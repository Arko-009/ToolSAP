/**
 * ToolSAP Intelligent XSLT Generator Engine
 * Automatically generates production-grade, standards-compliant XSLT (1.0, 2.0, 3.0)
 * from Source XML and Target XML samples with repetition detection and semantic mapping.
 */

import { validateXmlStructure } from '../xml/xmlValidator';
import { formatXml } from '../xml/xmlFormatter';
import { executeXsltTransform } from './xsltEngine';

export interface XsltGeneratorOptions {
  xsltVersion?: '1.0' | '2.0' | '3.0';
  indent?: boolean;
  omitXmlDeclaration?: boolean;
  useAttributeValueTemplates?: boolean;
  generateComments?: boolean;
}

export interface InferredFieldMapping {
  targetPath: string;
  targetName: string;
  sourcePath: string;
  sourceName: string;
  confidence: number; // 0 to 1
  isAttribute: boolean;
  sourceIsAttribute?: boolean;
  matchType: 'exact-name' | 'exact-value' | 'semantic' | 'fuzzy' | 'fallback';
}

export interface XsltGenerationResult {
  success: boolean;
  xslt: string;
  mappings: InferredFieldMapping[];
  executionTimeMs: number;
  unmappedFields: string[];
  testTransform?: {
    success: boolean;
    outputXml?: string;
    error?: string;
  };
  error?: {
    message: string;
    code?: string;
    suggestion?: string;
  };
}

interface NodeInfo {
  name: string;
  localName: string;
  prefix: string;
  namespaceUri: string;
  path: string;
  value: string;
  isAttribute: boolean;
  isLeaf: boolean;
  isRepeating: boolean;
  parentPath: string;
  children: NodeInfo[];
  attributes: NodeInfo[];
}

interface RepeatMappingPair {
  targetRepeatNode: NodeInfo;
  sourceRepeatNode: NodeInfo;
}

// Common enterprise SAP CPI abbreviations and synonyms for semantic mapping
const ENTERPRISE_SYNONYMS: Record<string, string[]> = {
  order: ['belnr', 'ordernumber', 'orderid', 'docnum', 'purchaseorder', 'ponumber', 'po_number', 'id'],
  ordernumber: ['belnr', 'order', 'docnum', 'ponumber', 'id', 'purchaseorder'],
  customer: ['partn', 'kunnr', 'customerid', 'customernumber', 'partner', 'client', 'partnernumber'],
  customername: ['name1', 'companyname', 'customer', 'name', 'organization'],
  currency: ['waerk', 'curcy', 'currencycode', 'curr'],
  price: ['netwr', 'netvalue', 'unitprice', 'amount', 'total', 'rate', 'val', 'price'],
  quantity: ['menge', 'qty', 'count', 'units', 'amount', 'unitsonhand'],
  unit: ['menee', 'unitofmeasure', 'uom', 'meins', 'measure'],
  description: ['ktext', 'maktx', 'name', 'itemname', 'title', 'desc', 'details', 'text'],
  material: ['matnr', 'sku', 'materialnumber', 'itemid', 'partnumber', 'code'],
  position: ['posex', 'posnr', 'itemno', 'lineno', 'index', 'itemposition', 'line'],
  status: ['stat', 'state', 'accountstatus', 'stockstatus', 'active'],
  date: ['credat', 'datum', 'orderdate', 'createdat', 'timestamp'],
  city: ['ort01', 'town', 'municipality'],
  country: ['land1', 'countrycode', 'nation'],
  street: ['stras', 'address', 'streetaddress', 'line1'],
  postalcode: ['pstlz', 'zip', 'zipcode', 'postcode'],
  email: ['emailaddress', 'mail', 'contactemail'],
  phone: ['phonenumber', 'telephone', 'tel', 'mobile'],
};

/**
 * Escapes characters for XML attribute or text insertion
 */
function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Normalizes an identifier string (strips colons, underscores, hyphens, and converts to lowercase).
 */
function normalizeIdentifier(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Tokenizes camelCase, PascalCase, snake_case, and kebab-case into distinct lowercase word tokens.
 */
function tokenizeWords(str: string): string[] {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-.:]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Calculates string similarity between two words (0.0 to 1.0) using Dice coefficient.
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeIdentifier(str1);
  const s2 = normalizeIdentifier(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return (minLen / maxLen) * 0.9;
  }

  // Token overlap
  const tokens1 = new Set(tokenizeWords(str1));
  const tokens2 = new Set(tokenizeWords(str2));
  let intersection = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) intersection++;
  }
  const total = Math.max(tokens1.size, tokens2.size);
  return total > 0 ? (intersection / total) * 0.85 : 0;
}

