/**
 * ToolSAP XPath Evaluator Engine
 * Supports XPath 3.1 (via FontoXPath) and Native XPath 1.0 (via browser DOM XPathEvaluator)
 * 100% Client-Side / Browser-Only Execution with Zero Network Latency
 * Specially tailored for SAP Cloud Integration (CPI), Integration Suite, IDocs, and SOAP Web Services.
 */

import {
  evaluateXPath,
  evaluateXPathToNodes,
  evaluateXPathToString,
  evaluateXPathToBoolean,
  evaluateXPathToNumber,
  ReturnType as FontoxpathReturnType,
} from 'fontoxpath';
import { validateXmlStructure } from '../xml/xmlValidator';

export type XPathEngine = 'xpath-3.1' | 'xpath-1.0';
export type XPathReturnType = 'auto' | 'nodes' | 'string' | 'number' | 'boolean';

export interface XPathNamespaceBinding {
  prefix: string;
  uri: string;
  isDefault?: boolean;
}

export type XPathMatchedNodeType =
  | 'element'
  | 'attribute'
  | 'text'
  | 'cdata'
  | 'comment'
  | 'processing-instruction';

export interface XPathMatchedNode {
  index: number;
  nodeType: XPathMatchedNodeType;
  name: string;
  path: string;
  value: string;
  outerXml: string;
  line?: number;
  column?: number;
}

export interface XPathEvaluationOptions {
  engine?: XPathEngine;
  returnType?: XPathReturnType;
  customNamespaces?: Record<string, string>;
  defaultNamespacePrefix?: string; // Prefix to map to default xmlns, default: 'dft'
}

export interface XPathEvaluationResult {
  success: boolean;
  engineUsed: XPathEngine;
  returnTypeDetected: 'nodes' | 'string' | 'number' | 'boolean' | 'empty';
  matches: XPathMatchedNode[];
  primitiveValue?: string | number | boolean | null;
  executionTimeMs: number;
  totalMatches: number;
  namespacesDetected: XPathNamespaceBinding[];
  xpathExpression: string;
  error?: {
    message: string;
    code?: string;
    column?: number;
    suggestion?: string;
  };
}

/**
 * Extracts all declared namespaces from an XML Document.
 * Scans root and child elements for xmlns and xmlns:prefix declarations.
 */
export function extractNamespacesFromXml(doc: Document): XPathNamespaceBinding[] {
  const namespacesMap = new Map<string, { uri: string; isDefault: boolean }>();

  function scanNode(node: Node) {
    if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
      const el = node as Element;
      if (el.attributes) {
        for (let i = 0; i < el.attributes.length; i++) {
          const attr = el.attributes[i];
          if (attr.name === 'xmlns') {
            namespacesMap.set('', { uri: attr.value, isDefault: true });
          } else if (attr.name.startsWith('xmlns:')) {
            const prefix = attr.name.substring(6);
            if (prefix) {
              namespacesMap.set(prefix, { uri: attr.value, isDefault: false });
            }
          }
        }
      }

      // Also check element's own namespaceURI if not covered
      if (el.prefix && el.namespaceURI && !namespacesMap.has(el.prefix)) {
        namespacesMap.set(el.prefix, { uri: el.namespaceURI, isDefault: false });
      }

      const children = el.childNodes;
      if (children) {
        for (let i = 0; i < children.length; i++) {
          scanNode(children[i]);
        }
      }
    }
  }

  if (doc.documentElement) {
    scanNode(doc.documentElement);
  }

  const result: XPathNamespaceBinding[] = [];
  for (const [prefix, info] of namespacesMap.entries()) {
    result.push({
      prefix,
      uri: info.uri,
      isDefault: info.isDefault,
    });
  }

  return result;
}

/**
 * Computes a canonical, 1-indexed XPath expression for a given DOM node.
 * Example: /store[1]/products[1]/product[2]/name[1]
 */
export function getNodeCanonicalPath(node: Node): string {
  if (node.nodeType === 9 /* DOCUMENT_NODE */) {
    return '/';
  }

  if (node.nodeType === 2 /* ATTRIBUTE_NODE */) {
    const attr = node as Attr;
    const ownerEl = attr.ownerElement;
    const parentPath = ownerEl ? getNodeCanonicalPath(ownerEl) : '';
    const attrName = attr.prefix ? `${attr.prefix}:${attr.localName}` : attr.name;
    return `${parentPath}/@${attrName}`;
  }

  if (node.nodeType === 3 /* TEXT_NODE */ || node.nodeType === 4 /* CDATA_SECTION_NODE */) {
    const parent = node.parentNode;
    if (!parent) return '/text()';
    const parentPath = getNodeCanonicalPath(parent);
    let textIndex = 1;
    let prev = node.previousSibling;
    while (prev) {
      if (prev.nodeType === 3 || prev.nodeType === 4) {
        textIndex++;
      }
      prev = prev.previousSibling;
    }
    return `${parentPath}/text()[${textIndex}]`;
  }

  if (node.nodeType === 8 /* COMMENT_NODE */) {
    const parent = node.parentNode;
    const parentPath = parent ? getNodeCanonicalPath(parent) : '';
    let commentIndex = 1;
    let prev = node.previousSibling;
    while (prev) {
      if (prev.nodeType === 8) {
        commentIndex++;
      }
      prev = prev.previousSibling;
    }
    return `${parentPath}/comment()[${commentIndex}]`;
  }

  if (node.nodeType === 1 /* ELEMENT_NODE */) {
    const el = node as Element;
    if (!el.parentNode || el.parentNode.nodeType === 9) {
      const elName = el.prefix ? `${el.prefix}:${el.localName}` : el.nodeName;
      return `/${elName}`;
    }

    const parentPath = getNodeCanonicalPath(el.parentNode);
    const elName = el.prefix ? `${el.prefix}:${el.localName}` : el.nodeName;

    // Calculate 1-indexed sibling position among siblings with same nodeName (case-sensitive)
    let index = 1;
    let sibling = el.previousSibling;
    while (sibling) {
      if (
        sibling.nodeType === 1 &&
        (sibling as Element).nodeName === el.nodeName
      ) {
        index++;
      }
      sibling = sibling.previousSibling;
    }

    return `${parentPath}/${elName}[${index}]`;
  }

  return '';
}

