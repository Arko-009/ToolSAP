/**
 * Standards-Compliant W3C XML Schema (XSD 1.0) Generator
 * 100% Client-Side / Browser-Only Execution
 * Specially designed for SAP Cloud Integration (CPI), Integration Suite, IDocs, and SOAP Web Services.
 */

import * as prettier from 'prettier/standalone';
import xmlPlugin from '@prettier/plugin-xml';
import {
  validateXmlStructure,
  validateAgainstXsd,
  offsetToLineCol,
  generateSnippet,
  type XsdValidationResult,
} from './xmlValidator';

export interface XsdGeneratorOptions {
  /** Target XML Schema namespace prefix (default 'xs') */
  schemaPrefix?: string;
  /** Whether to format output with Prettier (default true) */
  formatOutput?: boolean;
}

export interface XsdGenerationMetrics {
  elementCount: number;
  attributeCount: number;
  complexTypeCount: number;
  simpleTypeCount: number;
  namespacesDetected: { prefix: string; uri: string }[];
  targetNamespace: string | null;
  executionTimeMs: number;
}

export interface XsdGenerationResult {
  success: boolean;
  xsd: string;
  schemaSet?: Record<
    string,
    {
      targetNamespace: string;
      prefix?: string;
      xsd: string;
      filename: string;
    }
  >;
  metrics?: XsdGenerationMetrics;
  validationResult?: XsdValidationResult;
  error?: {
    message: string;
    line?: number;
    column?: number;
    snippet?: string;
    code?: string;
    category?: string;
    suggestion?: string;
  };
}

/**
 * Infer XML Schema simple type from observed string value and element/attribute name.
 * Conservative and deterministic rules conforming to W3C XSD 1.0.
 */
export function inferSimpleType(
  value: string,
  elementOrAttrName = ''
): 'xs:string' | 'xs:integer' | 'xs:decimal' | 'xs:date' | 'xs:dateTime' | 'xs:time' | 'xs:boolean' | 'xs:anyURI' {
  const trimmed = value.trim();
  if (!trimmed) return 'xs:string';

  // 1. Check for identifier, postal, phone, or code patterns in name
  // Identifiers, postal codes, and phone numbers must NOT be coerced to numeric types
  const isIdentifierOrCodeName =
    /^(id|uuid|guid|code|postal|zip|phone|tel|fax|mobile|ssn|ein|iban|swift|bic|sku|ean|upc|account|tax|vat|serial|ref|reference)s?$/i.test(
      elementOrAttrName
    ) ||
    /(\b|_|-)(id|uuid|guid|code|postal|zip|phone|tel|fax|mobile|ssn|ein|iban|swift|bic|sku|ean|upc|account|tax|vat|serial|ref|reference)s?$/i.test(
      elementOrAttrName
    ) ||
    /[a-z](Id|Code|Postal|Zip|Phone|Ref|Guid|Uuid)$/.test(elementOrAttrName);

  if (isIdentifierOrCodeName) {
    if (trimmed === 'true' || trimmed === 'false') return 'xs:boolean';
    return 'xs:string';
  }

  // 2. Exact boolean check
  if (trimmed === 'true' || trimmed === 'false') {
    return 'xs:boolean';
  }

  // 3. Leading zero rule:
  // Numbers with leading zeros (e.g. "00123", "01") must NOT be treated as integers or decimals
  // to avoid losing significant leading zeroes in business documents (e.g. customer IDs, postal codes).
  if (/^0\d+$/.test(trimmed) || /^-0\d+$/.test(trimmed)) {
    return 'xs:string';
  }

  // 4. ISO 8601 Date: YYYY-MM-DD
  if (/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(trimmed)) {
    return 'xs:date';
  }

  // 5. ISO 8601 DateTime: YYYY-MM-DDTHH:mm:ss(Z|+/-HH:mm)
  if (
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)?$/.test(
      trimmed
    )
  ) {
    return 'xs:dateTime';
  }

  // 6. ISO 8601 Time: HH:mm:ss
  if (/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)?$/.test(trimmed)) {
    return 'xs:time';
  }

  // 7. Integer: 0 or non-zero starting integer
  if (/^-?(0|[1-9]\d*)$/.test(trimmed)) {
    return 'xs:integer';
  }

  // 8. Decimal: e.g. 42.75, 0.99, -15.5
  if (/^-?(0|[1-9]\d*)\.\d+$/.test(trimmed)) {
    return 'xs:decimal';
  }

  // 9. Standard URI
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed) && !trimmed.includes(' ')) {
    return 'xs:anyURI';
  }

  return 'xs:string';
}

/**
 * Merges two observed simple types according to the W3C XSD type lattice.
 * If conflicting, widens to a common parent type (ultimately xs:string).
 */
export function mergeSimpleTypes(t1: string, t2: string): string {
  if (!t1) return t2 || 'xs:string';
  if (!t2) return t1 || 'xs:string';
  if (t1 === t2) return t1;

  // Numeric hierarchy: integer widens to decimal
  const numericSet = new Set(['xs:integer', 'xs:decimal']);
  if (numericSet.has(t1) && numericSet.has(t2)) {
    return 'xs:decimal';
  }

  // In all other mismatch cases (e.g. integer vs string, date vs string, boolean vs string), fallback to xs:string
  return 'xs:string';
}

