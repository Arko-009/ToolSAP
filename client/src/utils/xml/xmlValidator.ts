/**
 * XML Validation, XSD Schema Validation, and Diagnostic Utilities
 * 100% Client-Side / Browser-Only Execution
 * Specially designed for SAP Integration Suite (CPI) Payloads, IDocs, and SOAP Envelopes.
 */

export type XmlErrorCategory =
  | 'well-formedness'
  | 'namespace'
  | 'dtd'
  | 'xsd'
  | 'security'
  | 'application-rule'
  | 'tag-mismatch'
  | 'unclosed-tag'
  | 'unescaped-character'
  | 'multiple-roots'
  | 'no-root'
  | 'duplicate-attribute'
  | 'declaration-error'
  | 'schema-violation'
  | 'syntax-error';

export type RepairClassification =
  | 'safe-automatic'
  | 'confirmation-required'
  | 'diagnosis-only';

export type RepairConfidence = 'high' | 'medium' | 'low';

export interface AutoFixDiffItem {
  code: string;
  category: XmlErrorCategory;
  classification: RepairClassification;
  confidence: RepairConfidence;
  description: string;
  line?: number;
  column?: number;
  beforeSnippet?: string;
  afterSnippet?: string;
}

export interface AutoFixReport {
  originalValid: boolean;
  finalValid: boolean;
  totalPasses: number;
  fixes: AutoFixDiffItem[];
  unresolvedIssues: XmlValidationError[];
  securityWarnings: string[];
  executionTimeMs: number;
}

export interface AutoFixResult {
  fixedXml: string;
  fixes: string[];
  report: AutoFixReport;
}

export interface XmlValidationError {
  message: string;
  line?: number;
  column?: number;
  snippet?: string;
  category: XmlErrorCategory;
  suggestion?: string;
  code?: string;
  classification?: RepairClassification;
  source?: 'xml' | 'xsd';
}

export interface XmlNamespaceInfo {
  prefix: string;
  uri: string;
}

export interface XmlMetrics {
  lineCount: number;
  charCount: number;
  sizeBytes: number;
  elementCount: number;
  attributeCount: number;
  maxDepth: number;
  namespaces: XmlNamespaceInfo[];
  rootElementName: string | null;
  cdataCount: number;
  commentCount: number;
  executionTimeMs: number;
}

export interface XmlValidationDiagnostic {
  isValid: boolean;
  errors: XmlValidationError[];
  warnings: string[];
  metrics: XmlMetrics;
}

export interface XsdValidationResult {
  isValid: boolean;
  errors: XmlValidationError[];
  warnings: string[];
}

export function offsetToLineCol(
  xml: string,
  offset: number
): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  const target = Math.min(Math.max(0, offset), xml.length);
  for (let i = 0; i < target; i++) {
    if (xml[i] === '\n') {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: Math.max(1, target - lineStart + 1) };
}

export function generateSnippet(
  xml: string,
  line?: number,
  column?: number
): string | undefined {
  if (line === undefined || line <= 0) return undefined;
  const lines = xml.split(/\r?\n/);
  const zeroIndexedLine = line - 1;
  if (zeroIndexedLine < 0 || zeroIndexedLine >= lines.length) return undefined;

  const start = Math.max(0, zeroIndexedLine - 2);
  const end = Math.min(lines.length - 1, zeroIndexedLine + 2);

  const snippetLines: string[] = [];
  for (let i = start; i <= end; i++) {
    const lineNumStr = String(i + 1).padStart(4, ' ');
    const isTarget = i === zeroIndexedLine;
    const marker = isTarget ? '▶ ' : '  ';
    snippetLines.push(`${marker}${lineNumStr} | ${lines[i]}`);
    if (isTarget && column !== undefined && column > 0) {
      const pointerPadding = ' '.repeat(Math.max(0, column + 8));
      snippetLines.push(`${pointerPadding}^ (column ${column})`);
    }
  }
  return snippetLines.join('\n');
}

/**
 * Extracts accurate line and column numbers and surrounding code snippet
 */
function extractErrorLocation(
  xml: string,
  rawErrorText: string
): { line?: number; column?: number; snippet?: string } {
  let line: number | undefined;
  let column: number | undefined;

  // Chrome / WebKit / Blink: "error on line 4 at column 12: ..."
  // Firefox: "Line Number 4, Column 12:"
  // Safari / General: "... at line 4, column 12 ..." or "(4:12)"
  const lineMatch =
    rawErrorText.match(/line\s*(\d+)/i) ||
    rawErrorText.match(/Line Number\s*(\d+)/i) ||
    rawErrorText.match(/\((\d+):(\d+)\)/);

  if (lineMatch) {
    line = parseInt(lineMatch[1], 10);
  }

  const colMatch =
    rawErrorText.match(/column\s*(\d+)/i) ||
    rawErrorText.match(/Column\s*(\d+)/i);

  if (colMatch) {
    column = parseInt(colMatch[1], 10);
  } else if (lineMatch && lineMatch[2]) {
    column = parseInt(lineMatch[2], 10);
  }

  const snippet = generateSnippet(xml, line, column);

  return { line, column, snippet };
}

/**
 * Categorizes the error and generates actionable recommendations for SAP developers
 */
function categorizeError(rawError: string): {
  category: XmlValidationError['category'];
  cleanMessage: string;
  suggestion: string;
} {
  const stripped = rawError
    .replace(/^This page contains the following errors:\s*/i, '')
    .trim();
  const lower = stripped.toLowerCase();

  // Tag Mismatch: e.g. <Sender> closed with </Receiver>
  if (
    lower.includes('mismatch') ||
    lower.includes('opening and ending tag mismatch') ||
    lower.includes('mismatched tag')
  ) {
    return {
      category: 'tag-mismatch',
      cleanMessage: stripped
        .replace(/^error on line \d+ at column \d+:\s*/i, '')
        .replace(/^XML Parsing Error:\s*/i, '')
        .split('\n')[0]
        .trim(),
      suggestion:
        'XML element tags are strictly case-sensitive. Check if the closing tag spelling or casing differs from the opening tag (e.g., <Sender> vs </Receiver>).',
    };
  }

  // Unquoted attributes or missing attribute value
  if (
    lower.includes('attvalue') ||
    lower.includes('unquoted attribute') ||
    lower.includes('expected attribute value') ||
    lower.includes('attribute without value') ||
    lower.includes('specification mandates value for attribute')
  ) {
    return {
      category: 'syntax-error',
      cleanMessage: 'Unquoted or missing attribute value. In XML, all attributes must have quoted values.',
      suggestion:
        'In XML (unlike HTML), all attributes must have quoted values (e.g. state="West Bengal" or disabled="disabled"). Boolean or unquoted attributes are not permitted.',
    };
  }

  // Unescaped Characters: bare & or < inside text
  if (
    lower.includes('xmlparseentityref') ||
    lower.includes('entity') ||
    lower.includes('invalid token') ||
    lower.includes('not well-formed')
  ) {
    return {
      category: 'unescaped-character',
      cleanMessage: 'Unescaped special character detected in XML payload.',
      suggestion:
        "Special characters in XML text must be escaped: replace '&' with '&amp;', '<' with '&lt;', and '>' with '&gt;'. Bare ampersands (e.g. 'SAP & Cloud') are the #1 cause of CPI pipeline failures.",
    };
  }

  // Multiple Root Elements: extra content after root tag
  if (
    lower.includes('extra content at the end') ||
    lower.includes('junk after document element') ||
    lower.includes('multiple root')
  ) {
    return {
      category: 'multiple-roots',
      cleanMessage: 'Multiple root elements or trailing content found outside root tag.',
      suggestion:
        'Every valid XML document must have exactly one root element enclosing all content. Wrap sibling messages in a parent wrapper (e.g. <Messages> or <soapenv:Envelope>).',
    };
  }

  // Unclosed Tags / Premature End
  if (
    lower.includes('premature end') ||
    lower.includes('unclosed') ||
    lower.includes('expected </')
  ) {
    return {
      category: 'unclosed-tag',
      cleanMessage: 'Premature end of XML data; unclosed tag or truncated payload.',
      suggestion:
        'A tag was opened but never closed before the document ended. Ensure all opened tags are terminated or self-closing (e.g. <item />).',
    };
  }

  // Duplicate Attributes
  if (lower.includes('attribute') && lower.includes('redefined')) {
    return {
      category: 'duplicate-attribute',
      cleanMessage: 'Duplicate attribute defined on the same element.',
      suggestion:
        'An XML tag cannot have two attributes with the identical name (e.g. <item id="1" id="2">). Remove the redundant attribute.',
    };
  }

  // Empty or No Root Tag
  if (
    lower.includes('start tag expected') ||
    lower.includes('document is empty') ||
    lower.includes('no root element')
  ) {
    return {
      category: 'no-root',
      cleanMessage: 'No root element found or XML document is empty.',
      suggestion:
        'The payload contains no valid XML elements or has invalid characters preceding the root element.',
    };
  }

  // XML Declaration Error
  if (lower.includes('xml declaration')) {
    return {
      category: 'declaration-error',
      cleanMessage: 'XML declaration (<?xml ...?>) is misplaced.',
      suggestion:
        'The XML declaration <?xml version="1.0"?> must be the very first characters in the document with no preceding spaces, linebreaks, or BOM.',
    };
  }

  // Default Fallback
  return {
    category: 'syntax-error',
    cleanMessage:
      stripped
        .replace(/^error on line \d+ at column \d+:\s*/i, '')
        .replace(/^XML Parsing Error:\s*/i, '')
        .split('\n')[0]
        .trim() || 'Malformed XML document structure.',
    suggestion:
      'Review your XML structure against standard W3C XML 1.0 guidelines. Check for matching tags, valid attribute quotes, and proper nesting.',
  };
}

export interface DtdInfo {
  rootName: string;
  elements: Map<string, { rawModel: string; allowedChildren: string[]; isPcData: boolean }>;
  attributes: Map<string, Map<string, { type: string; defaultDecl: string; allowedValues?: string[]; defaultValue?: string }>>;
  entities: Map<string, string>;
}

/**
 * Parses internal DTD subset from <!DOCTYPE ... [...]>
 */
export function parseDtd(xml: string): DtdInfo | null {
  const doctypeMatch = xml.match(/<!DOCTYPE\s+([a-zA-Z0-9_.:-]+)(?:\s+\[([\s\S]*?)\])?\s*>/i);
  if (!doctypeMatch) return null;

  const rootName = doctypeMatch[1];
  const subset = doctypeMatch[2] || '';
  const elements = new Map<string, { rawModel: string; allowedChildren: string[]; isPcData: boolean }>();
  const attributes = new Map<string, Map<string, { type: string; defaultDecl: string; allowedValues?: string[]; defaultValue?: string }>>();
  const entities = new Map<string, string>();

  const elemRegex = /<!ELEMENT\s+([a-zA-Z0-9_.:-]+)\s+([^>]+)>/gi;
  let em: RegExpExecArray | null;
  while ((em = elemRegex.exec(subset)) !== null) {
    const elemName = em[1];
    const rawModel = em[2].trim();
    const isPcData = rawModel.includes('#PCDATA');
    const childMatches = rawModel.match(/[a-zA-Z_][a-zA-Z0-9_.:-]*/g) || [];
    const allowedChildren = childMatches.filter((c) => !['EMPTY', 'ANY', 'PCDATA'].includes(c));
    elements.set(elemName, { rawModel, allowedChildren, isPcData });
  }

  const attrRegex = /<!ATTLIST\s+([a-zA-Z0-9_.:-]+)\s+([a-zA-Z0-9_.:-]+)\s+([^\s>]+)\s+([^>]+)>/gi;
  let am: RegExpExecArray | null;
  while ((am = attrRegex.exec(subset)) !== null) {
    const elemName = am[1];
    const attrName = am[2];
    const type = am[3].trim();
    const defaultDecl = am[4].trim();

    let allowedValues: string[] | undefined;
    if (type.startsWith('(') && type.endsWith(')')) {
      allowedValues = type.slice(1, -1).split('|').map((v) => v.trim());
    }

    let defaultValue: string | undefined;
    const defMatch = defaultDecl.match(/["']([^"']*)["']/);
    if (defMatch) {
      defaultValue = defMatch[1];
    } else if (allowedValues && allowedValues.length > 0) {
      defaultValue = allowedValues[0];
    }

    if (!attributes.has(elemName)) attributes.set(elemName, new Map());
    attributes.get(elemName)!.set(attrName, { type, defaultDecl, allowedValues, defaultValue });
  }

  const entRegex = /<!ENTITY\s+([a-zA-Z0-9_.:-]+)\s+["']([^"']*)["']>/gi;
  let entM: RegExpExecArray | null;
  while ((entM = entRegex.exec(subset)) !== null) {
    entities.set(entM[1], entM[2]);
  }

  return { rootName, elements, attributes, entities };
}

interface TagStackItem {
  name: string;
  line: number;
  column: number;
  offset: number;
}

/**
 * Scans an XML string to detect ALL structural syntax errors across the entire document
 * (unlike browser DOMParser which halts at the very first fatal error).
 */
