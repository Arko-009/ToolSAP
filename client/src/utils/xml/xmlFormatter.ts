/**
 * XML Formatting, Minification, and Validation Utilities
 * 100% Client-Side / Browser-Only Execution
 * Specifically built for SAP Integration Payloads, SOAP Envelopes, and IDocs.
 */

import * as prettier from 'prettier/standalone';
import xmlPlugin from '@prettier/plugin-xml';
import * as docBuilders from 'prettier/doc';

const { group, indent, line, join, hardline } = (docBuilders as any).builders;

export interface XmlFormatOptions {
  tabWidth?: 2 | 4;
  useTabs?: boolean;
  xmlWhitespaceSensitivity?: 'ignore' | 'strict' | 'preserve';
  xmlQuoteAttributes?: 'preserve' | 'single' | 'double';
  xmlSelfClosingSpace?: boolean;
}

export interface XmlValidationError {
  message: string;
  line?: number;
  column?: number;
  snippet?: string;
}

export interface XmlValidationResult {
  isValid: boolean;
  error?: XmlValidationError;
}

export interface XmlFormatResult {
  success: boolean;
  output: string;
  stats: {
    lineCount: number;
    charCount: number;
    sizeBytes: number;
    executionTimeMs: number;
  };
  error?: XmlValidationError;
}

export interface XmlMinifyResult {
  success: boolean;
  output: string;
  stats: {
    lineCount: number;
    charCount: number;
    sizeBytes: number;
    executionTimeMs: number;
  };
  warning?: string;
  error?: XmlValidationError;
}

/**
 * Validates XML well-formedness using browser native DOMParser
 * Extracts accurate line and column numbers from parsererror
 */
export function validateXmlWellFormedness(xml: string): XmlValidationResult {
  if (!xml || !xml.trim()) {
    return {
      isValid: false,
      error: { message: 'XML input is empty. Please paste or upload an XML document.' },
    };
  }

  try {
    if (typeof DOMParser === 'undefined') {
      return { isValid: true };
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const parserError = doc.getElementsByTagName('parsererror')[0];

    if (parserError) {
      const errorText = parserError.textContent || 'Unknown XML parsing error';
      // Attempt to extract line and column numbers from common browser error formats
      // Example Chrome: "error on line 4 at column 12: Opening and ending tag mismatch"
      // Example Firefox: "XML Parsing Error: mismatched tag. Location: ... Line Number 4, Column 12:"
      let line: number | undefined;
      let column: number | undefined;

      const lineMatch = errorText.match(/line\s*(\d+)/i) || errorText.match(/Line Number\s*(\d+)/i);
      if (lineMatch) line = parseInt(lineMatch[1], 10);

      const colMatch = errorText.match(/column\s*(\d+)/i) || errorText.match(/Column\s*(\d+)/i);
      if (colMatch) column = parseInt(colMatch[1], 10);

      // Clean message: strip technical prefix
      const cleanMessage = errorText
        .split('\n')[0]
        .replace(/^error on line \d+ at column \d+:\s*/i, '')
        .replace(/^XML Parsing Error:\s*/i, '')
        .trim();

      return {
        isValid: false,
        error: {
          message: cleanMessage || 'Malformed XML document structure.',
          line,
          column,
        },
      };
    }

    return { isValid: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      isValid: false,
      error: { message: `DOM parser error: ${msg}` },
    };
  }
}

/**
 * Regex matching DOCTYPE declarations with internal DTD subsets: <!DOCTYPE ... [ ... ]>
 * The underlying parser in @prettier/plugin-xml (@xml-tools/parser / Chevrotain) does not
 * support the '[' token in DTDs and crashes with "unexpected character: ->[<-".
 */
const DTD_SUBSET_REGEX = /<!DOCTYPE\s+[^>\[]*\[[\s\S]*?\]\s*>/gi;

/**
 * Temporarily masks DOCTYPE declarations containing internal DTD subsets with safe XML comments.
 */
export function maskDtdSubsets(xml: string): {
  maskedXml: string;
  dtdMap: Map<string, string>;
} {
  const dtdMap = new Map<string, string>();
  let count = 0;
  const maskedXml = xml.replace(DTD_SUBSET_REGEX, (match) => {
    const token = `<!--__TSAP_DTD_SUBSET_${count++}__-->`;
    dtdMap.set(token, match);
    return token;
  });
  return { maskedXml, dtdMap };
}

/**
 * Restores original DOCTYPE declarations containing internal DTD subsets.
 */
export function restoreDtdSubsets(
  xml: string,
  dtdMap: Map<string, string>
): string {
  if (dtdMap.size === 0) return xml;
  let result = xml;
  for (const [token, dtd] of dtdMap) {
    result = result.replace(token, dtd);
  }
  return result;
}

/**
 * Regex matching XML blocks where entities should NOT be altered (CDATA, Comments, PIs, DOCTYPE)
 * or XML entity references (&...;) that need protection from Prettier's
 * whitespace injection and multiline splitting bug.
 */
const XML_PROTECTED_ENTITY_REGEX =
  /(<!\[CDATA\[[\s\S]*?\]\]>)|(<!--[\s\S]*?-->)|(<\?[\s\S]*?\?>)|(<!DOCTYPE[\s\S]*?\]\s*>|<!DOCTYPE[^>]*>)|(&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z_:][a-zA-Z0-9._:-]*);)/g;