/**
 * Determines whether a given namespace URI is foreign relative to the current target namespace.
 */
export function isForeignNamespace(
  itemNs: string | null | undefined,
  currentTargetNs: string | null
): boolean {
  if (!itemNs) return false;
  if (itemNs === 'http://www.w3.org/2001/XMLSchema') return false;
  if (itemNs === 'http://www.w3.org/2001/XMLSchema-instance') return false;
  if (itemNs === 'http://www.w3.org/XML/1998/namespace') return false;
  if (!currentTargetNs) {
    // Current schema has no targetNamespace, so any element or attribute WITH a namespace URI is foreign
    return true;
  }
  return itemNs !== currentTargetNs;
}

/** Internal schema node representation for element tree analysis */
interface ElementAnalysisNode {
  name: string;
  localName: string;
  prefix: string | null;
  namespaceURI: string | null;
  isRoot: boolean;

  // Sibling children grouping & ordering
  childrenMap: Map<string, ElementAnalysisNode>;
  childrenOrder: string[];

  // Order variation and conflict tracking
  observedChildSequences: string[][];
  hasOrderConflict: boolean;
  hasAnyRepeatedChild: boolean;

  // Occurrence tracking
  maxOccurrencesInParent: number;
  totalInstancesObserved: number;
  parentInstancesPresentCount: number;

  // Attributes
  attributesMap: Map<
    string,
    {
      name: string;
      localName: string;
      prefix: string | null;
      namespaceURI: string | null;
      type: string;
      observedValues: string[];
      presenceCount: number;
    }
  >;

  // Text & content classification
  textValues: string[];
  hasChildElements: boolean;
  hasText: boolean;
  isMixed: boolean;
  isNillable: boolean;
}

/**
 * Creates an empty analysis node for an element
 */
function createAnalysisNode(
  localName: string,
  prefix: string | null,
  namespaceURI: string | null,
  isRoot = false
): ElementAnalysisNode {
  return {
    name: prefix ? `${prefix}:${localName}` : localName,
    localName,
    prefix,
    namespaceURI,
    isRoot,
    childrenMap: new Map(),
    childrenOrder: [],
    observedChildSequences: [],
    hasOrderConflict: false,
    hasAnyRepeatedChild: false,
    maxOccurrencesInParent: 1,
    totalInstancesObserved: 0,
    parentInstancesPresentCount: 0,
    attributesMap: new Map(),
    textValues: [],
    hasChildElements: false,
    hasText: false,
    isMixed: false,
    isNillable: false,
  };
}

/**
 * Detects whether observed child element sequences contain order conflicts (cycles / non-contiguous repeats),
 * or whether a consistent topological sequence exists across all observed parent instances.
 */
function resolveChildOrderAndCompositor(node: ElementAnalysisNode): {
  hasConflict: boolean;
  hasRepeated: boolean;
  order: string[];
} {
  const allKeys = Array.from(node.childrenMap.keys());
  const hasRepeated = Array.from(node.childrenMap.values()).some((c) => c.maxOccurrencesInParent > 1);

  if (allKeys.length <= 1) {
    return {
      hasConflict: false,
      hasRepeated,
      order: allKeys,
    };
  }

  // Check if any child occurred non-contiguously in a single sequence: e.g. [A, B, A]
  for (const seq of node.observedChildSequences) {
    const seenIndices = new Map<string, number>();
    for (let i = 0; i < seq.length; i++) {
      const key = seq[i];
      if (seenIndices.has(key)) {
        const lastIdx = seenIndices.get(key)!;
        if (i > lastIdx + 1) {
          // Key appeared, then another key, then this key again
          return { hasConflict: true, hasRepeated: true, order: allKeys };
        }
      }
      seenIndices.set(key, i);
    }
  }

  // Build directed graph of precedence: edge A -> B means A appeared before B
  const adj = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();

  for (const k of allKeys) {
    adj.set(k, new Set());
    inDegree.set(k, 0);
  }

  for (const seq of node.observedChildSequences) {
    for (let i = 0; i < seq.length; i++) {
      for (let j = i + 1; j < seq.length; j++) {
        const u = seq[i];
        const v = seq[j];
        if (u !== v) {
          // If v -> u already exists, we have an immediate cycle / conflict
          if (adj.get(v)?.has(u)) {
            return { hasConflict: true, hasRepeated, order: allKeys };
          }
          if (!adj.get(u)!.has(v)) {
            adj.get(u)!.add(v);
          }
        }
      }
    }
  }

  // Recompute in-degrees
  for (const [, neighbors] of adj) {
    for (const v of neighbors) {
      inDegree.set(v, (inDegree.get(v) || 0) + 1);
    }
  }

  // Kahn's algorithm for topological sort
  const queue: string[] = [];
  for (const k of allKeys) {
    if (inDegree.get(k) === 0) {
      queue.push(k);
    }
  }

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    topologicalOrder.push(u);

    for (const v of adj.get(u) || []) {
      const newDeg = (inDegree.get(v) || 0) - 1;
      inDegree.set(v, newDeg);
      if (newDeg === 0) {
        queue.push(v);
      }
    }
  }

  if (topologicalOrder.length === allKeys.length) {
    return {
      hasConflict: false,
      hasRepeated,
      order: topologicalOrder,
    };
  }

  // Cycle detected in directed graph
  return {
    hasConflict: true,
    hasRepeated,
    order: allKeys,
  };
}