/**
 * Checks semantic synonym match using enterprise CPI vocabulary.
 */
function isSemanticMatch(name1: string, name2: string): boolean {
  const norm1 = normalizeIdentifier(name1);
  const norm2 = normalizeIdentifier(name2);

  if (norm1 === norm2) return true;

  for (const [concept, synonyms] of Object.entries(ENTERPRISE_SYNONYMS)) {
    const group = [concept, ...synonyms];
    const match1 = group.some((s) => norm1 === s || norm1.includes(s));
    const match2 = group.some((s) => norm2 === s || norm2.includes(s));
    if (match1 && match2) return true;
  }
  return false;
}

/**
 * Parses an XML Document into a normalized NodeInfo tree.
 */
function analyzeXmlTree(element: Element, parentPath = ''): NodeInfo {
  const name = element.nodeName;
  const localName = element.localName || name.split(':').pop() || name;
  const prefix = element.prefix || (name.includes(':') ? name.split(':')[0] : '');
  const namespaceUri = element.namespaceURI || '';
  const path = parentPath ? `${parentPath}/${name}` : `/${name}`;

  // Check if repeating among siblings
  const parent = element.parentElement;
  let isRepeating = false;
  if (parent) {
    let sameNameCount = 0;
    for (let i = 0; i < parent.children.length; i++) {
      if (parent.children[i].nodeName === name) sameNameCount++;
    }
    isRepeating = sameNameCount > 1;
  }

  // Analyze attributes
  const attributes: NodeInfo[] = [];
  if (element.attributes) {
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (!attr.name.startsWith('xmlns')) {
        attributes.push({
          name: attr.name,
          localName: attr.localName || attr.name.split(':').pop() || attr.name,
          prefix: attr.prefix || (attr.name.includes(':') ? attr.name.split(':')[0] : ''),
          namespaceUri: attr.namespaceURI || '',
          path: `${path}/@${attr.name}`,
          value: attr.value.trim(),
          isAttribute: true,
          isLeaf: true,
          isRepeating: false,
          parentPath: path,
          children: [],
          attributes: [],
        });
      }
    }
  }

  // Analyze child elements
  const children: NodeInfo[] = [];
  for (let i = 0; i < element.children.length; i++) {
    children.push(analyzeXmlTree(element.children[i], path));
  }

  // Determine if leaf
  const isLeaf = children.length === 0;
  const textVal = isLeaf ? (element.textContent || '').trim() : '';

  return {
    name,
    localName,
    prefix,
    namespaceUri,
    path,
    value: textVal,
    isAttribute: false,
    isLeaf,
    isRepeating,
    parentPath,
    children,
    attributes,
  };
}

/**
 * Collects all leaf nodes and attributes from a tree into a flat array.
 */
function collectLeafNodes(node: NodeInfo): NodeInfo[] {
  const leaves: NodeInfo[] = [...node.attributes];
  if (node.isLeaf) {
    leaves.push(node);
  } else {
    for (const child of node.children) {
      leaves.push(...collectLeafNodes(child));
    }
  }
  return leaves;
}

/**
 * Collects all container nodes (non-leaf elements).
 */
function collectContainerNodes(node: NodeInfo): NodeInfo[] {
  const containers: NodeInfo[] = [];
  if (!node.isLeaf && !node.isAttribute) {
    containers.push(node);
    for (const child of node.children) {
      containers.push(...collectContainerNodes(child));
    }
  }
  return containers;
}

/**
 * Finds all repeating collections in a tree.
 */
function findRepeatingNodes(node: NodeInfo): NodeInfo[] {
  const repeating: NodeInfo[] = [];
  if (node.isRepeating) {
    repeating.push(node);
  }
  for (const child of node.children) {
    repeating.push(...findRepeatingNodes(child));
  }
  return repeating;
}

/**
 * Computes best Source Node match for a given Target field.
 */