/**
 * Temporarily masks XML entity references (e.g. &amp;, &lt;, &#39;) with safe,
 * single-character Private Use Area Unicode codepoints (or fallback tokens).
 *
 * This prevents @prettier/plugin-xml from treating entity references as whitespace-padded
 * word boundaries (which turns "R&amp;D" into "R &amp; D" across 3 lines).
 */
export function maskXmlEntities(xml: string): {
  maskedXml: string;
  entityMap: Map<string, string>;
} {
  const entityMap = new Map<string, string>();
  const entityToPlaceholder = new Map<string, string>();
  let puaCode = 0xe000;

  const maskedXml = xml.replace(
    XML_PROTECTED_ENTITY_REGEX,
    (match, cdata, comment, pi, doctype) => {
      // If it's a protected block (CDATA, Comment, PI, DOCTYPE), leave untouched
      if (cdata || comment || pi || doctype) {
        return match;
      }

      // It's an entity reference (e.g. &amp;, &#39;, &lt;)
      const entityStr = match;
      let placeholder = entityToPlaceholder.get(entityStr);
      if (!placeholder) {
        // Find next unused character in Private Use Area (0xE000 - 0xF8FF)
        while (puaCode <= 0xf8ff && xml.includes(String.fromCharCode(puaCode))) {
          puaCode++;
        }

        if (puaCode <= 0xf8ff) {
          placeholder = String.fromCharCode(puaCode++);
        } else {
          // Fallback if PUA range is completely exhausted (extremely rare: >6,300 unique entities)
          placeholder = `__TSAP_ENT_${entityToPlaceholder.size}__`;
        }

        entityToPlaceholder.set(entityStr, placeholder);
        entityMap.set(placeholder, entityStr);
      }

      return placeholder;
    }
  );

  return { maskedXml, entityMap };
}

/**
 * Restores original XML entity references replaced during maskXmlEntities.
 */
export function restoreXmlEntities(
  formattedXml: string,
  entityMap: Map<string, string>
): string {
  if (entityMap.size === 0) return formattedXml;
  let restored = formattedXml;
  for (const [placeholder, entity] of entityMap) {
    restored = restored.replaceAll(placeholder, entity);
  }
  return restored;
}

/**
 * Helper to check if an element has xml:space="preserve"
 */
function hasXmlSpacePreserve(node: any): boolean {
  return (
    node.attribute &&
    node.attribute.some(
      (attr: any) =>
        attr &&
        attr.Name === 'xml:space' &&
        attr.STRING &&
        attr.STRING.slice(1, -1) === 'preserve'
    )
  );
}

/**
 * Checks if an element is mixed-content (contains both child elements and non-empty text)
 * Such elements must not have their inline text and child tags broken across multiple lines.
 */
function isMixedContentElement(node: any): boolean {
  if (!node || node.name !== 'element' || !node.content) return false;
  if (hasXmlSpacePreserve(node)) return false;
  const elements = node.content.element || [];
  const chardata = node.content.chardata || [];
  if (elements.length === 0) return false;
  return chardata.some((cd: any) => cd.TEXT && cd.TEXT.trim().length > 0);
}

/**
 * Removes unwanted softline from opening tag group to prevent dangling '>'
 */
function cleanOpenTagSoftline(openTagGroup: any) {
  if (openTagGroup && openTagGroup.type === 'group' && Array.isArray(openTagGroup.contents)) {
    openTagGroup.contents = openTagGroup.contents.filter(
      (item: any) => !(item && typeof item === 'object' && item.type === 'line' && item.soft)
    );
  }
}

const origXmlPrint = (xmlPlugin as any).printers?.xml?.print;