/**
 * Recursively resolves child order, detects order conflicts, and chooses compositors for each node.
 */
function finalizeNodeAnalysis(node: ElementAnalysisNode): void {
  if (node.hasChildElements) {
    const res = resolveChildOrderAndCompositor(node);
    node.hasOrderConflict = res.hasConflict;
    node.hasAnyRepeatedChild = res.hasRepeated;
    node.childrenOrder = res.order;
  }
  for (const [, child] of node.childrenMap) {
    finalizeNodeAnalysis(child);
  }
}

/**
 * Recursively analyzes an XML DOM Element and merges it into the schema analysis tree.
 */
function analyzeElement(
  xmlEl: Element,
  node: ElementAnalysisNode
): void {
  node.totalInstancesObserved++;

  // 1. Analyze attributes (filter xmlns and xsi metadata)
  const attrs = Array.from(xmlEl.attributes);
  for (const attr of attrs) {
    const attrName = attr.name;
    const attrValue = attr.value;

    // Filter XML namespace declarations
    if (attrName === 'xmlns' || attrName.startsWith('xmlns:')) {
      continue;
    }

    // Filter XML Schema Instance metadata
    if (attrName.startsWith('xsi:')) {
      if (attrName === 'xsi:nil' && attrValue === 'true') {
        node.isNillable = true;
      }
      continue;
    }

    const attrLocal = attr.localName || attrName.split(':').pop() || attrName;
    const attrPrefix = attr.prefix || (attrName.includes(':') ? attrName.split(':')[0] : null);
    const attrNs = attr.namespaceURI || (attrPrefix ? xmlEl.lookupNamespaceURI(attrPrefix) : null);
    const attrKey = attrPrefix ? `${attrPrefix}:${attrLocal}` : attrLocal;

    const existingAttr = node.attributesMap.get(attrKey);
    const inferredType = inferSimpleType(attrValue, attrLocal);

    if (existingAttr) {
      existingAttr.presenceCount++;
      existingAttr.observedValues.push(attrValue);
      existingAttr.type = mergeSimpleTypes(existingAttr.type, inferredType);
    } else {
      node.attributesMap.set(attrKey, {
        name: attrKey,
        localName: attrLocal,
        prefix: attrPrefix,
        namespaceURI: attrNs,
        type: inferredType,
        observedValues: [attrValue],
        presenceCount: 1,
      });
    }
  }

  // 2. Inspect child nodes for text and elements
  const childElements: Element[] = [];
  let nonWhitespaceText = '';

  for (const childNode of Array.from(xmlEl.childNodes)) {
    if (childNode.nodeType === 1 /* ELEMENT_NODE */) {
      childElements.push(childNode as Element);
    } else if (childNode.nodeType === 3 /* TEXT_NODE */ || childNode.nodeType === 4 /* CDATA_SECTION_NODE */) {
      const text = childNode.nodeValue || '';
      if (text.trim()) {
        nonWhitespaceText += text.trim();
      }
    }
  }

  if (nonWhitespaceText) {
    node.hasText = true;
    node.textValues.push(nonWhitespaceText);
  }

  if (childElements.length > 0) {
    node.hasChildElements = true;
  }

  if (node.hasChildElements && node.hasText) {
    node.isMixed = true;
  }

  // 3. Analyze child elements and track occurrences among siblings
  const siblingCounts = new Map<string, number>();
  const instanceChildKeys: string[] = [];
  const seenInThisInstance = new Set<string>();

  for (const childEl of childElements) {
    const childLocal = childEl.localName || childEl.nodeName.split(':').pop() || childEl.nodeName;
    const childPrefix = childEl.prefix || (childEl.nodeName.includes(':') ? childEl.nodeName.split(':')[0] : null);
    const childNs = childEl.namespaceURI || (childPrefix ? childEl.lookupNamespaceURI(childPrefix) : null);
    const childKey = childPrefix ? `${childPrefix}:${childLocal}` : childLocal;

    instanceChildKeys.push(childKey);

    // Track sibling repetition count
    const currentCount = (siblingCounts.get(childKey) || 0) + 1;
    siblingCounts.set(childKey, currentCount);

    let childNode = node.childrenMap.get(childKey);
    if (!childNode) {
      childNode = createAnalysisNode(childLocal, childPrefix, childNs, false);
      node.childrenMap.set(childKey, childNode);
    }

    if (!seenInThisInstance.has(childKey)) {
      seenInThisInstance.add(childKey);
      childNode.parentInstancesPresentCount++;
    }

    // Update max occurrences in single parent
    if (currentCount > childNode.maxOccurrencesInParent) {
      childNode.maxOccurrencesInParent = currentCount;
    }

    // Recursively analyze child element
    analyzeElement(childEl, childNode);
  }

  if (instanceChildKeys.length > 0) {
    node.observedChildSequences.push(instanceChildKeys);
  }
}

/**
 * Escapes XML attribute values
 */
function escapeXmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Builds the XSD markup from the analyzed node tree.
 */
