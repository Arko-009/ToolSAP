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

  let snippet: string | undefined;
  if (line !== undefined && line > 0) {
    const lines = xml.split(/\r?\n/);
    const zeroIndexedLine = line - 1;
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
    snippet = snippetLines.join('\n');
  }

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
  const lower = rawError.toLowerCase();

  // Tag Mismatch: e.g. <Sender> closed with </Receiver>
  if (
    lower.includes('mismatch') ||
    lower.includes('opening and ending tag mismatch') ||
    lower.includes('mismatched tag')
  ) {
    return {
      category: 'tag-mismatch',
      cleanMessage: rawError
        .replace(/^error on line \d+ at column \d+:\s*/i, '')
        .replace(/^XML Parsing Error:\s*/i, '')
        .split('\n')[0]
        .trim(),
      suggestion:
        'XML element tags are strictly case-sensitive. Check if the closing tag spelling or casing differs from the opening tag (e.g., <Sender> vs </Receiver>).',
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
    cleanMessage: rawError
      .replace(/^error on line \d+ at column \d+:\s*/i, '')
      .replace(/^XML Parsing Error:\s*/i, '')
      .split('\n')[0]
      .trim() || 'Malformed XML document structure.',
    suggestion:
      'Review your XML structure against standard W3C XML 1.0 guidelines. Check for matching tags, valid attribute quotes, and proper nesting.',
  };
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
      const loc = extractErrorLocation(xml, rawText);
      const { category, cleanMessage, suggestion } = categorizeError(rawText);

      return {
        isValid: false,
        errors: [
          {
            message: cleanMessage,
            line: loc.line,
            column: loc.column,
            snippet: loc.snippet,
            category,
            suggestion,
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
 * Intelligent Auto-Fix for Common XML Syntax Mistakes
 * 1. Escapes bare ampersands '&' -> '&amp;'
 * 2. Trims leading BOM / invisible characters preceding '<?xml'
 * 3. Normalizes smart/curly quotes
 */
export function autoFixXml(xml: string): { fixedXml: string; fixes: string[] } {
  const fixes: string[] = [];
  let result = xml;

  // 1. Trim leading BOM or whitespace before <?xml
  if (/^\s*<\?xml/i.test(result) && !result.startsWith('<?xml')) {
    result = result.replace(/^\s+<\?xml/i, '<?xml');
    fixes.push('Removed whitespace preceding XML declaration <?xml');
  }

  // 2. Escape bare ampersands outside of entities and CDATA
  // Match & that is NOT followed by (amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);
  const bareAmpRegex = /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g;
  const ampMatches = (result.match(bareAmpRegex) || []).length;
  if (ampMatches > 0) {
    result = result.replace(bareAmpRegex, '&amp;');
    fixes.push(`Escaped ${ampMatches} unescaped ampersand(s) to &amp;`);
  }

  // 3. Replace smart/curly quotes in attributes
  if (/[\u201C\u201D\u2018\u2019]/.test(result)) {
    result = result
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'");
    fixes.push('Replaced smart/curly quotes with standard XML quotes');
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
