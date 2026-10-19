/**
 * SAP CPI Groovy Script Execution Engine & Sandbox
 * Executes Groovy CPI scripts client-side with CPI mocks,
 * timeout protection, log interception, and change detection.
 */

import {
  CpiMessage,
  CpiMessageLogFactory,
  GroovyByteArray,
  GroovyInputStream,
} from './cpiMessage';
import {
  XmlSlurper,
  XmlParser,
  MarkupBuilder,
  StringWriter,
  JsonSlurper,
  JsonOutput,
  JsonBuilder,
  GroovyDate,
  SimpleDateFormat,
} from './cpiLibraries';
import { lintGroovyScript } from './compatibilityLinter';
import type {
  ExecutionInput,
  ExecutionResult,
  ExecutionDiagnostic,
  KeyValueDiff,
} from './types';

/**
 * Normalizes Groovy code to executable JavaScript inside our sandboxed context
 */
export function transpileGroovyToJs(script: string): { jsCode: string; error?: string } {
  try {
    let code = script;

    // 1. Normalize line endings
    code = code.replace(/\r\n/g, '\n');

    // 2. Strip package and import statements
    code = code.replace(/^\s*package\s+[\w.]+;?/gm, '// [package]');
    code = code.replace(/^\s*import\s+[\w.*]+;?/gm, '// [import]');

    // 3. Handle multi-line strings ('''...''' or """...""")
    code = code.replace(/'''([\s\S]*?)'''/g, (_m, p1) => {
      return `\`${p1.replace(/`/g, '\\`')}\``;
    });
    code = code.replace(/"""([\s\S]*?)"""/g, (_m, p1) => {
      return `\`${p1.replace(/`/g, '\\`')}\``;
    });

    // 4. Handle GString interpolation inside double quotes: "Hello ${name}" -> `Hello ${name}`
    code = code.replace(/"([^"\n\\]*\$\{[^"\n\\]*\}[^"\n\\]*)"/g, (_m, p1) => {
      return `\`${p1.replace(/`/g, '\\`')}\``;
    });

    // 5. Handle Groovy println/print without parentheses: println "something" -> println("something")
    code = code.replace(/^\s*println\s+([^(\n;].*)$/gm, (_m, p1) => {
      return `println(${p1});`;
    });
    code = code.replace(/^\s*print\s+([^(\n;].*)$/gm, (_m, p1) => {
      return `print(${p1});`;
    });

    // 6. Handle Groovy attribute syntax: node.@attr -> node['@attr']
    code = code.replace(/\.@([a-zA-Z0-9_-]+)/g, "['@$1']");

    // 7. Handle typed body getters & class literals
    code = code.replace(/(\.getBody)\s*\(\s*(?:\(?byte\[\]\)?(?:\.class)?|'byte\[\]'|"byte\[\]")\s*\)/g, "$1('byte[]')");
    code = code.replace(/(\.getBody)\s*\(\s*(?:String(?:\.class)?|'String'|"String")\s*\)/g, "$1('String')");
    code = code.replace(/(\.getBody)\s*\(\s*(?:InputStream(?:\.class)?|'InputStream'|"InputStream")\s*\)/g, "$1('InputStream')");

    // Standalone class references: (byte[]).class -> 'byte[]'
    code = code.replace(/\(?byte\[\]\)?\.class/g, "'byte[]'");

    // 8. Handle type casts: (String) x, (int) x, x as Float, etc. (do not match across newlines)
    code = code.replace(/([=,(]\s*)\(String\)[ \t]*([a-zA-Z0-9_]+)/g, '$1String($2)');
    code = code.replace(/([=,(]\s*)\((int|Integer)\)[ \t]*([a-zA-Z0-9_]+)/g, '$1parseInt($2, 10)');
    code = code.replace(/([=,(]\s*)\((float|Float|double|Double)\)[ \t]*([a-zA-Z0-9_]+)/g, '$1parseFloat($2)');
    code = code.replace(/([a-zA-Z0-9_().\]]+)\s+as\s+(String|float|Float|double|Double|int|Integer)\b/g, (_m, p1, p2) => {
      const type = p2.toLowerCase();
      if (type === 'string') return `String(${p1})`;
      if (type === 'int' || type === 'integer') return `parseInt(${p1}, 10)`;
      return `parseFloat(${p1})`;
    });
    code = code.replace(/String\.valueOf\s*\(([^)]+)\)/g, 'String($1)');

    // 9. Handle Groovy .length() on strings -> .length
    code = code.replace(/\.length\(\)/g, '.length');

    // 10. Handle Groovy Elvis operator: a ?: b -> (a || b)
    code = code.replace(/\s*\?:\s*/g, ' || ');

    // 10b. Handle Groovy replaceAll with regex -> ensure global flag 'g' in JS
    code = code.replace(/\.replaceAll\s*\(\s*\/([^/\n]+)\/([a-z]*)\s*,/g, (_m, pattern, flags) => {
      const newFlags = flags.includes('g') ? flags : flags + 'g';
      return `.replace(/${pattern}/${newFlags},`;
    });

    // 11. Handle Groovy entry point:
    // def Message processData(Message message) / Message processData(Message message) / def processData(message)
    code = code.replace(
      /(?:def\s+)?(?:Message\s+|void\s+)?processData\s*\(\s*(?:Message\s+)?([a-zA-Z0-9_]+)\s*\)/,
      'function processData($1)'
    );

    // 12. Handle variable declarations:
    // def x = ..., def byte[] x = ..., byte[] x = ..., String x = ..., StringWriter writer = ...
    code = code.replace(
      /^\s*def\s+(?:byte\[\]\s+|[a-zA-Z0-9_<>.]+\s+)?([a-zA-Z0-9_]+)\s*=/gm,
      'let $1 ='
    );
    code = code.replace(
      /^\s*(?:[A-Z][a-zA-Z0-9_<>.]*|int|Integer|boolean|Boolean|long|Long|float|Float|double|Double|byte|short|char|byte\[\])\s+([a-zA-Z0-9_]+)\s*=/gm,
      'let $1 ='
    );

    // 13. Handle Groovy named method arguments like xml.Tag(orderRef: orderId) -> xml.Tag({ orderRef: orderId })
    code = code.replace(/\(\s*([a-zA-Z0-9_]+)\s*:\s*([^,)\n]+)\s*\)/g, '({ $1: $2 })');

    // 14. Convert Groovy [key: val] map literals to JavaScript {key: val}
    code = transformGroovyMapLiterals(code);

    // 15. Inject loop guards to prevent runaway infinite loops from freezing execution thread
    let loopCount = 0;
    code = code.replace(/\bwhile\s*\(([^)]+)\)\s*\{/g, (_m, cond) => {
      const g = `__loopGuard_${loopCount++}`;
      return `let ${g} = 0; while (${cond}) { if (++${g} > 50000) { throw new Error("Execution limit exceeded: while loop exceeded 50,000 iterations"); }`;
    });
    code = code.replace(/\bfor\s*\(([^)]+)\)\s*\{/g, (_m, cond) => {
      const g = `__loopGuard_${loopCount++}`;
      return `let ${g} = 0; for (${cond}) { if (++${g} > 50000) { throw new Error("Execution limit exceeded: for loop exceeded 50,000 iterations"); }`;
    });

    // 16. Convert Groovy closures with Stack-Based Bracket Resolution
    code = transformGroovyClosures(code);

    return { jsCode: code };
  } catch (err: any) {
    return { jsCode: script, error: err.message };
  }
}

/**
 * Converts Groovy Map literals [key: value, ...] into JavaScript object literals {key: value, ...}
 * while preserving arrays [1, 2, 3] and index access [0].
 */
function transformGroovyMapLiterals(script: string): string {
  // Empty map [:] -> {}
  let code = script.replace(/\[\s*:\s*\]/g, '{}');

  const result: string[] = [];
  const mapStack: boolean[] = [];

  for (let i = 0; i < code.length; i++) {
    const char = code[i];

    if (char === '[') {
      const rest = code.slice(i + 1);
      // Check if bracket is immediately followed by a key: value pair
      const isMap = /^\s*(['"]?[a-zA-Z0-9_$-]+['"]?)\s*:[^:]/.test(rest);
      if (isMap) {
        mapStack.push(true);
        result.push('{');
        continue;
      } else {
        mapStack.push(false);
        result.push('[');
        continue;
      }
    }

    if (char === ']') {
      if (mapStack.length > 0) {
        const isMap = mapStack.pop();
        if (isMap) {
          result.push('}');
          continue;
        }
      }
      result.push(']');
      continue;
    }

    result.push(char);
  }

  return result.join('');
}

/**
 * Transforms Groovy closure blocks:
 *   collection.each { item -> ... }  => collection.each((item) => { ... });
 *   collection.each { ... }          => collection.each((it) => { ... });
 *   builder.Tag(args) { ... }        => builder.Tag(args, () => { ... });
 *   Tag { ... }                      => Tag(() => { ... });
 */
function transformGroovyClosures(script: string): string {
  const lines = script.split('\n');
  const stack: ({ type: 'CLOSURE' | 'BLOCK' | 'BUILDER_CLOSURE'; builder?: string })[] = [];
  const transformedLines: string[] = [];
  const knownBuilders = new Set<string>(['xml', 'builder', 'markup', 'mb']);

  const controlFlowKeywords = new Set([
    'if',
    'else',
    'for',
    'while',
    'switch',
    'try',
    'catch',
    'finally',
    'function',
    'class',
    'return',
    'let',
    'const',
    'var',
  ]);

  for (let l = 0; l < lines.length; l++) {
    let line = lines[l];

    // Detect builder instantiation: let xml = new MarkupBuilder(...)
    const builderMatch = line.match(/(?:let|const|var|def)?\s*([a-zA-Z0-9_]+)\s*=\s*new\s+MarkupBuilder/);
    if (builderMatch) {
      knownBuilders.add(builderMatch[1]);
    }

    // Function declarations are always regular blocks, never closures
    if (/^\s*function\b/.test(line)) {
      stack.push({ type: 'BLOCK' });
      transformedLines.push(line);
      continue;
    }

    // Single-line closures: e.g. numbers.collect { it * 2 } or numbers.collect { n -> n * 2 }
    line = line.replace(/(\.collect|\.each|\.findAll|\.find)\s*\{\s*([a-zA-Z0-9_]+)\s*->([^}]+)\}/g, '$1(($2) => ($3))');
    line = line.replace(/(\.collect|\.each|\.findAll|\.find)\s*\{([^}]+)\}/g, '$1((it) => ($2))');

    // Builder inner tags: route tag calls like Id('42') or Status('READY') to active builder
    const currentBuilder = stack.slice().reverse().find((s) => s.type === 'BUILDER_CLOSURE')?.builder;
    if (currentBuilder) {
      const innerTagWithArgsClosureMatch = line.match(/^(\s*)([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/);
      const innerTagClosureMatch = line.match(/^(\s*)([a-zA-Z0-9_]+)\s*\{/);
      const innerTagCallMatch = line.match(/^(\s*)([a-zA-Z0-9_]+)\s*\((.*)\)\s*;?$/);

      if (innerTagWithArgsClosureMatch && !controlFlowKeywords.has(innerTagWithArgsClosureMatch[2])) {
        const indent = innerTagWithArgsClosureMatch[1];
        const tag = innerTagWithArgsClosureMatch[2];
        const args = innerTagWithArgsClosureMatch[3];
        line = `${indent}${currentBuilder}.${tag}(${args}, () => {`;
        stack.push({ type: 'BUILDER_CLOSURE', builder: currentBuilder });
        transformedLines.push(line);
        continue;
      } else if (innerTagClosureMatch && !controlFlowKeywords.has(innerTagClosureMatch[2])) {
        const indent = innerTagClosureMatch[1];
        const tag = innerTagClosureMatch[2];
        line = `${indent}${currentBuilder}.${tag}(() => {`;
        stack.push({ type: 'BUILDER_CLOSURE', builder: currentBuilder });
        transformedLines.push(line);
        continue;
      } else if (innerTagCallMatch && !controlFlowKeywords.has(innerTagCallMatch[2])) {
        const indent = innerTagCallMatch[1];
        const tag = innerTagCallMatch[2];
        const args = innerTagCallMatch[3];
        line = `${indent}${currentBuilder}.${tag}(${args});`;
        transformedLines.push(line);
        continue;
      }
    }

    // Check if line starts a builder closure: builder.Tag(...) { or builder.Tag {
    const builderStartMatch = line.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*(?:\(([^)]*)\))?\s*\{/);
    if (builderStartMatch && knownBuilders.has(builderStartMatch[1])) {
      const bName = builderStartMatch[1];
      const args = builderStartMatch[3];
      if (args !== undefined && args.trim().length > 0) {
        line = line.replace(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/, `$1.$2($3, () => {`);
      } else {
        line = line.replace(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*(?:\(\))?\s*\{/, `$1.$2(() => {`);
      }
      stack.push({ type: 'BUILDER_CLOSURE', builder: bName });
      transformedLines.push(line);
      continue;
    }

    // Multi-line closures
    const explicitClosureMatch = line.match(/(\.each|\.collect|\.findAll|\.find)\s*\{\s*([a-zA-Z0-9_]+)\s*->/);
    if (explicitClosureMatch) {
      line = line.replace(/(\.each|\.collect|\.findAll|\.find)\s*\{\s*([a-zA-Z0-9_]+)\s*->/, '$1(($2) => {');
      stack.push({ type: 'CLOSURE' });
    } else {
      const implicitClosureMatch = line.match(/(\.each|\.collect|\.findAll|\.find)\s*\{/);
      if (implicitClosureMatch) {
        line = line.replace(/(\.each|\.collect|\.findAll|\.find)\s*\{/, '$1((it) => {');
        stack.push({ type: 'CLOSURE' });
      } else if (/(?<!\$)\{\s*$/.test(line)) {
        stack.push({ type: 'BLOCK' });
      }
    }

    // Check closing brace
    const trimmed = line.trim();
    if (trimmed === '}' || trimmed === '};') {
      const top = stack.pop();
      if (top && (top.type === 'CLOSURE' || top.type === 'BUILDER_CLOSURE')) {
        line = line.replace('}', '});');
      }
    }

    transformedLines.push(line);
  }

  return transformedLines.join('\n');
}

/**
 * Execute Groovy script against input payload
 */
export async function executeGroovyScript(input: ExecutionInput): Promise<ExecutionResult> {
  const startTime = performance.now();
  const runtimeVersion = input.runtime || '4.0.29';
  const consoleLogs: string[] = [];
  const diagnostics: ExecutionDiagnostic[] = [];

  // Step 1: Run Static Compatibility Linter
  const staticDiagnostics = lintGroovyScript(input.script, runtimeVersion);
  diagnostics.push(...staticDiagnostics);

  // If there are fatal syntax errors from the linter, return early
  const fatalError = diagnostics.find(
    (d) => d.severity === 'error' && d.category === 'SYNTAX_ERROR'
  );
  if (fatalError) {
    return {
      success: false,
      outputBody: input.body,
      originalBody: input.body,
      bodyType: detectBodyType(input.body),
      headers: { ...input.headers },
      properties: { ...input.properties },
      headerDiffs: calculateDiffs(input.headers, input.headers),
      propertyDiffs: calculateDiffs(input.properties, input.properties),
      consoleLogs: ['[Compilation Error] Script contains syntax errors. Execution aborted.'],
      attachments: [],
      diagnostics,
      durationMs: Math.round(performance.now() - startTime),
      runtimeVersion,
      timestamp: new Date().toISOString(),
    };
  }

  // Step 2: Initialize CPI Message & Context
  const message = new CpiMessage(input.body, input.headers, input.properties);
  const messageLogFactory = new CpiMessageLogFactory();

  // Step 3: Create Logging Interceptors
  const println = (...args: any[]) => {
    const formatted = args
      .map((a) => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)))
      .join(' ');
    consoleLogs.push(formatted);
  };
  const print = println;

  const System = {
    out: {
      println,
      print,
    },
    err: {
      println: (...args: any[]) => {
        const formatted = args.map((a) => String(a)).join(' ');
        consoleLogs.push(`[STDERR] ${formatted}`);
      },
    },
    currentTimeMillis: () => Date.now(),
  };

  // Step 4: Transpile Groovy script to sandboxed JS
  const { jsCode, error: transpileError } = transpileGroovyToJs(input.script);
  if (transpileError) {
    diagnostics.push({
      category: 'SYNTAX_ERROR',
      severity: 'error',
      message: `Transpilation failed: ${transpileError}`,
    });
    return {
      success: false,
      outputBody: input.body,
      originalBody: input.body,
      bodyType: detectBodyType(input.body),
      headers: { ...input.headers },
      properties: { ...input.properties },
      headerDiffs: calculateDiffs(input.headers, input.headers),
      propertyDiffs: calculateDiffs(input.properties, input.properties),
      consoleLogs,
      attachments: [],
      diagnostics,
      durationMs: Math.round(performance.now() - startTime),
      runtimeVersion,
      timestamp: new Date().toISOString(),
    };
  }

  // Step 5: Execute in sandboxed Function scope with timeout
  const TIMEOUT_MS = 2500;
  let executionSuccess = false;

  try {
    const Integer = {
      parseInt: (val: any, radix: number = 10) => {
        const s = String(val).trim();
        if (!/^[+-]?\d+$/.test(s)) {
          throw new Error(`NumberFormatException: For input string: "${val}"`);
        }
        const res = parseInt(s, radix);
        if (isNaN(res)) throw new Error(`NumberFormatException: For input string: "${val}"`);
        return res;
      },
      valueOf: (val: any) => Integer.parseInt(val),
      MAX_VALUE: 2147483647,
      MIN_VALUE: -2147483648,
    };

    const sandboxScope = {
      message,
      messageLogFactory,
      XmlSlurper,
      XmlParser,
      MarkupBuilder,
      StringWriter,
      JsonSlurper,
      JsonOutput,
      JsonBuilder,
      Date: GroovyDate,
      SimpleDateFormat,
      GroovyByteArray,
      GroovyInputStream,
      println,
      print,
      System,
      String,
      Number,
      Boolean,
      Math,
      parseInt,
      parseFloat,
      JSON,
      encodeURIComponent,
      decodeURIComponent,
      btoa,
      atob,
      Integer,
      Long: { parseLong: (v: any) => Integer.parseInt(v), valueOf: (v: any) => Integer.parseInt(v) },
      Double: {
        parseDouble: (v: any) => {
          const s = String(v).trim();
          if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(s)) {
            throw new Error(`NumberFormatException: For input string: "${v}"`);
          }
          const res = parseFloat(s);
          if (isNaN(res)) throw new Error(`NumberFormatException: For input string: "${v}"`);
          return res;
        },
        valueOf: (v: any) => parseFloat(v),
      },
      Float: {
        parseFloat: (v: any) => parseFloat(v),
        valueOf: (v: any) => parseFloat(v),
      },
      ITApiFactory: {
        getApi: (apiClass: any) => {
          const name = typeof apiClass === 'string' ? apiClass : apiClass?.name || 'Tenant API';
          throw new Error(
            `Unsupported tenant API: ${name} is bound to an active SAP Cloud Integration tenant and cannot be executed in offline browser simulation.`
          );
        },
      },
      ValueMappingApi: { name: 'ValueMappingApi', class: 'ValueMappingApi' },
      PartnerDirectoryService: { name: 'PartnerDirectoryService', class: 'PartnerDirectoryService' },
      SecureStoreService: { name: 'SecureStoreService', class: 'SecureStoreService' },
      KeystoreService: { name: 'KeystoreService', class: 'KeystoreService' },
      URL: class GroovySimulatedUrl {
        private _url: string;
        constructor(url: string) {
          this._url = String(url);
        }
        getText(): string {
          throw new Error(
            `Security & Privacy Violation: Outbound network request to '${this._url}' is blocked. ToolSAP executes 100% in-browser with zero outbound network access to preserve data privacy.`
          );
        }
        openStream(): any {
          throw new Error(
            `Security & Privacy Violation: Outbound network request to '${this._url}' is blocked. ToolSAP executes 100% in-browser with zero outbound network access to preserve data privacy.`
          );
        }
        toString(): string {
          return this._url;
        }
      },
      fetch: () => {
        throw new Error('Security & Privacy Violation: Network access (fetch) is disabled in Groovy Script Tester.');
      },
      XMLHttpRequest: function () {
        throw new Error('Security & Privacy Violation: Network access (XMLHttpRequest) is disabled in Groovy Script Tester.');
      },
      WebSocket: function () {
        throw new Error('Security & Privacy Violation: Network access (WebSocket) is disabled in Groovy Script Tester.');
      },
      EventSource: function () {
        throw new Error('Security & Privacy Violation: Network access (EventSource) is disabled in Groovy Script Tester.');
      },
    };

    // Construct the wrapped runner function without extraneous line offset
    const wrappedCode = `"use strict";\n${jsCode}\nif (typeof processData === 'function') { return processData(message); } else { throw new Error("Entry point processData(message) is not defined or is not a function."); }`;

    const scopeKeys = Object.keys(sandboxScope);
    const scopeValues = Object.values(sandboxScope);

    const runnerFn = new Function(scopeKeys.join(', '), wrappedCode);

    // Run with timeout promise race
    const executionPromise = new Promise<any>((resolve, reject) => {
      try {
        const returnedMsg = runnerFn(...scopeValues);
        resolve(returnedMsg);
      } catch (err) {
        reject(err);
      }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Execution timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
    );

    const returnedMessage = await Promise.race([executionPromise, timeoutPromise]);
    executionSuccess = true;

    // In Groovy CPI, processData typically returns message; if not returned, keep mutated message
    if (returnedMessage && returnedMessage instanceof CpiMessage) {
      // Returned message is our active instance
    }
  } catch (err: any) {
    executionSuccess = false;
    const isTimeout =
      String(err.message).includes('timed out') ||
      String(err.message).includes('Execution limit exceeded');
    const isSecurity = String(err.message).includes('Security & Privacy Violation');
    const isTenantApi = String(err.message).includes('Unsupported tenant API');

    let category: ExecutionDiagnostic['category'] = 'RUNTIME_EXCEPTION';
    if (isTimeout) {
      category = 'EXECUTION_TIMEOUT';
    } else if (isSecurity) {
      category = 'LIMITATION';
    } else if (isTenantApi) {
      category = 'UNSUPPORTED_SAP_API';
    }

    const lineInfo = extractLineInfo(err.stack, input.script);

    diagnostics.push({
      category,
      severity: 'error',
      message: err.message || 'Unknown runtime error occurred',
      line: lineInfo.line,
      column: lineInfo.col,
      snippet: lineInfo.snippet,
      suggestion: isTimeout
        ? 'Check for infinite while/for loops or excessively large recursive closures.'
        : isSecurity
        ? 'Submitted code attempted network access. In accordance with ToolSAP client-side privacy guarantees, outbound network calls are strictly prohibited.'
        : isTenantApi
        ? 'Tenant-bound SAP APIs require an active SAP Cloud Integration tenant repository. Supply simulated values in Exchange Properties or Headers for local testing.'
        : 'Verify object nullability or method signatures.',
    });

    consoleLogs.push(`[ERROR] ${err.name || 'Runtime Exception'}: ${err.message}`);
  }

  const durationMs = Math.round(performance.now() - startTime);

  // Step 6: Extract resulting state & calculate diffs
  const resultingHeaders = message._getInternalHeadersMap();
  const resultingProperties = message._getInternalPropertiesMap();
  const resultingAttachments = message._getInternalAttachmentsList();
  const rawOutputBody = message.getBody(String);
  const outputBody = typeof rawOutputBody === 'string' ? rawOutputBody : String(rawOutputBody ?? '');

  const headerDiffs = calculateDiffs(input.headers, resultingHeaders);
  const propertyDiffs = calculateDiffs(input.properties, resultingProperties);
  const bodyType = detectBodyType(outputBody);

  return {
    success: executionSuccess,
    outputBody,
    originalBody: input.body,
    bodyType,
    headers: resultingHeaders,
    properties: resultingProperties,
    headerDiffs,
    propertyDiffs,
    consoleLogs,
    attachments: resultingAttachments,
    diagnostics,
    durationMs,
    runtimeVersion,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculates key-value changes between original and resulting maps
 */
export function calculateDiffs(
  original: Record<string, any>,
  resulting: Record<string, any>
): KeyValueDiff[] {
  const diffs: KeyValueDiff[] = [];
  const allKeys = Array.from(new Set([...Object.keys(original), ...Object.keys(resulting)])).sort();

  for (const key of allKeys) {
    const origVal = original[key];
    const resVal = resulting[key];

    const origStr = origVal !== undefined ? String(origVal) : undefined;
    const resStr = resVal !== undefined ? String(resVal) : undefined;

    if (origVal === undefined && resVal !== undefined) {
      diffs.push({ key, newValue: resStr, status: 'added' });
    } else if (origVal !== undefined && resVal === undefined) {
      diffs.push({ key, originalValue: origStr, status: 'deleted' });
    } else if (origStr !== resStr) {
      diffs.push({ key, originalValue: origStr, newValue: resStr, status: 'modified' });
    } else {
      diffs.push({ key, originalValue: origStr, newValue: resStr, status: 'unchanged' });
    }
  }

  return diffs;
}

/**
 * Detects whether payload is XML, JSON, or plain text
 */
function detectBodyType(body: string): 'string' | 'xml' | 'json' | 'bytes' | 'empty' {
  if (!body || body.trim().length === 0) return 'empty';
  const trimmed = body.trim();
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) return 'xml';
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return 'json';
  }
  return 'string';
}

/**
 * Extract line number and snippet from runtime error stack trace
 */
function extractLineInfo(
  stack?: string,
  script?: string
): { line?: number; col?: number; snippet?: string } {
  if (!stack || !script) return {};

  const lines = script.split('\n');
  // Match patterns like <anonymous>:line:col or Function:line:col
  const match = stack.match(/<anonymous>:(\d+):(\d+)/) || stack.match(/eval.*?:(\d+):(\d+)/);
  if (match) {
    const rawLine = parseInt(match[1], 10);
    // Adjusted line number within user code: Function header + strict mode offset
    const line = Math.max(1, Math.min(lines.length, rawLine - 3));
    const col = parseInt(match[2], 10);
    return {
      line,
      col,
      snippet: lines[line - 1]?.trim(),
    };
  }

  return {};
}