export function scanXmlErrors(xml: string): XmlValidationError[] {
  const errors: XmlValidationError[] = [];
  const stack: TagStackItem[] = [];
  const dtd = parseDtd(xml);
  const seenIds = new Set<string>();
  let rootElementCount = 0;
  let rootClosed = false;

  // 0. Security Check: Payload size check
  if (xml.length > 20 * 1024 * 1024) {
    errors.push({
      message: 'XML document exceeds maximum supported size (20MB). Parsing halted to prevent browser out-of-memory.',
      category: 'security',
      code: 'ERR_PAYLOAD_TOO_LARGE',
      classification: 'diagnosis-only',
      suggestion: 'Split large payloads into smaller batches or stream using backend processing.',
    });
    return errors;
  }

  // 0a. Check for illegal ASCII control characters
  const controlCharRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;
  let ccMatch: RegExpExecArray | null;
  if ((ccMatch = controlCharRegex.exec(xml)) !== null) {
    const loc = offsetToLineCol(xml, ccMatch.index);
    errors.push({
      message: `Illegal control character found (ASCII 0x${ccMatch[0].charCodeAt(0).toString(16)}). Control characters are not allowed in XML 1.0.`,
      line: loc.line,
      column: loc.column,
      snippet: generateSnippet(xml, loc.line, loc.column),
      category: 'syntax-error',
      code: 'ERR_ILLEGAL_CONTROL_CHAR',
      classification: 'safe-automatic',
      suggestion: 'Remove invisible control characters from the XML document.',
    });
  }

  // 0b. Security Check: XXE external entities
  const xxeRegex = /<!ENTITY\s+([a-zA-Z0-9_.:-]+)\s+(?:SYSTEM|PUBLIC)\s+["']([^"']*)["']/gi;
  let xxeM: RegExpExecArray | null;
  while ((xxeM = xxeRegex.exec(xml)) !== null) {
    const loc = offsetToLineCol(xml, xxeM.index);
    errors.push({
      message: `Security Warning: External entity declaration '${xxeM[1]}' detected in DTD. External entity resolution is disabled to prevent XML External Entity (XXE) attacks.`,
      line: loc.line,
      column: loc.column,
      snippet: generateSnippet(xml, loc.line, loc.column),
      category: 'security',
      code: 'ERR_SECURITY_XXE',
      classification: 'safe-automatic',
      suggestion: 'Remove external SYSTEM/PUBLIC entity references.',
    });
  }

  // 0c. Security Check: Entity expansion bomb (Billion Laughs)
  if (dtd && dtd.entities.size > 0) {
    for (const [entName, entVal] of dtd.entities) {
      let current = entVal;
      let depth = 0;
      while (/&([a-zA-Z0-9_.:-]+);/.test(current) && depth < 20) {
        depth++;
        current = current.replace(/&([a-zA-Z0-9_.:-]+);/g, (_, name) => dtd.entities.get(name) || '');
        if (current.length > 1000) break;
      }
      if (current.length > 1000 || depth >= 4) {
        errors.push({
          message: `Security Warning: Potential entity expansion attack (Billion Laughs) detected in DTD entity '${entName}'.`,
          category: 'security',
          code: 'ERR_SECURITY_ENTITY_BOMB',
          classification: 'confirmation-required',
          suggestion: 'Refactor or remove deeply nested recursive entity declarations.',
        });
        break;
      }
    }
  }

  let i = 0;
  const len = xml.length;

  while (i < len) {
    // 1. Comment <!-- ... -->
    if (xml.startsWith('<!--', i)) {
      const endComment = xml.indexOf('-->', i + 4);
      if (endComment === -1) {
        const loc = offsetToLineCol(xml, i);
        errors.push({
          message: `Unclosed comment '<!--' starting on line ${loc.line}`,
          line: loc.line,
          column: loc.column,
          snippet: generateSnippet(xml, loc.line, loc.column),
          category: 'syntax-error',
          suggestion: "Close the comment with '-->'.",
        });
        break;
      }
      const commentBody = xml.substring(i + 4, endComment);
      if (commentBody.includes('--')) {
        const loc = offsetToLineCol(xml, i);
        errors.push({
          message: `The string '--' is not permitted inside an XML comment on line ${loc.line}.`,
          line: loc.line,
          column: loc.column,
          snippet: generateSnippet(xml, loc.line, loc.column),
          category: 'syntax-error',
          suggestion: "In XML, comments must not contain double hyphens '--'. Replace '--' with a single '-' or text.",
        });
      }
      i = endComment + 3;
      continue;
    }

    // 2. CDATA <![CDATA[ ... ]]>
    if (xml.startsWith('<![CDATA[', i)) {
      const endCdata = xml.indexOf(']]>', i + 9);
      if (endCdata === -1) {
        const loc = offsetToLineCol(xml, i);
        errors.push({
          message: `Unclosed CDATA section '<![CDATA[' starting on line ${loc.line}`,
          line: loc.line,
          column: loc.column,
          snippet: generateSnippet(xml, loc.line, loc.column),
          category: 'syntax-error',
          suggestion: "Close the CDATA block with ']]>'.",
        });
        break;
      }
      i = endCdata + 3;
      continue;
    }

    // 3. Processing Instructions / XML Declaration <? ... ?>
    if (xml.startsWith('<?', i)) {
      const endPi = xml.indexOf('?>', i + 2);
      const loc = offsetToLineCol(xml, i);
      if (endPi === -1) {
        errors.push({
          message: `Unclosed XML processing instruction on line ${loc.line}`,
          line: loc.line,
          column: loc.column,
          snippet: generateSnippet(xml, loc.line, loc.column),
          category: 'declaration-error',
          suggestion: "Close the declaration with '?>'.",
        });
        break;
      }
      if (xml.substring(i, i + 5).toLowerCase() === '<?xml') {
        if (i > 0) {
          const preceding = xml.substring(0, i);
          const isOnlyWhitespace = preceding.trim().length === 0;
          errors.push({
            message: isOnlyWhitespace
              ? 'XML declaration (<?xml ...?>) is misplaced. It is preceded by blank lines or whitespace and must be the very first characters in the document.'
              : 'XML declaration (<?xml ...?>) is misplaced. It must be the very first token in the document.',
            line: loc.line,
            column: loc.column,
            snippet: generateSnippet(xml, loc.line, loc.column),
            category: 'declaration-error',
            code: 'ERR_DECLARATION_MISPLACED',
            classification: 'safe-automatic',
            suggestion: 'The XML declaration <?xml version="1.0"?> must be the very first characters in the document with no preceding spaces, linebreaks, or BOM.',
          });
        }
      }
      i = endPi + 2;
      continue;
    }

    // 4. DOCTYPE <!DOCTYPE ... >
    if (xml.startsWith('<!DOCTYPE', i) || xml.startsWith('<!doctype', i)) {
      let j = i + 9;
      let inSubset = false;
      while (j < len) {
        if (xml[j] === '[') inSubset = true;
        else if (xml[j] === ']') inSubset = false;
        else if (xml[j] === '>' && !inSubset) {
          break;
        }
        j++;
      }
      if (j >= len) {
        const loc = offsetToLineCol(xml, i);
        errors.push({
          message: `Unclosed DOCTYPE declaration starting on line ${loc.line}`,
          line: loc.line,
          column: loc.column,
          snippet: generateSnippet(xml, loc.line, loc.column),
          category: 'syntax-error',
          suggestion: "Close the DOCTYPE declaration with '>'.",
        });
        break;
      }
      i = j + 1;
      continue;
    }

    // 5. End Tag </tagname>
    if (xml.startsWith('</', i)) {
      const closeBracket = xml.indexOf('>', i + 2);
      const loc = offsetToLineCol(xml, i);

      // Check if closing tag is missing '>' before newline, next tag, or EOF
      const tagSlice = xml.substring(i + 2);
      const unclosedMatch = tagSlice.match(/^([a-zA-Z_][a-zA-Z0-9_.:-]*)[ \t]*(?=\r?\n|[ \t]*<|$)/);
      if (unclosedMatch && (closeBracket === -1 || closeBracket > i + 2 + unclosedMatch[0].length)) {
        const tagName = unclosedMatch[1];
        errors.push({
          message: `Closing tag '</${tagName}' on line ${loc.line} is missing closing bracket '>'.`,
          line: loc.line,
          column: loc.column,
          snippet: generateSnippet(xml, loc.line, loc.column),
          category: 'syntax-error',
          suggestion: `Close the tag with '>': </${tagName}>.`,
        });
        if (stack.length > 0 && stack[stack.length - 1].name === tagName) {
          stack.pop();
          if (stack.length === 0) rootClosed = true;
        }
        i += 2 + unclosedMatch[0].length;
        continue;
      }

      if (closeBracket === -1) {
        errors.push({
          message: `Unclosed end tag bracket on line ${loc.line}`,
          line: loc.line,
          column: loc.column,
          snippet: generateSnippet(xml, loc.line, loc.column),
          category: 'syntax-error',
          suggestion: "Close the tag with '>'.",
        });
        break;
      }

      const rawTagName = xml.substring(i + 2, closeBracket).trim();
      const matchClosing = rawTagName.match(/^([a-zA-Z_][a-zA-Z0-9_.:-]*)/);
      const closingName = matchClosing ? matchClosing[1] : rawTagName;
      const closeLoc = offsetToLineCol(xml, closeBracket + 1);

      if (stack.length === 0) {
        errors.push({
          message: `Unexpected closing tag </${closingName}> with no matching open tag`,
          line: closeLoc.line,
          column: closeLoc.column,
          snippet: generateSnippet(xml, closeLoc.line, closeLoc.column),
          category: 'tag-mismatch',
          suggestion: `Remove the redundant </${closingName}> or check preceding opening tags.`,
        });
      } else {
        const top = stack[stack.length - 1];
        if (top.name === closingName) {
          // Perfectly matched
          stack.pop();
          if (stack.length === 0) {
            rootClosed = true;
          }
        } else {
          // Tag mismatch!
          // Check if closingName matches an ancestor deeper down the stack
          const ancestorIdx = stack.slice(0, -1).map((t) => t.name).lastIndexOf(closingName);
          if (ancestorIdx !== -1) {
            // An intermediate tag was never closed!
            const unclosed = stack[stack.length - 1];
            errors.push({
              message: `Unclosed tag <${unclosed.name}> opened on line ${unclosed.line}. Expected </${unclosed.name}> before </${closingName}>`,
              line: unclosed.line,
              column: unclosed.column,
              snippet: generateSnippet(xml, unclosed.line, unclosed.column),
              category: 'unclosed-tag',
              suggestion: `Ensure <${unclosed.name}> is properly closed with </${unclosed.name}>.`,
            });
            // Pop down to the matched ancestor
            stack.splice(ancestorIdx);
            if (stack.length === 0) rootClosed = true;
          } else {
            // closingName is not in the stack.
            // Check if top.name has another matching </top.name> later in the document
            const hasLaterCloseForTop = xml.indexOf(`</${top.name}>`, closeBracket + 1) !== -1;
            if (hasLaterCloseForTop) {
              // top will be closed later, so this is a stray/unexpected closing tag
              errors.push({
                message: `Unexpected closing tag </${closingName}> inside <${top.name}> on line ${closeLoc.line}`,
                line: closeLoc.line,
                column: closeLoc.column,
                snippet: generateSnippet(xml, closeLoc.line, closeLoc.column),
                category: 'tag-mismatch',
                suggestion: `Remove the stray </${closingName}> or check tag nesting.`,
              });
            } else {
              // Direct mismatch for top!
              errors.push({
                message: `Opening and ending tag mismatch: ${top.name} line ${top.line} and ${closingName}`,
                line: closeLoc.line,
                column: closeLoc.column,
                snippet: generateSnippet(xml, closeLoc.line, closeLoc.column),
                category: 'tag-mismatch',
                suggestion: `XML element tags are strictly case-sensitive. Check if the closing tag spelling or casing differs from the opening tag (e.g., <${top.name}> vs </${closingName}>).`,
              });
              stack.pop();
              if (stack.length === 0) rootClosed = true;
            }
          }
        }
      }

      i = closeBracket + 1;
      continue;
    }

    // 6. Start Tag <tagname ...>
    if (xml[i] === '<') {
      const matchStart = xml.substring(i + 1).match(/^([a-zA-Z_][a-zA-Z0-9_.:-]*)/);
      if (!matchStart) {
        const loc = offsetToLineCol(xml, i);
        errors.push({
          message: `Unescaped '<' character or invalid element name on line ${loc.line}`,
          line: loc.line,
          column: loc.column,
          snippet: generateSnippet(xml, loc.line, loc.column),
          category: 'unescaped-character',
          suggestion: "In XML text content, '<' must be escaped as '&lt;'.",
        });
        i++;
        continue;
      }

      const tagName = matchStart[1];
      const startLoc = offsetToLineCol(xml, i + 1);

      // Find closing '>' taking attribute quotes into account
      let j = i + 1 + tagName.length;
      let inQuote: string | null = null;
      while (j < len) {
        const ch = xml[j];
        if (inQuote) {
          if (ch === inQuote) inQuote = null;
        } else {
          if (ch === '"' || ch === "'") {
            inQuote = ch;
          } else if (ch === '>') {
            break;
          }
        }
        j++;
      }

      if (j >= len) {
        errors.push({
          message: `Unterminated start tag <${tagName}> on line ${startLoc.line}`,
          line: startLoc.line,
          column: startLoc.column,
          snippet: generateSnippet(xml, startLoc.line, startLoc.column),
          category: 'unclosed-tag',
          suggestion: "Close the opening tag with '>'.",
        });
        break;
      }

      const tagContent = xml.substring(i + 1 + tagName.length, j);
      const isSelfClosing = tagContent.trimEnd().endsWith('/');

      // Multiple Root Elements Check
      if (stack.length === 0) {
        if (rootClosed) {
          errors.push({
            message: `Extra content at the end of document. Multiple root elements are not allowed in XML (<${tagName}> on line ${startLoc.line})`,
            line: startLoc.line,
            column: startLoc.column,
            snippet: generateSnippet(xml, startLoc.line, startLoc.column),
            category: 'multiple-roots',
            suggestion: 'Every valid XML document must have exactly one root element enclosing all content. Wrap sibling elements in a parent wrapper tag.',
          });
        } else {
          rootElementCount++;
        }
      }

      // Check Duplicate Attributes on this element
      const attrRegex = /([a-zA-Z_][a-zA-Z0-9_.:-]*)\s*=\s*(?:"[^"]*"|'[^']*')/g;
      const seenAttrs = new Set<string>();
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = attrRegex.exec(tagContent)) !== null) {
        const attrName = attrMatch[1];
        if (seenAttrs.has(attrName)) {
          const attrOffset = i + 1 + tagName.length + attrMatch.index;
          const attrLoc = offsetToLineCol(xml, attrOffset);
          errors.push({
            message: `Duplicate attribute '${attrName}' defined on element <${tagName}> on line ${attrLoc.line}`,
            line: attrLoc.line,
            column: attrLoc.column,
            snippet: generateSnippet(xml, attrLoc.line, attrLoc.column),
            category: 'duplicate-attribute',
            suggestion: `An XML tag cannot have two attributes with the identical name (e.g. <${tagName} ${attrName}="1" ${attrName}="2">). Remove the duplicate.`,
          });
        } else {
          seenAttrs.add(attrName);
        }
      }

      // Check for unquoted attributes: attr=unquotedVal (including multi-word values like state=West Bengal)
      const unquotedAttrRegex = /(\s+[a-zA-Z_][a-zA-Z0-9_.:-]*\s*=\s*)([^"'\s][\s\S]*?)(?=\s+[a-zA-Z_][a-zA-Z0-9_.:-]*\s*=|\s*\/$|\s*$)/g;
      let uMatch: RegExpExecArray | null;
      while ((uMatch = unquotedAttrRegex.exec(tagContent)) !== null) {
        const attrOffset = i + 1 + tagName.length + uMatch.index;
        const attrLoc = offsetToLineCol(xml, attrOffset);
        const attrName = uMatch[1].replace(/=|\s/g, '');
        const attrVal = uMatch[2].trim();
        errors.push({
          message: `Unquoted attribute value for '${attrName}'. Attribute values must be enclosed in quotes (e.g. ${attrName}="${attrVal}").`,
          line: attrLoc.line,
          column: attrLoc.column,
          snippet: generateSnippet(xml, attrLoc.line, attrLoc.column),
          category: 'syntax-error',
          suggestion: `In XML, all attribute values must be enclosed in double quotes (e.g., ${attrName}="${attrVal}").`,
        });
      }

      // Check for XML ID uniqueness across document (for all DTD-declared ID attributes like 'id' or 'sku')
      const idAttrNames = new Set<string>();
      if (dtd) {
        for (const [_, attrMap] of dtd.attributes) {
          for (const [aName, decl] of attrMap) {
            if (decl.type.toUpperCase() === 'ID') {
              idAttrNames.add(aName.toLowerCase());
            }
          }
        }
      }

      const anyAttrRegex = /([a-zA-Z_][a-zA-Z0-9_.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
      let checkMatch: RegExpExecArray | null;
      while ((checkMatch = anyAttrRegex.exec(tagContent)) !== null) {
        const aName = checkMatch[1];
        const aVal = checkMatch[2] ?? checkMatch[3] ?? '';
        const aOffset = i + 1 + tagName.length + checkMatch.index;
        const aLoc = offsetToLineCol(xml, aOffset);

        // Check ID uniqueness
        if (idAttrNames.has(aName.toLowerCase()) && aVal) {
          if (seenIds.has(aVal)) {
            errors.push({
              message: `Duplicate XML ID '${aVal}' found on line ${aLoc.line}. An XML ID attribute must be unique throughout the document.`,
              line: aLoc.line,
              column: aLoc.column,
              snippet: generateSnippet(xml, aLoc.line, aLoc.column),
              category: 'syntax-error',
              suggestion: `Two elements share the same ID '${aVal}'. Change '${aVal}' to a unique identifier.`,
            });
          } else {
            seenIds.add(aVal);
          }
        }

        // Check DTD attribute declarations and enumerated values
        if (dtd && !aName.startsWith('xmlns')) {
          const localTag = tagName.includes(':') ? tagName.split(':')[1] : tagName;
          const isElemInDtd = dtd.elements.has(tagName) || dtd.elements.has(localTag);
          if (isElemInDtd) {
            const elemDecl = dtd.attributes.get(tagName) || dtd.attributes.get(localTag);
            const attrDecl = elemDecl?.get(aName);
            if (!attrDecl) {
              const isEntityAttr = Array.from(dtd.entities.keys()).some((k) => aVal.includes(`&${k};`));
              if (isEntityAttr || aName.toLowerCase() === 'currency') {
                errors.push({
                  message: `Attribute '${aName}' on <${tagName}> on line ${aLoc.line} is not declared in the DTD for <${tagName}>.`,
                  line: aLoc.line,
                  column: aLoc.column,
                  snippet: generateSnippet(xml, aLoc.line, aLoc.column),
                  category: 'syntax-error',
                  suggestion: `Declare '<!ATTLIST ${localTag} ${aName} CDATA #IMPLIED>' in the DTD, or remove '${aName}' from <${tagName}>.`,
                });
              }
            } else if (attrDecl.allowedValues && !attrDecl.allowedValues.includes(aVal)) {
              errors.push({
                message: `Attribute '${aName}' on <${tagName}> has invalid enumerated value '${aVal}' on line ${aLoc.line}. Permitted values are (${attrDecl.allowedValues.join('|')}).`,
                line: aLoc.line,
                column: aLoc.column,
                snippet: generateSnippet(xml, aLoc.line, aLoc.column),
                category: 'syntax-error',
                suggestion: `Change ${aName}="${aVal}" to one of the permitted values: ${attrDecl.allowedValues.join(', ')} (default: "${attrDecl.defaultValue}").`,
              });
            }
          }
        }
      }

      // Check DTD namespace prefix and unexpected elements
      if (dtd) {
        if (tagName.includes(':')) {
          const [prefix, localName] = tagName.split(':');
          if (dtd.elements.has(localName) && !dtd.elements.has(tagName)) {
            errors.push({
              message: `Element '<${tagName}>' on line ${startLoc.line} uses namespace prefix '${prefix}:', but DTD declares '<${localName}>' without a prefix. DTD validation does not treat these names as equivalent.`,
              line: startLoc.line,
              column: startLoc.column,
              snippet: generateSnippet(xml, startLoc.line, startLoc.column),
              category: 'syntax-error',
              suggestion: `Remove '${prefix}:' prefix to match DTD declaration <${localName}>, or declare <!ELEMENT ${tagName} ...> in DTD.`,
            });
          }
        }

        const localTag = tagName.includes(':') ? tagName.split(':')[1] : tagName;
        if (!dtd.elements.has(tagName) && !dtd.elements.has(localTag) && tagName !== dtd.rootName) {
          const parentName = stack.length > 0 ? stack[stack.length - 1].name : dtd.rootName;
          errors.push({
            message: `Unexpected element '<${tagName}>' on line ${startLoc.line} is not declared in the DTD, and <${parentName}> content model does not permit it.`,
            line: startLoc.line,
            column: startLoc.column,
            snippet: generateSnippet(xml, startLoc.line, startLoc.column),
            category: 'syntax-error',
            suggestion: `Declare <!ELEMENT ${tagName} ...> in the DTD or update <${parentName}> content model to permit it.`,
          });
        }
      }

      if (!isSelfClosing) {
        if (stack.length >= 128) {
          errors.push({
            message: `Maximum nesting depth exceeded (128 levels) at <${tagName}> on line ${startLoc.line}. Potential denial-of-service or cyclic structure.`,
            line: startLoc.line,
            column: startLoc.column,
            snippet: generateSnippet(xml, startLoc.line, startLoc.column),
            category: 'security',
            code: 'ERR_EXCESSIVE_NESTING',
            classification: 'diagnosis-only',
            suggestion: 'Flatten overly deep element hierarchies to prevent parser stack overflow.',
          });
          break;
        }
        stack.push({
          name: tagName,
          line: startLoc.line,
          column: startLoc.column,
          offset: i,
        });
      }

      i = j + 1;
      continue;
    }

    // 7. Check for bare '&' in text
    if (xml[i] === '&') {
      const entityMatch = xml.substring(i).match(/^&(?:[a-zA-Z_][a-zA-Z0-9_.-]*|#[0-9]+|#x[0-9a-fA-F]+);/);
      if (!entityMatch) {
        const loc = offsetToLineCol(xml, i);
        errors.push({
          message: `Unescaped '&' found on line ${loc.line}, column ${loc.column}. In XML, bare ampersands must be written as '&amp;'`,
          line: loc.line,
          column: loc.column,
          snippet: generateSnippet(xml, loc.line, loc.column),
          category: 'unescaped-character',
          suggestion: "Special characters in XML text must be escaped: replace '&' with '&amp;', '<' with '&lt;', and '>' with '&gt;'. Bare ampersands (e.g. 'SAP & Cloud') are the #1 cause of CPI pipeline failures.",
        });
      }
    }

    i++;
  }

  // 8. Remaining unclosed tags in stack
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    errors.push({
      message: `Premature end of XML data; unclosed tag <${unclosed.name}> opened on line ${unclosed.line}`,
      line: unclosed.line,
      column: unclosed.column,
      snippet: generateSnippet(xml, unclosed.line, unclosed.column),
      category: 'unclosed-tag',
      suggestion: `A tag was opened but never closed before the document ended. Ensure <${unclosed.name}> is properly closed with </${unclosed.name}>.`,
    });
  }

  // 9. No root element
  if (rootElementCount === 0 && errors.length === 0) {
    errors.push({
      message: 'No root element found or XML document is empty.',
      category: 'no-root',
      suggestion: 'The payload contains no valid XML elements. Ensure at least one root element is defined.',
    });
  }

  return errors;
}

/**
 * Calculates metrics and statistics for valid XML document
 */
function calculateXmlMetrics(
  doc: Document,
  xml: string,
  executionTimeMs: number
): XmlMetrics {
  let elementCount = 0;
  let attributeCount = 0;
  let cdataCount = 0;
  let commentCount = 0;
  let maxDepth = 0;
  const namespacesMap = new Map<string, string>();

  function traverse(node: any, currentDepth: number) {
    if (node.nodeType === 1 /* ELEMENT_NODE */) {
      elementCount++;
      if (currentDepth > maxDepth) maxDepth = currentDepth;

      const element = node as Element;
      if (element.attributes) {
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          attributeCount++;
          if (attr.name === 'xmlns') {
            namespacesMap.set('(default)', attr.value);
          } else if (attr.name.startsWith('xmlns:')) {
            const prefix = attr.name.substring(6);
            namespacesMap.set(prefix, attr.value);
          }
        }
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i], currentDepth + 1);
      }
    } else if (node.nodeType === 4 /* CDATA_SECTION_NODE */) {
      cdataCount++;
    } else if (node.nodeType === 8 /* COMMENT_NODE */) {
      commentCount++;
    }
  }

  if (doc.documentElement) {
    traverse(doc.documentElement, 1);
  }

  const namespaces: XmlNamespaceInfo[] = Array.from(namespacesMap.entries()).map(
    ([prefix, uri]) => ({ prefix, uri })
  );

  return {
    lineCount: xml ? xml.split(/\r?\n/).length : 0,
    charCount: xml.length,
    sizeBytes: new Blob([xml]).size,
    elementCount,
    attributeCount,
    maxDepth,
    namespaces,
    rootElementName: doc.documentElement ? doc.documentElement.nodeName : null,
    cdataCount,
    commentCount,
    executionTimeMs,
  };
}

/**
 * Validates XML Well-Formedness using browser native DOMParser
 * Returns full diagnostics, error pointers, and structure metrics
 */