/**
 * Formats leaf text elements (elements containing only text/chardata, without child elements,
 * CDATA, comments, or processing instructions) to ensure:
 * 1. Whitespace-only values (e.g., <SpaceDelimiter> </SpaceDelimiter>) are preserved and NOT collapsed into self-closing tags (<SpaceDelimiter />).
 * 2. Single-line text values (e.g., <LongDescription>) are kept on a single continuous line, avoiding word-wrapping at printWidth (80 chars) that injects unwanted newlines and spaces.
 * 3. Multi-line text values have their lines preserved without intra-line word-wrapping.
 */
function formatLeafElement(node: any, path: any, opts: any, print: any) {
  const elemText = opts.originalText.slice(node.location.startOffset, node.location.endOffset + 1);
  const firstGt = elemText.indexOf('>');
  const lastLt = elemText.lastIndexOf('</');

  if (firstGt === -1 || lastLt === -1 || lastLt < firstGt) {
    return null;
  }

  const innerText = elemText.slice(firstGt + 1, lastLt);

  const parts: any[] = [node.OPEN, node.Name];
  if (node.attribute && node.attribute.length > 0) {
    const attrs: any[] = [];
    path.each((attrPath: any) => {
      attrs.push(print(attrPath));
    }, 'attribute');
    const separator = opts.singleAttributePerLine ? hardline : line;
    parts.push(indent([line, join(separator, attrs)]));
  }
  const openTag = group([...parts, node.START_CLOSE]);
  const closeTag = group([node.SLASH_OPEN, node.END_NAME, node.END]);

  if (!innerText.includes('\n')) {
    // Single-line text or whitespace-only (e.g. <SpaceDelimiter> </SpaceDelimiter>)
    return group([openTag, innerText, closeTag]);
  } else {
    // Multi-line text: preserve individual lines without word-wrapping
    const lines = innerText
      .split('\n')
      .map((l: string) => l.trimEnd())
      .filter((l: string, idx: number, arr: string[]) => {
        if ((idx === 0 || idx === arr.length - 1) && l.trim().length === 0) return false;
        return true;
      });

    return group([
      openTag,
      indent([hardline, join(hardline, lines.map((l: string) => l.trim()))]),
      hardline,
      closeTag,
    ]);
  }
}

/**
 * Enhanced Prettier XML plugin that:
 * 1. Preserves mixed-content elements inline without splitting text, child tags, and punctuation.
 * 2. Preserves leaf text elements intact (prevents deleting whitespace-only values like <SpaceDelimiter> </SpaceDelimiter>
 *    and prevents word-wrapping single-line text like <LongDescription>).
 * 3. Removes unwanted softline in opening tags before CDATA and in elements without attributes,
 *    eliminating dangling '>' glitches like `<Script\n><![CDATA[...]></Script>`.
 */
const enhancedXmlPlugin: any = {
  ...xmlPlugin,
  printers: {
    ...(xmlPlugin as any).printers,
    xml: {
      ...(xmlPlugin as any).printers?.xml,
      print(path: any, opts: any, print: any) {
        const node = path.getValue();

        // 1. Mixed-content handling: keep text and inline child elements together
        // Prevents breaking words/punctuation across lines (e.g., <MixedText>Order <b>#10045</b> is <i>urgent</i>!</MixedText>)
        if (isMixedContentElement(node)) {
          const openParts: any[] = ['<', node.Name];
          if (node.attribute && node.attribute.length > 0) {
            path.each((attrPath: any) => {
              openParts.push(' ', print(attrPath));
            }, 'attribute');
          }
          openParts.push('>');

          const elemText = opts.originalText.slice(node.location.startOffset, node.location.endOffset + 1);
          const firstGt = elemText.indexOf('>');
          const lastLt = elemText.lastIndexOf('</');
          let inner = elemText.slice(firstGt + 1, lastLt);

          // If not strict preserve mode, trim leading/trailing newlines around inline content
          if (opts.xmlWhitespaceSensitivity !== 'preserve') {
            inner = inner.replace(/^\s*\n\s*/, '').replace(/\s*\n\s*$/, '').trim();
          }

          return [openParts, inner, ['</', node.Name, '>']];
        }

        // 2. Leaf element handling: elements with no child tags, no CDATA, no comments, and not self-closing
        if (node && node.name === 'element' && !hasXmlSpacePreserve(node)) {
          const content = node.content;
          const isNotSelfClosing = node.SLASH_CLOSE === null;
          const hasNoChildElements = !content || !content.element || content.element.length === 0;
          const hasNoCData = !content || !content.CData || content.CData.length === 0;
          const hasNoComment = !content || !content.Comment || content.Comment.length === 0;
          const hasNoPI = !content || !content.PROCESSING_INSTRUCTION || content.PROCESSING_INSTRUCTION.length === 0;

          if (isNotSelfClosing && hasNoChildElements && hasNoCData && hasNoComment && hasNoPI) {
            const leafDoc = formatLeafElement(node, path, opts, print);
            if (leafDoc) return leafDoc;
          }
        }

        const res: any = origXmlPrint(path, opts, print);

        // 3. Prevent dangling '>' before CDATA or in elements without attributes
        if (node && node.name === 'element' && res && res.type === 'group' && Array.isArray(res.contents)) {
          const hasNoAttrs = !node.attribute || node.attribute.length === 0;
          const hasCData = node.content && node.content.CData && node.content.CData.length > 0;

          if (hasNoAttrs || hasCData) {
            cleanOpenTagSoftline(res.contents[0]);
          }
        }

        return res;
      },
    },
  },
};