function findBestSourceMatch(
  targetField: NodeInfo,
  sourceLeaves: NodeInfo[],
  sourceRepeatContext?: NodeInfo
): { sourceNode: NodeInfo; confidence: number; matchType: InferredFieldMapping['matchType'] } | null {
  let bestMatch: NodeInfo | null = null;
  let highestScore = 0;
  let matchType: InferredFieldMapping['matchType'] = 'fallback';

  for (const candidate of sourceLeaves) {
    let score = 0;
    let type: InferredFieldMapping['matchType'] = 'fuzzy';

    const isInsideRepeat = sourceRepeatContext && candidate.path.startsWith(sourceRepeatContext.parentPath);

    // 1. Exact Name match
    if (normalizeIdentifier(targetField.localName) === normalizeIdentifier(candidate.localName)) {
      score = 0.95;
      type = 'exact-name';
    }
    // 2. Exact Value match (if both non-empty)
    else if (
      targetField.value &&
      candidate.value &&
      targetField.value === candidate.value &&
      targetField.value.length >= 1
    ) {
      score = 0.92;
      type = 'exact-value';
    }
    // 3. Semantic match (e.g. BELNR <-> OrderNumber)
    else if (isSemanticMatch(targetField.localName, candidate.localName)) {
      score = 0.88;
      type = 'semantic';
    }
    // 4. Fuzzy text similarity
    else {
      const sim = calculateSimilarity(targetField.localName, candidate.localName);
      if (sim > 0.6) {
        score = sim * 0.8;
        type = 'fuzzy';
      }
    }

    // Boost score if both are attributes or both are elements
    if (score > 0 && targetField.isAttribute === candidate.isAttribute) {
      score += 0.05;
    }

    // Proximity boost for candidates within the repeating item context
    if (score > 0 && isInsideRepeat) {
      score += 0.08;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = candidate;
      matchType = type;
    }
  }

  if (bestMatch && highestScore >= 0.5) {
    return {
      sourceNode: bestMatch,
      confidence: Math.min(1.0, Math.round(highestScore * 100) / 100),
      matchType,
    };
  }

  return null;
}

/**
 * Builds namespace-safe XPath expression for a source node.
 * Guarantees standard XSLT 1.0 engines (Chrome, Safari, Firefox, Saxon, Xalan)
 * can match elements regardless of default xmlns or prefixed namespaces.
 */