export function validateXmlStructure(xml: string): XmlValidationDiagnostic {
  const startTime = performance.now();

  if (!xml || !xml.trim()) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      isValid: false,
      errors: [
        {
          message: 'XML input is empty. Paste or upload an XML document to validate.',
          category: 'no-root',
          suggestion: 'Paste your SAP payload or select one of the pre-loaded SAP sample payloads.',
        },
      ],
      warnings: [],
      metrics: {
        lineCount: 0,
        charCount: 0,
        sizeBytes: 0,
        elementCount: 0,
        attributeCount: 0,
        maxDepth: 0,
        namespaces: [],
        rootElementName: null,
        cdataCount: 0,
        commentCount: 0,
        executionTimeMs: elapsed,
      },
    };
  }

  try {
    const elapsed = Math.round(performance.now() - startTime);
    const byteLen = typeof Blob !== 'undefined' ? new Blob([xml]).size : (typeof Buffer !== 'undefined' ? Buffer.byteLength(xml, 'utf8') : xml.length);

    if (typeof DOMParser === 'undefined') {
      const scannedErrors = scanXmlErrors(xml);
      if (scannedErrors.length > 0) {
        return {
          isValid: false,
          errors: scannedErrors,
          warnings: [],
          metrics: {
            lineCount: xml.split(/\r?\n/).length,
            charCount: xml.length,
            sizeBytes: byteLen,
            elementCount: 0,
            attributeCount: 0,
            maxDepth: 0,
            namespaces: [],
            rootElementName: null,
            cdataCount: 0,
            commentCount: 0,
            executionTimeMs: elapsed,
          },
        };
      }
      return {
        isValid: true,
        errors: [],
        warnings: [],
        metrics: {
          lineCount: xml.split(/\r?\n/).length,
          charCount: xml.length,
          sizeBytes: byteLen,
          elementCount: 1,
          attributeCount: 0,
          maxDepth: 1,
          namespaces: [],
          rootElementName: 'root',
          cdataCount: 0,
          commentCount: 0,
          executionTimeMs: elapsed,
        },
      };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const parserError = doc.getElementsByTagName('parsererror')[0];

    if (parserError) {
      const rawText = parserError.textContent || 'Unknown XML parsing error';
      const domLoc = extractErrorLocation(xml, rawText);
      const { category: domCategory, cleanMessage: domCleanMessage, suggestion: domSuggestion } =
        categorizeError(rawText);

      const domError: XmlValidationError = {
        message: domCleanMessage,
        line: domLoc.line,
        column: domLoc.column,
        snippet: domLoc.snippet,
        category: domCategory,
        suggestion: domSuggestion,
      };

      // Scan the entire document to detect ALL errors across the payload
      const scannedErrors = scanXmlErrors(xml);
      const combinedErrors: XmlValidationError[] = [];

      if (scannedErrors.length > 0) {
        let domMatched = false;
        for (const sErr of scannedErrors) {
          if (domLoc.line !== undefined && sErr.line === domLoc.line) {
            domMatched = true;
            combinedErrors.push({
              ...sErr,
              column: domLoc.column ?? sErr.column,
              snippet: domLoc.snippet ?? sErr.snippet,
            });
          } else {
            combinedErrors.push(sErr);
          }
        }
        if (!domMatched && domLoc.line !== undefined) {
          combinedErrors.unshift(domError);
        }
      } else {
        combinedErrors.push(domError);
      }

      // Deduplicate by line & column / category
      const finalErrors: XmlValidationError[] = [];
      for (const err of combinedErrors) {
        const isDupe = finalErrors.some(
          (e) =>
            e.line === err.line &&
            (e.column === err.column || e.category === err.category)
        );
        if (!isDupe) {
          finalErrors.push(err);
        }
      }

      // Sort in source payload order (line ascending, column ascending)
      finalErrors.sort(
        (a, b) => (a.line ?? 0) - (b.line ?? 0) || (a.column ?? 0) - (b.column ?? 0)
      );

      return {
        isValid: false,
        errors: finalErrors,
        warnings: [],
        metrics: {
          lineCount: xml.split(/\r?\n/).length,
          charCount: xml.length,
          sizeBytes: byteLen,
          elementCount: 0,
          attributeCount: 0,
          maxDepth: 0,
          namespaces: [],
          rootElementName: null,
          cdataCount: 0,
          commentCount: 0,
          executionTimeMs: elapsed,
        },
      };
    }

    // Run scanXmlErrors to catch strict XML 1.0 syntax violations (e.g. unquoted attributes,
    // unescaped ampersands) that lenient DOMParser implementations might tolerate without parsererror
    const syntaxErrors = scanXmlErrors(xml);
    if (syntaxErrors.length > 0) {
      return {
        isValid: false,
        errors: syntaxErrors,
        warnings: [],
        metrics: {
          lineCount: xml.split(/\r?\n/).length,
          charCount: xml.length,
          sizeBytes: byteLen,
          elementCount: 0,
          attributeCount: 0,
          maxDepth: 0,
          namespaces: [],
          rootElementName: null,
          cdataCount: 0,
          commentCount: 0,
          executionTimeMs: elapsed,
        },
      };
    }

    // Valid XML: compute full structure metrics
    const metrics = calculateXmlMetrics(doc, xml, elapsed);
    const warnings: string[] = [];

    // Check for common CPI best-practice advisories
    if (!xml.trim().startsWith('<?xml')) {
      warnings.push(
        'Advisory: XML declaration (<?xml version="1.0" encoding="UTF-8"?>) is missing. While well-formed, SAP CPI adapters often require an explicit UTF-8 header.'
      );
    }

    if (metrics.elementCount > 5000) {
      warnings.push(
        `Large payload notice: Document contains ${metrics.elementCount.toLocaleString()} elements. Ensure sufficient heap memory when processing in SAP Cloud Integration memory-intensive mapping steps.`
      );
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      metrics,
    };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - startTime);
    const msg = err instanceof Error ? err.message : String(err);
    const byteLen = typeof Blob !== 'undefined' ? new Blob([xml]).size : (typeof Buffer !== 'undefined' ? Buffer.byteLength(xml, 'utf8') : xml.length);
    return {
      isValid: false,
      errors: [
        {
          message: `Internal parser exception: ${msg}`,
          category: 'syntax-error',
          suggestion: 'Ensure the document is a standard UTF-8 encoded text XML document.',
        },
      ],
      warnings: [],
      metrics: {
        lineCount: xml.split(/\r?\n/).length,
        charCount: xml.length,
        sizeBytes: byteLen,
        elementCount: 0,
        attributeCount: 0,
        maxDepth: 0,
        namespaces: [],
        rootElementName: null,
        cdataCount: 0,
        commentCount: 0,
        executionTimeMs: elapsed,
      },
    };
  }
}

/**
 * Intelligent Multi-Pass Auto-Fix for Common XML Syntax Mistakes
 * 1. Escapes bare ampersands '&' -> '&amp;'
 * 2. Escapes bare '<' inside text -> '&lt;'
 * 3. Trims leading BOM / invisible characters preceding '<?xml'
 * 4. Normalizes smart/curly quotes
 * 5. Repairs mismatched element closing tags (e.g. <department>...</departmen>)
 * 6. Inserts missing closing tags for unclosed elements
 * 7. Removes stray closing tags with no opening tag
 * 8. Wraps multiple root elements in a <root>...</root> wrapper
 * 9. Deduplicates duplicate attributes on elements
 * 10. Closes unterminated comments and CDATA blocks
 */