/**
 * Serializes a DOM node into an XML string.
 */
export function serializeNodeToXml(node: Node): string {
  try {
    if (typeof XMLSerializer !== 'undefined') {
      const serializer = new XMLSerializer();
      return serializer.serializeToString(node);
    }
    if ((globalThis as unknown as { XMLSerializer?: new () => { serializeToString: (n: Node) => string } }).XMLSerializer) {
      const SerializerClass = (globalThis as unknown as { XMLSerializer: new () => { serializeToString: (n: Node) => string } }).XMLSerializer;
      return new SerializerClass().serializeToString(node);
    }
  } catch {
    // Fallback serialization below
  }

  if (node.nodeType === 1 /* ELEMENT_NODE */) {
    const el = node as Element;
    return (el as any).outerHTML || `<${el.nodeName}>${el.textContent || ''}</${el.nodeName}>`;
  }
  if (node.nodeType === 2 /* ATTRIBUTE_NODE */) {
    const attr = node as Attr;
    return `${attr.name}="${attr.value}"`;
  }
  if (node.nodeType === 8 /* COMMENT_NODE */) {
    return `<!--${node.nodeValue ?? ''}-->`;
  }
  if (node.nodeType === 4 /* CDATA_SECTION_NODE */) {
    return `<![CDATA[${node.nodeValue ?? ''}]]>`;
  }
  if (node.nodeType === 7 /* PROCESSING_INSTRUCTION_NODE */) {
    const pi = node as ProcessingInstruction;
    return `<?${pi.target} ${pi.data}?>`;
  }
  return node.nodeValue || node.textContent || '';
}

/**
 * Approximate line and column location of an element or attribute in raw XML string.
 */
export function estimateNodeLocation(
  xml: string,
  node: Node
): { line: number; column: number } | undefined {
  if (node.nodeType === 1 /* ELEMENT_NODE */) {
    const el = node as Element;
    const tagName = el.nodeName;
    const regex = new RegExp(`<${tagName}\\b`, 'g');
    let match: RegExpExecArray | null;
    let occurrences = 0;

    // Find sibling index among same tag names in document
    const allSameTags = el.ownerDocument?.getElementsByTagName(tagName);
    let targetIndex = 0;
    if (allSameTags) {
      for (let i = 0; i < allSameTags.length; i++) {
        if (allSameTags[i] === el) {
          targetIndex = i;
          break;
        }
      }
    }

    while ((match = regex.exec(xml)) !== null) {
      if (occurrences === targetIndex) {
        const offset = match.index;
        const lines = xml.substring(0, offset).split(/\r?\n/);
        return {
          line: lines.length,
          column: (lines[lines.length - 1]?.length || 0) + 1,
        };
      }
      occurrences++;
    }
  }

  if (node.nodeType === 2 /* ATTRIBUTE_NODE */) {
    const attr = node as Attr;
    const attrSearch = `${attr.name}="${attr.value}"`;
    const idx = xml.indexOf(attrSearch);
    if (idx >= 0) {
      const lines = xml.substring(0, idx).split(/\r?\n/);
      return {
        line: lines.length,
        column: (lines[lines.length - 1]?.length || 0) + 1,
      };
    }
  }

  return undefined;
}

/**
 * Converts a standard XPath expression to a namespace-agnostic query using local-name().
 * Example: /store/products/product/@sku -> /*[local-name()='store']/*[local-name()='products']/*[local-name()='product']/@*[local-name()='sku']
 * Handles string literals, axes, function calls, and operators correctly without corruption.
 */
