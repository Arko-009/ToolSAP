import { useState, useCallback, useRef, useEffect } from 'react';
import {
  FileOutput,
  Copy,
  Download,
  Upload,
  Trash2,
  Sparkles,
  Check,
  AlertCircle,
  FileCode,
  Shield,
  Layers,
  ClipboardPaste,
  HelpCircle,
  Code2,
} from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useToastContext } from '@/components/ui/Toast';
import { ToolWorkspaceLayout } from '@/components/tools/ToolWorkspaceLayout';
import { CodeEditor } from '@/components/tools/CodeEditor';
import {
  generateXsdFromXml,
  SAMPLE_SAP_PURCHASE_ORDER_XML,
  type XsdGenerationMetrics,
} from '@/utils/xml/xmlToXsdGenerator';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function XmlToXsdPage() {
  const { addToast } = useToastContext();

  // Input & Output states
  const [inputXml, setInputXml] = useState('');
  const [outputXsd, setOutputXsd] = useState('');
  const [activeFileName, setActiveFileName] = useState<string | null>(null);

  // Processing & Diagnostic states
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<{
    message: string;
    line?: number;
    column?: number;
    snippet?: string;
    code?: string;
    suggestion?: string;
  } | null>(null);
  const [metrics, setMetrics] = useState<XsdGenerationMetrics | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived input metrics
  const inputLineCount = inputXml ? inputXml.split('\n').length : 0;
  const inputSizeBytes = new Blob([inputXml]).size;

  // Expose automated test runner in browser window for development/testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/utils/xml/xmlToXsdGenerator.testSuite').then((mod) => {
        (window as unknown as { __runXmlToXsdTestSuite?: () => unknown }).__runXmlToXsdTestSuite =
          mod.runXmlToXsdTestSuite;
      });
    }
  }, []);

  // Generate XSD Schema strictly from current editor contents
  const handleGenerate = useCallback(async (customInput?: string) => {
    const xmlToProcess = customInput !== undefined ? customInput : inputXml;

    if (!xmlToProcess.trim()) {
      setError({
        message: 'Please paste or upload an XML document to generate schema.',
        suggestion: 'Input cannot be empty. Paste XML or click "Load Sample" to test.',
      });
      setOutputXsd('');
      setMetrics(null);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateXsdFromXml(xmlToProcess);

      if (result.success) {
        setOutputXsd(result.xsd);
        setMetrics(result.metrics || null);
        setError(null);
        addToast({
          type: 'success',
          title: 'XSD Schema Generated',
          description: `Generated and validated W3C XML Schema in ${result.metrics?.executionTimeMs || 0} ms.`,
        });
      } else {
        setOutputXsd('');
        setMetrics(null);
        setError({
          message: result.error?.message || 'Failed to generate schema.',
          line: result.error?.line,
          column: result.error?.column,
          snippet: result.error?.snippet,
          code: result.error?.code,
          suggestion: result.error?.suggestion,
        });
        addToast({
          type: 'error',
          title: 'Generation Failed',
          description: result.error?.message || 'Check XML syntax errors.',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected generation error.';
      setError({
        message: msg,
        suggestion: 'Ensure the XML document is well-formed.',
      });
      setOutputXsd('');
      setMetrics(null);
    } finally {
      setIsGenerating(false);
    }
  }, [inputXml, addToast]);

  // Handle File Upload
  const handleFileUpload = useCallback(
    (file: File) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        addToast({
          type: 'error',
          title: 'File Too Large',
          description: `File size exceeds maximum allowed 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInputXml(text);
        setActiveFileName(file.name);
        setError(null);
        setOutputXsd('');
        setMetrics(null);
        addToast({
          type: 'info',
          title: 'File Loaded',
          description: `Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB). Click "Generate XSD" to create schema.`,
        });
      };
      reader.onerror = () => {
        addToast({
          type: 'error',
          title: 'Read Error',
          description: `Failed to read file: ${file.name}`,
        });
      };
      reader.readAsText(file);
    },
    [addToast]
  );

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Paste from clipboard
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputXml(text);
        setActiveFileName(null);
        setError(null);
        addToast({
          type: 'info',
          title: 'Pasted from Clipboard',
          description: `Pasted ${text.split('\n').length} lines of XML.`,
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Clipboard Permission',
        description: 'Unable to access clipboard. Please use Ctrl+V or Cmd+V directly in the editor.',
      });
    }
  }, [addToast]);

  // Load SAP Sample XML
  const handleLoadSample = useCallback(() => {
    setInputXml(SAMPLE_SAP_PURCHASE_ORDER_XML);
    setActiveFileName('sample-purchase-order.xml');
    setError(null);
    setOutputXsd('');
    setMetrics(null);
    addToast({
      type: 'info',
      title: 'SAP Sample Loaded',
      description: 'Loaded sample SAP Purchase Order XML with namespaces and items.',
    });
  }, [addToast]);

  // Clear Editor
  const handleClear = useCallback(() => {
    setInputXml('');
    setOutputXsd('');
    setActiveFileName(null);
    setError(null);
    setMetrics(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Copy Generated XSD
  const handleCopyXsd = useCallback(async () => {
    if (!outputXsd) return;
    try {
      await navigator.clipboard.writeText(outputXsd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast({
        type: 'success',
        title: 'Copied to Clipboard',
        description: 'Generated XSD schema copied.',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Copy Failed',
        description: 'Could not copy schema to clipboard.',
      });
    }
  }, [outputXsd, addToast]);

  // Download Generated XSD
  const handleDownloadXsd = useCallback(() => {
    if (!outputXsd) return;
    const blob = new Blob([outputXsd], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const baseName = activeFileName ? activeFileName.replace(/\.[^/.]+$/, '') : 'schema';
    link.href = url;
    link.download = `${baseName}.xsd`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Download Started',
      description: `Downloaded ${baseName}.xsd`,
    });
  }, [outputXsd, activeFileName, addToast]);

  // Render Left Pane (XML Input)
  const leftPane = (
    <div
      className={`flex flex-col h-[580px] lg:h-[620px] ${isDragging ? 'ring-2 ring-primary-500 rounded-xl bg-primary-50/20' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
        }}
        accept=".xml,.txt,.wsdl,.xsd,.svg"
        className="hidden"
        id="xml-file-upload-input"
      />

      <Card padding="none" className="flex flex-col h-full overflow-hidden border-neutral-200 shadow-xs">
        {/* Input Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-neutral-200/80 bg-neutral-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
              <FileCode className="h-4 w-4 text-primary-600" />
              <span>XML Input</span>
            </div>
            {activeFileName && (
              <span className="text-[11px] font-mono text-neutral-500 bg-neutral-200/60 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                {activeFileName}
              </span>
            )}
            {inputLineCount > 0 && (
              <span className="text-[11px] font-mono text-neutral-400">
                {inputLineCount} lines · {(inputSizeBytes / 1024).toFixed(1)} KB
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePasteFromClipboard}
              title="Paste from clipboard"
              className="h-7 px-2 text-xs"
            >
              <ClipboardPaste className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Paste</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              title="Upload XML file"
              className="h-7 px-2 text-xs"
            >
              <Upload className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLoadSample}
              title="Load realistic SAP Purchase Order XML sample"
              className="h-7 px-2 text-xs text-primary-700 bg-primary-50/50 hover:bg-primary-50 border-primary-200/80"
            >
              <Sparkles className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Sample</span>
            </Button>
            {inputXml && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                title="Clear input"
                className="h-7 px-2 text-xs text-neutral-500 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Validation Error Feedback */}
        {error && (
          <div className="m-3 p-3.5 bg-rose-50/90 border border-rose-200/90 rounded-xl text-rose-900 text-xs shadow-2xs animate-fade-in shrink-0">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-rose-950">XML Validation Error</span>
                  {error.line !== undefined && (
                    <Badge variant="error" size="sm" className="font-mono">
                      Line {error.line}
                      {error.column ? `, Col ${error.column}` : ''}
                    </Badge>
                  )}
                </div>
                <p className="text-rose-800 leading-relaxed">{error.message}</p>
                {error.snippet && (
                  <pre className="mt-2 p-2 bg-white/90 border border-rose-200 rounded-md font-mono text-[11px] text-rose-900 overflow-x-auto">
                    {error.snippet}
                  </pre>
                )}
                {error.suggestion && (
                  <p className="text-[11px] text-rose-700 font-medium pt-1">
                    💡 Tip: {error.suggestion}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Code Editor */}
        <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
          <CodeEditor
            value={inputXml}
            onChange={(val) => {
              setInputXml(val);
              if (error) setError(null);
            }}
            placeholder="Paste your XML sample here, upload an XML file, or click 'Sample' above..."
            hasError={!!error}
            height="100%"
            minHeight="100%"
          />
        </div>

        {/* Input Information Footer */}
        <div className="px-4 py-2.5 bg-neutral-50/70 border-t border-neutral-200/80 flex items-center justify-between text-[11px] text-neutral-500 shrink-0">
          <span className="truncate max-w-[280px] sm:max-w-none">
            Supports XML payloads, SOAP envelopes & SAP IDocs · Max 5 MB
          </span>
          <span className="font-mono shrink-0">
            {inputLineCount} lines · {(inputSizeBytes / 1024).toFixed(1)} KB
          </span>
        </div>
      </Card>
    </div>
  );

  // Render Right Pane (XSD Output)
  const rightPane = (
    <div className="flex flex-col h-[580px] lg:h-[620px]">
      <Card padding="none" className="flex flex-col h-full overflow-hidden border-neutral-200 shadow-xs">
        {/* Output Header Toolbar with Prominent Generate XSD Action */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-neutral-200/80 bg-neutral-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
              <FileOutput className="h-4 w-4 text-emerald-600" />
              <span>Generated XSD Schema</span>
            </div>
            {outputXsd ? (
              <Badge variant="success" size="sm">
                <Check className="h-3 w-3 mr-0.5 text-emerald-600" />
                Valid XSD 1.0
              </Badge>
            ) : (
              <span className="text-[11px] text-neutral-400 font-mono">
                Awaiting Generation
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleGenerate()}
              disabled={isGenerating || !inputXml.trim()}
              className="h-7 px-3 text-xs font-semibold shadow-xs"
              id="generate-xsd-btn"
            >
              {isGenerating ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Generate XSD
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyXsd}
              disabled={!outputXsd}
              title="Copy XSD to clipboard"
              className="h-7 px-2 text-xs"
              id="copy-xsd-btn"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadXsd}
              disabled={!outputXsd}
              title="Download XSD file"
              className="h-7 px-2 text-xs"
              id="download-xsd-btn"
            >
              <Download className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>

        {/* Code Editor (Read Only) */}
        <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
          <CodeEditor
            value={outputXsd}
            readOnly
            placeholder="The generated W3C XML Schema (XSD 1.0) will appear here after clicking 'Generate XSD'..."
            height="100%"
            minHeight="100%"
          />
        </div>

        {/* Output Schema Diagnostics & Metrics Footer */}
        {metrics && (
          <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-200/80 text-[11px] text-neutral-600 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-neutral-700">
                <strong>{metrics.elementCount}</strong> elements
              </span>
              <span className="text-neutral-300">·</span>
              <span className="font-mono text-neutral-700">
                <strong>{metrics.attributeCount}</strong> attributes
              </span>
              <span className="text-neutral-300">·</span>
              <span className="font-mono text-neutral-700">
                <strong>{metrics.complexTypeCount}</strong> complexTypes
              </span>
              {metrics.targetNamespace && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="font-mono text-neutral-500 truncate max-w-[200px]" title={metrics.targetNamespace}>
                    ns: {metrics.targetNamespace}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 font-mono text-emerald-700">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span>100% Validated ({metrics.executionTimeMs} ms)</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  // Bottom educational information section
  const infoSection = (
    <div className="mt-12 space-y-8">
      {/* Feature Highlights Grid */}
      <div className="grid md:grid-cols-3 gap-5">
        <Card padding="md" className="bg-white border-neutral-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4 text-primary-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                Deterministic Sibling Union
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                When repeated elements (e.g. line items) contain optional fields in some instances, all observed fields are merged with appropriate occurrences (<code className="font-mono text-primary-700">maxOccurs="unbounded"</code>).
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="bg-white border-neutral-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                Safe Conservative Inference
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Values with significant leading zeros (e.g. <code className="font-mono text-primary-700">00123</code>) and identifiers remain strings. Valid ISO dates, times, decimals, and booleans are accurately inferred.
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="bg-white border-neutral-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <Code2 className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                CPI & Integration Suite Ready
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Produces W3C XSD 1.0 schemas that import directly into SAP Cloud Integration Message Mappings, External Definitions, and SOAP adapters without schema errors.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Guide Section */}
      <Card padding="lg" className="bg-white border-neutral-200">
        <h3 className="text-base font-bold text-neutral-900 mb-3 flex items-center gap-2">
          <HelpCircle className="h-4.5 w-4.5 text-primary-600" />
          Using Generated XSD Schemas in SAP Cloud Integration (CPI)
        </h3>
        <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
          <p>
            In SAP Cloud Integration (Integration Suite / CPI), creating custom Message Mappings often requires an XSD schema for the source or target message structure. If you only have sample XML payloads from a REST API, test system, or legacy system, this generator creates valid XSD schemas in seconds.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/70">
              <h4 className="font-semibold text-neutral-900 mb-1">Step 1: Download Schema</h4>
              <p className="text-neutral-600">
                Paste your sample XML payload, click <strong>Generate XSD</strong>, and download the resulting <code className="font-mono text-neutral-800">.xsd</code> file.
              </p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/70">
              <h4 className="font-semibold text-neutral-900 mb-1">Step 2: Import into CPI iFlow</h4>
              <p className="text-neutral-600">
                In your CPI Integration Flow, navigate to <strong>Resources → Schemas</strong>, upload the <code className="font-mono text-neutral-800">.xsd</code> file, and select it in your Message Mapping step.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      <SEOHead
        title="XML to XSD Generator — Generate XML Schemas Online | ToolSAP"
        description="Free online XML to XSD Schema generator. Convert XML samples into production-ready W3C XSD 1.0 schemas for SAP Cloud Integration (CPI) and message mappings."
        canonical="/tools/xml-to-xsd"
        keywords={[
          'xml to xsd',
          'generate xsd',
          'xml schema generator',
          'sap cpi xsd generator',
          'xsd generator online',
          'sap message mapping schema',
        ]}
      />

      <ToolWorkspaceLayout
        toolName="XML → XSD Generator"
        toolDescription="Generate production-ready W3C XML Schema (XSD 1.0) definitions from XML samples. Fast, deterministic, and 100% in-browser."
        badgeLabel="100% In-Browser · Privacy-First"
        leftPane={leftPane}
        rightPane={rightPane}
        infoSection={infoSection}
      />
    </>
  );
}