function buildNodeXsd(
  node: ElementAnalysisNode,
  schemaPrefix: string,
  currentTargetNs: string | null,
  indent = '  ',
  isTopLevelDeclaration = false,
  parentCompositorKind: 'sequence' | 'all' | 'choice' = 'sequence',
  parentInstancesCount = 1
): { xsd: string; complexCount: number; simpleCount: number; elementCount: number; attrCount: number } {
  let complexCount = 0;
  let simpleCount = 0;
  let elementCount = 1;
  let attrCount = node.attributesMap.size;

  const sp = schemaPrefix ? `${schemaPrefix}:` : '';
  const nextIndent = indent + '  ';
  const innerIndent = nextIndent + '  ';

  // Determine occurrences for non-root elements
  let occAttrs = '';
  if (!node.isRoot && !isTopLevelDeclaration) {
    if (parentCompositorKind === 'all') {
      const isReq = parentInstancesCount > 0 && node.parentInstancesPresentCount === parentInstancesCount;
      occAttrs = isReq ? ' minOccurs="1"' : ' minOccurs="0"';
    } else if (parentCompositorKind === 'choice') {
      const maxOcc = node.maxOccurrencesInParent > 1 ? ' maxOccurs="unbounded"' : '';
      occAttrs = ` minOccurs="0"${maxOcc}`;
    } else {
      const isReq = parentInstancesCount > 0 && node.parentInstancesPresentCount === parentInstancesCount;
      const minOcc = isReq ? ' minOccurs="1"' : ' minOccurs="0"';
      const maxOcc = node.maxOccurrencesInParent > 1 ? ' maxOccurs="unbounded"' : '';
      occAttrs = `${minOcc}${maxOcc}`;
    }
  }

  const nillableAttr = node.isNillable ? ' nillable="true"' : '';

  // Determine element type structure
  if (node.hasChildElements) {
    // Case A: Complex Type with child sequence, all, or choice
    complexCount++;
    const mixedAttr = node.isMixed ? ' mixed="true"' : '';
    let childrenXml = '';

    let compositorKind: 'sequence' | 'all' | 'choice' = 'sequence';
    if (node.hasOrderConflict) {
      if (node.hasAnyRepeatedChild) {
        compositorKind = 'choice';
      } else {
        compositorKind = 'all';
      }
    }

    const compOpen =
      compositorKind === 'all'
        ? `${nextIndent}  <${sp}all>\n`
        : compositorKind === 'choice'
        ? `${nextIndent}  <${sp}choice minOccurs="0" maxOccurs="unbounded">\n`
        : `${nextIndent}  <${sp}sequence>\n`;

    const compClose =
      compositorKind === 'all'
        ? `${nextIndent}  </${sp}all>\n`
        : compositorKind === 'choice'
        ? `${nextIndent}  </${sp}choice>\n`
        : `${nextIndent}  </${sp}sequence>\n`;

    for (const childKey of node.childrenOrder) {
      const childNode = node.childrenMap.get(childKey);
      if (childNode) {
        const isForeignEl = isForeignNamespace(childNode.namespaceURI, currentTargetNs);
        if (isForeignEl) {
          const qName = childNode.prefix ? `${childNode.prefix}:${childNode.localName}` : childNode.localName;
          let occ = '';
          if (compositorKind === 'all') {
            const isReq = node.totalInstancesObserved > 0 && childNode.parentInstancesPresentCount === node.totalInstancesObserved;
            occ = isReq ? ' minOccurs="1"' : ' minOccurs="0"';
          } else if (compositorKind === 'choice') {
            const maxOcc = childNode.maxOccurrencesInParent > 1 ? ' maxOccurs="unbounded"' : '';
            occ = ` minOccurs="0"${maxOcc}`;
          } else {
            const isReq = node.totalInstancesObserved > 0 && childNode.parentInstancesPresentCount === node.totalInstancesObserved;
            const minOcc = isReq ? ' minOccurs="1"' : ' minOccurs="0"';
            const maxOcc = childNode.maxOccurrencesInParent > 1 ? ' maxOccurs="unbounded"' : '';
            occ = `${minOcc}${maxOcc}`;
          }
          const nillable = childNode.isNillable ? ' nillable="true"' : '';
          childrenXml += `${innerIndent}<${sp}element ref="${escapeXmlAttr(qName)}"${occ}${nillable} />\n`;
          elementCount++;
        } else {
          const res = buildNodeXsd(
            childNode,
            schemaPrefix,
            currentTargetNs,
            innerIndent,
            false,
            compositorKind,
            node.totalInstancesObserved
          );
          childrenXml += res.xsd;
          complexCount += res.complexCount;
          simpleCount += res.simpleCount;
          elementCount += res.elementCount;
          attrCount += res.attrCount;
        }
      }
    }

    let attrsXml = '';
    for (const [, attr] of node.attributesMap) {
      const isForeignAttr = isForeignNamespace(attr.namespaceURI, currentTargetNs);
      const isRequired = node.totalInstancesObserved > 0 && attr.presenceCount === node.totalInstancesObserved;
      const useAttr = isRequired ? 'use="required"' : 'use="optional"';

      if (attr.prefix === 'xml') {
        attrsXml += `${innerIndent}<${sp}attribute ref="xml:${escapeXmlAttr(attr.localName)}" ${useAttr} />\n`;
      } else if (isForeignAttr) {
        const qName = attr.prefix ? `${attr.prefix}:${attr.localName}` : attr.localName;
        attrsXml += `${innerIndent}<${sp}attribute ref="${escapeXmlAttr(qName)}" ${useAttr} />\n`;
      } else {
        attrsXml += `${innerIndent}<${sp}attribute name="${escapeXmlAttr(attr.localName)}" type="${attr.type}" ${useAttr} />\n`;
      }
    }

    const xsd =
      `${indent}<${sp}element name="${escapeXmlAttr(node.localName)}"${occAttrs}${nillableAttr}>\n` +
      `${nextIndent}<${sp}complexType${mixedAttr}>\n` +
      compOpen +
      childrenXml +
      compClose +
      attrsXml +
      `${nextIndent}</${sp}complexType>\n` +
      `${indent}</${sp}element>\n`;

    return { xsd, complexCount, simpleCount, elementCount, attrCount };
  } else if (node.attributesMap.size > 0 && node.hasText) {
    // Case B: Element with text AND attributes -> complexType with simpleContent extension
    complexCount++;
    simpleCount++;
    let inferredBase = '';
    for (const val of node.textValues) {
      const t = inferSimpleType(val, node.localName);
      inferredBase = inferredBase ? mergeSimpleTypes(inferredBase, t) : t;
    }
    if (!inferredBase) inferredBase = 'xs:string';

    let attrsXml = '';
    for (const [, attr] of node.attributesMap) {
      const isForeignAttr = isForeignNamespace(attr.namespaceURI, currentTargetNs);
      const isRequired = node.totalInstancesObserved > 0 && attr.presenceCount === node.totalInstancesObserved;
      const useAttr = isRequired ? 'use="required"' : 'use="optional"';

      if (attr.prefix === 'xml') {
        attrsXml += `${innerIndent}  <${sp}attribute ref="xml:${escapeXmlAttr(attr.localName)}" ${useAttr} />\n`;
      } else if (isForeignAttr) {
        const qName = attr.prefix ? `${attr.prefix}:${attr.localName}` : attr.localName;
        attrsXml += `${innerIndent}  <${sp}attribute ref="${escapeXmlAttr(qName)}" ${useAttr} />\n`;
      } else {
        attrsXml += `${innerIndent}  <${sp}attribute name="${escapeXmlAttr(attr.localName)}" type="${attr.type}" ${useAttr} />\n`;
      }
    }

    const xsd =
      `${indent}<${sp}element name="${escapeXmlAttr(node.localName)}"${occAttrs}${nillableAttr}>\n` +
      `${nextIndent}<${sp}complexType>\n` +
      `${nextIndent}  <${sp}simpleContent>\n` +
      `${nextIndent}    <${sp}extension base="${inferredBase}">\n` +
      attrsXml +
      `${nextIndent}    </${sp}extension>\n` +
      `${nextIndent}  </${sp}simpleContent>\n` +
      `${nextIndent}</${sp}complexType>\n` +
      `${indent}</${sp}element>\n`;

    return { xsd, complexCount, simpleCount, elementCount, attrCount };
  } else if (node.attributesMap.size > 0) {
    // Case C: Element with attributes but no child elements and no text
    complexCount++;
    let attrsXml = '';
    for (const [, attr] of node.attributesMap) {
      const isForeignAttr = isForeignNamespace(attr.namespaceURI, currentTargetNs);
      const isRequired = node.totalInstancesObserved > 0 && attr.presenceCount === node.totalInstancesObserved;
      const useAttr = isRequired ? 'use="required"' : 'use="optional"';

      if (attr.prefix === 'xml') {
        attrsXml += `${innerIndent}<${sp}attribute ref="xml:${escapeXmlAttr(attr.localName)}" ${useAttr} />\n`;
      } else if (isForeignAttr) {
        const qName = attr.prefix ? `${attr.prefix}:${attr.localName}` : attr.localName;
        attrsXml += `${innerIndent}<${sp}attribute ref="${escapeXmlAttr(qName)}" ${useAttr} />\n`;
      } else {
        attrsXml += `${innerIndent}<${sp}attribute name="${escapeXmlAttr(attr.localName)}" type="${attr.type}" ${useAttr} />\n`;
      }
    }

    const xsd =
      `${indent}<${sp}element name="${escapeXmlAttr(node.localName)}"${occAttrs}${nillableAttr}>\n` +
      `${nextIndent}<${sp}complexType>\n` +
      attrsXml +
      `${nextIndent}</${sp}complexType>\n` +
      `${indent}</${sp}element>\n`;

    return { xsd, complexCount, simpleCount, elementCount, attrCount };
  } else {
    // Case D: Simple element with text only or empty
    simpleCount++;
    let inferredType = '';
    if (node.hasText && node.textValues.length > 0) {
      for (const val of node.textValues) {
        const t = inferSimpleType(val, node.localName);
        inferredType = inferredType ? mergeSimpleTypes(inferredType, t) : t;
      }
    }
    if (!inferredType) inferredType = 'xs:string';

    const xsd = `${indent}<${sp}element name="${escapeXmlAttr(node.localName)}" type="${inferredType}"${occAttrs}${nillableAttr} />\n`;
    return { xsd, complexCount, simpleCount, elementCount, attrCount };
  }
}

