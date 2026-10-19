/**
 * SAP CPI Compatibility & Upgrade Linter
 * Statically analyzes Groovy scripts for syntax issues, Groovy 2 vs 4 deprecations,
 * and unsupported SAP tenant-only services.
 */

import type { ExecutionDiagnostic, GroovyRuntimeVersion } from './types';

interface LintRule {
  id: string;
  pattern: RegExp;
  category: ExecutionDiagnostic['category'];
  severity: ExecutionDiagnostic['severity'];
  message: string;
  suggestion?: string;
  runtimeApplicable?: GroovyRuntimeVersion;
}

const STATIC_RULES: LintRule[] = [
  // Groovy 2.4 -> 4.0 Deprecated Packages
  {
    id: 'deprecated-xmlslurper-pkg',
    pattern: /import\s+groovy\.util\.XmlSlurper/g,
    category: 'COMPATIBILITY_WARNING',
    severity: 'warning',
    message: 'Deprecated import: groovy.util.XmlSlurper',
    suggestion: 'In Groovy 4.0+, use "import groovy.xml.XmlSlurper" instead.',
    runtimeApplicable: '4.0.29',
  },
  {
    id: 'deprecated-xmlparser-pkg',
    pattern: /import\s+groovy\.util\.XmlParser/g,
    category: 'COMPATIBILITY_WARNING',
    severity: 'warning',
    message: 'Deprecated import: groovy.util.XmlParser',
    suggestion: 'In Groovy 4.0+, use "import groovy.xml.XmlParser" instead.',
    runtimeApplicable: '4.0.29',
  },
  // Tenant-Only SAP Services
  {
    id: 'tenant-partner-directory',
    pattern: /PartnerDirectoryService|com\.sap\.it\.api\.pd/g,
    category: 'UNSUPPORTED_SAP_API',
    severity: 'warning',
    message: 'Tenant-Bound API: PartnerDirectoryService detected.',
    suggestion:
      'Partner Directory is an SAP cloud tenant-only service. Parameter lookups are not available in offline simulation; mock these parameters in Exchange Properties for testing.',
  },
  {
    id: 'tenant-value-mapping',
    pattern: /ValueMappingApi|com\.sap\.it\.api\.mapping\.ValueMappingApi/g,
    category: 'UNSUPPORTED_SAP_API',
    severity: 'warning',
    message: 'Tenant-Bound API: ValueMappingApi detected.',
    suggestion:
      'Value Mapping requires an active SAP tenant repository. Test the transformation logic using mock maps or headers.',
  },
  {
    id: 'tenant-secure-store',
    pattern: /SecureStoreService|com\.sap\.it\.api\.securestore/g,
    category: 'UNSUPPORTED_SAP_API',
    severity: 'warning',
    message: 'Tenant-Bound API: SecureStoreService detected.',
    suggestion:
      'Secure Store credentials cannot be retrieved outside of SAP Cloud Integration runtime. Supply simulated credentials in test properties.',
  },
  {
    id: 'tenant-keystore',
    pattern: /KeystoreService|com\.sap\.it\.api\.keystore/g,
    category: 'UNSUPPORTED_SAP_API',
    severity: 'warning',
    message: 'Tenant-Bound API: KeystoreService detected.',
    suggestion: 'Keystore certificates and keys are bound to your SAP tenant environment.',
  },
  {
    id: 'camel-internals',
    pattern: /org\.apache\.camel\.(impl|component|processor)/g,
    category: 'COMPATIBILITY_WARNING',
    severity: 'warning',
    message: 'Camel Internal API access detected.',
    suggestion:
      'SAP advises against relying on Camel internal implementation classes as they may break across Cloud Integration runtime updates.',
  },
  {
    id: 'system-exit-discouraged',
    pattern: /System\.exit\s*\(/g,
    category: 'LIMITATION',
    severity: 'error',
    message: 'System.exit() is prohibited in SAP Cloud Integration.',
    suggestion: 'Throw an exception or return the message instead of attempting to terminate the JVM.',
  },
];

/**
 * Perform static compatibility linting on Groovy script
 */
export function lintGroovyScript(
  script: string,
  runtime: GroovyRuntimeVersion = '4.0.29'
): ExecutionDiagnostic[] {
  const diagnostics: ExecutionDiagnostic[] = [];
  const lines = script.split('\n');

  // 1. Bracket & Quote balance checks
  const balanceCheck = checkBracketsAndQuotes(script);
  if (balanceCheck) {
    diagnostics.push(balanceCheck);
  }

  // 2. Check for processData entry point
  const hasProcessData =
    /def\s+(Message\s+)?processData\s*\(/.test(script) ||
    /Message\s+processData\s*\(/.test(script) ||
    /void\s+processData\s*\(/.test(script) ||
    /processData\s*\(/.test(script);

  if (!hasProcessData) {
    diagnostics.push({
      category: 'COMPATIBILITY_WARNING',
      severity: 'warning',
      message: 'No "processData(Message message)" function found.',
      suggestion:
        'Standard SAP Cloud Integration scripts require an entry-point function: "def Message processData(Message message)".',
    });
  }

  // 3. Rule-based static checks
  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;

    for (const rule of STATIC_RULES) {
      if (rule.runtimeApplicable && rule.runtimeApplicable !== runtime) {
        continue;
      }

      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(lineText)) {
        diagnostics.push({
          category: rule.category,
          severity: rule.severity,
          message: rule.message,
          line: lineNum,
          snippet: lineText.trim(),
          suggestion: rule.suggestion,
        });
      }
    }
  });

  return diagnostics;
}

/**
 * Checks for unmatched brackets, parentheses, or unclosed string quotes
 */
function checkBracketsAndQuotes(script: string): ExecutionDiagnostic | null {
  const stack: { char: string; line: number; col: number }[] = [];
  const lines = script.split('\n');

  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTripleQuote = false;
  let inBlockComment = false;

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    const lineNum = l + 1;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      const prev = c > 0 ? line[c - 1] : '';
      const next = c < line.length - 1 ? line[c + 1] : '';

      // Skip escaped characters
      if (prev === '\\') continue;

      // Block comment handling
      if (!inSingleQuote && !inDoubleQuote && !inTripleQuote) {
        if (!inBlockComment && char === '/' && next === '*') {
          inBlockComment = true;
          c++;
          continue;
        }
        if (inBlockComment && char === '*' && next === '/') {
          inBlockComment = false;
          c++;
          continue;
        }
        if (inBlockComment) continue;

        // Line comment
        if (char === '/' && next === '/') {
          break; // Rest of line is comment
        }
      }

      if (inBlockComment) continue;

      // Triple quote handling (''' or """)
      if (
        (char === "'" || char === '"') &&
        line.slice(c, c + 3) === char.repeat(3)
      ) {
        inTripleQuote = !inTripleQuote;
        c += 2;
        continue;
      }
      if (inTripleQuote) continue;

      // Single/double quotes
      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        continue;
      }
      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }

      if (inSingleQuote || inDoubleQuote) continue;

      // Brackets matching
      if (char === '{' || char === '(' || char === '[') {
        stack.push({ char, line: lineNum, col: c + 1 });
      } else if (char === '}' || char === ')' || char === ']') {
        if (stack.length === 0) {
          return {
            category: 'SYNTAX_ERROR',
            severity: 'error',
            message: `Unmatched closing bracket '${char}'`,
            line: lineNum,
            column: c + 1,
            snippet: line.trim(),
            suggestion: `Check closing bracket '${char}' on line ${lineNum}`,
          };
        }

        const top = stack.pop()!;
        const expected =
          top.char === '{' ? '}' : top.char === '(' ? ')' : ']';
        if (char !== expected) {
          return {
            category: 'SYNTAX_ERROR',
            severity: 'error',
            message: `Mismatched bracket: expected '${expected}' to close '${top.char}' from line ${top.line}, but found '${char}'`,
            line: lineNum,
            column: c + 1,
            snippet: line.trim(),
          };
        }
      }
    }
  }

  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    return {
      category: 'SYNTAX_ERROR',
      severity: 'error',
      message: `Unclosed bracket '${unclosed.char}' opened on line ${unclosed.line}, col ${unclosed.col}`,
      line: unclosed.line,
      column: unclosed.col,
      suggestion: `Add closing bracket to pair with '${unclosed.char}'`,
    };
  }

  return null;
}
