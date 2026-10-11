/**
 * XML Validation, XSD Schema Validation, and Diagnostic Utilities
 * 100% Client-Side / Browser-Only Execution
 * Specially designed for SAP Integration Suite (CPI) Payloads, IDocs, and SOAP Envelopes.
 */

export interface XmlValidationError {
  message: string;
  line?: number;
  column?: number;
  snippet?: string;
  category:
    | 'tag-mismatch'
    | 'unclosed-tag'
    | 'unescaped-character'
    | 'multiple-roots'
    | 'no-root'
    | 'duplicate-attribute'
    | 'declaration-error'
    | 'schema-violation'
    | 'syntax-error';
  suggestion?: string;
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
  attributes: Map<string, Map<string, { type: string; defaultDecl: string }>>;
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
  const attributes = new Map<string, Map<string, { type: string; defaultDecl: string }>>();

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
    const type = am[3];
    const defaultDecl = am[4].trim();
    if (!attributes.has(elemName)) attributes.set(elemName, new Map());
    attributes.get(elemName)!.set(attrName, { type, defaultDecl });
  }

  return { rootName, elements, attributes };
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
        const preceding = xml.substring(0, i);
        if (preceding.trim().length > 0) {
          errors.push({
            message: 'XML declaration (<?xml ...?>) is misplaced. It must be the very first token in the document.',
            line: loc.line,
            column: loc.column,
            snippet: generateSnippet(xml, loc.line, loc.column),
            category: 'declaration-error',
            suggestion: 'Move <?xml ...?> to the beginning of the file without preceding tags or text.',
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

      // Check for XML ID uniqueness across document
      const idAttrRegex = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
      let idMatch: RegExpExecArray | null;
      while ((idMatch = idAttrRegex.exec(tagContent)) !== null) {
        const idVal = idMatch[1] ?? idMatch[2];
        if (idVal) {
          if (seenIds.has(idVal)) {
            const attrOffset = i + 1 + tagName.length + idMatch.index;
            const attrLoc = offsetToLineCol(xml, attrOffset);
            errors.push({
              message: `Duplicate XML ID '${idVal}' found on line ${attrLoc.line}. An XML ID attribute must be unique throughout the document.`,
              line: attrLoc.line,
              column: attrLoc.column,
              snippet: generateSnippet(xml, attrLoc.line, attrLoc.column),
              category: 'syntax-error',
              suggestion: `Two elements share the same ID '${idVal}'. Change '${idVal}' to a unique identifier.`,
            });
          } else {
            seenIds.add(idVal);
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
            suggestion: `Remove '<${tagName}>' from the document or declare <!ELEMENT ${tagName} ...> in the DTD.`,
          });
        }
      }

      if (!isSelfClosing) {
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

  function traverse(node: Node, currentDepth: number) {
    if (node.nodeType === Node.ELEMENT_NODE) {
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
    } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
      cdataCount++;
    } else if (node.nodeType === Node.COMMENT_NODE) {
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
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const parserError = doc.getElementsByTagName('parsererror')[0];

    const elapsed = Math.round(performance.now() - startTime);

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
          sizeBytes: new Blob([xml]).size,
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
        sizeBytes: new Blob([xml]).size,
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
export function autoFixXml(xml: string): { fixedXml: string; fixes: string[] } {
  const fixes: string[] = [];
  let result = xml;

  if (!result || !result.trim()) {
    return { fixedXml: result, fixes };
  }

  // Run up to 4 iterative passes to resolve cascading dependencies
  for (let pass = 0; pass < 4; pass++) {
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
          passFixes.push(`Added quotes to attribute in <${tagName}>: ${p1.trim()}"${p2.trim()}"`);
          return `${p1}"${p2.trim()}"`;
        });
      }

      // 0b. Handle boolean / standalone attributes without value, e.g. <input disabled> -> <input disabled="disabled">
      const standaloneRegex = /(\s+)([a-zA-Z_][a-zA-Z0-9_.:-]*)(?=\s+(?![=])|\s*\/$|\s*$)/g;
      if (standaloneRegex.test(fixedAttrs)) {
        fixedAttrs = fixedAttrs.replace(standaloneRegex, (m: string, space: string, attrName: string) => {
          if (attrName.startsWith('?') || attrName.endsWith('?')) return m;
          passFixes.push(`Assigned value to boolean/standalone attribute '${attrName}' in <${tagName}>`);
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
        passFixes.push('Moved misplaced <?xml ...?> declaration to the top of the document');
      } else if (first.index > 0) {
        // Preceded only by whitespace/BOM
        result = result.replace(/^\s+<\?xml/i, '<?xml');
        passFixes.push('Removed whitespace preceding XML declaration <?xml');
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
          passFixes.push('Removed invalid nested <?xml ...?> declaration from document body');
        }
      }
    }

    // 2. Escape bare ampersands outside of entities and CDATA
    const bareAmpRegex = /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g;
    const ampMatches = (result.match(bareAmpRegex) || []).length;
    if (ampMatches > 0) {
      result = result.replace(bareAmpRegex, '&amp;');
      passFixes.push(`Escaped ${ampMatches} bare ampersand(s) to &amp;`);
    }

    // 3. Escape bare '<' not starting a valid tag or declaration
    const bareLtRegex = /<(?![a-zA-Z_/?!])/g;
    const ltMatches = (result.match(bareLtRegex) || []).length;
    if (ltMatches > 0) {
      result = result.replace(bareLtRegex, '&lt;');
      passFixes.push(`Escaped ${ltMatches} bare '<' symbol(s) to &lt;`);
    }

    // 4. Normalize smart / curly quotes
    if (/[\u201C\u201D\u2018\u2019]/.test(result)) {
      result = result
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");
      passFixes.push('Normalized smart/curly quotes to standard XML quotes');
    }

    // 5. Close unclosed comments or CDATA
    if (result.includes('<!--') && !result.includes('-->')) {
      result = `${result}\n-->`;
      passFixes.push("Closed unterminated comment with '-->'");
    }
    if (result.includes('<![CDATA[') && !result.includes(']]>')) {
      result = `${result}\n]]>`;
      passFixes.push("Closed unterminated CDATA with ']]>'");
    }

    // 5b. DTD Namespace Prefix Alignment & Unexpected Element Fix
    const dtd = parseDtd(result);
    if (dtd) {
      // 5b-1. Remove namespace prefixes from elements when DTD declared them without prefix
      for (const [declaredElem] of dtd.elements) {
        const prefixedRegex = new RegExp(`(<|</)([a-zA-Z0-9_.:-]+):(${declaredElem})([\\s>/])`, 'g');
        if (prefixedRegex.test(result)) {
          result = result.replace(prefixedRegex, (_m, p1, _prefix, local, p4) => {
            return `${p1}${local}${p4}`;
          });
          passFixes.push(`Removed undeclared namespace prefix from <${declaredElem}> elements to match DTD declaration`);
        }
      }

      // 5b-2. Remove unexpected elements not declared in DTD
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
        const blockRegex = new RegExp(`^[ \\t]*<${tag}(\\s[^>]*)?>[\\s\\S]*?<\\/${tag}>[ \\t]*\\r?\\n?`, 'gmi');
        if (blockRegex.test(result)) {
          result = result.replace(blockRegex, '');
          passFixes.push(`Removed unexpected element <${tag}> not declared in DTD`);
        }
      }
    }

    // 5c. Deduplicate XML IDs across document
    const idRegex = /(\bid\s*=\s*["'])([^"']+)(["'])/gi;
    const allIds: string[] = [];
    let im: RegExpExecArray | null;
    while ((im = idRegex.exec(result)) !== null) {
      allIds.push(im[2]);
    }

    const seenIdsForFix = new Set<string>();
    result = result.replace(idRegex, (full, p1, val, p3) => {
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
        passFixes.push(`Changed duplicate ID '${val}' to unique ID '${newId}'`);
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
      passFixes.push('Enclosed multiple root elements in a <root>...</root> wrapper');
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
            passFixes.push(`Line ${err.line}: Corrected </${actualTag}> to </${expectedTag}>`);
          } else {
            // Check adjacent lines in case of wrapping
            let fixedNearby = false;
            for (const offset of [-1, 1, -2, 2]) {
              const checkIdx = lineIdx + offset;
              if (checkIdx >= 0 && checkIdx < lines.length && targetRegex.test(lines[checkIdx])) {
                lines[checkIdx] = lines[checkIdx].replace(targetRegex, `</${expectedTag}>`);
                linesModified = true;
                passFixes.push(`Line ${checkIdx + 1}: Corrected </${actualTag}> to </${expectedTag}>`);
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
                passFixes.push(`Corrected closing tag </${actualTag}> to </${expectedTag}>`);
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
            passFixes.push(`Line ${targetLine}: Closed unclosed leaf element <${unclosedTag}> with </${unclosedTag}>`);
          } else if (matchBefore) {
            const nextTag = matchBefore[1];
            const targetNextRegex = new RegExp(`(</\\s*${nextTag}\\s*>)`, 'i');
            for (let k = lineIdx; k < lines.length; k++) {
              if (targetNextRegex.test(lines[k])) {
                const indent = lines[k].match(/^(\s*)/)?.[1] || '';
                lines[k] = lines[k].replace(targetNextRegex, `${indent}</${unclosedTag}>\n$1`);
                linesModified = true;
                passFixes.push(`Line ${k + 1}: Inserted missing closing tag </${unclosedTag}> before </${nextTag}>`);
                break;
              }
            }
          } else {
            // Premature end of document or no next tag: append before root close or end
            lines.push(`</${unclosedTag}>`);
            linesModified = true;
            passFixes.push(`Appended missing closing tag </${unclosedTag}>`);
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
              passFixes.push(`Line ${err.line}: Removed duplicate attribute '${attrName}'`);
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
              passFixes.push(`Line ${err.line}: Removed stray closing tag </${strayTag}>`);
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

  return { fixedXml: result, fixes };
}

/**
 * Client-Side XSD Schema Rule Validation
 * Checks element hierarchy, presence of required elements, and basic types
 */
export function validateAgainstXsd(xml: string, xsd: string): XsdValidationResult {
  if (!xml.trim()) {
    return {
      isValid: false,
      errors: [{ message: 'XML document is empty.', category: 'no-root' }],
      warnings: [],
    };
  }
  if (!xsd.trim()) {
    return {
      isValid: false,
      errors: [{ message: 'XSD schema is empty.', category: 'schema-violation' }],
      warnings: [],
    };
  }

  // First validate XML structure
  const xmlValidation = validateXmlStructure(xml);
  if (!xmlValidation.isValid) {
    return {
      isValid: false,
      errors: xmlValidation.errors,
      warnings: [],
    };
  }

  // Validate XSD structure
  const xsdValidation = validateXmlStructure(xsd);
  if (!xsdValidation.isValid) {
    return {
      isValid: false,
      errors: [
        {
          message: `XSD Schema syntax error: ${xsdValidation.errors[0]?.message}`,
          line: xsdValidation.errors[0]?.line,
          column: xsdValidation.errors[0]?.column,
          snippet: xsdValidation.errors[0]?.snippet,
          category: 'schema-violation',
          suggestion: 'Ensure the XSD schema is itself a well-formed XML schema with <xs:schema>.',
        },
      ],
      warnings: [],
    };
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'application/xml');
  const xsdDoc = parser.parseFromString(xsd, 'application/xml');

  const xsdRoot = xsdDoc.documentElement;
  if (!xsdRoot || !xsdRoot.nodeName.includes('schema')) {
    return {
      isValid: false,
      errors: [
        {
          message: 'Root element of schema must be <xs:schema> or <xsd:schema>.',
          category: 'schema-violation',
        },
      ],
      warnings: [],
    };
  }

  const errors: XmlValidationError[] = [];
  const warnings: string[] = [];

  const xmlRoot = xmlDoc.documentElement;
  const rootLocalName = xmlRoot.localName || xmlRoot.nodeName.split(':').pop() || '';

  // Look for top-level xs:element definitions in XSD
  const topElements = Array.from(xsdDoc.getElementsByTagNameNS('*', 'element')).filter(
    (el) => el.parentNode === xsdRoot
  );

  const matchedTopElement = topElements.find(
    (el) => el.getAttribute('name') === rootLocalName
  );

  if (topElements.length > 0 && !matchedTopElement) {
    const declaredNames = topElements
      .map((el) => el.getAttribute('name'))
      .filter(Boolean)
      .join(', ');
    errors.push({
      message: `Root element <${xmlRoot.nodeName}> does not match any top-level schema element: [${declaredNames}].`,
      category: 'schema-violation',
      suggestion: `Rename XML root to <${topElements[0]?.getAttribute('name')}> or update the XSD schema definition.`,
    });
  }

  // Check required child elements (minOccurs >= 1 or default 1) inside sequences
  const allSchemaElements = Array.from(xsdDoc.getElementsByTagNameNS('*', 'element'));
  allSchemaElements.forEach((schemaEl) => {
    const elName = schemaEl.getAttribute('name');
    const minOccurs = schemaEl.getAttribute('minOccurs');
    const type = schemaEl.getAttribute('type');

    if (elName && (minOccurs === '1' || minOccurs === null)) {
      // If this element's parent is inside a complexType belonging to an element present in the XML
      const parentComplex = schemaEl.closest('complexType');
      const parentElement = parentComplex?.closest('element');
      const parentElName = parentElement?.getAttribute('name');

      if (parentElName) {
        const matchingParentsInXml = xmlDoc.getElementsByTagNameNS('*', parentElName);
        if (matchingParentsInXml.length > 0) {
          Array.from(matchingParentsInXml).forEach((parentXmlNode) => {
            const hasChild = Array.from(parentXmlNode.children).some(
              (c) => (c.localName || c.nodeName.split(':').pop()) === elName
            );
            if (!hasChild) {
              warnings.push(
                `Schema Advisory: Required element <${elName}> (minOccurs="1") is missing under parent <${parentElName}>.`
              );
            }
          });
        }
      }
    }

    // Check basic data type format if element exists in XML
    if (elName && type) {
      const xmlNodes = xmlDoc.getElementsByTagNameNS('*', elName);
      Array.from(xmlNodes).forEach((node) => {
        const val = (node.textContent || '').trim();
        if (val) {
          if (type.includes('integer') && !/^-?\d+$/.test(val)) {
            errors.push({
              message: `Type mismatch for <${elName}>: expected '${type}', but found non-integer '${val}'.`,
              category: 'schema-violation',
              suggestion: `Provide a valid integer value for element <${elName}>.`,
            });
          } else if (type.includes('decimal') && !/^-?\d+(\.\d+)?$/.test(val)) {
            errors.push({
              message: `Type mismatch for <${elName}>: expected '${type}', but found invalid decimal '${val}'.`,
              category: 'schema-violation',
              suggestion: `Provide a valid decimal value (e.g. 19.99) for <${elName}>.`,
            });
          } else if (type.includes('date') && !/^\d{4}-\d{2}-\d{2}/.test(val)) {
            errors.push({
              message: `Type mismatch for <${elName}>: expected ISO Date (YYYY-MM-DD), but found '${val}'.`,
              category: 'schema-violation',
              suggestion: `Format the date as YYYY-MM-DD (e.g. 2026-10-11) for <${elName}>.`,
            });
          } else if (
            type.includes('boolean') &&
            !['true', 'false', '0', '1'].includes(val.toLowerCase())
          ) {
            errors.push({
              message: `Type mismatch for <${elName}>: expected boolean ('true'/'false'), but found '${val}'.`,
              category: 'schema-violation',
            });
          }
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
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
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xs:element name="OrderRequest">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Header">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="OrderNumber" type="xs:string" />
              <xs:element name="SupplierName" type="xs:string" />
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
                    <xs:element name="Quantity" type="xs:integer" />
                    <xs:element name="Price" type="xs:decimal" />
                  </xs:sequence>
                </xs:complexType>
              </xs:element>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;