export function convertToNamespaceAgnostic(xpath: string): string {
  const trimmed = xpath.trim();
  if (!trimmed) return '';

  // 1. Protect String Literals (both "..." and '...')
  const stringLiterals: string[] = [];
  const withProtectedStrings = trimmed.replace(
    /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
    (match) => {
      stringLiterals.push(match);
      return `___TOOLSAP_STR_${stringLiterals.length - 1}___`;
    }
  );

  // 2. Protect XPath Axes (e.g., following-sibling::, ancestor::)
  const axes: string[] = [];
  const axisRegex =
    /\b(ancestor-or-self|ancestor|attribute|child|descendant-or-self|descendant|following-sibling|following|namespace|parent|preceding-sibling|preceding|self)::/g;
  const withProtectedAxes = withProtectedStrings.replace(axisRegex, (_match, axisName) => {
    axes.push(axisName);
    return `___TOOLSAP_AXIS_${axes.length - 1}___::`;
  });

  // 3. Known keywords and functions that should not be converted
  const reservedWords = new Set([
    'and',
    'or',
    'div',
    'mod',
    'to',
    'for',
    'in',
    'return',
    'if',
    'then',
    'else',
    'satisfies',
    'every',
    'some',
    'eq',
    'ne',
    'lt',
    'le',
    'gt',
    'ge',
    'is',
    'union',
    'intersect',
    'except',
    'count',
    'sum',
    'avg',
    'min',
    'max',
    'not',
    'true',
    'false',
    'boolean',
    'string',
    'number',
    'concat',
    'contains',
    'starts-with',
    'ends-with',
    'substring',
    'substring-before',
    'substring-after',
    'string-length',
    'normalize-space',
    'local-name',
    'namespace-uri',
    'name',
    'position',
    'last',
    'round',
    'floor',
    'ceiling',
    'matches',
    'replace',
    'lower-case',
    'upper-case',
    'text',
    'node',
    'comment',
    'processing-instruction',
  ]);

  // 4. Protect function calls and node tests like text(), count(...)
  const functionCalls: string[] = [];
  const withProtectedFunctions = withProtectedAxes.replace(
    /\b([a-zA-Z_][a-zA-Z0-9_.-]*)\s*\(/g,
    (_match, fnName) => {
      functionCalls.push(fnName);
      return `___TOOLSAP_FN_${functionCalls.length - 1}___(`;
    }
  );

  // 5. Convert attributes: @prefix:localName or @localName (except @*)
  const withConvertedAttrs = withProtectedFunctions.replace(
    /@([a-zA-Z_][a-zA-Z0-9_.-]*:)?([a-zA-Z_][a-zA-Z0-9_.-]*)/g,
    (_match, _prefix, localName) => {
      if (localName === '*' || localName.startsWith('___TOOLSAP_')) return _match;
      return `@*[local-name()='${localName}']`;
    }
  );

  // 6. Convert element steps:
  // An element step appears after /, //, [, (, |, ,, :, or at start of string
  const withConvertedElements = withConvertedAttrs.replace(
    /(^|[/([|,:]|\s+)([a-zA-Z_][a-zA-Z0-9_.-]*:)?([a-zA-Z_][a-zA-Z0-9_.-]*)(?=$|[[/)\]|,\s:])/g,
    (_match, prefixChar, _nsPrefix, localName) => {
      if (
        localName === '*' ||
        localName.startsWith('___TOOLSAP_') ||
        reservedWords.has(localName)
      ) {
        return _match;
      }
      return `${prefixChar}*[local-name()='${localName}']`;
    }
  );

  // 7. Restore function calls
  const withRestoredFunctions = withConvertedElements.replace(
    /___TOOLSAP_FN_(\d+)___\(/g,
    (_match, idxStr) => `${functionCalls[parseInt(idxStr, 10)]}(`
  );

  // 8. Restore axes
  const withRestoredAxes = withRestoredFunctions.replace(
    /___TOOLSAP_AXIS_(\d+)___::/g,
    (_match, idxStr) => `${axes[parseInt(idxStr, 10)]}::`
  );

  // 9. Restore string literals
  const finalResult = withRestoredAxes.replace(
    /___TOOLSAP_STR_(\d+)___/g,
    (_match, idxStr) => stringLiterals[parseInt(idxStr, 10)]
  );

  return finalResult;
}

/**
 * Main evaluation function.
 * Evaluates an XPath expression against an XML payload with full namespace awareness and detailed result metadata.
 */
export async function evaluateXPathExpression(
  xml: string,
  xpathExpression: string,
  options: XPathEvaluationOptions = {}
): Promise<XPathEvaluationResult> {
  const startTime = performance.now();
  const engine: XPathEngine = options.engine ?? 'xpath-3.1';
  const returnType: XPathReturnType = options.returnType ?? 'auto';
  const defaultPrefix = options.defaultNamespacePrefix ?? 'dft';

  const cleanXml = (xml || '').trim();
  const cleanXPath = (xpathExpression || '').trim();

  // 1. Guard against empty inputs
  if (!cleanXml) {
    return {
      success: false,
      engineUsed: engine,
      returnTypeDetected: 'empty',
      matches: [],
      executionTimeMs: 0,
      totalMatches: 0,
      namespacesDetected: [],
      xpathExpression: cleanXPath,
      error: {
        message: 'XML input is empty. Paste or upload an XML document.',
        code: 'ERR_EMPTY_XML',
        suggestion: 'Paste an XML document or select one of the preloaded SAP sample payloads.',
      },
    };
  }

  if (!cleanXPath) {
    return {
      success: false,
      engineUsed: engine,
      returnTypeDetected: 'empty',
      matches: [],
      executionTimeMs: 0,
      totalMatches: 0,
      namespacesDetected: [],
      xpathExpression: '',
      error: {
        message: 'XPath expression is empty. Enter an XPath query to evaluate.',
        code: 'ERR_EMPTY_XPATH',
        suggestion: 'Examples: //product, /store/products/product[1]/name, count(//item), sum(//amount)',
      },
    };
  }

  // 2. Validate XML structure
  const xmlValidation = validateXmlStructure(cleanXml);
  if (!xmlValidation.isValid) {
    const firstErr = xmlValidation.errors[0];
    return {
      success: false,
      engineUsed: engine,
      returnTypeDetected: 'empty',
      matches: [],
      executionTimeMs: Math.round(performance.now() - startTime),
      totalMatches: 0,
      namespacesDetected: [],
      xpathExpression: cleanXPath,
      error: {
        message: `XML Well-Formedness Error: ${firstErr?.message || 'XML is not well-formed'}`,
        code: 'ERR_XML_PARSE_ERROR',
        suggestion: firstErr?.suggestion || 'Fix XML syntax errors before evaluating XPath queries, or check the XML Validator tool.',
      },
    };
  }

  // Parse XML into DOM Document
  let doc: Document;
  try {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      doc = parser.parseFromString(cleanXml, 'application/xml');
    } else {
      // Server-side / test environment fallback
      const { DOMParser: XmldomParser } = await import('@xmldom/xmldom');
      const parser = new XmldomParser({
        onError: () => {},
      });
      doc = parser.parseFromString(cleanXml, 'application/xml') as unknown as Document;
    }
  } catch (parseEx) {
    return {
      success: false,
      engineUsed: engine,
      returnTypeDetected: 'empty',
      matches: [],
      executionTimeMs: Math.round(performance.now() - startTime),
      totalMatches: 0,
      namespacesDetected: [],
      xpathExpression: cleanXPath,
      error: {
        message: `Failed to parse XML: ${parseEx instanceof Error ? parseEx.message : String(parseEx)}`,
        code: 'ERR_XML_PARSE_EXCEPTION',
      },
    };
  }

  // 3. Extract detected namespaces
  const detectedNamespaces = extractNamespacesFromXml(doc);
  const namespaceMap: Record<string, string> = {
    xml: 'http://www.w3.org/XML/1998/namespace',
    xmlns: 'http://www.w3.org/2000/xmlns/',
    xsi: 'http://www.w3.org/2001/XMLSchema-instance',
    xs: 'http://www.w3.org/2001/XMLSchema',
    fn: 'http://www.w3.org/2005/xpath-functions',
    math: 'http://www.w3.org/2005/xpath-functions/math',
    map: 'http://www.w3.org/2005/xpath-functions/map',
    array: 'http://www.w3.org/2005/xpath-functions/array',
  };

  for (const ns of detectedNamespaces) {
    if (ns.prefix) {
      namespaceMap[ns.prefix] = ns.uri;
    }
    if (ns.isDefault) {
      namespaceMap[defaultPrefix] = ns.uri;
      namespaceMap[''] = ns.uri;
    }
  }

  // Overlay user custom namespace mappings
  if (options.customNamespaces) {
    Object.assign(namespaceMap, options.customNamespaces);
  }

  const namespaceResolver = (prefix: string | null): string | null => {
    if (!prefix) {
      return namespaceMap[''] || namespaceMap[defaultPrefix] || null;
    }
    return namespaceMap[prefix] || null;
  };

  // 4. Execution via Engine
  try {
    // If XPath 1.0 requested AND native document.evaluate exists in browser environment
    if (engine === 'xpath-1.0' && typeof doc.evaluate === 'function') {
      return evaluateWithNativeXPath(
        doc,
        cleanXml,
        cleanXPath,
        returnType,
        namespaceResolver,
        detectedNamespaces,
        startTime
      );
    }

    // Modern XPath 3.1 evaluation via FontoXPath
    return evaluateWithFontoXPath(
      doc,
      cleanXml,
      cleanXPath,
      returnType,
      namespaceResolver,
      detectedNamespaces,
      startTime
    );
  } catch (err: unknown) {
    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    const errMsg = err instanceof Error ? err.message : String(err);

    // Provide helpful suggestions for common XPath gotchas
    let suggestion = 'Check XPath syntax, brackets, parentheses, and namespace prefixes.';
    if (errMsg.includes('XPST0081') || errMsg.includes('prefix') || errMsg.includes('namespace')) {
      suggestion = `A prefix in your XPath is undeclared. Check the detected namespaces table or use the "${defaultPrefix}:" prefix for default namespace.`;
    } else if (errMsg.includes('XPST0003') || errMsg.includes('syntax') || errMsg.includes('Unexpected')) {
      suggestion = 'XPath syntax error. Verify matching brackets [ ], quotes " ", and parentheses ( ).';
    } else if (errMsg.includes('XPST0017') || errMsg.includes('Unknown function')) {
      suggestion = 'Function not found in XPath specification. Verify function name spelling.';
    }

    return {
      success: false,
      engineUsed: engine,
      returnTypeDetected: 'empty',
      matches: [],
      executionTimeMs: elapsed,
      totalMatches: 0,
      namespacesDetected: detectedNamespaces,
      xpathExpression: cleanXPath,
      error: {
        message: errMsg,
        code: 'ERR_XPATH_EVALUATION',
        suggestion,
      },
    };
  }
}

/**
 * Evaluates XPath using FontoXPath (XPath 3.1 & 1.0 compatible).
 */
function evaluateWithFontoXPath(
  doc: Document,
  xml: string,
  xpath: string,
  forcedReturnType: XPathReturnType,
  namespaceResolver: (prefix: string | null) => string | null,
  detectedNamespaces: XPathNamespaceBinding[],
  startTime: number
): XPathEvaluationResult {
  const options = {
    namespaceResolver: (prefix: string) => namespaceResolver(prefix),
  };

  // Try evaluating as Nodes first if auto or forced nodes
  if (forcedReturnType === 'nodes' || forcedReturnType === 'auto') {
    try {
      const nodes = evaluateXPathToNodes(xpath, doc, null, {}, options);
      if (nodes && nodes.length > 0) {
        const matches: XPathMatchedNode[] = (nodes as any[]).map((node: any, idx: number) => {
          let nodeType: XPathMatchedNodeType = 'element';
          if (node.nodeType === 2) nodeType = 'attribute';
          else if (node.nodeType === 3) nodeType = 'text';
          else if (node.nodeType === 4) nodeType = 'cdata';
          else if (node.nodeType === 8) nodeType = 'comment';
          else if (node.nodeType === 7) nodeType = 'processing-instruction';

          const name =
            node.nodeType === 2
              ? `@${(node as Attr).name}`
              : (node as Element).nodeName || '#text';
          const val = (node.nodeValue || node.textContent || '').trim();
          const outer = serializeNodeToXml(node);
          const loc = estimateNodeLocation(xml, node);

          return {
            index: idx + 1,
            nodeType,
            name,
            path: getNodeCanonicalPath(node),
            value: val,
            outerXml: outer,
            line: loc?.line,
            column: loc?.column,
          };
        });

        const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
        return {
          success: true,
          engineUsed: 'xpath-3.1',
          returnTypeDetected: 'nodes',
          matches,
          totalMatches: matches.length,
          executionTimeMs: elapsed,
          namespacesDetected: detectedNamespaces,
          xpathExpression: xpath,
        };
      } else if (forcedReturnType === 'nodes') {
        // Explicitly asked for nodes and got 0 matches
        const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
        return {
          success: true,
          engineUsed: 'xpath-3.1',
          returnTypeDetected: 'nodes',
          matches: [],
          totalMatches: 0,
          executionTimeMs: elapsed,
          namespacesDetected: detectedNamespaces,
          xpathExpression: xpath,
        };
      }
    } catch (nodeEx) {
      if (forcedReturnType === 'nodes') {
        throw nodeEx;
      }
      // If auto, continue to test primitive types (number, boolean, string)
    }
  }

  // Evaluate as primitive (number / boolean / string)
  if (forcedReturnType === 'number') {
    const num = evaluateXPathToNumber(xpath, doc, null, {}, options);
    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    return {
      success: true,
      engineUsed: 'xpath-3.1',
      returnTypeDetected: 'number',
      primitiveValue: num,
      matches: [],
      totalMatches: 1,
      executionTimeMs: elapsed,
      namespacesDetected: detectedNamespaces,
      xpathExpression: xpath,
    };
  }

  if (forcedReturnType === 'boolean') {
    const bool = evaluateXPathToBoolean(xpath, doc, null, {}, options);
    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    return {
      success: true,
      engineUsed: 'xpath-3.1',
      returnTypeDetected: 'boolean',
      primitiveValue: bool,
      matches: [],
      totalMatches: 1,
      executionTimeMs: elapsed,
      namespacesDetected: detectedNamespaces,
      xpathExpression: xpath,
    };
  }

  if (forcedReturnType === 'string') {
    const str = evaluateXPathToString(xpath, doc, null, {}, options);
    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    return {
      success: true,
      engineUsed: 'xpath-3.1',
      returnTypeDetected: 'string',
      primitiveValue: str,
      matches: [],
      totalMatches: 1,
      executionTimeMs: elapsed,
      namespacesDetected: detectedNamespaces,
      xpathExpression: xpath,
    };
  }

  // Auto-detect using evaluateXPath ANY return type
  const rawAny = evaluateXPath(xpath, doc, null, {}, FontoxpathReturnType.ANY, options);
  const elapsed = Math.round((performance.now() - startTime) * 10) / 10;

  if (typeof rawAny === 'number') {
    return {
      success: true,
      engineUsed: 'xpath-3.1',
      returnTypeDetected: 'number',
      primitiveValue: rawAny,
      matches: [],
      totalMatches: 1,
      executionTimeMs: elapsed,
      namespacesDetected: detectedNamespaces,
      xpathExpression: xpath,
    };
  }

  if (typeof rawAny === 'boolean') {
    return {
      success: true,
      engineUsed: 'xpath-3.1',
      returnTypeDetected: 'boolean',
      primitiveValue: rawAny,
      matches: [],
      totalMatches: 1,
      executionTimeMs: elapsed,
      namespacesDetected: detectedNamespaces,
      xpathExpression: xpath,
    };
  }

  if (typeof rawAny === 'string') {
    return {
      success: true,
      engineUsed: 'xpath-3.1',
      returnTypeDetected: 'string',
      primitiveValue: rawAny,
      matches: [],
      totalMatches: 1,
      executionTimeMs: elapsed,
      namespacesDetected: detectedNamespaces,
      xpathExpression: xpath,
    };
  }

  if (Array.isArray(rawAny)) {
    if (rawAny.length === 0) {
      return {
        success: true,
        engineUsed: 'xpath-3.1',
        returnTypeDetected: 'empty',
        matches: [],
        totalMatches: 0,
        executionTimeMs: elapsed,
        namespacesDetected: detectedNamespaces,
        xpathExpression: xpath,
      };
    }

    // Sequence of values (numbers, strings, booleans, objects, or nodes)
    const matches: XPathMatchedNode[] = (rawAny as any[]).map((item: any, idx: number) => {
      const isNode = item && typeof item === 'object' && item.nodeType !== undefined;
      if (isNode) {
        let nodeType: XPathMatchedNodeType = 'element';
        if (item.nodeType === 2) nodeType = 'attribute';
        else if (item.nodeType === 3) nodeType = 'text';
        else if (item.nodeType === 4) nodeType = 'cdata';
        else if (item.nodeType === 8) nodeType = 'comment';
        else if (item.nodeType === 7) nodeType = 'processing-instruction';

        const name =
          item.nodeType === 2
            ? `@${(item as Attr).name}`
            : (item as Element).nodeName || '#text';
        const val = (item.nodeValue || item.textContent || '').trim();
        const outer = serializeNodeToXml(item);
        const loc = estimateNodeLocation(xml, item);

        return {
          index: idx + 1,
          nodeType,
          name,
          path: getNodeCanonicalPath(item),
          value: val,
          outerXml: outer,
          line: loc?.line,
          column: loc?.column,
        };
      }

      const strVal = typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item ?? '');
      return {
        index: idx + 1,
        nodeType: 'text' as XPathMatchedNodeType,
        name: `item[${idx + 1}]`,
        path: `(${xpath})[${idx + 1}]`,
        value: strVal,
        outerXml: strVal,
      };
    });

    const firstItem = rawAny[0];
    const detectedType =
      typeof firstItem === 'number'
        ? 'number'
        : typeof firstItem === 'boolean'
          ? 'boolean'
          : 'string';

    return {
      success: true,
      engineUsed: 'xpath-3.1',
      returnTypeDetected: detectedType,
      primitiveValue: rawAny.length === 1 ? rawAny[0] : rawAny,
      matches,
      totalMatches: matches.length,
      executionTimeMs: elapsed,
      namespacesDetected: detectedNamespaces,
      xpathExpression: xpath,
    };
  }

  return {
    success: true,
    engineUsed: 'xpath-3.1',
    returnTypeDetected: 'string',
    primitiveValue: String(rawAny ?? ''),
    matches: [],
    totalMatches: 1,
    executionTimeMs: elapsed,
    namespacesDetected: detectedNamespaces,
    xpathExpression: xpath,
  };
}

/**
 * Evaluates XPath using native browser document.evaluate (XPath 1.0).
 */
function evaluateWithNativeXPath(
  doc: Document,
  xml: string,
  xpath: string,
  forcedReturnType: XPathReturnType,
  namespaceResolver: (prefix: string | null) => string | null,
  detectedNamespaces: XPathNamespaceBinding[],
  startTime: number
): XPathEvaluationResult {
  const nsResolver: XPathNSResolver = {
    lookupNamespaceURI: (prefix: string | null) => namespaceResolver(prefix),
  };

  // Check result type requested
  let evalResult: XPathResult;

  if (forcedReturnType === 'number') {
    evalResult = doc.evaluate(xpath, doc, nsResolver, XPathResult.NUMBER_TYPE, null);
    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    return {
      success: true,
      engineUsed: 'xpath-1.0',
      returnTypeDetected: 'number',
      primitiveValue: evalResult.numberValue,
      matches: [],
      totalMatches: 1,
      executionTimeMs: elapsed,
      namespacesDetected: detectedNamespaces,
      xpathExpression: xpath,
    };
  }

  if (forcedReturnType === 'string') {
    evalResult = doc.evaluate(xpath, doc, nsResolver, XPathResult.STRING_TYPE, null);
    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    return {
      success: true,
      engineUsed: 'xpath-1.0',
      returnTypeDetected: 'string',
      primitiveValue: evalResult.stringValue,
      matches: [],
      totalMatches: 1,
      executionTimeMs: elapsed,
      namespacesDetected: detectedNamespaces,
      xpathExpression: xpath,
    };
  }

  if (forcedReturnType === 'boolean') {
    evalResult = doc.evaluate(xpath, doc, nsResolver, XPathResult.BOOLEAN_TYPE, null);
    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    return {
      success: true,
      engineUsed: 'xpath-1.0',
      returnTypeDetected: 'boolean',
      primitiveValue: evalResult.booleanValue,
      matches: [],
      totalMatches: 1,
      executionTimeMs: elapsed,
      namespacesDetected: detectedNamespaces,
      xpathExpression: xpath,
    };
  }

  // Auto / Nodes
  evalResult = doc.evaluate(xpath, doc, nsResolver, XPathResult.ANY_TYPE, null);
  const elapsed = Math.round((performance.now() - startTime) * 10) / 10;

  switch (evalResult.resultType) {
    case XPathResult.NUMBER_TYPE:
      return {
        success: true,
        engineUsed: 'xpath-1.0',
        returnTypeDetected: 'number',
        primitiveValue: evalResult.numberValue,
        matches: [],
        totalMatches: 1,
        executionTimeMs: elapsed,
        namespacesDetected: detectedNamespaces,
        xpathExpression: xpath,
      };

    case XPathResult.STRING_TYPE:
      return {
        success: true,
        engineUsed: 'xpath-1.0',
        returnTypeDetected: 'string',
        primitiveValue: evalResult.stringValue,
        matches: [],
        totalMatches: 1,
        executionTimeMs: elapsed,
        namespacesDetected: detectedNamespaces,
        xpathExpression: xpath,
      };

    case XPathResult.BOOLEAN_TYPE:
      return {
        success: true,
        engineUsed: 'xpath-1.0',
        returnTypeDetected: 'boolean',
        primitiveValue: evalResult.booleanValue,
        matches: [],
        totalMatches: 1,
        executionTimeMs: elapsed,
        namespacesDetected: detectedNamespaces,
        xpathExpression: xpath,
      };

    case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
    case XPathResult.ORDERED_NODE_ITERATOR_TYPE: {
      const nodes: Node[] = [];
      let n: Node | null = evalResult.iterateNext();
      while (n) {
        nodes.push(n);
        n = evalResult.iterateNext();
      }

      const matches: XPathMatchedNode[] = nodes.map((node: Node, idx: number) => {
        let nodeType: XPathMatchedNodeType = 'element';
        if (node.nodeType === 2) nodeType = 'attribute';
        else if (node.nodeType === 3) nodeType = 'text';
        else if (node.nodeType === 4) nodeType = 'cdata';
        else if (node.nodeType === 8) nodeType = 'comment';
        else if (node.nodeType === 7) nodeType = 'processing-instruction';

        const name =
          node.nodeType === 2
            ? `@${(node as Attr).name}`
            : (node as Element).nodeName || '#text';
        const val = (node.nodeValue || node.textContent || '').trim();
        const outer = serializeNodeToXml(node);
        const loc = estimateNodeLocation(xml, node);

        return {
          index: idx + 1,
          nodeType,
          name,
          path: getNodeCanonicalPath(node),
          value: val,
          outerXml: outer,
          line: loc?.line,
          column: loc?.column,
        };
      });

      return {
        success: true,
        engineUsed: 'xpath-1.0',
        returnTypeDetected: matches.length > 0 ? 'nodes' : 'empty',
        matches,
        totalMatches: matches.length,
        executionTimeMs: elapsed,
        namespacesDetected: detectedNamespaces,
        xpathExpression: xpath,
      };
    }

    default:
      return {
        success: true,
        engineUsed: 'xpath-1.0',
        returnTypeDetected: 'empty',
        matches: [],
        totalMatches: 0,
        executionTimeMs: elapsed,
        namespacesDetected: detectedNamespaces,
        xpathExpression: xpath,
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Real-world Presets & Sample Payloads for SAP Cloud Integration Developers
// ─────────────────────────────────────────────────────────────────────────────

export interface XPathPresetSample {
  id: string;
  title: string;
  description: string;
  xml: string;
  queries: {
    name: string;
    xpath: string;
    description: string;
    category: 'router' | 'splitter' | 'enricher' | 'general';
  }[];
}

export const XPATH_PRESET_SAMPLES: XPathPresetSample[] = [
  {
    id: 'sap-purchase-order',
    title: 'SAP Purchase Order (IDoc / ORDERS05)',
    description: 'Standard SAP Purchase Order IDoc payload with Header, Line Items, Pricing, and Partner Segments.',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<ORDERS05>
  <IDOC BEGIN="1">
    <EDI_DC40 SEGMENT="1">
      <TABNAM>EDI_DC40</TABNAM>
      <MANDT>100</MANDT>
      <DOCNUM>0000000004529104</DOCNUM>
      <DOCREL>750</DOCREL>
      <STATUS>30</STATUS>
      <DIRECT>1</DIRECT>
      <MESTYP>ORDERS</MESTYP>
      <SNDPRT>LS</SNDPRT>
      <SNDPRN>SAP_S4HANA</SNDPRN>
      <RCVPRT>LS</RCVPRT>
      <RCVPRN>CPI_HUB</RCVPRN>
      <CREDAT>20261019</CREDAT>
      <CRETIM>143000</CRETIM>
    </EDI_DC40>
    <E1EDK01 SEGMENT="1">
      <ACTION>000</ACTION>
      <KZABS>1</KZABS>
      <CURCY>EUR</CURCY>
      <BELNR>4500098120</BELNR>
      <RECIPNT_NO>100294</RECIPNT_NO>
    </E1EDK01>
    <E1EDKA1 SEGMENT="1">
      <PARVW>AG</PARVW>
      <PARTN>0001004820</PARTN>
      <NAME1>Acme Industrial Solutions</NAME1>
      <ORT01>Walldorf</ORT01>
      <LAND1>DE</LAND1>
    </E1EDKA1>
    <E1EDKA1 SEGMENT="1">
      <PARVW>WE</PARVW>
      <PARTN>0001004899</PARTN>
      <NAME1>ToolSAP Distribution Center</NAME1>
      <ORT01>Kolkata</ORT01>
      <LAND1>IN</LAND1>
    </E1EDKA1>
    <E1EDP01 SEGMENT="1">
      <POSEX>00010</POSEX>
      <ACTION>001</ACTION>
      <MENGE>25.000</MENGE>
      <MENEE>PCE</MENEE>
      <BMNG2>25.000</BMNG2>
      <PMENE>PCE</PMENE>
      <NETWR>1250.00</NETWR>
      <E1EDP19 SEGMENT="1">
        <QUALF>002</QUALF>
        <IDTNR>MAT-IND-0091</IDTNR>
        <KTEXT>Pressure Sensor Valve 1/2"</KTEXT>
      </E1EDP19>
    </E1EDP01>
    <E1EDP01 SEGMENT="1">
      <POSEX>00020</POSEX>
      <ACTION>001</ACTION>
      <MENGE>8.000</MENGE>
      <MENEE>PCE</MENEE>
      <BMNG2>8.000</BMNG2>
      <PMENE>PCE</PMENE>
      <NETWR>640.00</NETWR>
      <E1EDP19 SEGMENT="1">
        <QUALF>002</QUALF>
        <IDTNR>MAT-IND-0044</IDTNR>
        <KTEXT>Optical Flow Meter 24V</KTEXT>
      </E1EDP19>
    </E1EDP01>
    <E1EDS01 SEGMENT="1">
      <SUMID>002</SUMID>
      <SUMME>1890.00</SUMME>
      <SUNIT>EUR</SUNIT>
    </E1EDS01>
  </IDOC>
</ORDERS05>`,
    queries: [
      {
        name: 'Order Number (Content Modifier)',
        xpath: '//E1EDK01/BELNR/text()',
        description: 'Extracts the Purchase Order document number for routing or filename generation.',
        category: 'enricher',
      },
      {
        name: 'High Quantity Items (Router)',
        xpath: '//E1EDP01[number(MENGE) > 10]/E1EDP19/KTEXT',
        description: 'Selects item descriptions where ordered quantity exceeds 10.',
        category: 'router',
      },
      {
        name: 'Splitter Target (Iterating Splitter)',
        xpath: '//E1EDP01',
        description: 'XPath expression for SAP CPI General Splitter / Iterating Splitter step.',
        category: 'splitter',
      },
      {
        name: 'Total Items Count (Aggregator)',
        xpath: 'count(//E1EDP01)',
        description: 'Calculates the number of line items in the purchase order.',
        category: 'general',
      },
      {
        name: 'Sum of Item Values',
        xpath: 'sum(//E1EDP01/NETWR)',
        description: 'Computes total net value of all line items.',
        category: 'general',
      },
    ],
  },
  {
    id: 'multi-namespace-store',
    title: 'Multi-Namespace Product Catalog',
    description: 'E-commerce product catalog with multiple namespaces (default, meta, display) and rich attributes.',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<store xmlns="https://example.com/store"
       xmlns:meta="https://example.com/metadata"
       xmlns:display="https://example.com/display">

  <storeInfo>
    <name>TechZone Electronics</name>
    <location country="India" city="Kolkata"/>
    <meta:owner department="Engineering">ToolSAP</meta:owner>
    <established>2019</established>
  </storeInfo>

  <products>
    <product sku="PRD001" status="available" meta:source="warehouse">
      <name>Wireless Headphones</name>
      <description>Great sound with <display:emphasis style="bold">noise cancellation</display:emphasis> and <display:link href="https://example.com/headphones">product details</display:link>.</description>
      <price currency="INR">3499.50</price>
      <stock>45</stock>
      <tags>
        <tag>Audio</tag>
        <tag>Wireless</tag>
        <tag>Bluetooth</tag>
      </tags>
    </product>

    <product sku="PRD002" status="limited" meta:source="supplier">
      <name>USB-C Hub</name>
      <description>Compact <display:emphasis style="italic">7-in-1</display:emphasis> laptop adapter.</description>
      <price currency="INR">1299.00</price>
      <stock>8</stock>
      <tags>
        <tag>Accessories</tag>
        <tag>USB-C</tag>
      </tags>
    </product>

    <product sku="PRD003" status="discontinued" meta:source="archive">
      <name>VGA to HDMI Adapter</name>
      <price currency="INR">499.00</price>
      <stock>0</stock>
    </product>
  </products>
</store>`,
    queries: [
      {
        name: 'Available Products (Prefixed)',
        xpath: '//dft:product[@status="available"]/dft:name/text()',
        description: 'Selects names of available products using default namespace prefix "dft:".',
        category: 'router',
      },
      {
        name: 'Namespaced Attribute Filter',
        xpath: '//dft:product[@meta:source="warehouse"]',
        description: 'Finds products from warehouse source using meta: namespace prefix.',
        category: 'router',
      },
      {
        name: 'Embedded Display Elements',
        xpath: '//display:emphasis',
        description: 'Selects all emphasis markup elements across product descriptions.',
        category: 'enricher',
      },
      {
        name: 'Namespace-Agnostic Product Lookup',
        xpath: "/*[local-name()='store']/*[local-name()='products']/*[local-name()='product'][@status='limited']",
        description: 'Matches limited products without requiring any namespace declarations.',
        category: 'general',
      },
    ],
  },
  {
    id: 'soap-cpi-service',
    title: 'SOAP Web Service (CPI / S/4HANA)',
    description: 'SOAP 1.1 / 1.2 envelope with WS-Addressing Header and business customer query response.',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:wsa="http://www.w3.org/2005/08/addressing"
                  xmlns:cust="http://sap.com/xi/Customer/v1">
  <soapenv:Header>
    <wsa:MessageID>urn:uuid:7f3b890a-c112-4fe1-9981-d1092837bcde</wsa:MessageID>
    <wsa:Action>http://sap.com/xi/Customer/QueryCustomerIn</wsa:Action>
    <wsa:To>https://cpi.toolsap.internal/cxf/customer</wsa:To>
  </soapenv:Header>
  <soapenv:Body>
    <cust:CustomerQueryResponse>
      <cust:ResultCount>2</cust:ResultCount>
      <cust:Customer id="C-10020">
        <cust:Name>Arjun Sen</cust:Name>
        <cust:AccountStatus>Active</cust:AccountStatus>
        <cust:Balance currency="EUR">14250.75</cust:Balance>
        <cust:CountryCode>IN</cust:CountryCode>
      </cust:Customer>
      <cust:Customer id="C-10021">
        <cust:Name>Maria Schmidt</cust:Name>
        <cust:AccountStatus>Pending</cust:AccountStatus>
        <cust:Balance currency="EUR">850.00</cust:Balance>
        <cust:CountryCode>DE</cust:CountryCode>
      </cust:Customer>
    </cust:CustomerQueryResponse>
  </soapenv:Body>
</soapenv:Envelope>`,
    queries: [
      {
        name: 'Message ID (Header Extraction)',
        xpath: '//wsa:MessageID/text()',
        description: 'Extracts the unique WS-Addressing Message ID for tracking in CPI message logs.',
        category: 'enricher',
      },
      {
        name: 'Active Customers (Router)',
        xpath: '//cust:Customer[cust:AccountStatus = "Active"]',
        description: 'Filters for customer records with Active status.',
        category: 'router',
      },
      {
        name: 'Customers Splitter',
        xpath: '//soapenv:Body//cust:Customer',
        description: 'Expression to split each customer record in SAP CPI Splitter step.',
        category: 'splitter',
      },
      {
        name: 'High Balance Boolean Condition',
        xpath: 'boolean(//cust:Customer[number(cust:Balance) > 10000])',
        description: 'Returns boolean true/false for Router decision branch.',
        category: 'router',
      },
    ],
  },
];
