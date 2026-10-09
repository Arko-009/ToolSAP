/**
 * XML Formatting, Minification, and Validation Utilities
 * 100% Client-Side / Browser-Only Execution
 * Specifically built for SAP Integration Payloads, SOAP Envelopes, and IDocs.
 */

import * as prettier from 'prettier/standalone';
import xmlPlugin from '@prettier/plugin-xml';

export interface XmlFormatOptions {
  tabWidth?: 2 | 4;
  useTabs?: boolean;
  xmlWhitespaceSensitivity?: 'ignore' | 'strict';
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

    const formatted = await prettier.format(xml, {
      parser: 'xml',
      plugins: [xmlPlugin],
      tabWidth,
      useTabs,
      xmlWhitespaceSensitivity,
      xmlQuoteAttributes,
      xmlSelfClosingSpace,
    });

    const elapsed = Math.round(performance.now() - startTime);
    const lines = formatted.split('\n').length;
    const chars = formatted.length;
    const sizeBytes = new Blob([formatted]).size;

    return {
      success: true,
      output: formatted,
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
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const child = node.childNodes[i];
    if (child.nodeType === Node.TEXT_NODE) {
      if (!child.nodeValue || child.nodeValue.trim().length === 0) {
        node.removeChild(child);
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
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