/**
 * Format XML document using Prettier standalone and @prettier/plugin-xml
 */
export async function formatXml(
  xml: string,
  options: XmlFormatOptions = {}
): Promise<XmlFormatResult> {
  const startTime = performance.now();

  if (!xml || !xml.trim()) {
    return {
      success: false,
      output: '',
      stats: { lineCount: 0, charCount: 0, sizeBytes: 0, executionTimeMs: 0 },
      error: { message: 'XML input is empty.' },
    };
  }

  // Pre-validate with DOMParser to provide clean line/column error diagnostics
  const validation = validateXmlWellFormedness(xml);
  if (!validation.isValid && validation.error) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      success: false,
      output: '',
      stats: {
        lineCount: 0,
        charCount: 0,
        sizeBytes: 0,
        executionTimeMs: elapsed,
      },
      error: validation.error,
    };
  }

  try {
    const {
      tabWidth = 2,
      useTabs = false,
      xmlWhitespaceSensitivity = 'ignore',
      xmlQuoteAttributes = 'preserve',
      xmlSelfClosingSpace = true,
    } = options;

    // 1. Mask DOCTYPE internal DTD subsets [...] to prevent @xml-tools/parser Chevrotain lexer crash
    const { maskedXml: xmlWithoutDtdSubsets, dtdMap } = maskDtdSubsets(xml);

    // 2. Mask entities to protect against Prettier plugin-xml's space injection and line-split bug
    const { maskedXml, entityMap } = maskXmlEntities(xmlWithoutDtdSubsets);

    const formatted = await prettier.format(maskedXml, {
      parser: 'xml',
      plugins: [enhancedXmlPlugin],
      tabWidth,
      useTabs,
      xmlWhitespaceSensitivity,
      xmlQuoteAttributes,
      xmlSelfClosingSpace,
    });

    // 3. Restore exact original escaped entities
    const outputWithEntities = restoreXmlEntities(formatted, entityMap);

    // 4. Restore original DOCTYPE internal DTD subsets
    const finalOutput = restoreDtdSubsets(outputWithEntities, dtdMap);

    const elapsed = Math.round(performance.now() - startTime);
    const lines = finalOutput.split('\n').length;
    const chars = finalOutput.length;
    const sizeBytes = new Blob([finalOutput]).size;

    return {
      success: true,
      output: finalOutput,
      stats: {
        lineCount: lines,
        charCount: chars,
        sizeBytes,
        executionTimeMs: elapsed,
      },
    };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - startTime);
    const rawMsg = err instanceof Error ? err.message : String(err);

    // Parse line/col if available in prettier error message
    let line: number | undefined;
    let column: number | undefined;
    const locMatch = rawMsg.match(/\((\d+):(\d+)\)/);
    if (locMatch) {
      line = parseInt(locMatch[1], 10);
      column = parseInt(locMatch[2], 10);
    }

    const cleanMsg = rawMsg
      .replace(/^SyntaxError:\s*/, '')
      .split('\n')[0]
      .trim();

    return {
      success: false,
      output: '',
      stats: { lineCount: 0, charCount: 0, sizeBytes: 0, executionTimeMs: elapsed },
      error: {
        message: cleanMsg || 'Failed to format XML document due to syntax error.',
        line: line || validation.error?.line,
        column: column || validation.error?.column,
      },
    };
  }
}

/**
 * Safe XML Minification:
 * Uses DOM-based serialization while stripping redundant inter-tag whitespace.
 * Preserves CDATA sections, comments, and internal element text values.
 */