/**
 * Collects all namespace declarations present across all elements in the XML document.
 */
function collectDocumentNamespaces(xmlDoc: Document): { prefix: string; uri: string }[] {
  const namespaces: { prefix: string; uri: string }[] = [];
  const seenUris = new Set<string>();

  function walk(el: Element) {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name === 'xmlns') {
        const uri = attr.value.trim();
        if (uri && !seenUris.has(uri)) {
          seenUris.add(uri);
          namespaces.push({ prefix: '', uri });
        }
      } else if (attr.name.startsWith('xmlns:')) {
        const prefix = attr.name.substring(6);
        const uri = attr.value.trim();
        if (uri && !seenUris.has(uri) && prefix !== 'xs' && prefix !== 'xsd') {
          seenUris.add(uri);
          namespaces.push({ prefix, uri });
        }
      }
    }

    if (el.namespaceURI && !seenUris.has(el.namespaceURI)) {
      seenUris.add(el.namespaceURI);
      const prefix = el.prefix || '';
      namespaces.push({ prefix, uri: el.namespaceURI });
    }

    for (const child of Array.from(el.children)) {
      walk(child);
    }
  }

  if (xmlDoc.documentElement) {
    walk(xmlDoc.documentElement);
  }

  return namespaces;
}

/**
 * Recursively collects foreign namespace element nodes and attributes across the analysis tree.
 */
