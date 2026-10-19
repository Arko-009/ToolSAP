/**
 * ToolSAP In-Browser XSLT Execution Engine
 * Supports 100% Client-Side XSLT Transformation with Zero Latency & Zero Data Transmission
 * Uses native browser window.XSLTProcessor (C++ engine) with fallback to xslt-processor
 */

import { validateXmlStructure } from '../xml/xmlValidator';
import { formatXml } from '../xml/xmlFormatter';

export interface XsltTransformOptions {
  autoFormatOutput?: boolean;
  xsltVersion?: '1.0' | '2.0' | '3.0';
  parameters?: Record<string, string>;
}

export interface XsltTransformResult {
  success: boolean;
  outputXml: string;
  executionTimeMs: number;
  engineUsed: 'native-browser' | 'xslt-processor';
  outputSizeBytes: number;
  error?: {
    message: string;
    line?: number;
    column?: number;
    code?: string;
    suggestion?: string;
  };
}

/**
 * Validates whether an XML document has parsererror tags.
 */
function checkForParserError(doc: Document): string | null {
  const parserErrors = doc.getElementsByTagName('parsererror');
  if (parserErrors && parserErrors.length > 0) {
    return parserErrors[0].textContent || 'XML parsing error';
  }
  return null;
}

/**
 * Executes an XSLT transformation against a source XML payload.
 */