function buildSourceXPath(
  sourceNode: NodeInfo,
  inLoop: boolean,
  loopContext?: NodeInfo,
  sourceHasNamespaces = false
): string {
  // If inside a loop and sourceNode is a descendant of the loop item
  if (inLoop && loopContext && sourceNode.path.startsWith(loopContext.path)) {
    const relativePath = sourceNode.path.substring(loopContext.path.length).replace(/^\//, '');
    if (!relativePath) {
      return '.';
    }
    const segments = relativePath.split('/');
    const xpathSegments = segments.map((seg) => {
      if (seg.startsWith('@')) {
        const attrName = seg.substring(1);
        const cleanLocal = attrName.split(':').pop() || attrName;
        return sourceHasNamespaces ? `@*[local-name()='${cleanLocal}']` : `@${attrName}`;
      }
      const cleanLocal = seg.split(':').pop() || seg;
      return sourceHasNamespaces ? `*[local-name()='${cleanLocal}']` : seg;
    });
    return xpathSegments.join('/');
  }

  // Outside loop or referencing a header/root field from inside loop
  const cleanLocal = sourceNode.localName;
  if (sourceNode.isAttribute) {
    return sourceHasNamespaces ? `//@*[local-name()='${cleanLocal}']` : `//@${sourceNode.name}`;
  }
  return sourceHasNamespaces ? `//*[local-name()='${cleanLocal}']` : `//${sourceNode.name}`;
}

/**
 * Main XSLT Generator Function
 * Generates an XSLT transformation from Source XML and Target XML samples.
 */
export async function generateXsltFromSourceAndTarget(
  sourceXml: string,
  targetXml: string,
  options: XsltGeneratorOptions = {}
): Promise<XsltGenerationResult> {
  const startTime = performance.now();
  const xsltVersion = options.xsltVersion ?? '1.0';
  const indent = options.indent ?? true;
  const omitXmlDecl = options.omitXmlDeclaration ?? false;
  const generateComments = options.generateComments ?? true;

  const cleanSource = (sourceXml || '').trim();
  const cleanTarget = (targetXml || '').trim();

  // 1. Guard against empty inputs
  if (!cleanSource) {
    return {
      success: false,
      xslt: '',
      mappings: [],
      executionTimeMs: 0,
      unmappedFields: [],
      error: {
        message: 'Source XML is empty. Provide a Source XML payload.',
        code: 'ERR_EMPTY_SOURCE',
      },
    };
  }

  if (!cleanTarget) {
    return {
      success: false,
      xslt: '',
      mappings: [],
      executionTimeMs: 0,
      unmappedFields: [],
      error: {
        message: 'Target XML is empty. Provide the desired Target XML structure.',
        code: 'ERR_EMPTY_TARGET',
      },
    };
  }

  // 2. Validate both documents
  const sourceVal = validateXmlStructure(cleanSource);
  if (!sourceVal.isValid) {
    return {
      success: false,
      xslt: '',
      mappings: [],
      executionTimeMs: Math.round(performance.now() - startTime),
      unmappedFields: [],
      error: {
        message: `Source XML Error: ${sourceVal.errors[0]?.message}`,
        code: 'ERR_INVALID_SOURCE_XML',
      },
    };
  }

  const targetVal = validateXmlStructure(cleanTarget);
  if (!targetVal.isValid) {
    return {
      success: false,
      xslt: '',
      mappings: [],
      executionTimeMs: Math.round(performance.now() - startTime),
      unmappedFields: [],
      error: {
        message: `Target XML Error: ${targetVal.errors[0]?.message}`,
        code: 'ERR_INVALID_TARGET_XML',
      },
    };
  }

  // 3. Parse XML DOMs
  let sourceDoc: Document;
  let targetDoc: Document;
  try {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      sourceDoc = parser.parseFromString(cleanSource, 'application/xml');
      targetDoc = parser.parseFromString(cleanTarget, 'application/xml');
    } else {
      const { DOMParser: XmldomParser } = await import('@xmldom/xmldom');
      const parser = new XmldomParser({ onError: () => {} });
      sourceDoc = parser.parseFromString(cleanSource, 'application/xml') as unknown as Document;
      targetDoc = parser.parseFromString(cleanTarget, 'application/xml') as unknown as Document;
    }
  } catch (ex: any) {
    return {
      success: false,
      xslt: '',
      mappings: [],
      executionTimeMs: Math.round(performance.now() - startTime),
      unmappedFields: [],
      error: {
        message: `DOM Parse Exception: ${ex?.message}`,
        code: 'ERR_DOM_PARSE_EXCEPTION',
      },
    };
  }

  // Check if source has any namespaces (default xmlns="..." or prefixed xmlns:prefix="...")
  const sourceHasNamespaces =
    cleanSource.includes('xmlns') ||
    /<[a-zA-Z0-9_\-]+:[a-zA-Z0-9_\-]+/.test(cleanSource);

  // 4. Analyze Tree Structures
  const sourceTree = analyzeXmlTree(sourceDoc.documentElement);
  const targetTree = analyzeXmlTree(targetDoc.documentElement);

  const sourceLeaves = collectLeafNodes(sourceTree);
  const targetLeaves = collectLeafNodes(targetTree);

  const sourceRepeating = findRepeatingNodes(sourceTree);
  const targetRepeating = findRepeatingNodes(targetTree);
  const targetContainers = collectContainerNodes(targetTree);

  // Identify matching repeating collections (e.g. Item <-> E1EDP01 or product <-> product)
  const repeatPairs: RepeatMappingPair[] = [];

  // Strategy A: Match explicit repeating target nodes with repeating source nodes
  for (const tr of targetRepeating) {
    let bestSr: NodeInfo | undefined = undefined;
    let highestSim = -1;
    for (const sr of sourceRepeating) {
      const sim = calculateSimilarity(tr.localName, sr.localName);
      if (sim > highestSim) {
        highestSim = sim;
        bestSr = sr;
      }
    }
    if (!bestSr && sourceRepeating.length > 0) {
      bestSr = sourceRepeating[0];
    }
    if (bestSr) {
      repeatPairs.push({ targetRepeatNode: tr, sourceRepeatNode: bestSr });
    }
  }

  // Strategy B: Single-sample target detection.
  // If target only provided 1 sample item in target XML, find container whose child fields match repeating source
  if (repeatPairs.length === 0 && sourceRepeating.length > 0) {
    for (const sr of sourceRepeating) {
      const srLeaves = collectLeafNodes(sr);
      let bestContainer: NodeInfo | undefined = undefined;
      let maxMatches = 0;

      for (const tc of targetContainers) {
        if (tc.parentPath === '') continue; // Skip root
        const tcLeaves = collectLeafNodes(tc);
        let matches = 0;
        for (const tcl of tcLeaves) {
          const m = findBestSourceMatch(tcl, srLeaves, sr);
          if (m && m.confidence >= 0.7) matches++;
        }
        const currentDepth = tc.path.split('/').length;
        const bestDepth = bestContainer ? bestContainer.path.split('/').length : 0;
        if (matches > maxMatches || (matches === maxMatches && matches > 0 && currentDepth > bestDepth)) {
          maxMatches = matches;
          bestContainer = tc;
        }
      }

      if (bestContainer && maxMatches >= 1) {
        repeatPairs.push({ targetRepeatNode: bestContainer, sourceRepeatNode: sr });
      }
    }
  }

  // 5. Build Mappings Table
  const mappings: (InferredFieldMapping & { sourceNode?: NodeInfo })[] = [];
  const unmappedFields: string[] = [];

  for (const tLeaf of targetLeaves) {
    // Check if target leaf is inside any repeating collection
    const activePair = repeatPairs.find((p) => tLeaf.path.startsWith(p.targetRepeatNode.path));
    const match = findBestSourceMatch(
      tLeaf,
      sourceLeaves,
      activePair ? activePair.sourceRepeatNode : undefined
    );

    if (match) {
      mappings.push({
        targetPath: tLeaf.path,
        targetName: tLeaf.name,
        sourcePath: match.sourceNode.path,
        sourceName: match.sourceNode.name,
        confidence: match.confidence,
        isAttribute: tLeaf.isAttribute,
        sourceIsAttribute: match.sourceNode.isAttribute,
        matchType: match.matchType,
        sourceNode: match.sourceNode,
      });
    } else {
      unmappedFields.push(tLeaf.path);
    }
  }

  // 6. Generate XSLT Code
  const indentStr = (depth: number) => '  '.repeat(depth);

  function renderTargetNode(
    node: NodeInfo,
    depth: number,
    inLoop = false,
    activeLoopPair?: RepeatMappingPair
  ): string {
    const ind = indentStr(depth);

    // If this node is a repeating target collection
    const pair = repeatPairs.find((p) => p.targetRepeatNode.path === node.path);
    if (pair && !inLoop) {
      const repeatSelect = sourceHasNamespaces
        ? `//*[local-name()='${pair.sourceRepeatNode.localName}']`
        : `//${pair.sourceRepeatNode.name}`;

      let loopCode = '';
      if (generateComments) {
        loopCode += `${ind}<!-- Repeating Collection: ${node.name} mapped from ${repeatSelect} -->\n`;
      }
      loopCode += `${ind}<xsl:for-each select="${repeatSelect}">\n`;
      loopCode += renderTargetNode(node, depth + 1, true, pair);
      loopCode += `${ind}</xsl:for-each>\n`;
      return loopCode;
    }

    // Leaf element with text content or attributes
    if (node.isLeaf) {
      const mapped = mappings.find((m) => m.targetPath === node.path);
      let xpathExpr = '';
      if (mapped && mapped.sourceNode) {
        xpathExpr = buildSourceXPath(
          mapped.sourceNode,
          inLoop,
          activeLoopPair?.sourceRepeatNode,
          sourceHasNamespaces
        );
      }

      // Check if node has attributes
      if (node.attributes.length > 0) {
        let leafCode = `${ind}<${node.name}`;
        // Render attributes
        for (const attr of node.attributes) {
          const attrMapped = mappings.find((m) => m.targetPath === attr.path);
          if (attrMapped && attrMapped.sourceNode) {
            const attrXPath = buildSourceXPath(
              attrMapped.sourceNode,
              inLoop,
              activeLoopPair?.sourceRepeatNode,
              sourceHasNamespaces
            );
            leafCode += ` ${attr.name}="{${attrXPath}}"`;
          } else if (attr.value) {
            leafCode += ` ${attr.name}="${escapeXml(attr.value)}"`;
          }
        }

        if (mapped) {
          leafCode += `>\n`;
          leafCode += `${ind}  <xsl:value-of select="${xpathExpr}"/>\n`;
          leafCode += `${ind}</${node.name}>\n`;
        } else if (node.value) {
          leafCode += `>${escapeXml(node.value)}</${node.name}>\n`;
        } else {
          leafCode += `/>\n`;
        }
        return leafCode;
      }

      if (mapped) {
        return `${ind}<${node.name}><xsl:value-of select="${xpathExpr}"/></${node.name}>\n`;
      }
      if (node.value) {
        return `${ind}<${node.name}>${escapeXml(node.value)}</${node.name}>\n`;
      }
      return `${ind}<${node.name}/>\n`;
    }

    // Container Element with children
    let container = `${ind}<${node.name}`;
    // Container attributes
    if (node.attributes.length > 0) {
      for (const attr of node.attributes) {
        const attrMapped = mappings.find((m) => m.targetPath === attr.path);
        if (attrMapped && attrMapped.sourceNode) {
          const attrXPath = buildSourceXPath(
            attrMapped.sourceNode,
            inLoop,
            activeLoopPair?.sourceRepeatNode,
            sourceHasNamespaces
          );
          container += ` ${attr.name}="{${attrXPath}}"`;
        } else if (attr.value) {
          container += ` ${attr.name}="${escapeXml(attr.value)}"`;
        }
      }
    }
    container += `>\n`;

    // Render children (avoid repeating loop children multiple times if sample had duplicates)
    const renderedChildPaths = new Set<string>();
    for (const child of node.children) {
      // If child is a repeat target node, ensure it's rendered only once as the template
      const isRepeatTarget = repeatPairs.some((p) => p.targetRepeatNode.path === child.path);
      if (isRepeatTarget && renderedChildPaths.has(child.name)) {
        continue;
      }
      renderedChildPaths.add(child.name);
      container += renderTargetNode(child, depth + 1, inLoop, activeLoopPair);
    }

    container += `${ind}</${node.name}>\n`;
    return container;
  }

  // Collect any namespace declarations from target root
  let targetNsDeclarations = '';
  if (targetDoc.documentElement) {
    for (let i = 0; i < targetDoc.documentElement.attributes.length; i++) {
      const a = targetDoc.documentElement.attributes[i];
      if (a.name.startsWith('xmlns') && !a.name.includes(':xsl')) {
        targetNsDeclarations += `\n  ${a.name}="${a.value}"`;
      }
    }
  }

  // Construct complete XSLT Stylesheet
  let xsltContent = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="${xsltVersion}" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"${targetNsDeclarations}>
  
  <xsl:output method="xml" indent="${indent ? 'yes' : 'no'}" encoding="UTF-8" omit-xml-declaration="${omitXmlDecl ? 'yes' : 'no'}"/>

  <!-- ToolSAP Generated XSLT Mapping -->
  <!-- Target Root: ${targetTree.name} | Mapped Fields: ${mappings.length} -->
  <xsl:template match="/">
${renderTargetNode(targetTree, 2)}
  </xsl:template>
</xsl:stylesheet>`;

  // Format generated XSLT cleanly
  try {
    const formatted = await formatXml(xsltContent, { tabWidth: 2 });
    if (formatted.success && formatted.output) {
      xsltContent = formatted.output;
    }
  } catch {
    // Keep unformatted if formatter fails
  }

  // Clean mappings for return (strip internal DOM references)
  const cleanMappings: InferredFieldMapping[] = mappings.map((m) => ({
    targetPath: m.targetPath,
    targetName: m.targetName,
    sourcePath: m.sourcePath,
    sourceName: m.sourceName,
    confidence: m.confidence,
    isAttribute: m.isAttribute,
    sourceIsAttribute: m.sourceIsAttribute,
    matchType: m.matchType,
  }));

  // 7. Verify generated XSLT by executing live test transform against Source XML
  let testTransformResult: { success: boolean; outputXml?: string; error?: string } = { success: false };
  try {
    const testExec = await executeXsltTransform(cleanSource, xsltContent, { autoFormatOutput: true });
    testTransformResult = {
      success: testExec.success,
      outputXml: testExec.outputXml,
      error: testExec.error?.message,
    };
  } catch (testEx: any) {
    testTransformResult = {
      success: false,
      error: testEx?.message || 'Verification transform failed',
    };
  }

  const elapsed = Math.round((performance.now() - startTime) * 10) / 10;

  return {
    success: true,
    xslt: xsltContent,
    mappings: cleanMappings,
    unmappedFields,
    executionTimeMs: elapsed,
    testTransform: testTransformResult,
  };
}