function collectForeignDeclarations(
  node: ElementAnalysisNode,
  rootNsUri: string | null,
  foreignElements: Map<string, Map<string, ElementAnalysisNode>>,
  foreignAttributes: Map<
    string,
    Map<string, { name: string; localName: string; prefix: string | null; namespaceURI: string | null; type: string }>
  >,
  parentNsUri: string | null = rootNsUri
): void {
  if (node.namespaceURI && isForeignNamespace(node.namespaceURI, rootNsUri)) {
    if (parentNsUri !== node.namespaceURI) {
      let elMap = foreignElements.get(node.namespaceURI);
      if (!elMap) {
        elMap = new Map();
        foreignElements.set(node.namespaceURI, elMap);
      }
      if (!elMap.has(node.localName)) {
        elMap.set(node.localName, node);
      }
    }
  }

  for (const [, attr] of node.attributesMap) {
    if (attr.namespaceURI && isForeignNamespace(attr.namespaceURI, rootNsUri)) {
      let attrMap = foreignAttributes.get(attr.namespaceURI);
      if (!attrMap) {
        attrMap = new Map();
        foreignAttributes.set(attr.namespaceURI, attrMap);
      }
      if (!attrMap.has(attr.localName)) {
        attrMap.set(attr.localName, attr);
      }
    }
  }

  for (const [, childNode] of node.childrenMap) {
    collectForeignDeclarations(childNode, rootNsUri, foreignElements, foreignAttributes, node.namespaceURI);
  }
}

/**
 * Builds companion schemas for each foreign namespace for multi-schema generation.
 */
async function buildCompanionSchemas(
  rootAnalysis: ElementAnalysisNode,
  rootNsUri: string | null,
  foreignNamespaces: { prefix: string; uri: string }[],
  schemaPrefix: string,
  formatOutput: boolean
): Promise<Record<string, { targetNamespace: string; prefix?: string; xsd: string; filename: string }>> {
  const schemaSet: Record<string, { targetNamespace: string; prefix?: string; xsd: string; filename: string }> = {};
  if (foreignNamespaces.length === 0) return schemaSet;

  const foreignElements = new Map<string, Map<string, ElementAnalysisNode>>();
  const foreignAttributes = new Map<
    string,
    Map<string, { name: string; localName: string; prefix: string | null; namespaceURI: string | null; type: string }>
  >();

  collectForeignDeclarations(rootAnalysis, rootNsUri, foreignElements, foreignAttributes);

  const sp = schemaPrefix ? `${schemaPrefix}:` : '';

  for (const ns of foreignNamespaces) {
    const elMap = foreignElements.get(ns.uri) || new Map();
    const attrMap = foreignAttributes.get(ns.uri) || new Map();

    let body = '';

    for (const [, elNode] of elMap) {
      const res = buildNodeXsd(elNode, schemaPrefix, ns.uri, '  ', true);
      body += res.xsd;
    }

    for (const [, attr] of attrMap) {
      body += `  <${sp}attribute name="${escapeXmlAttr(attr.localName)}" type="${attr.type}" />\n`;
    }

    const schemaTag = `<${sp}schema xmlns:${schemaPrefix}="http://www.w3.org/2001/XMLSchema"\n  targetNamespace="${escapeXmlAttr(ns.uri)}"\n  xmlns="${escapeXmlAttr(ns.uri)}"\n  elementFormDefault="qualified">\n`;

    const raw = `<?xml version="1.0" encoding="UTF-8"?>\n${schemaTag}${body}</${sp}schema>`;
    let formatted = raw;
    if (formatOutput) {
      try {
        formatted = await prettier.format(raw, {
          parser: 'xml',
          plugins: [xmlPlugin],
          tabWidth: 2,
          useTabs: false,
          xmlWhitespaceSensitivity: 'ignore',
          xmlQuoteAttributes: 'double',
          xmlSelfClosingSpace: true,
        });
      } catch {
        formatted = raw;
      }
    }

    schemaSet[ns.uri] = {
      targetNamespace: ns.uri,
      prefix: ns.prefix,
      xsd: formatted,
      filename: `${ns.prefix || 'schema'}.xsd`,
    };
  }

  return schemaSet;
}

/**
 * Main function: Generates a complete W3C XML Schema 1.0 (XSD) from an input XML document.
 * Includes schema compilation and roundtrip validation against the input XML.
 */