export async function executeXsltTransform(
  sourceXml: string,
  xsltContent: string,
  options: XsltTransformOptions = {}
): Promise<XsltTransformResult> {
  const startTime = performance.now();
  const autoFormat = options.autoFormatOutput ?? true;

  const cleanXml = (sourceXml || '').trim();
  const cleanXslt = (xsltContent || '').trim();

  // 1. Guard against empty inputs
  if (!cleanXml) {
    return {
      success: false,
      outputXml: '',
      executionTimeMs: 0,
      engineUsed: 'native-browser',
      outputSizeBytes: 0,
      error: {
        message: 'Source XML is empty. Paste or upload a source XML payload.',
        code: 'ERR_EMPTY_SOURCE_XML',
        suggestion: 'Paste an XML document or click "Load Sample" to test with an enterprise payload.',
      },
    };
  }

  if (!cleanXslt) {
    return {
      success: false,
      outputXml: '',
      executionTimeMs: 0,
      engineUsed: 'native-browser',
      outputSizeBytes: 0,
      error: {
        message: 'XSLT Stylesheet is empty. Provide an XSLT transformation or generate one.',
        code: 'ERR_EMPTY_XSLT',
        suggestion: 'Click "Generate XSLT" from Source & Target XML, or pick a pre-built Enterprise Recipe.',
      },
    };
  }

  // 2. Validate Source XML well-formedness
  const xmlValidation = validateXmlStructure(cleanXml);
  if (!xmlValidation.isValid) {
    const firstErr = xmlValidation.errors[0];
    return {
      success: false,
      outputXml: '',
      executionTimeMs: Math.round(performance.now() - startTime),
      engineUsed: 'native-browser',
      outputSizeBytes: 0,
      error: {
        message: `Source XML Well-Formedness Error: ${firstErr?.message || 'XML is malformed'}`,
        line: firstErr?.line,
        column: firstErr?.column,
        code: 'ERR_SOURCE_XML_SYNTAX',
        suggestion: firstErr?.suggestion || 'Fix XML syntax errors before running XSLT transformation.',
      },
    };
  }

  // 3. Validate XSLT Stylesheet structure
  const xsltValidation = validateXmlStructure(cleanXslt);
  if (!xsltValidation.isValid) {
    const firstErr = xsltValidation.errors[0];
    return {
      success: false,
      outputXml: '',
      executionTimeMs: Math.round(performance.now() - startTime),
      engineUsed: 'native-browser',
      outputSizeBytes: 0,
      error: {
        message: `XSLT Stylesheet XML Error: ${firstErr?.message || 'XSLT is not valid XML'}`,
        line: firstErr?.line,
        column: firstErr?.column,
        code: 'ERR_XSLT_SYNTAX',
        suggestion: firstErr?.suggestion || 'XSLT stylesheets must be valid XML. Check tags, quotes, and xmlns declarations.',
      },
    };
  }

  // 4. Attempt Native Browser XSLTProcessor (Fastest & natively compliant)
  if (typeof window !== 'undefined' && typeof (window as any).XSLTProcessor !== 'undefined') {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(cleanXml, 'application/xml');
      const xsltDoc = parser.parseFromString(cleanXslt, 'application/xml');

      const xmlErr = checkForParserError(xmlDoc);
      if (xmlErr) {
        throw new Error(`Failed to parse Source XML: ${xmlErr}`);
      }

      const xsltErr = checkForParserError(xsltDoc);
      if (xsltErr) {
        throw new Error(`Failed to parse XSLT Stylesheet: ${xsltErr}`);
      }

      const processor = new (window as any).XSLTProcessor();
      processor.importStylesheet(xsltDoc);

      // Pass optional parameters if provided
      if (options.parameters) {
        for (const [key, value] of Object.entries(options.parameters)) {
          processor.setParameter(null, key, value);
        }
      }

      const resultDoc = processor.transformToDocument(xmlDoc);
      const transformErr = checkForParserError(resultDoc);
      if (transformErr) {
        throw new Error(`Transformation Error: ${transformErr}`);
      }

      const serializer = new XMLSerializer();
      let outputString = serializer.serializeToString(resultDoc);

      // Format output XML if requested
      if (autoFormat && outputString.trim().startsWith('<')) {
        const formatted = await formatXml(outputString, { tabWidth: 2 });
        if (formatted.success && formatted.output) {
          outputString = formatted.output;
        }
      }

      const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
      return {
        success: true,
        outputXml: outputString,
        executionTimeMs: elapsed,
        engineUsed: 'native-browser',
        outputSizeBytes: new Blob([outputString]).size,
      };
    } catch (browserEx: any) {
      // If native browser threw, we can attempt xslt-processor fallback below or return detailed error
      const errMsg = browserEx?.message || String(browserEx);
      // If error indicates syntax or template issue in XSLT, return meaningful suggestion
      if (errMsg.includes('prefix') || errMsg.includes('namespace') || errMsg.includes('XPath')) {
        return {
          success: false,
          outputXml: '',
          executionTimeMs: Math.round(performance.now() - startTime),
          engineUsed: 'native-browser',
          outputSizeBytes: 0,
          error: {
            message: errMsg,
            code: 'ERR_XSLT_EXECUTION',
            suggestion: 'Verify XPath expressions in xsl:value-of and xsl:for-each. Check that all namespace prefixes are declared on xsl:stylesheet.',
          },
        };
      }
    }
  }

  // 5. Fallback Engine: xslt-processor (Supports Node.js / test environments)
  try {
    const { Xslt, XmlParser } = await import('xslt-processor');
    const parser = new XmlParser();
    const xmlDoc = parser.xmlParse(cleanXml);

    let fallbackXslt = cleanXslt;
    if (options.parameters) {
      for (const [key, value] of Object.entries(options.parameters)) {
        const paramRegex = new RegExp(`<xsl:param\\s+name=["']${key}["'][^>]*\\/?>`, 'g');
        if (paramRegex.test(fallbackXslt)) {
          fallbackXslt = fallbackXslt.replace(
            paramRegex,
            `<xsl:variable name="${key}">${value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</xsl:variable>`
          );
        }
      }
    }
    const xslDoc = parser.xmlParse(fallbackXslt);

    const xslt = new Xslt();
    const rawOutput = await xslt.xsltProcess(xmlDoc, xslDoc);
    let outputString = typeof rawOutput === 'string' ? rawOutput : String(rawOutput ?? '');

    if (autoFormat && outputString.trim().startsWith('<')) {
      const formatted = await formatXml(outputString, { tabWidth: 2 });
      if (formatted.success && formatted.output) {
        outputString = formatted.output;
      }
    }

    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    return {
      success: true,
      outputXml: outputString,
      executionTimeMs: elapsed,
      engineUsed: 'xslt-processor',
      outputSizeBytes: new Blob([outputString]).size,
    };
  } catch (fallbackEx: any) {
    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    const errMsg = fallbackEx?.message || String(fallbackEx);

    let suggestion = 'Check XSLT template matches, xsl:for-each selectors, and matching closing tags.';
    if (errMsg.includes('prefix') || errMsg.includes('undeclared')) {
      suggestion = 'A namespace prefix used in the XSLT is not declared on <xsl:stylesheet>. Add xmlns:prefix="...".';
    } else if (errMsg.includes('syntax') || errMsg.includes('tag')) {
      suggestion = 'Check for matching opening and closing XSLT tags (<xsl:template>, <xsl:for-each>, <xsl:choose>).';
    }

    return {
      success: false,
      outputXml: '',
      executionTimeMs: elapsed,
      engineUsed: 'xslt-processor',
      outputSizeBytes: 0,
      error: {
        message: `XSLT Execution Error: ${errMsg}`,
        code: 'ERR_XSLT_EXECUTION_FAILED',
        suggestion,
      },
    };
  }
}