export function minifyXml(xml: string): XmlMinifyResult {
  const startTime = performance.now();

  if (!xml || !xml.trim()) {
    return {
      success: false,
      output: '',
      stats: { lineCount: 0, charCount: 0, sizeBytes: 0, executionTimeMs: 0 },
      error: { message: 'XML input is empty.' },
    };
  }

  const validation = validateXmlWellFormedness(xml);
  if (!validation.isValid && validation.error) {
    return {
      success: false,
      output: '',
      stats: { lineCount: 0, charCount: 0, sizeBytes: 0, executionTimeMs: 0 },
      error: validation.error,
    };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');

    // Recursively clean whitespace-only text nodes between element tags
    cleanWhitespaceNodes(doc);

    const serializer = new XMLSerializer();
    let minified = serializer.serializeToString(doc);

    // Normalize any lingering multi-line breaks between tags
    minified = minified.replace(/>\s+</g, '><').trim();

    const elapsed = Math.round(performance.now() - startTime);
    const lines = minified.split('\n').length;
    const chars = minified.length;
    const sizeBytes = new Blob([minified]).size;

    return {
      success: true,
      output: minified,
      stats: {
        lineCount: lines,
        charCount: chars,
        sizeBytes,
        executionTimeMs: elapsed,
      },
      warning:
        'Safe minification preserves text content, attributes, and CDATA. Verify your SAP target endpoint if strict whitespace sensitivity is required.',
    };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - startTime);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      output: '',
      stats: { lineCount: 0, charCount: 0, sizeBytes: 0, executionTimeMs: elapsed },
      error: { message: `Minification failed: ${msg}` },
    };
  }
}

/**
 * Helper to recursively remove whitespace-only text nodes
 * while strictly preserving CDATA and non-empty text content
 */
function cleanWhitespaceNodes(node: Node) {
  const TEXT_NODE = typeof Node !== 'undefined' ? Node.TEXT_NODE : 3;
  const ELEMENT_NODE = typeof Node !== 'undefined' ? Node.ELEMENT_NODE : 1;

  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const child = node.childNodes[i];
    if (child.nodeType === TEXT_NODE) {
      if (!child.nodeValue || child.nodeValue.trim().length === 0) {
        node.removeChild(child);
      }
    } else if (child.nodeType === ELEMENT_NODE) {
      cleanWhitespaceNodes(child);
    }
  }
}

/**
 * Realistic SAP Cloud Integration (CPI / Integration Suite) Sample XML
 * Demonstrates SOAP Envelope, Namespaces, IDoc headers, CDATA, Attributes, and nested structures.
 */
export const SAP_SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sap="http://sap.com/xi/XI/Message/30" xmlns:ord="http://tool-sap.dev/orders/v1">
  <soapenv:Header>
    <sap:Main version="3.0">
      <sap:MessageClass>ApplicationMessage</sap:MessageClass>
      <sap:ProcessingMode>asynchronous</sap:ProcessingMode>
      <sap:MessageId>8fa3c021-39da-4f11-9a2d-98317df60e12</sap:MessageId>
      <sap:TimeSent>2026-10-09T08:30:00Z</sap:TimeSent>
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
        <ord:OrderDate>2026-10-09</ord:OrderDate>
        <ord:CustomerNumber>CUST-409182</ord:CustomerNumber>
        <ord:CompanyCode>1010</ord:CompanyCode>
        <ord:SalesOrganization>1000</ord:SalesOrganization>
        <ord:DistributionChannel>10</ord:DistributionChannel>
        <ord:SpecialInstructions><![CDATA[Priority delivery requested for SAP Integration Suite hub. Handle with automated CI/CD pipeline.]]></ord:SpecialInstructions>
      </ord:Header>
      <ord:Items>
        <ord:Item lineNumber="10" materialNumber="MAT-88401">
          <ord:Description>SAP Cloud Integration Enterprise Adapter Pack</ord:Description>
          <ord:Quantity unit="EA">1</ord:Quantity>
          <ord:NetPrice currency="EUR">4500.00</ord:NetPrice>
          <ord:TaxAmount rate="19.00">855.00</ord:TaxAmount>
        </ord:Item>
        <ord:Item lineNumber="20" materialNumber="MAT-33109">
          <ord:Description>Managed API Gateway Subscription (Annual)</ord:Description>
          <ord:Quantity unit="EA">12</ord:Quantity>
          <ord:NetPrice currency="EUR">350.00</ord:NetPrice>
          <ord:TaxAmount rate="19.00">798.00</ord:TaxAmount>
        </ord:Item>
      </ord:Items>
      <ord:Summary>
        <ord:TotalNetAmount>8700.00</ord:TotalNetAmount>
        <ord:TotalTaxAmount>1653.00</ord:TotalTaxAmount>
        <ord:TotalGrossAmount>10353.00</ord:TotalGrossAmount>
      </ord:Summary>
    </ord:OrderRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