export async function generateXsdFromXml(
  xml: string,
  options: XsdGeneratorOptions = {}
): Promise<XsdGenerationResult> {
  const startTime = performance.now();
  const schemaPrefix = options.schemaPrefix ?? 'xs';
  const formatOutput = options.formatOutput ?? true;

  // 1. Guard against empty / whitespace-only input
  const cleanXml = (xml || '').trim();
  if (!cleanXml) {
    return {
      success: false,
      xsd: '',
      error: {
        message: 'XML input is empty. Please paste or upload an XML document.',
        code: 'ERR_EMPTY_INPUT',
        category: 'well-formedness',
        suggestion: 'Paste a valid XML payload or use the "Load Sample" button to test.',
      },
    };
  }

  // 2. Validate input XML structure and well-formedness
  const initialValidation = validateXmlStructure(cleanXml);
  if (!initialValidation.isValid) {
    const firstError = initialValidation.errors[0];
    return {
      success: false,
      xsd: '',
      error: {
        message: firstError?.message || 'XML is not well-formed.',
        line: firstError?.line,
        column: firstError?.column,
        snippet: firstError?.snippet,
        code: firstError?.code || 'ERR_MALFORMED_XML',
        category: firstError?.category || 'well-formedness',
        suggestion: firstError?.suggestion || 'Ensure all opening tags have matching closing tags and attributes are quoted.',
      },
    };
  }

  // 3. Parse XML using native DOMParser or xmldom fallback
  let parser: DOMParser;
  if (typeof DOMParser !== 'undefined') {
    parser = new DOMParser();
  } else {
    const { DOMParser: XmldomParser } = await import('@xmldom/xmldom');
    parser = new XmldomParser({ onError: () => {} }) as unknown as DOMParser;
  }
  const xmlDoc = parser.parseFromString(cleanXml, 'application/xml');

  // Check for parsererror
  const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
  if (parserError) {
    const errText = parserError.textContent || 'XML Parser Error';
    const loc = offsetToLineCol(cleanXml, 0);
    return {
      success: false,
      xsd: '',
      error: {
        message: errText.split('\n')[0].replace(/^error on line \d+ at column \d+:\s*/i, ''),
        line: loc.line,
        column: loc.column,
        snippet: generateSnippet(cleanXml, loc.line, loc.column),
        code: 'ERR_PARSER_ERROR',
        category: 'well-formedness',
        suggestion: 'Fix syntax errors before generating schema.',
      },
    };
  }

  const rootEl = xmlDoc.documentElement;
  if (!rootEl) {
    return {
      success: false,
      xsd: '',
      error: {
        message: 'No root element found in XML document.',
        code: 'ERR_NO_ROOT',
        category: 'no-root',
        suggestion: 'An XML document must have exactly one root element enclosing all content.',
      },
    };
  }

  // 4. Identify Target Namespace and Element Form Default
  const rootNsUri = rootEl.namespaceURI || rootEl.getAttribute('xmlns') || null;
  const rootLocalName = rootEl.localName || rootEl.nodeName.split(':').pop() || rootEl.nodeName;
  const rootPrefix = rootEl.prefix || (rootEl.nodeName.includes(':') ? rootEl.nodeName.split(':')[0] : null);

  const documentNamespaces = collectDocumentNamespaces(xmlDoc);

  // 5. Construct Analysis Tree and resolve ordering
  const rootAnalysis = createAnalysisNode(rootLocalName, rootPrefix, rootNsUri, true);
  analyzeElement(rootEl, rootAnalysis);
  finalizeNodeAnalysis(rootAnalysis);

  // 6. Build <xs:schema> Root and Namespace Declarations
  const sp = schemaPrefix ? `${schemaPrefix}:` : '';
  let schemaTag = `<${sp}schema xmlns:${schemaPrefix}="http://www.w3.org/2001/XMLSchema"`;

  if (rootNsUri) {
    schemaTag += `\n  targetNamespace="${escapeXmlAttr(rootNsUri)}"`;
    if (rootPrefix) {
      schemaTag += `\n  xmlns:${rootPrefix}="${escapeXmlAttr(rootNsUri)}"`;
    }
    schemaTag += `\n  xmlns="${escapeXmlAttr(rootNsUri)}"`;
    schemaTag += `\n  elementFormDefault="qualified"`;
  }

  // Declare other namespaces found in document
  for (const ns of documentNamespaces) {
    if (ns.uri && ns.uri !== rootNsUri && ns.uri !== 'http://www.w3.org/2001/XMLSchema') {
      if (ns.prefix) {
        schemaTag += `\n  xmlns:${ns.prefix}="${escapeXmlAttr(ns.uri)}"`;
      }
    }
  }

  schemaTag += '>\n';

  // Imports for foreign namespaces
  const foreignNamespaces = documentNamespaces.filter(
    (ns) =>
      ns.uri &&
      ns.uri !== rootNsUri &&
      ns.uri !== 'http://www.w3.org/2001/XMLSchema' &&
      ns.uri !== 'http://www.w3.org/2001/XMLSchema-instance' &&
      ns.uri !== 'http://www.w3.org/XML/1998/namespace'
  );

  let importsXml = '';
  // Built-in W3C xml namespace (xml:lang, xml:base, etc.)
  const usesXmlNamespace = documentNamespaces.some(
    (ns) => ns.prefix === 'xml' || ns.uri === 'http://www.w3.org/XML/1998/namespace'
  );
  if (usesXmlNamespace) {
    importsXml += `  <${sp}import namespace="http://www.w3.org/XML/1998/namespace" />\n`;
  }

  for (const ns of foreignNamespaces) {
    const filename = `${ns.prefix || 'schema'}.xsd`;
    importsXml += `  <${sp}import namespace="${escapeXmlAttr(ns.uri)}" schemaLocation="${escapeXmlAttr(filename)}" />\n`;
  }

  // 7. Generate Schema Body
  const bodyResult = buildNodeXsd(rootAnalysis, schemaPrefix, rootNsUri, '  ');
  const rawXsd = `<?xml version="1.0" encoding="UTF-8"?>\n${schemaTag}${importsXml}${bodyResult.xsd}</${sp}schema>`;

  // Build companion schemas for foreign namespaces
  const schemaSet = await buildCompanionSchemas(
    rootAnalysis,
    rootNsUri,
    foreignNamespaces,
    schemaPrefix,
    formatOutput
  );

  // 8. Format XSD with Prettier XML plugin
  let finalXsd = rawXsd;
  if (formatOutput) {
    try {
      finalXsd = await prettier.format(rawXsd, {
        parser: 'xml',
        plugins: [xmlPlugin],
        tabWidth: 2,
        useTabs: false,
        xmlWhitespaceSensitivity: 'ignore',
        xmlQuoteAttributes: 'double',
        xmlSelfClosingSpace: true,
      });
    } catch {
      // If Prettier fails for any reason, keep clean rawXsd
      finalXsd = rawXsd;
    }
  }

  // 9. Mandatory Post-Generation Verification
  // Check XSD well-formedness and compile schema
  const xsdDoc = parser.parseFromString(finalXsd, 'application/xml');
  const xsdParserError = xsdDoc.getElementsByTagName('parsererror')[0];
  if (xsdParserError) {
    return {
      success: false,
      xsd: finalXsd,
      error: {
        message: 'Generated XSD schema failed XML well-formedness check.',
        code: 'ERR_XSD_MALFORMED',
        category: 'xsd',
        suggestion: 'The schema generator produced malformed XML. Please verify input characters.',
      },
    };
  }

  // Validate the original input XML against the generated schema
  const validationResult = validateAgainstXsd(cleanXml, finalXsd, schemaSet);
  if (!validationResult.isValid) {
    const err = validationResult.errors[0];
    return {
      success: false,
      xsd: finalXsd,
      schemaSet,
      validationResult,
      error: {
        message: `Schema verification failed: ${err?.message || 'Generated schema failed to validate original XML.'}`,
        line: err?.line,
        column: err?.column,
        code: err?.code || 'ERR_ROUNDTRIP_VALIDATION_FAILED',
        category: err?.category || 'schema-violation',
        suggestion: err?.suggestion || 'Review the XML input structure.',
      },
    };
  }

  const executionTimeMs = Math.round(performance.now() - startTime);

  const metrics: XsdGenerationMetrics = {
    elementCount: bodyResult.elementCount,
    attributeCount: bodyResult.attrCount,
    complexTypeCount: bodyResult.complexCount,
    simpleTypeCount: bodyResult.simpleCount,
    namespacesDetected: documentNamespaces,
    targetNamespace: rootNsUri,
    executionTimeMs,
  };

  return {
    success: true,
    xsd: finalXsd,
    schemaSet,
    metrics,
    validationResult,
  };
}