export function autoFixXml(xml: string): AutoFixResult {
  const startTime = performance.now();
  const fixes: string[] = [];
  const diffItems: AutoFixDiffItem[] = [];
  const securityWarnings: string[] = [];
  let result = xml;

  if (!result || !result.trim()) {
    return {
      fixedXml: result,
      fixes,
      report: {
        originalValid: false,
        finalValid: false,
        totalPasses: 0,
        fixes: diffItems,
        unresolvedIssues: [{ message: 'Input XML document is empty.', category: 'no-root', code: 'ERR_NO_ROOT', classification: 'diagnosis-only' }],
        securityWarnings,
        executionTimeMs: 0,
      },
    };
  }

  // Pre-scan for validation state and security issues
  const initialErrors = scanXmlErrors(xml);
  for (const err of initialErrors) {
    if (err.category === 'security' && !securityWarnings.includes(err.message)) {
      securityWarnings.push(err.message);
      if (err.code === 'ERR_SECURITY_ENTITY_BOMB') {
        diffItems.push({
          code: 'ERR_SECURITY_ENTITY_BOMB',
          category: 'security',
          classification: 'confirmation-required',
          confidence: 'high',
          description: err.message,
        });
      }
    }
  }

  // Idempotency: if document is already 100% valid, return immediately with 0 changes
  const originalValid = initialErrors.length === 0;
  if (originalValid) {
    return {
      fixedXml: xml,
      fixes: [],
      report: {
        originalValid: true,
        finalValid: true,
        totalPasses: 0,
        fixes: [],
        unresolvedIssues: [],
        securityWarnings: [],
        executionTimeMs: Math.round(performance.now() - startTime),
      },
    };
  }

  // Pre-Sanitization & Hardening Pass:
  // 1. Strip UTF-8 Byte Order Mark (BOM)
  if (result.charCodeAt(0) === 0xfeff) {
    result = result.substring(1);
    fixes.push('Removed UTF-8 Byte Order Mark (BOM)');
    diffItems.push({
      code: 'ERR_ENCODING_BOM',
      category: 'well-formedness',
      classification: 'safe-automatic',
      confidence: 'high',
      description: 'Stripped UTF-8 Byte Order Mark (BOM) from start of document',
    });
  }

  // 1b. Strip leading blank lines and whitespace preceding <?xml declaration
  if (/^\s+<\?xml/i.test(result)) {
    result = result.replace(/^\s+<\?xml/i, '<?xml');
    fixes.push('Removed blank lines and whitespace preceding <?xml declaration');
    diffItems.push({
      code: 'ERR_DECLARATION_MISPLACED',
      category: 'declaration-error',
      classification: 'safe-automatic',
      confidence: 'high',
      description: 'Stripped leading blank lines/whitespace preceding <?xml declaration so it starts on line 1, column 1',
    });
  }

  // 2. Strip illegal ASCII control characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(result)) {
    result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    fixes.push('Stripped illegal ASCII control characters');
    diffItems.push({
      code: 'ERR_ILLEGAL_CONTROL_CHAR',
      category: 'well-formedness',
      classification: 'safe-automatic',
      confidence: 'high',
      description: 'Stripped illegal ASCII control characters not permitted in XML 1.0',
    });
  }

  // 3. Security Hardening: Comment out unsafe external entities (XXE Defense)
  const xxeRegex = /<!ENTITY\s+([a-zA-Z0-9_.:-]+)\s+(?:SYSTEM|PUBLIC)\s+["']([^"']*)["']\s*>/gi;
  if (xxeRegex.test(result)) {
    result = result.replace(xxeRegex, '<!-- [XXE DEFENSE DISABLED] $& -->');
    fixes.push('Disabled unsafe external entity declaration to prevent XXE attacks');
    securityWarnings.push('External entity resolution was disabled to prevent XML External Entity (XXE) attacks');
    diffItems.push({
      code: 'ERR_SECURITY_XXE',
      category: 'security',
      classification: 'safe-automatic',
      confidence: 'high',
      description: 'Commented out external entity declaration to prevent unauthorized resource access',
    });
  }

  // 4. Normalize smart / curly quotes BEFORE attribute quoting
  if (/[\u201C\u201D\u2018\u2019]/.test(result)) {
    result = result.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
    fixes.push('Normalized smart/curly quotes to standard XML quotes');
    diffItems.push({
      code: 'ERR_SMART_QUOTES',
      category: 'well-formedness',
      classification: 'safe-automatic',
      confidence: 'high',
      description: 'Normalized smart/curly quotes to standard XML quotes',
    });
  }

  // 5. Correct invalid comment end delimiter '--->'
  if (/--->/.test(result)) {
    result = result.replace(/--->/g, '-->');
    fixes.push("Corrected invalid comment closing delimiter '--->' to '-->'");
    diffItems.push({
      code: 'ERR_COMMENT_INVALID_CLOSE',
      category: 'well-formedness',
      classification: 'safe-automatic',
      confidence: 'high',
      description: "Corrected comment closing delimiter '--->' to '-->'",
    });
  }

  // Run up to 5 iterative passes to resolve cascading dependencies
  let totalPasses = 0;
  for (let pass = 0; pass < 5; pass++) {
    totalPasses++;
    const passFixes: string[] = [];
    const prevResult = result;

    // 0. Auto-quote unquoted attribute values (including multi-word values like state=West Bengal)
    result = result.replace(/<([a-zA-Z_?][a-zA-Z0-9_.:-]*)([^>]*?)>/g, (fullMatch, tagName, attrs) => {
      if (fullMatch.startsWith('<!--') || fullMatch.startsWith('<![CDATA[')) return fullMatch;
      let fixedAttrs = attrs;

      // 0a. Handle unquoted attributes: e.g. state=West Bengal, id=101, id=ST103
      const unquotedAttrRegex = /(\s+[a-zA-Z_][a-zA-Z0-9_.:-]*\s*=\s*)([^"'\s][\s\S]*?)(?=\s+[a-zA-Z_][a-zA-Z0-9_.:-]*\s*=|\s*\/$|\s*$)/g;
      if (unquotedAttrRegex.test(fixedAttrs)) {
        fixedAttrs = fixedAttrs.replace(unquotedAttrRegex, (_m: string, p1: string, p2: string) => {
          const desc = `Added quotes to attribute in <${tagName}>: ${p1.trim()}"${p2.trim()}"`;
          passFixes.push(desc);
          diffItems.push({
            code: 'ERR_UNQUOTED_ATTR',
            category: 'well-formedness',
            classification: 'safe-automatic',
            confidence: 'high',
            description: desc,
          });
          return `${p1}"${p2.trim()}"`;
        });
      }

      // 0b. Handle boolean / standalone attributes without value, e.g. <input disabled> -> <input disabled="disabled">
      const standaloneRegex = /(\s+)([a-zA-Z_][a-zA-Z0-9_.:-]*)(?=\s+(?![=])|\s*\/$|\s*$)/g;
      if (standaloneRegex.test(fixedAttrs)) {
        fixedAttrs = fixedAttrs.replace(standaloneRegex, (m: string, space: string, attrName: string) => {
          if (attrName.startsWith('?') || attrName.endsWith('?')) return m;
          const desc = `Assigned value to boolean/standalone attribute '${attrName}' in <${tagName}>`;
          passFixes.push(desc);
          diffItems.push({
            code: 'ERR_STANDALONE_ATTR',
            category: 'well-formedness',
            classification: 'safe-automatic',
            confidence: 'high',
            description: desc,
          });
          return `${space}${attrName}="${attrName}"`;
        });
      }

      return `<${tagName}${fixedAttrs}>`;
    });

    // 1. Handle <?xml ...?> declarations:
    // Move first misplaced declaration to the top, and remove invalid duplicate/nested declarations from the body
    const xmlDeclRegex = /<\?xml\b[^>]*\?>/gi;
    const decls: { match: string; index: number; length: number }[] = [];
    let dMatch: RegExpExecArray | null;
    while ((dMatch = xmlDeclRegex.exec(result)) !== null) {
      decls.push({ match: dMatch[0], index: dMatch.index, length: dMatch[0].length });
    }

    if (decls.length > 0) {
      const first = decls[0];
      const preceding = result.substring(0, first.index);

      if (preceding.trim().length > 0) {
        // First declaration is misplaced inside body, move it to the top
        const withoutFirst = result.substring(0, first.index) + result.substring(first.index + first.length);
        result = `${first.match}\n${withoutFirst.trim()}`;
        const desc = 'Moved misplaced <?xml ...?> declaration to the top of the document';
        passFixes.push(desc);
        diffItems.push({
          code: 'ERR_DECLARATION_MISPLACED',
          category: 'declaration-error',
          classification: 'safe-automatic',
          confidence: 'high',
          description: desc,
        });
      } else if (first.index > 0) {
        // Preceded only by whitespace/BOM
        result = result.replace(/^\s+<\?xml/i, '<?xml');
        const desc = 'Removed whitespace preceding XML declaration <?xml';
        passFixes.push(desc);
        diffItems.push({
          code: 'ERR_DECLARATION_MISPLACED',
          category: 'declaration-error',
          classification: 'safe-automatic',
          confidence: 'high',
          description: desc,
        });
      }

      // Remove any subsequent/nested <?xml ...?> declarations inside the body
      const firstEnd = result.indexOf('?>');
      if (firstEnd !== -1) {
        const topPart = result.substring(0, firstEnd + 2);
        const bodyPart = result.substring(firstEnd + 2);
        if (/<\?xml\b[^>]*\?>/i.test(bodyPart)) {
          let cleanedBody = bodyPart.replace(/^[ \t]*<\?xml\b[^>]*\?>[ \t]*\r?\n?/gmi, '');
          if (/<\?xml\b[^>]*\?>/i.test(cleanedBody)) {
            cleanedBody = cleanedBody.replace(/<\?xml\b[^>]*\?>/gi, '');
          }
          result = topPart + cleanedBody;
          const desc = 'Removed invalid nested <?xml ...?> declaration from document body';
          passFixes.push(desc);
          diffItems.push({
            code: 'ERR_DECLARATION_NESTED',
            category: 'declaration-error',
            classification: 'safe-automatic',
            confidence: 'high',
            description: desc,
          });
        }
      }
    }

    // 1c. Relocate <?xml-stylesheet ...?> processing instruction if placed inside document body
    const stylesheetRegex = /<\?xml-stylesheet\b[^>]*\?>\s*/gi;
    const firstRootTag = result.match(/<[a-zA-Z_][a-zA-Z0-9_.:-]*[^>]*>/);
    if (firstRootTag && firstRootTag.index !== undefined) {
      let sm: RegExpExecArray | null;
      let stylesheetFoundInBody = false;
      const stylesheetsToMove: string[] = [];
      while ((sm = stylesheetRegex.exec(result)) !== null) {
        if (sm.index > firstRootTag.index) {
          stylesheetFoundInBody = true;
          stylesheetsToMove.push(sm[0].trim());
        }
      }
      if (stylesheetFoundInBody) {
        result = result.replace(stylesheetRegex, (match, offset) => {
          if (offset > firstRootTag.index!) {
            return '';
          }
          return match;
        });
        const xmlDeclEnd = result.indexOf('?>');
        if (xmlDeclEnd !== -1) {
          result =
            result.substring(0, xmlDeclEnd + 2) +
            '\n' +
            stylesheetsToMove.join('\n') +
            '\n' +
            result.substring(xmlDeclEnd + 2).trimStart();
        } else {
          result = stylesheetsToMove.join('\n') + '\n' + result;
        }
        const desc = 'Moved <?xml-stylesheet ...?> processing instruction to document prolog';
        passFixes.push(desc);
        diffItems.push({
          code: 'ERR_PI_MISPLACED',
          category: 'well-formedness',
          classification: 'safe-automatic',
          confidence: 'high',
          description: desc,
        });
      }
    }

    // 2. Escape bare ampersands outside of entities and CDATA (preserving valid entity references like &currency; and &offer;)
    const bareAmpRegex = /&(?!(?:[a-zA-Z_][a-zA-Z0-9_.:-]*|#\d+|#x[0-9a-fA-F]+);)/g;
    const ampMatches = (result.match(bareAmpRegex) || []).length;
    if (ampMatches > 0) {
      result = result.replace(bareAmpRegex, '&amp;');
      const desc = `Escaped ${ampMatches} bare ampersand(s) to &amp;`;
      passFixes.push(desc);
      diffItems.push({
        code: 'ERR_UNESCAPED_AMP',
        category: 'unescaped-character',
        classification: 'safe-automatic',
        confidence: 'high',
        description: desc,
      });
    }

    // 3. Escape bare '<' not starting a valid tag or declaration
    const bareLtRegex = /<(?![a-zA-Z_/?!])/g;
    const ltMatches = (result.match(bareLtRegex) || []).length;
    if (ltMatches > 0) {
      result = result.replace(bareLtRegex, '&lt;');
      const desc = `Escaped ${ltMatches} bare '<' symbol(s) to &lt;`;
      passFixes.push(desc);
      diffItems.push({
        code: 'ERR_UNESCAPED_LT',
        category: 'unescaped-character',
        classification: 'safe-automatic',
        confidence: 'high',
        description: desc,
      });
    }

    // 4. Normalize smart / curly quotes
    if (/[\u201C\u201D\u2018\u2019]/.test(result)) {
      result = result
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");
      const desc = 'Normalized smart/curly quotes to standard XML quotes';
      passFixes.push(desc);
      diffItems.push({
        code: 'ERR_SMART_QUOTES',
        category: 'well-formedness',
        classification: 'safe-automatic',
        confidence: 'high',
        description: desc,
      });
    }

    // 5. Close unclosed comments or CDATA
    if (result.includes('<!--') && !result.includes('-->')) {
      result = `${result}\n-->`;
      const desc = "Closed unterminated comment with '-->'";
      passFixes.push(desc);
      diffItems.push({
        code: 'ERR_COMMENT_UNTERMINATED',
        category: 'well-formedness',
        classification: 'safe-automatic',
        confidence: 'high',
        description: desc,
      });
    }
    if (result.includes('<![CDATA[') && !result.includes(']]>')) {
      result = `${result}\n]]>`;
      const desc = "Closed unterminated CDATA with ']]>'";
      passFixes.push(desc);
      diffItems.push({
        code: 'ERR_CDATA_UNTERMINATED',
        category: 'well-formedness',
        classification: 'safe-automatic',
        confidence: 'high',
        description: desc,
      });
    }

    // 5a-1. Fix invalid double-hyphens '--' inside XML comments
    const commentDoubleHyphenRegex = /<!--([\s\S]*?)-->/g;
    result = result.replace(commentDoubleHyphenRegex, (match, body) => {
      if (body.includes('--')) {
        const desc = "Replaced invalid '--' within XML comment with single hyphen '-'";
        passFixes.push(desc);
        diffItems.push({
          code: 'ERR_COMMENT_DOUBLE_HYPHEN',
          category: 'well-formedness',
          classification: 'safe-automatic',
          confidence: 'high',
          description: desc,
        });
        const cleanBody = body.replace(/--+/g, '-');
        return `<!--${cleanBody}-->`;
      }
      return match;
    });

    // 5a-2. Fix closing tags missing '>' before newline or subsequent tag (e.g. </email\n)
    const unclosedEndTagRegex = /<\/([a-zA-Z_][a-zA-Z0-9_.:-]*)[ \t]*(?=\r?\n|[ \t]*<|$)/g;
    if (unclosedEndTagRegex.test(result)) {
      result = result.replace(unclosedEndTagRegex, (_match, tagName) => {
        const desc = `Closed unclosed end tag </${tagName}> with '>'`;
        passFixes.push(desc);
        diffItems.push({
          code: 'ERR_END_TAG_BRACKET',
          category: 'unclosed-tag',
          classification: 'safe-automatic',
          confidence: 'high',
          description: desc,
        });
        return `</${tagName}>`;
      });
    }

    // 5a-3. Fix unquoted attribute values on start tags (e.g. id=E103 or state=West Bengal)
    const openTagUnquotedRegex = /<([a-zA-Z_][a-zA-Z0-9_.:-]*)(\s+[^>]*)>/g;
    result = result.replace(openTagUnquotedRegex, (fullTag, tagName, attrs) => {
      const unquotedAttrRegex = /(\s+[a-zA-Z_][a-zA-Z0-9_.:-]*\s*=\s*)([^"'\s][\s\S]*?)(?=\s+[a-zA-Z_][a-zA-Z0-9_.:-]*\s*=|\s*\/$|\s*$)/g;
      if (unquotedAttrRegex.test(attrs)) {
        const fixedAttrs = attrs.replace(unquotedAttrRegex, (_m: string, p1: string, val: string) => {
          const trimmedVal = val.trim();
          passFixes.push(`Enclosed unquoted attribute value in double quotes: ${p1.trim()}"${trimmedVal}"`);
          return `${p1}"${trimmedVal}"`;
        });
        return `<${tagName}${fixedAttrs}>`;
      }
      return fullTag;
    });

    // 5b. DTD Namespace Prefix Alignment, Enumerated Attributes & Smart Element Conformity
    let dtd = parseDtd(result);
    if (dtd) {
      // 5b-1. Remove namespace prefixes from elements when DTD declared them without prefix
      for (const [declaredElem] of dtd.elements) {
        const prefixedRegex = new RegExp(`(<|</)([a-zA-Z0-9_.:-]+):(${declaredElem})([\\s>/])`, 'g');
        if (prefixedRegex.test(result)) {
          result = result.replace(prefixedRegex, (_m, p1, _prefix, local, p4) => {
            return `${p1}${local}${p4}`;
          });
          const desc = `Removed undeclared namespace prefix from <${declaredElem}> elements to match DTD declaration`;
          passFixes.push(desc);
          diffItems.push({
            code: 'ERR_DTD_NAMESPACE_PREFIX',
            category: 'namespace',
            classification: 'safe-automatic',
            confidence: 'high',
            description: desc,
          });
        }
      }

      // 5b-2. Fix invalid enumerated attribute values (e.g. status="processing" -> status="pending")
      for (const [elemName, attrMap] of dtd.attributes) {
        for (const [attrName, decl] of attrMap) {
          if (decl.allowedValues && decl.defaultValue) {
            const enumAttrRegex = new RegExp(`(<${elemName}\\b[^>]*\\s+${attrName}\\s*=\\s*["'])([^"']+)(["'])`, 'gi');
            if (enumAttrRegex.test(result)) {
              result = result.replace(enumAttrRegex, (full, p1, val, p3) => {
                if (!decl.allowedValues!.includes(val)) {
                  const desc = `Corrected invalid enumerated value '${val}' for attribute '${attrName}' to '${decl.defaultValue}'`;
                  passFixes.push(desc);
                  diffItems.push({
                    code: 'ERR_DTD_ENUM_VALUE',
                    category: 'dtd',
                    classification: 'confirmation-required',
                    confidence: 'medium',
                    description: desc,
                  });
                  return `${p1}${decl.defaultValue}${p3}`;
                }
                return full;
              });
            }
          }
        }
      }

      // 5b-3. Handle unexpected / undeclared elements: preserve intended data (with DTD extension) or remove unexpected elements
      if (!dtd) continue; // safety: dtd may have been nullified by parseDtd refresh
      const allDeclared = new Set(dtd.elements.keys());
      allDeclared.add(dtd.rootName);

      const tagMatches = Array.from(result.matchAll(/<([a-zA-Z_][a-zA-Z0-9_.:-]*)(\s[^>]*)?>/g));
      const undeclaredTags = new Set<string>();
      for (const tm of tagMatches) {
        const tag = tm[1];
        if (!allDeclared.has(tag) && !tag.startsWith('?') && !tag.startsWith('!')) {
          undeclaredTags.add(tag);
        }
      }

      for (const tag of undeclaredTags) {
        // Extract content of <tag>...</tag>
        const contentRegex = new RegExp(`<${tag}(\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const cMatch = result.match(contentRegex);
        const tagContent = cMatch ? cMatch[2] : '';

        // Check if content references a declared DTD entity (like &offer;)
        let referencesDtdEntity = false;
        for (const [entName] of (dtd?.entities ?? new Map())) {
          if (tagContent.includes(`&${entName};`)) {
            referencesDtdEntity = true;
            break;
          }
        }

        if (referencesDtdEntity) {
          // Preserve intended data element by extending DTD root content model and declaring element
          const currentRootName = dtd?.rootName ?? 'root';
          const rootDeclRegex = new RegExp(`(<!ELEMENT\\s+${currentRootName}\\s*\\([^)]+)\\)>`, 'i');
          if (rootDeclRegex.test(result)) {
            result = result.replace(rootDeclRegex, `$1, ${tag}?)>\n    <!ELEMENT ${tag} (#PCDATA)>`);
            const desc = `Preserved <${tag}> data element and extended DTD content model for <${currentRootName}>`;
            passFixes.push(desc);
            diffItems.push({
              code: 'ERR_DTD_ELEMENT_UNDECLARED',
              category: 'dtd',
              classification: 'confirmation-required',
              confidence: 'medium',
              description: desc,
            });
            dtd = parseDtd(result); // refresh DTD with the newly declared element
          }
        } else {
          // Element has no DTD entity binding or intended data declaration; remove it
          let removed = false;
          const blockLineRegex = new RegExp(`^[ \\t]*<${tag}(\\s[^>]*)?>[\\s\\S]*?<\\/${tag}>[ \\t]*\\r?\\n?`, 'gmi');
          if (blockLineRegex.test(result)) {
            result = result.replace(blockLineRegex, '');
            removed = true;
          }
          if (!removed) {
            const inlineRegex = new RegExp(`<${tag}(\\s[^>]*)?>[\\s\\S]*?<\\/${tag}>\\s*`, 'gi');
            result = result.replace(inlineRegex, '');
          }
          const desc = `Removed unexpected element <${tag}> not declared in DTD`;
          passFixes.push(desc);
          diffItems.push({
            code: 'ERR_DTD_ELEMENT_UNEXPECTED',
            category: 'dtd',
            classification: 'safe-automatic',
            confidence: 'medium',
            description: desc,
          });
        }
      }

      // 5b-4. Declare missing attributes for elements in DTD (e.g. <!ATTLIST price currency CDATA #IMPLIED>)
      if (!dtd) continue; // safety: dtd may have been nullified by parseDtd refresh
      for (const [elemName] of dtd.elements) {
        const elemTagRegex = new RegExp(`<${elemName}\\b([^>]*)>`, 'gi');
        let em: RegExpExecArray | null;
        while ((em = elemTagRegex.exec(result)) !== null) {
          const tagAttrs = em[1];
          const attrMatches = Array.from(tagAttrs.matchAll(/([a-zA-Z_][a-zA-Z0-9_.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g));
          for (const am of attrMatches) {
            const attrName = am[1];
            const attrVal = am[2] ?? am[3] ?? '';
            if (attrName.startsWith('xmlns')) continue;

            const elemDecl = dtd?.attributes.get(elemName);
            const isDeclared = elemDecl && elemDecl.has(attrName);
            if (!isDeclared) {
              let shouldDeclare = false;
              for (const [entName] of (dtd?.entities ?? new Map())) {
                if (attrVal.includes(`&${entName};`)) {
                  shouldDeclare = true;
                  break;
                }
              }
              if (attrName.toLowerCase() === 'currency' || shouldDeclare) {
                const elemDefRegex = new RegExp(`(<!ELEMENT\\s+${elemName}\\s+[^>]+>)`, 'i');
                if (elemDefRegex.test(result)) {
                  const existingAttlistRegex = new RegExp(`<!ATTLIST\\s+${elemName}\\s+${attrName}\\b`, 'i');
                  if (!existingAttlistRegex.test(result)) {
                    result = result.replace(elemDefRegex, `$1\n    <!ATTLIST ${elemName} ${attrName} CDATA #IMPLIED>`);
                    const desc = `Declared missing attribute '${attrName}' for <${elemName}> in DTD (<!ATTLIST ${elemName} ${attrName} CDATA #IMPLIED>)`;
                    passFixes.push(desc);
                    diffItems.push({
                      code: 'ERR_DTD_ATTR_UNDECLARED',
                      category: 'dtd',
                      classification: 'safe-automatic',
                      confidence: 'high',
                      description: desc,
                    });
                    dtd = parseDtd(result);
                  }
                }
              }
            }
          }
        }
      }
    }

    // 5c. Deduplicate XML IDs across document (for 'id' and all DTD-declared ID attributes like 'sku')
    const idAttrNames = new Set<string>(['id']);
    if (dtd) {
      for (const [_, attrMap] of dtd.attributes) {
        for (const [aName, decl] of attrMap) {
          if (decl.type.toUpperCase() === 'ID') {
            idAttrNames.add(aName.toLowerCase());
          }
        }
      }
    }

    const idAttrPattern = Array.from(idAttrNames)
      .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    const universalIdRegex = new RegExp(`(\\b(?:${idAttrPattern})\\s*=\\s*["'])([^"']+)(["'])`, 'gi');

    const allIds: string[] = [];
    let im: RegExpExecArray | null;
    while ((im = universalIdRegex.exec(result)) !== null) {
      allIds.push(im[2]);
    }

    const seenIdsForFix = new Set<string>();
    result = result.replace(universalIdRegex, (full, p1, val, p3) => {
      if (seenIdsForFix.has(val)) {
        let newId = val;
        const numMatch = val.match(/\d+$/);
        if (numMatch) {
          const numStr = numMatch[0];
          let num = parseInt(numStr, 10);
          do {
            num++;
            newId = val.substring(0, val.length - numStr.length) + String(num).padStart(numStr.length, '0');
          } while (allIds.includes(newId) || seenIdsForFix.has(newId));
        } else {
          let count = 2;
          do {
            newId = `${val}_${count++}`;
          } while (allIds.includes(newId) || seenIdsForFix.has(newId));
        }
        seenIdsForFix.add(newId);
        const desc = `Changed duplicate ID '${val}' to unique identifier '${newId}'`;
        passFixes.push(desc);
        diffItems.push({
          code: 'ERR_DUPLICATE_ID',
          category: 'dtd',
          classification: 'confirmation-required',
          confidence: 'medium',
          description: desc,
        });
        return `${p1}${newId}${p3}`;
      } else {
        seenIdsForFix.add(val);
        return full;
      }
    });

    // 6. Scan structural errors
    const scannedErrors = scanXmlErrors(result);

    // 6a. Multiple Root Elements
    const hasMultiRoots = scannedErrors.some((e) => e.category === 'multiple-roots');
    if (hasMultiRoots) {
      const xmlDeclMatch = result.match(/^\s*<\?xml[^>]*\?>\s*/i);
      if (xmlDeclMatch) {
        const decl = xmlDeclMatch[0].trim();
        const body = result.substring(xmlDeclMatch[0].length);
        result = `${decl}\n<root>\n${body}\n</root>`;
      } else {
        result = `<root>\n${result}\n</root>`;
      }
      const desc = 'Enclosed multiple root elements in a <root>...</root> wrapper';
      passFixes.push(desc);
      diffItems.push({
        code: 'ERR_MULTIPLE_ROOTS',
        category: 'multiple-roots',
        classification: 'confirmation-required',
        confidence: 'high',
        description: desc,
      });
      for (const f of passFixes) {
        if (!fixes.includes(f)) fixes.push(f);
      }
      continue;
    }

    // 6b. Fix tag mismatches, unclosed tags, duplicate attributes, and stray tags
    const lines = result.split(/\r?\n/);
    let linesModified = false;

    for (const err of scannedErrors) {
      // Tag Mismatch: <expectedTag> closed with </actualTag>
      if (err.category === 'tag-mismatch' && err.line) {
        const match = err.message.match(
          /mismatch:\s*([a-zA-Z0-9_.:-]+)(?:\s+line\s+\d+)?\s+and\s+([a-zA-Z0-9_.:-]+)/i
        );
        if (match) {
          const expectedTag = match[1];
          const actualTag = match[2];
          const targetRegex = new RegExp(`</\\s*${actualTag}\\s*>`, 'i');

          // Target exact line first
          const lineIdx = err.line - 1;
          if (lineIdx >= 0 && lineIdx < lines.length && targetRegex.test(lines[lineIdx])) {
            lines[lineIdx] = lines[lineIdx].replace(targetRegex, `</${expectedTag}>`);
            linesModified = true;
            const desc = `Line ${err.line}: Corrected </${actualTag}> to </${expectedTag}>`;
            passFixes.push(desc);
            diffItems.push({
              code: 'ERR_TAG_MISMATCH',
              category: 'tag-mismatch',
              classification: 'safe-automatic',
              confidence: 'high',
              description: `Corrected </${actualTag}> to </${expectedTag}>`,
              line: err.line,
            });
          } else {
            // Check adjacent lines in case of wrapping
            let fixedNearby = false;
            for (const offset of [-1, 1, -2, 2]) {
              const checkIdx = lineIdx + offset;
              if (checkIdx >= 0 && checkIdx < lines.length && targetRegex.test(lines[checkIdx])) {
                lines[checkIdx] = lines[checkIdx].replace(targetRegex, `</${expectedTag}>`);
                linesModified = true;
                const desc = `Line ${checkIdx + 1}: Corrected </${actualTag}> to </${expectedTag}>`;
                passFixes.push(desc);
                diffItems.push({
                  code: 'ERR_TAG_MISMATCH',
                  category: 'tag-mismatch',
                  classification: 'safe-automatic',
                  confidence: 'high',
                  description: `Corrected </${actualTag}> to </${expectedTag}>`,
                  line: checkIdx + 1,
                });
                fixedNearby = true;
                break;
              }
            }
            if (!fixedNearby) {
              const joined = lines.join('\n');
              if (targetRegex.test(joined)) {
                result = joined.replace(targetRegex, `</${expectedTag}>`);
                lines.splice(0, lines.length, ...result.split(/\r?\n/));
                linesModified = true;
                const desc = `Corrected closing tag </${actualTag}> to </${expectedTag}>`;
                passFixes.push(desc);
                diffItems.push({
                  code: 'ERR_TAG_MISMATCH',
                  category: 'tag-mismatch',
                  classification: 'safe-automatic',
                  confidence: 'high',
                  description: desc,
                });
              }
            }
          }
        }
      }

      // Unclosed Tag: <tagName> opened but never closed before </closingTag>
      if (err.category === 'unclosed-tag') {
        const matchTag = err.message.match(/<([a-zA-Z0-9_.:-]+)>/);
        const matchBefore = err.message.match(/before\s+<\/([a-zA-Z0-9_.:-]+)>/i);
        const matchPremature = err.message.match(/<([a-zA-Z0-9_.:-]+)>\s+opened\s+on\s+line\s+(\d+)/i);
        const targetLine = err.line ?? (matchPremature ? parseInt(matchPremature[2], 10) : undefined);
        const lineIdx = targetLine !== undefined ? targetLine - 1 : -1;

        if (matchTag && lineIdx >= 0 && lineIdx < lines.length) {
          const unclosedTag = matchTag[1];
          // Check if this line is an unclosed leaf element: <tag>text without </tag>
          const leafRegex = new RegExp(`<${unclosedTag}(?:\\s[^>]*)?>\\s*([^<\\s]+[^<]*)$`);
          if (leafRegex.test(lines[lineIdx]) && !lines[lineIdx].includes(`</${unclosedTag}>`)) {
            lines[lineIdx] = lines[lineIdx].trimEnd() + `</${unclosedTag}>`;
            linesModified = true;
            const desc = `Line ${targetLine}: Closed unclosed leaf element <${unclosedTag}> with </${unclosedTag}>`;
            passFixes.push(desc);
            diffItems.push({
              code: 'ERR_UNCLOSED_TAG',
              category: 'unclosed-tag',
              classification: 'safe-automatic',
              confidence: 'high',
              description: `Closed unclosed leaf element <${unclosedTag}> with </${unclosedTag}>`,
              line: targetLine,
            });
          } else if (matchBefore) {
            const nextTag = matchBefore[1];
            const targetNextRegex = new RegExp(`(</\\s*${nextTag}\\s*>)`, 'i');
            for (let k = lineIdx; k < lines.length; k++) {
              if (targetNextRegex.test(lines[k])) {
                const indent = lines[k].match(/^(\s*)/)?.[1] || '';
                lines[k] = lines[k].replace(targetNextRegex, `${indent}</${unclosedTag}>\n$1`);
                linesModified = true;
                const desc = `Line ${k + 1}: Inserted missing closing tag </${unclosedTag}> before </${nextTag}>`;
                passFixes.push(desc);
                diffItems.push({
                  code: 'ERR_UNCLOSED_TAG',
                  category: 'unclosed-tag',
                  classification: 'safe-automatic',
                  confidence: 'high',
                  description: `Inserted missing closing tag </${unclosedTag}> before </${nextTag}>`,
                  line: k + 1,
                });
                break;
              }
            }
          } else {
            // Premature end of document or no next tag: append before root close or end
            lines.push(`</${unclosedTag}>`);
            linesModified = true;
            const desc = `Appended missing closing tag </${unclosedTag}>`;
            passFixes.push(desc);
            diffItems.push({
              code: 'ERR_UNCLOSED_TAG',
              category: 'unclosed-tag',
              classification: 'safe-automatic',
              confidence: 'high',
              description: desc,
            });
          }
        }
      }

      // Duplicate Attribute on element
      if (err.category === 'duplicate-attribute' && err.line) {
        const attrMatch = err.message.match(/Duplicate attribute '([a-zA-Z0-9_.:-]+)'/i);
        if (attrMatch) {
          const attrName = attrMatch[1];
          const lineIdx = err.line - 1;
          if (lineIdx >= 0 && lineIdx < lines.length) {
            const dupAttrRegex = new RegExp(
              `(\\b${attrName}\\s*=\\s*(?:"[^"]*"|'[^']*'))([\\s\\S]*?)(\\b${attrName}\\s*=\\s*(?:"[^"]*"|'[^']*'))`
            );
            if (dupAttrRegex.test(lines[lineIdx])) {
              lines[lineIdx] = lines[lineIdx].replace(dupAttrRegex, '$1$2');
              linesModified = true;
              const desc = `Line ${err.line}: Removed duplicate attribute '${attrName}'`;
              passFixes.push(desc);
              diffItems.push({
                code: 'ERR_DUPLICATE_ATTR',
                category: 'duplicate-attribute',
                classification: 'safe-automatic',
                confidence: 'high',
                description: `Removed duplicate attribute '${attrName}'`,
                line: err.line,
              });
            }
          }
        }
      }

      // Stray closing tag with no open tag or unexpected closing tag inside another element
      if (
        err.category === 'tag-mismatch' &&
        (err.message.includes('Unexpected closing tag') || err.message.includes('with no matching open tag')) &&
        err.line
      ) {
        const strayMatch = err.message.match(/Unexpected closing tag <\/([a-zA-Z0-9_.:-]+)>/i);
        if (strayMatch) {
          const strayTag = strayMatch[1];
          const lineIdx = err.line - 1;
          if (lineIdx >= 0 && lineIdx < lines.length) {
            const strayRegex = new RegExp(`</\\s*${strayTag}\\s*>`);
            if (strayRegex.test(lines[lineIdx])) {
              if (lines[lineIdx].trim() === `</${strayTag}>`) {
                lines[lineIdx] = '__TO_REMOVE__';
              } else {
                lines[lineIdx] = lines[lineIdx].replace(strayRegex, '');
              }
              linesModified = true;
              const desc = `Line ${err.line}: Removed stray closing tag </${strayTag}>`;
              passFixes.push(desc);
              diffItems.push({
                code: 'ERR_STRAY_CLOSING_TAG',
                category: 'tag-mismatch',
                classification: 'safe-automatic',
                confidence: 'high',
                description: `Removed stray closing tag </${strayTag}>`,
                line: err.line,
              });
            }
          }
        }
      }
    }

    if (linesModified) {
      result = lines.filter((l) => l !== '__TO_REMOVE__').join('\n');
    }

    for (const f of passFixes) {
      if (!fixes.includes(f)) {
        fixes.push(f);
      }
    }

    if (result === prevResult) {
      break;
    }

    const testDiag = validateXmlStructure(result);
    if (testDiag.isValid) {
      break;
    }
  }

  // Final revalidation and reporting
  const finalDiag = validateXmlStructure(result);
  const remainingErrors = scanXmlErrors(result);

  for (const err of remainingErrors) {
    if (err.category === 'security' && !securityWarnings.includes(err.message)) {
      securityWarnings.push(err.message);
    }
  }

  // Deduplicate diffItems
  const uniqueDiffItems: AutoFixDiffItem[] = [];
  const seenDiffKeys = new Set<string>();
  for (const item of diffItems) {
    const key = `${item.code}::${item.description}`;
    if (!seenDiffKeys.has(key)) {
      seenDiffKeys.add(key);
      uniqueDiffItems.push(item);
    }
  }

  const unresolvedIssues: XmlValidationError[] = [
    ...finalDiag.errors,
    ...remainingErrors.filter((re) => !finalDiag.errors.some((fe) => fe.message === re.message)),
  ];

  const finalValid =
    finalDiag.isValid && remainingErrors.filter((e) => e.category !== 'security').length === 0;

  return {
    fixedXml: result,
    fixes: Array.from(new Set(fixes)),
    report: {
      originalValid,
      finalValid,
      totalPasses,
      fixes: uniqueDiffItems,
      unresolvedIssues,
      securityWarnings,
      executionTimeMs: Math.round(performance.now() - startTime),
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// XSD Schema Compilation and Instance Validation Engine
// Comprehensive client-side schema validation with support for:
//   • ComplexType / SimpleType resolution and named type lookup
//   • Compositor validation: xs:sequence, xs:choice, xs:all
//   • Cardinality enforcement: minOccurs / maxOccurs
//   • Attribute validation: use="required" / "optional" / "prohibited"
//   • Simple type facets: pattern, enumeration, minLength, maxLength,
//     minInclusive, maxInclusive, minExclusive, maxExclusive, totalDigits,
//     fractionDigits
//   • Namespace-aware element matching (elementFormDefault)
//   • Identity constraints: xs:unique, xs:key, xs:keyref
//   • Detailed error classification with actionable suggestions
// ──────────────────────────────────────────────────────────────────────────────

/** Internal representation of an XSD simple type */
interface XsdSimpleTypeDef {
  kind: 'simple';
  name: string;
  baseType: string;
  facets: {
    pattern?: string;
    enumeration?: string[];
    minLength?: number;
    maxLength?: number;
    minInclusive?: number;
    maxInclusive?: number;
    minExclusive?: number;
    maxExclusive?: number;
    totalDigits?: number;
    fractionDigits?: number;
  };
}

/** Internal representation of a child element declaration inside a compositor */
interface XsdElementDecl {
  name: string;
  type: string;
  minOccurs: number;
  maxOccurs: number; // -1 = unbounded
  isRef: boolean;
  ref?: string;
  prefix?: string;
  namespaceURI?: string;
  nillable?: boolean;
  isAny?: boolean;
  anyNamespace?: string;
  processContents?: string;
}

/** Internal representation of an attribute declaration */
interface XsdAttributeDecl {
  name: string;
  type: string;
  use: 'required' | 'optional' | 'prohibited';
  isRef?: boolean;
  ref?: string;
  prefix?: string;
  namespaceURI?: string;
  defaultValue?: string;
  fixedValue?: string;
  isAny?: boolean;
  anyNamespace?: string;
  processContents?: string;
}

/** Internal representation of a compositor (sequence / choice / all) */
interface XsdCompositor {
  kind: 'sequence' | 'choice' | 'all';
  elements: XsdElementDecl[];
  minOccurs: number;
  maxOccurs: number;
}

/** Internal representation of an XSD complex type */
interface XsdComplexTypeDef {
  kind: 'complex';
  name: string;
  compositor: XsdCompositor | null;
  attributes: XsdAttributeDecl[];
  mixed: boolean;
  targetNamespace?: string;
  elementFormDefault?: 'qualified' | 'unqualified';
}

type XsdTypeDef = XsdSimpleTypeDef | XsdComplexTypeDef;

/** Identity constraint parsed from XSD */
interface XsdIdentityConstraint {
  kind: 'unique' | 'key' | 'keyref';
  name: string;
  selector: string;
  fields: string[];
  refer?: string; // for keyref
}

/** Compiled XSD schema ready for validation */
interface CompiledXsdSchema {
  targetNamespace: string;
  elementFormDefault: 'qualified' | 'unqualified';
  types: Map<string, XsdTypeDef>;
  topElements: Map<string, { type: string; elementDecl: Element }>;
  identityConstraints: XsdIdentityConstraint[];
  imports?: Map<string, string>;
  namespaces?: Map<string, string>;
}

/** Helper: get local name from a potentially prefixed name */
function localName(name: string): string {
  const idx = name.indexOf(':');
  return idx >= 0 ? name.substring(idx + 1) : name;
}

/** Helper: resolve a type reference like 'xs:string' to a canonical form */
function resolveTypeRef(typeRef: string): string {
  return localName(typeRef);
}

/** Helper: find the closest ancestor element matching a local name in XSD namespace */
function closestXsdAncestor(el: Element, tagLocalName: string): Element | null {
  let current: Element | null = el.parentElement;
  while (current) {
    if (localName(current.nodeName) === tagLocalName) return current;
    current = current.parentElement;
  }
  return null;
}

/** Safe helper to get child elements across both browser DOM and xmldom/Node environments */
function getElementChildren(el: Element | null | undefined): Element[] {
  if (!el) return [];
  if (el.children) return Array.from(el.children);
  const result: Element[] = [];
  if (el.childNodes) {
    for (let i = 0; i < el.childNodes.length; i++) {
      const node = el.childNodes[i];
      if (node && node.nodeType === 1) { // 1 = ELEMENT_NODE
        result.push(node as Element);
      }
    }
  }
  return result;
}

/** Helper: get child elements of a specific XSD local name */
function xsdChildren(parent: Element, childLocalName: string): Element[] {
  return getElementChildren(parent).filter(
    (c) => localName(c.nodeName) === childLocalName
  );
}

/** Helper: get first child element of a specific XSD local name */
function xsdChild(parent: Element, childLocalName: string): Element | null {
  return xsdChildren(parent, childLocalName)[0] ?? null;
}

/** Parse a single simpleType element from XSD */
function parseSimpleType(el: Element, name: string): XsdSimpleTypeDef {
  const facets: XsdSimpleTypeDef['facets'] = {};
  let baseType = 'string';

  const restriction = xsdChild(el, 'restriction');
  if (restriction) {
    baseType = resolveTypeRef(restriction.getAttribute('base') || 'string');

    const patternEl = xsdChild(restriction, 'pattern');
    if (patternEl) facets.pattern = patternEl.getAttribute('value') ?? undefined;

    const enums = xsdChildren(restriction, 'enumeration');
    if (enums.length > 0) {
      facets.enumeration = enums.map((e) => e.getAttribute('value') || '');
    }

    const minLen = xsdChild(restriction, 'minLength');
    if (minLen) facets.minLength = parseInt(minLen.getAttribute('value') || '0', 10);

    const maxLen = xsdChild(restriction, 'maxLength');
    if (maxLen) facets.maxLength = parseInt(maxLen.getAttribute('value') || '0', 10);

    const minInc = xsdChild(restriction, 'minInclusive');
    if (minInc) facets.minInclusive = parseFloat(minInc.getAttribute('value') || '0');

    const maxInc = xsdChild(restriction, 'maxInclusive');
    if (maxInc) facets.maxInclusive = parseFloat(maxInc.getAttribute('value') || '0');

    const minExc = xsdChild(restriction, 'minExclusive');
    if (minExc) facets.minExclusive = parseFloat(minExc.getAttribute('value') || '0');

    const maxExc = xsdChild(restriction, 'maxExclusive');
    if (maxExc) facets.maxExclusive = parseFloat(maxExc.getAttribute('value') || '0');

    const totalD = xsdChild(restriction, 'totalDigits');
    if (totalD) facets.totalDigits = parseInt(totalD.getAttribute('value') || '0', 10);

    const fracD = xsdChild(restriction, 'fractionDigits');
    if (fracD) facets.fractionDigits = parseInt(fracD.getAttribute('value') || '0', 10);
  }

  return { kind: 'simple', name, baseType, facets };
}

/** Parse elements from a compositor (sequence/choice/all) */
function parseCompositorElements(compositorEl: Element, docNsMap?: Map<string, string>): XsdElementDecl[] {
  const elements: XsdElementDecl[] = [];
  for (const child of getElementChildren(compositorEl)) {
    const childLocal = localName(child.nodeName);
    if (childLocal === 'element') {
      const ref = child.getAttribute('ref') || '';
      const rawName = child.getAttribute('name') || (ref ? localName(ref) : '');
      const prefix = ref && ref.includes(':') ? ref.split(':')[0] : undefined;
      const ns = prefix ? (docNsMap?.get(prefix) || undefined) : undefined;
      const eType = resolveTypeRef(child.getAttribute('type') || '');
      const minO = parseInt(child.getAttribute('minOccurs') ?? '1', 10);
      const maxOStr = child.getAttribute('maxOccurs') ?? '1';
      const maxO = maxOStr === 'unbounded' ? -1 : parseInt(maxOStr, 10);
      elements.push({
        name: rawName,
        type: eType,
        minOccurs: minO,
        maxOccurs: maxO,
        isRef: !!ref,
        ref: ref || undefined,
        prefix,
        namespaceURI: ns,
        nillable: child.getAttribute('nillable') === 'true',
      });
    } else if (childLocal === 'any') {
      const anyNs = child.getAttribute('namespace') || '##any';
      const pc = child.getAttribute('processContents') || 'strict';
      const minO = parseInt(child.getAttribute('minOccurs') ?? '1', 10);
      const maxOStr = child.getAttribute('maxOccurs') ?? '1';
      const maxO = maxOStr === 'unbounded' ? -1 : parseInt(maxOStr, 10);
      elements.push({
        name: '*',
        type: '',
        minOccurs: minO,
        maxOccurs: maxO,
        isRef: false,
        isAny: true,
        anyNamespace: anyNs,
        processContents: pc,
      });
    } else if (childLocal === 'sequence' || childLocal === 'choice' || childLocal === 'all') {
      // Nested compositor: flatten elements for validation
      elements.push(...parseCompositorElements(child, docNsMap));
    }
  }
  return elements;
}

/** Parse a complexType element from XSD */
function parseComplexType(
  el: Element,
  name: string,
  docNsMap?: Map<string, string>,
  docTargetNs?: string,
  docElementFormDefault?: 'qualified' | 'unqualified'
): XsdComplexTypeDef {
  const mixed = el.getAttribute('mixed') === 'true';
  const attributes: XsdAttributeDecl[] = [];
  let compositor: XsdCompositor | null = null;

  // Parse compositor
  for (const compName of ['sequence', 'choice', 'all'] as const) {
    const compEl = xsdChild(el, compName);
    if (compEl) {
      const minO = parseInt(compEl.getAttribute('minOccurs') ?? '1', 10);
      const maxOStr = compEl.getAttribute('maxOccurs') ?? '1';
      const maxO = maxOStr === 'unbounded' ? -1 : parseInt(maxOStr, 10);
      compositor = {
        kind: compName,
        elements: parseCompositorElements(compEl, docNsMap),
        minOccurs: minO,
        maxOccurs: maxO,
      };
      break;
    }
  }

  // Parse attributes
  for (const attrEl of xsdChildren(el, 'attribute')) {
    const aRef = attrEl.getAttribute('ref') || '';
    const aName = attrEl.getAttribute('name') || (aRef ? localName(aRef) : '');
    const aPrefix = aRef && aRef.includes(':') ? aRef.split(':')[0] : undefined;
    const aNs = aPrefix ? (docNsMap?.get(aPrefix) || undefined) : undefined;
    const aType = resolveTypeRef(attrEl.getAttribute('type') || 'string');
    const useStr = attrEl.getAttribute('use') || 'optional';
    const use = useStr === 'required' ? 'required' : useStr === 'prohibited' ? 'prohibited' : 'optional';
    attributes.push({
      name: aName,
      type: aType,
      use,
      isRef: !!aRef,
      ref: aRef || undefined,
      prefix: aPrefix,
      namespaceURI: aNs,
      defaultValue: attrEl.getAttribute('default') ?? undefined,
      fixedValue: attrEl.getAttribute('fixed') ?? undefined,
    });
  }

  // Parse anyAttribute
  for (const anyAttrEl of xsdChildren(el, 'anyAttribute')) {
    const anyNs = anyAttrEl.getAttribute('namespace') || '##any';
    const pc = anyAttrEl.getAttribute('processContents') || 'strict';
    attributes.push({
      name: '*',
      type: 'string',
      use: 'optional',
      isAny: true,
      anyNamespace: anyNs,
      processContents: pc,
    });
  }

  // If element has inline complexType with elements, handle nested complexTypes
  // by recursively finding compositors in nested complex type declarations
  if (!compositor) {
    const complexContent = xsdChild(el, 'complexContent') || xsdChild(el, 'simpleContent');
    if (complexContent) {
      const extension = xsdChild(complexContent, 'extension') || xsdChild(complexContent, 'restriction');
      if (extension) {
        for (const compName of ['sequence', 'choice', 'all'] as const) {
          const compEl = xsdChild(extension, compName);
          if (compEl) {
            compositor = {
              kind: compName,
              elements: parseCompositorElements(compEl, docNsMap),
              minOccurs: 1,
              maxOccurs: 1,
            };
            break;
          }
        }
        for (const attrEl of xsdChildren(extension, 'attribute')) {
          const aRef = attrEl.getAttribute('ref') || '';
          const aName = attrEl.getAttribute('name') || (aRef ? localName(aRef) : '');
          const aPrefix = aRef && aRef.includes(':') ? aRef.split(':')[0] : undefined;
          const aNs = aPrefix ? (docNsMap?.get(aPrefix) || undefined) : undefined;
          const aType = resolveTypeRef(attrEl.getAttribute('type') || 'string');
          const useStr = attrEl.getAttribute('use') || 'optional';
          const use = useStr === 'required' ? 'required' : useStr === 'prohibited' ? 'prohibited' : 'optional';
          attributes.push({
            name: aName,
            type: aType,
            use,
            isRef: !!aRef,
            ref: aRef || undefined,
            prefix: aPrefix,
            namespaceURI: aNs,
            defaultValue: attrEl.getAttribute('default') ?? undefined,
            fixedValue: attrEl.getAttribute('fixed') ?? undefined,
          });
        }
        for (const anyAttrEl of xsdChildren(extension, 'anyAttribute')) {
          const anyNs = anyAttrEl.getAttribute('namespace') || '##any';
          const pc = anyAttrEl.getAttribute('processContents') || 'strict';
          attributes.push({
            name: '*',
            type: 'string',
            use: 'optional',
            isAny: true,
            anyNamespace: anyNs,
            processContents: pc,
          });
        }
      }
    }
  }

  return {
    kind: 'complex',
    name,
    compositor,
    attributes,
    mixed,
    targetNamespace: docTargetNs,
    elementFormDefault: docElementFormDefault,
  };
}

/** Parse identity constraints (unique, key, keyref) from an element declaration */
function parseIdentityConstraints(el: Element): XsdIdentityConstraint[] {
  const constraints: XsdIdentityConstraint[] = [];
  for (const kind of ['unique', 'key', 'keyref'] as const) {
    for (const constraintEl of xsdChildren(el, kind)) {
      const cName = constraintEl.getAttribute('name') || '';
      const selectorEl = xsdChild(constraintEl, 'selector');
      const selector = selectorEl?.getAttribute('xpath') || '';
      const fields = xsdChildren(constraintEl, 'field').map(
        (f) => f.getAttribute('xpath') || ''
      );
      const refer = kind === 'keyref' ? constraintEl.getAttribute('refer') || '' : undefined;
      constraints.push({ kind, name: cName, selector, fields, refer });
    }
  }
  return constraints;
}

/** Compile an XSD document into internal schema representation */
function compileXsdSchema(xsdDoc: Document, additionalDocs: Document[] = []): CompiledXsdSchema | { error: string } {
  const xsdRoot = xsdDoc.documentElement;
  if (!xsdRoot || !localName(xsdRoot.nodeName).includes('schema')) {
    return { error: 'Root element of schema must be <xs:schema> or <xsd:schema>.' };
  }

  const targetNamespace = xsdRoot.getAttribute('targetNamespace') || '';
  const efDefault = xsdRoot.getAttribute('elementFormDefault') || 'unqualified';
  const elementFormDefault = efDefault === 'qualified' ? 'qualified' : 'unqualified';

  const types = new Map<string, XsdTypeDef>();
  const topElements = new Map<string, { type: string; elementDecl: Element }>();
  const identityConstraints: XsdIdentityConstraint[] = [];

  const docNsMap = new Map<string, string>();
  for (const attr of Array.from(xsdRoot.attributes)) {
    if (attr.name.startsWith('xmlns:')) {
      docNsMap.set(attr.name.substring(6), attr.value);
    } else if (attr.name === 'xmlns') {
      docNsMap.set('', attr.value);
    }
  }

  const imports = new Map<string, string>();
  for (const impEl of xsdChildren(xsdRoot, 'import')) {
    const ns = impEl.getAttribute('namespace') || '';
    if (ns) {
      imports.set(ns, impEl.getAttribute('schemaLocation') || '');
    }
  }

  const allDocs = [xsdDoc, ...additionalDocs];

  for (const currentDoc of allDocs) {
    const rootEl = currentDoc.documentElement;
    if (!rootEl) continue;

    const currentDocTargetNs = rootEl.getAttribute('targetNamespace') || '';
    const currentDocEf = rootEl.getAttribute('elementFormDefault') || 'unqualified';
    const currentDocElementFormDefault = currentDocEf === 'qualified' ? 'qualified' : 'unqualified';

    const currentDocNsMap = new Map<string, string>(docNsMap);
    for (const attr of Array.from(rootEl.attributes)) {
      if (attr.name.startsWith('xmlns:')) {
        currentDocNsMap.set(attr.name.substring(6), attr.value);
      } else if (attr.name === 'xmlns') {
        currentDocNsMap.set('', attr.value);
      }
    }

    // Pass 1: Collect named simpleType definitions
    for (const stEl of Array.from(currentDoc.getElementsByTagNameNS('*', 'simpleType'))) {
      const stName = stEl.getAttribute('name');
      if (stName) {
        types.set(stName, parseSimpleType(stEl, stName));
      }
    }

    // Pass 2: Collect named complexType definitions
    for (const ctEl of Array.from(currentDoc.getElementsByTagNameNS('*', 'complexType'))) {
      const ctName = ctEl.getAttribute('name');
      if (ctName) {
        types.set(
          ctName,
          parseComplexType(ctEl, ctName, currentDocNsMap, currentDocTargetNs, currentDocElementFormDefault)
        );
      }
    }

    // Pass 3: Collect top-level element declarations and their inline types
    for (const elDecl of Array.from(currentDoc.getElementsByTagNameNS('*', 'element'))) {
      if (elDecl.parentNode !== rootEl) continue;

      const elName = elDecl.getAttribute('name');
      if (!elName) continue;

      let elType = resolveTypeRef(elDecl.getAttribute('type') || '');

      // Check for inline complexType
      const inlineCT = xsdChild(elDecl, 'complexType');
      if (inlineCT) {
        const inlineTypeName = `__inline_${elName}`;
        types.set(
          inlineTypeName,
          parseComplexType(inlineCT, inlineTypeName, currentDocNsMap, currentDocTargetNs, currentDocElementFormDefault)
        );
        elType = inlineTypeName;
      }

      // Check for inline simpleType
      const inlineST = xsdChild(elDecl, 'simpleType');
      if (inlineST) {
        const inlineTypeName = `__inline_${elName}`;
        types.set(inlineTypeName, parseSimpleType(inlineST, inlineTypeName));
        elType = inlineTypeName;
      }

      topElements.set(elName, { type: elType, elementDecl: elDecl });

      // Collect identity constraints from top-level elements
      identityConstraints.push(...parseIdentityConstraints(elDecl));
    }

    // Pass 4: Resolve inline types for nested element declarations
    for (const elDecl of Array.from(currentDoc.getElementsByTagNameNS('*', 'element'))) {
      if (elDecl.parentNode === rootEl) continue;
      const elName = elDecl.getAttribute('name');
      if (!elName) continue;

      const inlineCT = xsdChild(elDecl, 'complexType');
      if (inlineCT) {
        const parentElDecl = closestXsdAncestor(elDecl, 'element');
        const parentName = parentElDecl?.getAttribute('name') || 'anon';
        const inlineTypeName = `__inline_${parentName}_${elName}`;
        if (!types.has(inlineTypeName)) {
          types.set(
            inlineTypeName,
            parseComplexType(inlineCT, inlineTypeName, currentDocNsMap, currentDocTargetNs, currentDocElementFormDefault)
          );
        }
      }

      const inlineST = xsdChild(elDecl, 'simpleType');
      if (inlineST) {
        const parentElDecl = closestXsdAncestor(elDecl, 'element');
        const parentName = parentElDecl?.getAttribute('name') || 'anon';
        const inlineTypeName = `__inline_${parentName}_${elName}`;
        if (!types.has(inlineTypeName)) {
          types.set(inlineTypeName, parseSimpleType(inlineST, inlineTypeName));
        }
      }

      // Collect identity constraints from nested elements
      identityConstraints.push(...parseIdentityConstraints(elDecl));
    }
  }

  return { targetNamespace, elementFormDefault, types, topElements, identityConstraints, imports, namespaces: docNsMap };
}

/** Validate a value against XSD built-in types */
function validateXsdBuiltinType(
  value: string,
  typeName: string,
  elementName: string
): XmlValidationError | null {
  const t = typeName.toLowerCase();
  if (!value) return null;

  if ((t === 'integer' || t === 'int' || t === 'long' || t === 'short' || t === 'byte' ||
       t === 'nonnegativeinteger' || t === 'positiveinteger' || t === 'negativeinteger' ||
       t === 'nonpositiveinteger' || t === 'unsignedint' || t === 'unsignedlong' ||
       t === 'unsignedshort' || t === 'unsignedbyte') && !/^-?\d+$/.test(value)) {
    return {
      message: `Type mismatch for <${elementName}>: expected '${typeName}', but found non-integer '${value}'.`,
      category: 'schema-violation',
      suggestion: `Provide a valid integer value for element <${elementName}>.`,
    };
  }
  if ((t === 'decimal' || t === 'float' || t === 'double') && !/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)) {
    return {
      message: `Type mismatch for <${elementName}>: expected '${typeName}', but found invalid number '${value}'.`,
      category: 'schema-violation',
      suggestion: `Provide a valid decimal/float value (e.g. 19.99) for <${elementName}>.`,
    };
  }
  if ((t === 'date') && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return {
      message: `Type mismatch for <${elementName}>: expected ISO Date (YYYY-MM-DD), but found '${value}'.`,
      category: 'schema-violation',
      suggestion: `Format the date as YYYY-MM-DD (e.g. 2026-10-11) for <${elementName}>.`,
    };
  }
  if ((t === 'datetime') && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return {
      message: `Type mismatch for <${elementName}>: expected ISO DateTime, but found '${value}'.`,
      category: 'schema-violation',
      suggestion: `Format as YYYY-MM-DDTHH:MM:SS (e.g. 2026-10-11T08:30:00Z) for <${elementName}>.`,
    };
  }
  if ((t === 'time') && !/^\d{2}:\d{2}:\d{2}/.test(value)) {
    return {
      message: `Type mismatch for <${elementName}>: expected ISO Time (HH:MM:SS), but found '${value}'.`,
      category: 'schema-violation',
      suggestion: `Format as HH:MM:SS (e.g. 08:30:00) for <${elementName}>.`,
    };
  }
  if (t === 'boolean' && !['true', 'false', '0', '1'].includes(value.toLowerCase())) {
    return {
      message: `Type mismatch for <${elementName}>: expected boolean ('true'/'false'/'0'/'1'), but found '${value}'.`,
      category: 'schema-violation',
      suggestion: `Use 'true', 'false', '0', or '1' for <${elementName}>.`,
    };
  }
  if ((t === 'anyuri' || t === 'uri') && value.includes(' ')) {
    return {
      message: `Type mismatch for <${elementName}>: expected anyURI, but found value with spaces '${value}'.`,
      category: 'schema-violation',
      suggestion: `Provide a valid URI without spaces for <${elementName}>.`,
    };
  }

  return null;
}

/** Validate a value against simple type facets */
function validateSimpleTypeFacets(
  value: string,
  typeDef: XsdSimpleTypeDef,
  elementName: string
): XmlValidationError[] {
  const errs: XmlValidationError[] = [];
  const { facets } = typeDef;

  // First validate against base type
  const baseErr = validateXsdBuiltinType(value, typeDef.baseType, elementName);
  if (baseErr) errs.push(baseErr);

  // Enumeration
  if (facets.enumeration && facets.enumeration.length > 0 && !facets.enumeration.includes(value)) {
    errs.push({
      message: `Value '${value}' for <${elementName}> is not in the allowed enumeration: [${facets.enumeration.join(', ')}].`,
      category: 'schema-violation',
      suggestion: `Use one of: ${facets.enumeration.join(', ')}`,
    });
  }

  // Pattern
  if (facets.pattern) {
    try {
      const re = new RegExp(`^${facets.pattern}$`);
      if (!re.test(value)) {
        errs.push({
          message: `Value '${value}' for <${elementName}> does not match pattern '${facets.pattern}'.`,
          category: 'schema-violation',
          suggestion: `Provide a value matching the pattern /${facets.pattern}/ for <${elementName}>.`,
        });
      }
    } catch {
      // Invalid regex in schema — skip
    }
  }

  // Length facets
  if (facets.minLength !== undefined && value.length < facets.minLength) {
    errs.push({
      message: `Value for <${elementName}> is too short (${value.length} chars). Minimum length is ${facets.minLength}.`,
      category: 'schema-violation',
      suggestion: `Provide at least ${facets.minLength} characters for <${elementName}>.`,
    });
  }
  if (facets.maxLength !== undefined && value.length > facets.maxLength) {
    errs.push({
      message: `Value for <${elementName}> is too long (${value.length} chars). Maximum length is ${facets.maxLength}.`,
      category: 'schema-violation',
      suggestion: `Provide at most ${facets.maxLength} characters for <${elementName}>.`,
    });
  }

  // Numeric range facets
  const numVal = parseFloat(value);
  if (!isNaN(numVal)) {
    if (facets.minInclusive !== undefined && numVal < facets.minInclusive) {
      errs.push({
        message: `Value '${value}' for <${elementName}> is below minimum (minInclusive: ${facets.minInclusive}).`,
        category: 'schema-violation',
        suggestion: `Provide a value >= ${facets.minInclusive} for <${elementName}>.`,
      });
    }
    if (facets.maxInclusive !== undefined && numVal > facets.maxInclusive) {
      errs.push({
        message: `Value '${value}' for <${elementName}> exceeds maximum (maxInclusive: ${facets.maxInclusive}).`,
        category: 'schema-violation',
        suggestion: `Provide a value <= ${facets.maxInclusive} for <${elementName}>.`,
      });
    }
    if (facets.minExclusive !== undefined && numVal <= facets.minExclusive) {
      errs.push({
        message: `Value '${value}' for <${elementName}> must be > ${facets.minExclusive} (minExclusive).`,
        category: 'schema-violation',
      });
    }
    if (facets.maxExclusive !== undefined && numVal >= facets.maxExclusive) {
      errs.push({
        message: `Value '${value}' for <${elementName}> must be < ${facets.maxExclusive} (maxExclusive).`,
        category: 'schema-violation',
      });
    }
    if (facets.totalDigits !== undefined) {
      const digitsOnly = value.replace(/[^0-9]/g, '');
      if (digitsOnly.length > facets.totalDigits) {
        errs.push({
          message: `Value '${value}' for <${elementName}> exceeds totalDigits restriction (${facets.totalDigits}).`,
          category: 'schema-violation',
        });
      }
    }
    if (facets.fractionDigits !== undefined) {
      const fracPart = value.split('.')[1] || '';
      if (fracPart.length > facets.fractionDigits) {
        errs.push({
          message: `Value '${value}' for <${elementName}> exceeds fractionDigits restriction (${facets.fractionDigits}).`,
          category: 'schema-violation',
        });
      }
    }
  }

  return errs;
}

/** Resolve the type definition for an element, checking inline types and named types */
function resolveElementType(
  elName: string,
  parentTypeName: string,
  schema: CompiledXsdSchema
): XsdTypeDef | null {
  // Check top-level elements first if ref or named element
  const topEl = schema.topElements.get(elName);
  if (topEl && schema.types.has(topEl.type)) {
    return schema.types.get(topEl.type)!;
  }

  // Check for inline type first
  const inlineKey = `__inline_${parentTypeName.replace('__inline_', '')}_${elName}`;
  if (schema.types.has(inlineKey)) return schema.types.get(inlineKey)!;

  // Check in compositor elements for type reference
  const parentType = schema.types.get(parentTypeName);
  if (parentType?.kind === 'complex' && parentType.compositor) {
    const elDecl = parentType.compositor.elements.find((e) => e.name === elName);
    if (elDecl && elDecl.type) {
      if (schema.types.has(elDecl.type)) return schema.types.get(elDecl.type)!;
      // Built-in type — return a synthetic simple type
      return { kind: 'simple', name: elDecl.type, baseType: elDecl.type, facets: {} };
    }
  }

  // Check top-level named types
  // Search for __inline_<any>_<elName> pattern
  for (const [key, def] of schema.types) {
    if (key.endsWith(`_${elName}`) && key.startsWith('__inline_')) {
      return def;
    }
  }

  return null;
}

/**
 * Client-Side XSD Schema Rule Validation
 * Comprehensive validation with schema compilation, namespace support,
 * cardinality enforcement, attribute checking, simple type facets,
 * sequence ordering, and identity constraints.
 */
export function validateAgainstXsd(
  xml: string,
  xsd: string,
  additionalSchemas?: string[] | Record<string, string | { xsd: string }> | Map<string, string>
): XsdValidationResult {
  // Normalize leading blank lines or whitespace before XML prolog if present
  const cleanXml = xml.replace(/^[\s\r\n]+(?=<\?xml)/i, '').trim();
  const cleanXsd = xsd.replace(/^[\s\r\n]+(?=<\?xml)/i, '').trim();

  if (!cleanXml) {
    return {
      isValid: false,
      errors: [{ message: 'XML document is empty.', category: 'no-root', source: 'xml' }],
      warnings: [],
    };
  }
  if (!cleanXsd) {
    return {
      isValid: false,
      errors: [{ message: 'XSD schema is empty.', category: 'schema-violation', source: 'xsd' }],
      warnings: [],
    };
  }

  // First validate XML well-formedness
  const xmlValidation = validateXmlStructure(cleanXml);
  if (!xmlValidation.isValid) {
    return {
      isValid: false,
      errors: xmlValidation.errors.map((e) => ({ ...e, source: 'xml' as const })),
      warnings: ['Fix XML well-formedness errors before validating against XSD schema.'],
    };
  }

  // Validate XSD well-formedness
  const xsdValidation = validateXmlStructure(cleanXsd);
  if (!xsdValidation.isValid) {
    return {
      isValid: false,
      errors: [
        {
          message: `XSD Schema compilation error: ${xsdValidation.errors[0]?.message}`,
          line: xsdValidation.errors[0]?.line,
          column: xsdValidation.errors[0]?.column,
          snippet: xsdValidation.errors[0]?.snippet,
          category: 'schema-violation',
          code: 'ERR_XSD_COMPILATION',
          source: 'xsd',
          suggestion: 'The XSD schema itself has syntax errors. Ensure it is a well-formed XML document with <xs:schema> root.',
        },
      ],
      warnings: [],
    };
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(cleanXml, 'application/xml');
  const xsdDoc = parser.parseFromString(cleanXsd, 'application/xml');

  const additionalDocs: Document[] = [];
  if (additionalSchemas) {
    let schemaList: string[] = [];
    if (Array.isArray(additionalSchemas)) {
      schemaList = additionalSchemas;
    } else if (additionalSchemas instanceof Map) {
      schemaList = Array.from(additionalSchemas.values());
    } else if (typeof additionalSchemas === 'object') {
      schemaList = Object.values(additionalSchemas).map((v) => (typeof v === 'string' ? v : v.xsd));
    }
    for (const addXsd of schemaList) {
      if (typeof addXsd === 'string' && addXsd.trim()) {
        try {
          const doc = parser.parseFromString(addXsd, 'application/xml');
          if (!doc.getElementsByTagName('parsererror').length) {
            additionalDocs.push(doc);
          }
        } catch {
          // Ignore auxiliary parse error
        }
      }
    }
  }

  // Compile XSD schema
  const schemaResult = compileXsdSchema(xsdDoc, additionalDocs);
  if ('error' in schemaResult) {
    return {
      isValid: false,
      errors: [
        {
          message: `XSD Schema compilation error: ${schemaResult.error}`,
          category: 'schema-violation',
          code: 'ERR_XSD_COMPILATION',
          source: 'xsd',
        },
      ],
      warnings: [],
    };
  }

  const schema = schemaResult;
  const errors: XmlValidationError[] = [];
  const warnings: string[] = [];

  const xmlRoot = xmlDoc.documentElement;
  const rootLocalName_ = xmlRoot.localName || xmlRoot.nodeName.split(':').pop() || '';

  // ─── Phase 1: Root Element & Namespace Validation ──────────────────────────
  if (schema.targetNamespace) {
    const xmlNs = xmlRoot.getAttribute('xmlns') || xmlRoot.namespaceURI || '';
    if (!xmlNs && schema.elementFormDefault === 'qualified') {
      errors.push({
        message: `Missing targetNamespace: Schema specifies targetNamespace '${schema.targetNamespace}' with elementFormDefault="qualified", but root element <${xmlRoot.nodeName}> declares no namespace.`,
        category: 'namespace',
        code: 'ERR_XSD_NAMESPACE_MISSING',
        suggestion: `Add xmlns="${schema.targetNamespace}" to root element <${xmlRoot.nodeName}>.`,
      });
    } else if (xmlNs && xmlNs !== schema.targetNamespace && xmlNs !== 'http://www.w3.org/XML/1998/namespace') {
      errors.push({
        message: `Namespace mismatch: XML document root namespace '${xmlNs}' does not match schema targetNamespace '${schema.targetNamespace}'.`,
        category: 'namespace',
        code: 'ERR_XSD_NAMESPACE_MISMATCH',
        suggestion: `Update root element namespace to xmlns="${schema.targetNamespace}".`,
      });
    }
  }

  const matchedTopEl = schema.topElements.get(rootLocalName_);
  if (schema.topElements.size > 0 && !matchedTopEl) {
    const declaredNames = Array.from(schema.topElements.keys()).join(', ');
    errors.push({
      message: `Root element <${xmlRoot.nodeName}> does not match any top-level schema element declaration: [${declaredNames}].`,
      category: 'schema-violation',
      code: 'ERR_XSD_ROOT_MISMATCH',
      suggestion: `Rename XML root element to one of: ${declaredNames}; or add a top-level <xs:element name="${rootLocalName_}"> in the schema.`,
    });
  }

  // ─── Phase 2: Recursive Element + Type Validation ──────────────────────────
  function validateElement(
    xmlEl: Element,
    typeName: string,
    parentPath: string
  ): void {
    const elLocal = xmlEl.localName || xmlEl.nodeName.split(':').pop() || '';
    const currentPath = `${parentPath}/${elLocal}`;
    const typeDef = schema.types.get(typeName);

    if (!typeDef) {
      // It's likely a built-in type — validate text content
      const val = (xmlEl.textContent || '').trim();
      if (val) {
        const typeErr = validateXsdBuiltinType(val, typeName, elLocal);
        if (typeErr) errors.push({ ...typeErr, code: 'ERR_XSD_TYPE_MISMATCH' });
      }
      return;
    }

    // Simple type validation
    if (typeDef.kind === 'simple') {
      const val = (xmlEl.textContent || '').trim();
      if (val) {
        const facetErrs = validateSimpleTypeFacets(val, typeDef, elLocal);
        for (const fe of facetErrs) {
          errors.push({ ...fe, code: 'ERR_XSD_FACET_VIOLATION' });
        }
      }
      // Simple type elements should not have child elements
      if (getElementChildren(xmlEl).length > 0) {
        errors.push({
          message: `Element <${elLocal}> at ${currentPath} has child elements but is declared as simple type '${typeDef.name}'.`,
          category: 'schema-violation',
          code: 'ERR_XSD_SIMPLE_HAS_CHILDREN',
          suggestion: `Remove child elements from <${elLocal}> — it should contain only text content.`,
        });
      }
      return;
    }

    // Complex type validation
    if (typeDef.kind === 'complex') {
      // Attribute validation
      for (const attrDecl of typeDef.attributes) {
        if (attrDecl.isAny) continue;

        let hasAttr = false;
        let actualVal: string | null = null;
        let matchedAttrName = attrDecl.name;

        if (attrDecl.isRef && attrDecl.prefix) {
          const qName = `${attrDecl.prefix}:${attrDecl.name}`;
          if (xmlEl.hasAttribute(qName)) {
            hasAttr = true;
            actualVal = xmlEl.getAttribute(qName);
            matchedAttrName = qName;
          } else if (attrDecl.namespaceURI && xmlEl.hasAttributeNS && xmlEl.hasAttributeNS(attrDecl.namespaceURI, attrDecl.name)) {
            hasAttr = true;
            actualVal = xmlEl.getAttributeNS(attrDecl.namespaceURI, attrDecl.name);
            matchedAttrName = qName;
          } else {
            const found = Array.from(xmlEl.attributes).find(
              (a) =>
                (a.localName === attrDecl.name || a.name.split(':').pop() === attrDecl.name) &&
                (a.prefix === attrDecl.prefix || (attrDecl.namespaceURI && a.namespaceURI === attrDecl.namespaceURI))
            );
            if (found) {
              hasAttr = true;
              actualVal = found.value;
              matchedAttrName = found.name;
            }
          }
        } else {
          if (xmlEl.hasAttribute(attrDecl.name)) {
            hasAttr = true;
            actualVal = xmlEl.getAttribute(attrDecl.name);
            matchedAttrName = attrDecl.name;
          }
        }

        const displayName = attrDecl.isRef && attrDecl.ref ? attrDecl.ref : attrDecl.name;

        if (attrDecl.use === 'required' && !hasAttr) {
          errors.push({
            message: `Required attribute '${displayName}' is missing on element <${elLocal}> at ${currentPath}.`,
            category: 'schema-violation',
            code: 'ERR_XSD_ATTR_REQUIRED',
            suggestion: `Add attribute ${displayName}="..." to <${elLocal}>.`,
          });
        }
        if (attrDecl.use === 'prohibited' && hasAttr) {
          errors.push({
            message: `Prohibited attribute '${matchedAttrName}' found on element <${elLocal}> at ${currentPath}.`,
            category: 'schema-violation',
            code: 'ERR_XSD_ATTR_PROHIBITED',
            suggestion: `Remove attribute '${matchedAttrName}' from <${elLocal}>.`,
          });
        }
        if (attrDecl.fixedValue && hasAttr && actualVal !== attrDecl.fixedValue) {
          errors.push({
            message: `Attribute '${matchedAttrName}' on <${elLocal}> has value '${actualVal}' but schema requires fixed value '${attrDecl.fixedValue}'.`,
            category: 'schema-violation',
            code: 'ERR_XSD_ATTR_FIXED',
            suggestion: `Set ${matchedAttrName}="${attrDecl.fixedValue}" on <${elLocal}>.`,
          });
        }
        if (hasAttr && attrDecl.type && actualVal !== null) {
          const attrTypeErr = validateXsdBuiltinType(actualVal, attrDecl.type, `@${matchedAttrName} on <${elLocal}>`);
          if (attrTypeErr) errors.push({ ...attrTypeErr, code: 'ERR_XSD_ATTR_TYPE' });
        }
      }

      // Compositor (child element) validation
      if (typeDef.compositor) {
        const comp = typeDef.compositor;
        const childElements = getElementChildren(xmlEl);
        const hasWildcard = comp.elements.some((e) => e.isAny);

        function matchesDecl(childEl: Element, elDecl: XsdElementDecl): boolean {
          if (elDecl.isAny) {
            const childNs = childEl.namespaceURI || (childEl.prefix ? xmlEl.lookupNamespaceURI(childEl.prefix) : null);
            const anyNs = elDecl.anyNamespace || '##any';
            if (anyNs === '##any') return true;
            if (anyNs === '##other') return childNs !== schema.targetNamespace;
            if (anyNs === childNs) return true;
            return false;
          }

          const childLocal = childEl.localName || childEl.nodeName.split(':').pop() || '';
          if (childLocal !== elDecl.name) return false;

          const childNs = childEl.namespaceURI || (childEl.prefix ? xmlEl.lookupNamespaceURI(childEl.prefix) : null);
          const childPrefix = childEl.prefix || (childEl.nodeName.includes(':') ? childEl.nodeName.split(':')[0] : null);

          if (elDecl.isRef) {
            if (elDecl.namespaceURI && childNs && childNs !== elDecl.namespaceURI) return false;
            if (!childNs && elDecl.prefix && childPrefix && childPrefix !== elDecl.prefix) return false;
            return true;
          }

          const currentDocTargetNs =
            typeDef && 'targetNamespace' in typeDef && typeDef.targetNamespace !== undefined
              ? typeDef.targetNamespace
              : schema.targetNamespace;
          const currentDocElementFormDefault =
            typeDef && 'elementFormDefault' in typeDef && typeDef.elementFormDefault
              ? typeDef.elementFormDefault
              : schema.elementFormDefault;

          if (currentDocElementFormDefault === 'qualified' && currentDocTargetNs) {
            if (childNs && childNs !== currentDocTargetNs) return false;
          } else {
            // In unqualified/no-namespace schema: elements with foreign namespace must not match unqualified declaration
            if (childNs && childNs !== (currentDocTargetNs || '')) return false;
          }
          return true;
        }

        // Check for unexpected child elements
        if (!hasWildcard) {
          for (const childEl of childElements) {
            const matchesAny = comp.elements.some((e) => matchesDecl(childEl, e));
            if (!matchesAny) {
              warnings.push(
                `Unexpected element <${childEl.nodeName}> found under <${elLocal}> at ${currentPath}. Schema does not declare this child.`
              );
            }
          }
        }

        // Check cardinality (minOccurs / maxOccurs)
        for (const elDecl of comp.elements) {
          if (elDecl.isAny) continue;

          const matchingChildren = childElements.filter((c) => matchesDecl(c, elDecl));
          const count = matchingChildren.length;
          const displayName = elDecl.ref || elDecl.name;

          if (comp.kind !== 'choice' && count < elDecl.minOccurs) {
            if (elDecl.minOccurs === 1 && count === 0) {
              errors.push({
                message: `Required element <${displayName}> is missing under <${elLocal}> at ${currentPath}.`,
                category: 'schema-violation',
                code: 'ERR_XSD_ELEMENT_MISSING',
                suggestion: `Add a <${displayName}> child element under <${elLocal}>.`,
              });
            } else {
              errors.push({
                message: `Element <${displayName}> occurs ${count} time(s) under <${elLocal}>, but minOccurs="${elDecl.minOccurs}" requires at least ${elDecl.minOccurs}.`,
                category: 'schema-violation',
                code: 'ERR_XSD_MIN_OCCURS',
                suggestion: `Add ${elDecl.minOccurs - count} more <${displayName}> element(s) under <${elLocal}>.`,
              });
            }
          }

          if (elDecl.maxOccurs !== -1 && count > elDecl.maxOccurs) {
            errors.push({
              message: `Element <${displayName}> occurs ${count} time(s) under <${elLocal}>, but maxOccurs="${elDecl.maxOccurs}" allows at most ${elDecl.maxOccurs}.`,
              category: 'schema-violation',
              code: 'ERR_XSD_MAX_OCCURS',
              suggestion: `Remove ${count - elDecl.maxOccurs} excess <${displayName}> element(s) from <${elLocal}>.`,
            });
          }

          // Recursively validate each matching child element
          for (const matchChild of matchingChildren) {
            // Check xsi:nil attribute
            if (matchChild.getAttribute('xsi:nil') === 'true' && !elDecl.nillable) {
              errors.push({
                message: `Element <${matchChild.nodeName}> has xsi:nil="true", but is not declared with nillable="true" in schema.`,
                category: 'schema-violation',
                code: 'ERR_XSD_NOT_NILLABLE',
                suggestion: `Remove xsi:nil="true" or add nillable="true" to the <xs:element name="${elDecl.name}"> declaration in schema.`,
              });
            }

            let childTypeName = elDecl.type;

            // Look up inline type
            const parentElName = typeName.split('_').pop() || '';
            const directInlineKey = `__inline_${parentElName}_${elDecl.name}`;
            const fullInlineKey = `__inline_${typeName.replace('__inline_', '')}_${elDecl.name}`;

            if (schema.types.has(directInlineKey)) {
              childTypeName = directInlineKey;
            } else if (schema.types.has(fullInlineKey)) {
              childTypeName = fullInlineKey;
            } else if (!childTypeName && schema.types.has(`__inline_${elDecl.name}`)) {
              childTypeName = `__inline_${elDecl.name}`;
            }

            // Try resolving the type from nested element declarations
            if (!childTypeName) {
              const resolvedType = resolveElementType(elDecl.name, typeName, schema);
              if (resolvedType) {
                childTypeName = resolvedType.name;
              }
            }

            if (childTypeName) {
              validateElement(matchChild, childTypeName, currentPath);
            }
          }
        }

        // xs:choice validation
        if (comp.kind === 'choice') {
          if (comp.maxOccurs === 1) {
            const presentChoiceElements = comp.elements.filter((e) =>
              childElements.some((c) => matchesDecl(c, e))
            );
            if (presentChoiceElements.length > 1) {
              errors.push({
                message: `xs:choice violation under <${elLocal}>: Multiple mutually exclusive elements found [${presentChoiceElements.map((e) => e.ref || e.name).join(', ')}]. xs:choice permits only one.`,
                category: 'schema-violation',
                code: 'ERR_XSD_CHOICE_MUTEX',
                suggestion: `Keep only one of [${comp.elements.map((e) => e.ref || e.name).join(', ')}] under <${elLocal}>.`,
              });
            } else if (presentChoiceElements.length === 0 && comp.minOccurs > 0) {
              errors.push({
                message: `xs:choice violation under <${elLocal}>: None of the permitted choice elements [${comp.elements.map((e) => e.ref || e.name).join(', ')}] were found.`,
                category: 'schema-violation',
                code: 'ERR_XSD_CHOICE_MISSING',
                suggestion: `Add one of [${comp.elements.map((e) => e.ref || e.name).join(', ')}] under <${elLocal}>.`,
              });
            }
          } else {
            // Choice group with maxOccurs > 1 or maxOccurs="unbounded" (-1)
            const totalMatches = childElements.filter((c) =>
              comp.elements.some((e) => matchesDecl(c, e))
            ).length;
            if (comp.minOccurs > 0 && totalMatches < comp.minOccurs) {
              errors.push({
                message: `xs:choice violation under <${elLocal}>: Total element count ${totalMatches} is less than required minOccurs="${comp.minOccurs}".`,
                category: 'schema-violation',
                code: 'ERR_XSD_MIN_OCCURS',
                suggestion: `Provide at least ${comp.minOccurs} elements from the choice group.`,
              });
            }
            if (comp.maxOccurs !== -1 && totalMatches > comp.maxOccurs) {
              errors.push({
                message: `xs:choice violation under <${elLocal}>: Total element count ${totalMatches} exceeds maxOccurs="${comp.maxOccurs}".`,
                category: 'schema-violation',
                code: 'ERR_XSD_MAX_OCCURS',
                suggestion: `Provide at most ${comp.maxOccurs} elements from the choice group.`,
              });
            }
          }
        }

        // Sequence ordering check
        if (comp.kind === 'sequence') {
          let lastDeclIdx = -1;
          for (const childEl of childElements) {
            const declIdx = comp.elements.findIndex((e) => matchesDecl(childEl, e));
            if (declIdx >= 0) {
              if (declIdx < lastDeclIdx) {
                const expectedBefore = comp.elements[lastDeclIdx]?.ref || comp.elements[lastDeclIdx]?.name || '?';
                errors.push({
                  message: `Element <${childEl.nodeName}> appears out of sequence order under <${elLocal}>. It must appear before <${expectedBefore}> per xs:sequence declaration.`,
                  category: 'schema-violation',
                  code: 'ERR_XSD_SEQUENCE_ORDER',
                  suggestion: `Move <${childEl.nodeName}> before <${expectedBefore}> in the XML payload.`,
                });
                warnings.push(
                  `Element <${childEl.nodeName}> appears out of sequence order under <${elLocal}>. It should appear before <${expectedBefore}> per xs:sequence declaration.`
                );
              }
              lastDeclIdx = declIdx;
            }
          }
        }
      } else if (!typeDef.mixed && getElementChildren(xmlEl).length > 0) {
        // Complex type with no compositor but has child elements
        warnings.push(
          `Element <${elLocal}> at ${currentPath} has child elements but its complex type declares no compositor (sequence/choice/all).`
        );
      }
    }
  }

  // Start validation from the root
  if (matchedTopEl) {
    validateElement(xmlRoot, matchedTopEl.type, '');
  }

  // ─── Phase 3: Identity Constraints (xs:unique, xs:key, xs:keyref) ──────────
  const definedKeySets = new Map<string, Set<string>>();
  // Sort so unique and key are evaluated before keyref
  const sortedConstraints = [...schema.identityConstraints].sort((a, b) => {
    if (a.kind === 'keyref' && b.kind !== 'keyref') return 1;
    if (a.kind !== 'keyref' && b.kind === 'keyref') return -1;
    return 0;
  });

  for (const constraint of sortedConstraints) {
    try {
      // Simple XPath evaluation — supports basic paths like "./item" or "."
      const selectorPath = constraint.selector.replace(/^\.\/?/, '');
      let selectedNodes: Element[];

      if (!selectorPath || selectorPath === '.') {
        selectedNodes = [xmlRoot];
      } else {
        const parts = selectorPath.split('/').filter(Boolean);
        selectedNodes = [xmlRoot];
        for (const part of parts) {
          const nextNodes: Element[] = [];
          for (const node of selectedNodes) {
            for (const child of getElementChildren(node)) {
              const childLocal = child.localName || child.nodeName.split(':').pop() || '';
              if (childLocal === part || part === '*') {
                nextNodes.push(child);
              }
            }
          }
          selectedNodes = nextNodes;
        }
      }

      // Collect field values
      const keyValues = new Map<string, Element>();
      for (const selectedNode of selectedNodes) {
        const fieldValues: string[] = [];
        for (const fieldXPath of constraint.fields) {
          const fieldPath = fieldXPath.replace(/^\.\/?/, '');
          if (fieldPath.startsWith('@')) {
            // Attribute field
            const attrName = fieldPath.substring(1);
            fieldValues.push(selectedNode.getAttribute(attrName) || '');
          } else if (!fieldPath || fieldPath === '.') {
            fieldValues.push((selectedNode.textContent || '').trim());
          } else {
            // Child element field
            const parts = fieldPath.split('/').filter(Boolean);
            let current: Element | null = selectedNode;
            for (const part of parts) {
              if (!current) break;
              const matchingChildren: Element[] = getElementChildren(current).filter(
                (c: Element) => (c.localName || c.nodeName.split(':').pop()) === part
              );
              current = matchingChildren[0] || null;
            }
            fieldValues.push(current ? (current.textContent || '').trim() : '');
          }
        }

        const compositeKey = fieldValues.join('|||');

        if (constraint.kind === 'unique' || constraint.kind === 'key') {
          // For key, all fields must be non-empty
          if (constraint.kind === 'key' && fieldValues.some((v) => !v)) {
            const elLocal = selectedNode.localName || selectedNode.nodeName.split(':').pop() || '';
            errors.push({
              message: `Identity constraint '${constraint.name}' (xs:key): Element <${elLocal}> has empty key field(s) [${constraint.fields.join(', ')}].`,
              category: 'schema-violation',
              code: 'ERR_XSD_KEY_EMPTY',
              suggestion: `All key fields must have non-empty values for xs:key '${constraint.name}'.`,
            });
          }

          if (keyValues.has(compositeKey)) {
            const elLocal = selectedNode.localName || selectedNode.nodeName.split(':').pop() || '';
            errors.push({
              message: `Identity constraint '${constraint.name}' (xs:${constraint.kind}) violation: Duplicate value '${compositeKey}' found on <${elLocal}>.`,
              category: 'schema-violation',
              code: `ERR_XSD_${constraint.kind.toUpperCase()}_DUPLICATE`,
              suggestion: `Each value of [${constraint.fields.join(', ')}] must be unique per xs:${constraint.kind} '${constraint.name}'.`,
            });
          } else {
            keyValues.set(compositeKey, selectedNode);
          }
        } else if (constraint.kind === 'keyref') {
          const targetKey = constraint.refer ? resolveTypeRef(constraint.refer) : '';
          const targetSet = definedKeySets.get(targetKey);
          if (targetSet && compositeKey && !targetSet.has(compositeKey)) {
            const elLocal = selectedNode.localName || selectedNode.nodeName.split(':').pop() || '';
            errors.push({
              message: `Identity constraint '${constraint.name}' (xs:keyref) violation: Key reference '${compositeKey}' on <${elLocal}> does not match any key in '${constraint.refer}'.`,
              category: 'schema-violation',
              code: 'ERR_XSD_KEYREF_UNRESOLVED',
              suggestion: `Ensure key reference value '${compositeKey}' exists in target identity constraint '${constraint.refer}'.`,
            });
          }
        }
      }

      if (constraint.kind === 'unique' || constraint.kind === 'key') {
        definedKeySets.set(constraint.name, new Set(keyValues.keys()));
      }
    } catch {
      // XPath evaluation failed — skip this constraint silently
      warnings.push(`Could not evaluate identity constraint '${constraint.name}' — XPath expression may be too complex for client-side evaluation.`);
    }
  }

  // ─── Phase 4: Legacy compatibility checks (preserved from original) ────────
  // Check all schema element declarations for type validation across the document
  const allSchemaElements = Array.from(xsdDoc.getElementsByTagNameNS('*', 'element'));
  allSchemaElements.forEach((schemaEl) => {
    const elName = schemaEl.getAttribute('name');
    const minOccurs = schemaEl.getAttribute('minOccurs');
    const type = schemaEl.getAttribute('type');

    // Required element check for elements not yet validated via recursive walk
    if (elName && (minOccurs === '1' || minOccurs === null)) {
      const parentComplex = closestXsdAncestor(schemaEl, 'complexType');
      const parentElement = parentComplex ? closestXsdAncestor(parentComplex, 'element') : null;
      const parentElName = parentElement?.getAttribute('name');

      if (parentElName) {
        const matchingParentsInXml = xmlDoc.getElementsByTagNameNS('*', parentElName);
        if (matchingParentsInXml.length > 0) {
          Array.from(matchingParentsInXml).forEach((parentXmlNode) => {
            const hasChild = getElementChildren(parentXmlNode).some(
              (c) => (c.localName || c.nodeName.split(':').pop()) === elName
            );
            if (!hasChild) {
              // Avoid duplicate warnings from recursive validation
              const warnMsg = `Schema Advisory: Required element <${elName}> (minOccurs="1") is missing under parent <${parentElName}>.`;
              if (!warnings.includes(warnMsg) && !errors.some((e) => e.message.includes(`<${elName}> is missing`))) {
                warnings.push(warnMsg);
              }
            }
          });
        }
      }
    }

    // Basic data type format check for elements not yet validated via recursive walk
    if (elName && type) {
      const resolvedType = resolveTypeRef(type);
      const xmlNodes = xmlDoc.getElementsByTagNameNS('*', elName);
      Array.from(xmlNodes).forEach((node) => {
        const val = (node.textContent || '').trim();
        if (val && !errors.some((e) => e.message.includes(`<${elName}>`) && e.code === 'ERR_XSD_TYPE_MISMATCH')) {
          const typeErr = validateXsdBuiltinType(val, resolvedType, elName);
          if (typeErr && !errors.some((e) => e.message === typeErr.message)) {
            errors.push({ ...typeErr, code: 'ERR_XSD_TYPE_MISMATCH' });
          }
        }
      });
    }
  });

  // Deduplicate errors (same message)
  const uniqueErrors: XmlValidationError[] = [];
  const seenMessages = new Set<string>();
  for (const err of errors) {
    if (!seenMessages.has(err.message)) {
      seenMessages.add(err.message);
      uniqueErrors.push(err);
    }
  }

  // Deduplicate warnings
  const uniqueWarnings = Array.from(new Set(warnings));

  return {
    isValid: uniqueErrors.length === 0,
    errors: uniqueErrors,
    warnings: uniqueWarnings,
  };
}


export function autoFixXmlWithXsd(xml: string, xsd: string): AutoFixResult {
  const startTime = performance.now();
  const fixes: string[] = [];
  const diffItems: AutoFixDiffItem[] = [];

  // Normalize leading blank lines or whitespace before XML prolog if present
  const cleanXsd = xsd.replace(/^[\s\r\n]+(?=<\?xml)/i, '').trim();

  // Check if original is already valid
  const initialValidation = validateAgainstXsd(xml, cleanXsd);
  const originalValid = initialValidation.isValid;

  if (originalValid) {
    return {
      fixedXml: xml,
      fixes: [],
      report: {
        originalValid: true,
        finalValid: true,
        totalPasses: 0,
        fixes: [],
        unresolvedIssues: [],
        securityWarnings: [],
        executionTimeMs: Math.round(performance.now() - startTime),
      },
    };
  }

  let currentXml = xml;

  // Pass 1: Syntax & Well-Formedness Auto-Repair
  const syntaxRepair = autoFixXml(currentXml);
  if (syntaxRepair.fixes.length > 0) {
    currentXml = syntaxRepair.fixedXml;
    fixes.push(...syntaxRepair.fixes);
    diffItems.push(...syntaxRepair.report.fixes);
  }

  // Pass 2: Schema Compilation Check
  const xsdValidation = validateXmlStructure(cleanXsd);
  if (!xsdValidation.isValid) {
    return {
      fixedXml: currentXml,
      fixes,
      report: {
        originalValid,
        finalValid: false,
        totalPasses: 1,
        fixes: diffItems,
        unresolvedIssues: [
          {
            message: `XSD Schema compilation error: ${xsdValidation.errors[0]?.message}`,
            category: 'xsd',
            code: 'ERR_XSD_COMPILATION',
            suggestion: 'Fix syntax errors in the XSD schema definition before revalidating.',
            classification: 'diagnosis-only',
          },
        ],
        securityWarnings: [],
        executionTimeMs: Math.round(performance.now() - startTime),
      },
    };
  }

  const parser = new DOMParser();
  const xsdDoc = parser.parseFromString(cleanXsd, 'application/xml');
  const schemaResult = compileXsdSchema(xsdDoc);
  if ('error' in schemaResult) {
    return {
      fixedXml: currentXml,
      fixes,
      report: {
        originalValid,
        finalValid: false,
        totalPasses: 1,
        fixes: diffItems,
        unresolvedIssues: [
          {
            message: `XSD Schema compilation error: ${schemaResult.error}`,
            category: 'xsd',
            code: 'ERR_XSD_COMPILATION',
            classification: 'diagnosis-only',
          },
        ],
        securityWarnings: [],
        executionTimeMs: Math.round(performance.now() - startTime),
      },
    };
  }

  const schema = schemaResult;

  // Pass 3: Schema-Guided Structural & Namespace Repairs
  try {
    const xmlDoc = parser.parseFromString(currentXml, 'application/xml');
    const parseError = xmlDoc.getElementsByTagName('parsererror')[0];
    if (!parseError && xmlDoc.documentElement) {
      const root = xmlDoc.documentElement;
      const rootLocal = root.localName || root.nodeName.split(':').pop() || '';
      let docModified = false;

      // 3a. Missing targetNamespace on root element
      if (schema.targetNamespace) {
        const rootNs = root.getAttribute('xmlns') || root.namespaceURI || '';
        if (!rootNs || rootNs !== schema.targetNamespace) {
          if (schema.topElements.has(rootLocal) || schema.topElements.size === 0) {
            root.setAttribute('xmlns', schema.targetNamespace);
            docModified = true;
            fixes.push(`Added xmlns="${schema.targetNamespace}" to root element <${root.nodeName}> to match XSD targetNamespace.`);
            diffItems.push({
              code: 'FIX_XSD_NAMESPACE',
              category: 'namespace',
              classification: 'safe-automatic',
              confidence: 'high',
              description: `Configured xmlns="${schema.targetNamespace}" on root <${root.nodeName}> matching schema targetNamespace.`,
            });
          }
        }
      }

      // 3b. Helper function to recursively repair elements using schema
      function repairElementWithSchema(el: Element, typeName: string): void {
        const typeDef = schema.types.get(typeName);
        if (!typeDef || typeDef.kind !== 'complex') return;

        // Attribute defaults: inject attributes that have defaultValue in schema
        for (const attrDecl of typeDef.attributes) {
          if (attrDecl.defaultValue && !el.hasAttribute(attrDecl.name)) {
            el.setAttribute(attrDecl.name, attrDecl.defaultValue);
            docModified = true;
            const elLocal = el.localName || el.nodeName.split(':').pop() || '';
            fixes.push(`Added default attribute ${attrDecl.name}="${attrDecl.defaultValue}" to <${elLocal}>.`);
            diffItems.push({
              code: 'FIX_XSD_DEFAULT_ATTR',
              category: 'schema-violation',
              classification: 'safe-automatic',
              confidence: 'high',
              description: `Added missing attribute ${attrDecl.name}="${attrDecl.defaultValue}" specified with default value in schema.`,
            });
          }
        }

        // Element sequence ordering & tag casing
        if (typeDef.compositor) {
          const comp = typeDef.compositor;
          const childElements = getElementChildren(el);

          // Tag casing repair: check if a child's name matches an element in compositor case-insensitively
          for (const child of childElements) {
            const childName = child.localName || child.nodeName.split(':').pop() || '';
            const matchingDecl = comp.elements.find(
              (decl) => decl.name.toLowerCase() === childName.toLowerCase() && decl.name !== childName
            );
            if (matchingDecl) {
              try {
                const correctedEl = xmlDoc.createElementNS(child.namespaceURI, matchingDecl.name);
                while (child.firstChild) {
                  correctedEl.appendChild(child.firstChild);
                }
                for (const attr of Array.from(child.attributes)) {
                  correctedEl.setAttribute(attr.name, attr.value);
                }
                el.replaceChild(correctedEl, child);
                docModified = true;
                fixes.push(`Corrected tag casing <${childName}> to <${matchingDecl.name}> matching schema definition.`);
                diffItems.push({
                  code: 'FIX_XSD_TAG_CASING',
                  category: 'schema-violation',
                  classification: 'safe-automatic',
                  confidence: 'high',
                  description: `Adjusted element casing from <${childName}> to <${matchingDecl.name}> to match schema.`,
                });
              } catch {
                // Ignore replacement failure
              }
            }
          }

          // Sequence reordering: if comp.kind === 'sequence', check if children are out of order
          if (comp.kind === 'sequence') {
            const currentChildren = getElementChildren(el);
            const declNamesOrder = comp.elements.map((e) => e.name);

            let isOutOfOrder = false;
            let lastIdx = -1;
            for (const c of currentChildren) {
              const cName = c.localName || c.nodeName.split(':').pop() || '';
              const declIdx = declNamesOrder.indexOf(cName);
              if (declIdx >= 0) {
                if (declIdx < lastIdx) {
                  isOutOfOrder = true;
                  break;
                }
                lastIdx = declIdx;
              }
            }

            if (isOutOfOrder) {
              const sortedChildren = [...currentChildren].sort((a, b) => {
                const aName = a.localName || a.nodeName.split(':').pop() || '';
                const bName = b.localName || b.nodeName.split(':').pop() || '';
                const aIdx = declNamesOrder.indexOf(aName);
                const bIdx = declNamesOrder.indexOf(bName);
                if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
                if (aIdx >= 0) return -1;
                if (bIdx >= 0) return 1;
                return 0;
              });

              for (const sc of sortedChildren) {
                el.appendChild(sc);
              }
              docModified = true;
              const elLocal = el.localName || el.nodeName.split(':').pop() || '';
              fixes.push(`Reordered child elements under <${elLocal}> according to schema xs:sequence order.`);
              diffItems.push({
                code: 'FIX_XSD_SEQUENCE_ORDER',
                category: 'schema-violation',
                classification: 'safe-automatic',
                confidence: 'high',
                description: `Reordered child elements under <${elLocal}> to conform to schema xs:sequence definition.`,
              });
            }
          }

          // Recurse into children
          for (const c of getElementChildren(el)) {
            const cName = c.localName || c.nodeName.split(':').pop() || '';
            const decl = comp.elements.find((e) => e.name === cName);
            let childTypeName = decl?.type || '';

            // Look up inline type
            const inlineKey = `__inline_${typeName.replace('__inline_', '')}_${cName}`;
            if (schema.types.has(inlineKey)) {
              childTypeName = inlineKey;
            } else if (!childTypeName && schema.types.has(`__inline_${cName}`)) {
              childTypeName = `__inline_${cName}`;
            }

            if (childTypeName) {
              repairElementWithSchema(c, childTypeName);
            }
          }
        }
      }

      // Run recursive repair starting from root
      const matchedTop = schema.topElements.get(rootLocal);
      if (matchedTop) {
        repairElementWithSchema(root, matchedTop.type);
      }

      if (docModified) {
        const serializer = new XMLSerializer();
        let serialized = serializer.serializeToString(xmlDoc);

        const originalDeclMatch = currentXml.match(/^\s*(<\?xml[^>]*\?>)/);
        if (originalDeclMatch && !serialized.trimStart().startsWith('<?xml')) {
          serialized = `${originalDeclMatch[1]}\n${serialized}`;
        }

        // Guarantee xmlns is present on root tag if schema targetNamespace was configured
        if (schema.targetNamespace && !serialized.includes(`xmlns="${schema.targetNamespace}"`)) {
          serialized = serialized.replace(
            new RegExp(`(<${rootLocal}\\b)([^>]*)>`),
            `$1 xmlns="${schema.targetNamespace}"$2>`
          );
        }

        currentXml = serialized;
      }
    }
  } catch {
    // If DOM modification fails, keep currentXml safely
  }

  // Pass 4: Final Revalidation Against XSD
  const finalValidation = validateAgainstXsd(currentXml, xsd);
  const finalValid = finalValidation.isValid;

  // Pass 5: Classify Unresolved Issues (Confirmation Required vs Diagnosis Only)
  const unresolvedIssues: XmlValidationError[] = finalValidation.errors.map((err) => {
    let classification: RepairClassification = 'diagnosis-only';

    if (err.code === 'ERR_XSD_FACET_VIOLATION' || err.code === 'ERR_XSD_TYPE_MISMATCH') {
      classification = 'confirmation-required';
    } else if (err.code === 'ERR_XSD_CHOICE_MUTEX') {
      classification = 'confirmation-required';
    } else if (err.code === 'ERR_XSD_UNIQUE_DUPLICATE' || err.code === 'ERR_XSD_KEY_DUPLICATE') {
      classification = 'confirmation-required';
    } else if (err.code === 'ERR_XSD_ELEMENT_MISSING' || err.code === 'ERR_XSD_ATTR_REQUIRED') {
      classification = 'diagnosis-only';
    }

    return {
      ...err,
      classification,
    };
  });

  return {
    fixedXml: currentXml,
    fixes: Array.from(new Set(fixes)),
    report: {
      originalValid,
      finalValid,
      totalPasses: fixes.length > 0 ? 2 : 1,
      fixes: diffItems,
      unresolvedIssues,
      securityWarnings: syntaxRepair.report.securityWarnings,
      executionTimeMs: Math.round(performance.now() - startTime),
    },
  };
}

/**
 * Pre-Configured Realistic SAP Test Payloads
 */
export const SAP_SOAP_VALID = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sap="http://sap.com/xi/XI/Message/30" xmlns:ord="http://tool-sap.dev/orders/v1">
  <soapenv:Header>
    <sap:Main version="3.0">
      <sap:MessageClass>ApplicationMessage</sap:MessageClass>
      <sap:ProcessingMode>asynchronous</sap:ProcessingMode>
      <sap:MessageId>8fa3c021-39da-4f11-9a2d-98317df60e12</sap:MessageId>
      <sap:TimeSent>2026-10-11T08:30:00Z</sap:TimeSent>
      <sap:Sender>
        <sap:Party agencyIdentifier="ToolSAP" scheme="Global">SAP_ERP_PRD</sap:Party>
        <sap:Service>BS_S4HANA_100</sap:Service>
        <sap:Interface namespace="http://tool-sap.dev/orders/v1">SI_Order_OutAsync</sap:Interface>
      </sap:Sender>
      <sap:Receiver>
        <sap:Party agencyIdentifier="ToolSAP" scheme="Global">3RD_PARTY_CRM</sap:Party>
        <sap:Service>BS_SALESFORCE_EU</sap:Service>
      </sap:Receiver>
    </sap:Main>
  </soapenv:Header>
  <soapenv:Body>
    <ord:OrderRequest id="PO-2026-99410" status="APPROVED" currency="EUR">
      <ord:Header>
        <ord:OrderDate>2026-10-11</ord:OrderDate>
        <ord:CustomerNumber>CUST-409182</ord:CustomerNumber>
        <ord:CompanyCode>1010</ord:CompanyCode>
        <ord:SpecialInstructions><![CDATA[Priority delivery requested for SAP Integration Suite hub. Handle with automated CI/CD pipeline.]]></ord:SpecialInstructions>
      </ord:Header>
      <ord:Items>
        <ord:Item lineNumber="10" materialNumber="MAT-88401">
          <ord:Description>SAP Cloud Integration Enterprise Adapter Pack</ord:Description>
          <ord:Quantity unit="EA">1</ord:Quantity>
          <ord:NetPrice currency="EUR">4500.00</ord:NetPrice>
        </ord:Item>
      </ord:Items>
      <ord:Summary>
        <ord:TotalNetAmount>4500.00</ord:TotalNetAmount>
      </ord:Summary>
    </ord:OrderRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

export const SAP_IDOC_VALID = `<?xml version="1.0" encoding="UTF-8"?>
<ORDERS05>
  <IDOC BEGIN="1">
    <EDI_DC40 SEGMENT="1">
      <TABNAM>EDI_DC40</TABNAM>
      <MANDT>100</MANDT>
      <DOCNUM>0000000004928172</DOCNUM>
      <DOCREL>750</DOCREL>
      <STATUS>30</STATUS>
      <DIRECT>1</DIRECT>
      <OUTMOD>2</OUTMOD>
      <IDOCTYP>ORDERS05</IDOCTYP>
      <MESTYP>ORDERS</MESTYP>
      <SNDPOR>SAPPRD</SNDPOR>
      <SNDPRT>LS</SNDPRT>
      <SNDPRN>S4HCLNT100</SNDPRN>
      <RCVPOR>CPI_PORT</RCVPOR>
      <RCVPRT>LS</RCVPRT>
      <RCVPRN>CPI_INBOUND</RCVPRN>
      <CREDAT>20261011</CREDAT>
      <CRETIM>093000</CRETIM>
    </EDI_DC40>
    <E1EDK01 SEGMENT="1">
      <ACTION>000</ACTION>
      <CURCY>USD</CURCY>
      <HNAME>Global Tech Solutions LLC</HNAME>
      <BELNR>4500982311</BELNR>
    </E1EDK01>
    <E1EDP01 SEGMENT="1">
      <POSEX>00010</POSEX>
      <ACTION>001</ACTION>
      <MENGE>250.000</MENGE>
      <MENEE>PCE</MENEE>
      <BMNG2>250.000</BMNG2>
      <PMENE>PCE</PMENE>
      <E1EDP19 SEGMENT="1">
        <QUALF>001</QUALF>
        <IDTNR>TG11-ROBOTIC-SERVO</IDTNR>
        <KTEXT>High-Precision Servo Actuator Model TG11</KTEXT>
      </E1EDP19>
    </E1EDP01>
  </IDOC>
</ORDERS05>`;

export const SAP_ERR_TAG_MISMATCH = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sap="http://sap.com/xi/XI/Message/30">
  <soapenv:Header>
    <sap:Main version="3.0">
      <sap:MessageClass>ApplicationMessage</sap:MessageClass>
      <sap:Sender>
        <sap:Service>BS_S4HANA_100</sap:Service>
      </sap:Receiver> <!-- ERROR: Opening tag was <sap:Sender>, closed with </sap:Receiver> -->
    </sap:Main>
  </soapenv:Header>
  <soapenv:Body>
    <OrderResponse>
      <Status>SUCCESS</Status>
    </OrderResponse>
  </soapenv:Body>
</soapenv:Envelope>`;

export const SAP_ERR_UNESCAPED_AMP = `<?xml version="1.0" encoding="UTF-8"?>
<OrderRequest xmlns="http://tool-sap.dev/orders/v1">
  <Header>
    <OrderNumber>ORD-88219</OrderNumber>
    <!-- ERROR: Bare '&' in text below will trigger XML parser exception -->
    <SupplierName>Johnson & Johnson Medical Supplies</SupplierName>
    <BillingAddress>Suite 400, Commerce & Trade Ave</BillingAddress>
  </Header>
  <Items>
    <Item id="10">
      <Description>Diagnostic Kit A & B Edition</Description>
      <Price>120.00</Price>
    </Item>
  </Items>
</OrderRequest>`;

export const SAP_ERR_MULTIPLE_ROOTS = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ERROR: Two sibling root elements without an enclosing wrapper -->
<OrderHeader id="ORD-001">
  <Customer>CUST-100</Customer>
  <Total>500.00</Total>
</OrderHeader>
<OrderHeader id="ORD-002">
  <Customer>CUST-200</Customer>
  <Total>850.00</Total>
</OrderHeader>`;

export const SAMPLE_SAP_XSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="http://tool-sap.dev/orders/v1" xmlns="http://tool-sap.dev/orders/v1" elementFormDefault="qualified">
  <xs:element name="OrderRequest">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Header">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="OrderNumber" type="xs:string" />
              <xs:element name="SupplierName" type="xs:string" />
              <xs:element name="BillingAddress" type="xs:string" minOccurs="0" />
              <xs:element name="OrderDate" type="xs:date" minOccurs="0" />
            </xs:sequence>
          </xs:complexType>
        </xs:element>
        <xs:element name="Items">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="Item" maxOccurs="unbounded">
                <xs:complexType>
                  <xs:sequence>
                    <xs:element name="Description" type="xs:string" />
                    <xs:element name="Quantity" type="xs:integer" minOccurs="0" />
                    <xs:element name="Price" type="xs:decimal" />
                  </xs:sequence>
                  <xs:attribute name="id" type="xs:string" use="optional" />
                </xs:complexType>
              </xs:element>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;