/** Sample SAP Purchase Order XML for user convenience */
export const SAMPLE_SAP_PURCHASE_ORDER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<PurchaseOrder xmlns="http://sap.com/xi/PurchaseOrder" orderId="PO-98234" orderDate="2026-10-13">
  <Header>
    <OrderNumber>4500019283</OrderNumber>
    <CompanyCode>1000</CompanyCode>
    <PurchasingOrg>1000</PurchasingOrg>
    <Vendor id="V-10029">
      <Name>Global Technology Suppliers GmbH</Name>
      <Country>DE</Country>
      <PostalCode>80333</PostalCode>
      <City>Munich</City>
    </Vendor>
    <PaymentTerms>NT30</PaymentTerms>
  </Header>
  <Items>
    <Item itemNumber="10">
      <MaterialCode>MAT-40291</MaterialCode>
      <Description>High-Speed Industrial Optical Sensor</Description>
      <Quantity>25</Quantity>
      <UnitOfMeasure>EA</UnitOfMeasure>
      <NetPrice currency="EUR">142.50</NetPrice>
      <DeliveryDate>2026-11-01</DeliveryDate>
      <IsActive>true</IsActive>
    </Item>
    <Item itemNumber="20">
      <MaterialCode>MAT-88102</MaterialCode>
      <Description>Thermal Protective Housing Cable Mount</Description>
      <Quantity>50</Quantity>
      <UnitOfMeasure>EA</UnitOfMeasure>
      <NetPrice currency="EUR">18.75</NetPrice>
      <DeliveryDate>2026-11-05</DeliveryDate>
      <DiscountRate>0.05</DiscountRate>
      <IsActive>true</IsActive>
    </Item>
  </Items>
  <Summary>
    <TotalLines>2</TotalLines>
    <TotalNetValue currency="EUR">4475.00</TotalNetValue>
  </Summary>
</PurchaseOrder>`;
