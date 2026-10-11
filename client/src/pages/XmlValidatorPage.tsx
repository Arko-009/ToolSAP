import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Copy,
  Upload,
  FileCode,
  Shield,
  Clock,
  ArrowRight,
  Layers,
  Code2,
  Home,
  Check,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useToastContext } from '@/components/ui/Toast';
import { ToolWorkspaceLayout } from '@/components/tools/ToolWorkspaceLayout';
import { CodeEditor } from '@/components/tools/CodeEditor';
import {
  validateXmlStructure,
  autoFixXml,
  validateAgainstXsd,
  type XmlValidationDiagnostic,
  type XsdValidationResult,
  SAMPLE_SAP_XSD,
} from '@/utils/xml/xmlValidator';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function XmlValidatorPage() {
  const { addToast } = useToastContext();

  // State
  const [inputXml, setInputXml] = useState('');
  const [inputXsd, setInputXsd] = useState(SAMPLE_SAP_XSD);
  const [validationMode, setValidationMode] = useState<'syntax' | 'xsd'>('syntax');
  const [activeTab, setActiveTab] = useState<'xml' | 'xsd'>('xml');
  const [activeFileName, setActiveFileName] = useState<string | null>(null);

  // Diagnostics state
  const [diagnostic, setDiagnostic] = useState<XmlValidationDiagnostic>(() =>
    validateXmlStructure('')
  );
  const [xsdResult, setXsdResult] = useState<XsdValidationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSearchNotice, setShowSearchNotice] = useState(true);

  // Derived input metrics
  const linesCount = inputXml ? inputXml.split(/\r?\n/).length : 0;
  const charCount = inputXml.length;
  const sizeBytes = new Blob([inputXml]).size;

  // Run validation
  const runValidation = useCallback(
    (xmlToValidate = inputXml, xsdToValidate = inputXsd, mode = validationMode) => {
      const diag = validateXmlStructure(xmlToValidate);
      setDiagnostic(diag);

      if (mode === 'xsd') {
        const schemaRes = validateAgainstXsd(xmlToValidate, xsdToValidate);
        setXsdResult(schemaRes);
      } else {
        setXsdResult(null);
      }
    },
    [inputXml, inputXsd, validationMode]
  );

  // Auto-validate whenever input changes
  useEffect(() => {
    runValidation(inputXml, inputXsd, validationMode);
  }, [inputXml, inputXsd, validationMode, runValidation]);

  // Handle Auto-Fix
  const handleAutoFix = () => {
    if (!inputXml.trim()) return;
    const { fixedXml, fixes } = autoFixXml(inputXml);
    if (fixes.length === 0) {
      addToast({
        type: 'info',
        title: 'No automatic fixes needed',
        description: 'No unescaped characters, BOM, or quotes issues were detected.',
      });
      return;
    }

    setInputXml(fixedXml);
    addToast({
      type: 'success',
      title: 'Auto-Fix Applied',
      description: fixes.join('. '),
    });
  };

  // Copy
  const handleCopy = async () => {
    if (!inputXml) return;
    try {
      await navigator.clipboard.writeText(inputXml);
      setCopied(true);
      addToast({
        type: 'success',
        title: 'Copied to clipboard',
        description: `${linesCount} lines copied.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({
        type: 'error',
        title: 'Copy failed',
        description: 'Could not access clipboard.',
      });
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      addToast({
        type: 'error',
        title: 'File too large',
        description: 'Please upload an XML file under 5 MB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputXml(text);
      setActiveFileName(file.name);
      addToast({
        type: 'success',
        title: 'File dropped',
        description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      });
    };
    reader.readAsText(file);
  };

  const isInputEmpty = !inputXml.trim();

  const isActuallyValid =
    validationMode === 'syntax'
      ? diagnostic.isValid
      : diagnostic.isValid && (xsdResult ? xsdResult.isValid : true);

  const primaryError =
    validationMode === 'xsd' && xsdResult && !xsdResult.isValid && xsdResult.errors.length > 0
      ? xsdResult.errors[0]
      : diagnostic.errors[0];

  const allWarnings = [
    ...diagnostic.warnings,
    ...(validationMode === 'xsd' && xsdResult ? xsdResult.warnings : []),
  ];

  return (
    <>
      <SEOHead
        title="XML Validator — Validate XML & XSD Schemas Online | ToolSAP"
        description="Free online XML validator for SAP developers. Check XML well-formedness, validate SOAP and IDoc structures, line-by-line syntax error diagnostics, 100% in-browser privacy."
        canonical="/tools/xml-validator"
        keywords={[
          'xml validator',
          'validate xml',
          'xml syntax checker',
          'sap xml validator',
          'cpi xml validator',
          'xml well-formedness',
          'xsd validator online',
          'toolsap',
        ]}
      />

      {/* JSON-LD Structured Data for Software Application */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'ToolSAP XML Validator',
            url: 'https://tool-sap.vercel.app/tools/xml-validator',
            description:
              'Free in-browser XML syntax validator and XSD schema checker for SAP Integration Suite and CPI developers.',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'All',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            creator: {
              '@type': 'Organization',
              name: 'ToolSAP',
              url: 'https://tool-sap.vercel.app/',
            },
          }),
        }}
      />

      {/* Search Landing Discovery Callout */}
      {showSearchNotice && (
        <div className="bg-primary-950 text-white border-b border-primary-900/60 py-2.5 px-4 text-xs transition-all">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                <strong className="font-semibold text-sky-300">ToolSAP Platform:</strong> You are on the{' '}
                <span className="text-white font-medium">XML Validator</span> tool. Looking for our main homepage or SAP learning hub?
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-sky-300 hover:text-white underline underline-offset-2 font-medium"
              >
                <Home className="h-3 w-3" />
                <span>Go to Homepage</span>
              </Link>
              <span className="text-primary-700">|</span>
              <Link
                to="/tools"
                className="inline-flex items-center gap-1 text-sky-300 hover:text-white font-medium"
              >
                <span>All Tools</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
              <button
                onClick={() => setShowSearchNotice(false)}
                className="text-primary-400 hover:text-white ml-2 text-xs"
                title="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <ToolWorkspaceLayout
        toolName="XML Validator"
        toolDescription="Validate XML well-formedness, pinpoint syntax errors with line/column markers, test XSD schemas, and diagnose SAP Integration Suite payloads with 100% in-browser privacy."
        badgeLabel="100% In-Browser · Privacy Guaranteed"
        toolbarActions={
          <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Left: Validation Mode & Sample Select */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center p-1 rounded-lg bg-neutral-100 border border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setValidationMode('syntax');
                    setActiveTab('xml');
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    validationMode === 'syntax'
                      ? 'bg-white text-primary-700 shadow-2xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 inline mr-1 text-primary-600" />
                  Syntax & Well-Formedness
                </button>
                <button
                  type="button"
                  onClick={() => setValidationMode('xsd')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    validationMode === 'xsd'
                      ? 'bg-white text-primary-700 shadow-2xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <FileCheck2 className="h-3.5 w-3.5 inline mr-1 text-emerald-600" />
                  XSD Schema Validation
                </button>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() => runValidation()}
              >
                Re-Validate
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={<Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                onClick={handleAutoFix}
                title="Auto-escape bare ampersands, fix BOM, clean quotes"
              >
                Auto-Fix Common Errors
              </Button>



              <Button
                variant="secondary"
                size="sm"
                icon={copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                onClick={handleCopy}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        }
        leftPane={
          <div
            className={`w-full h-[580px] lg:h-[620px] flex flex-col bg-white rounded-xl border transition-colors shadow-2xs overflow-hidden ${
              isDragging ? 'border-primary-500 ring-2 ring-primary-100' : 'border-neutral-200'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Left Header */}
            <div className="flex items-center justify-between px-4 py-2.5 min-h-[46px] h-[46px] bg-neutral-50/80 border-b border-neutral-200 shrink-0">
              <div className="flex items-center gap-2">
                {validationMode === 'xsd' ? (
                  <div className="inline-flex rounded-md p-0.5 bg-neutral-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('xml')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        activeTab === 'xml' ? 'bg-white text-primary-700 font-semibold shadow-2xs' : 'text-neutral-600'
                      }`}
                    >
                      XML Payload
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('xsd')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        activeTab === 'xsd' ? 'bg-white text-emerald-700 font-semibold shadow-2xs' : 'text-neutral-600'
                      }`}
                    >
                      XSD Schema Definition
                    </button>
                  </div>
                ) : (
                  <>
                    <FileCode className="h-4 w-4 text-primary-600" />
                    <span className="text-xs font-semibold text-neutral-800">
                      {activeFileName || 'XML Document Input'}
                    </span>
                  </>
                )}
                {activeFileName && validationMode === 'syntax' && (
                  <span className="text-[11px] text-neutral-400 font-mono">({activeFileName})</span>
                )}
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
              {validationMode === 'xsd' && activeTab === 'xsd' ? (
                <CodeEditor
                  value={inputXsd}
                  onChange={(val) => setInputXsd(val)}
                  placeholder="Paste or type XSD Schema (<xs:schema>)..."
                  height="100%"
                  minHeight="100%"
                />
              ) : (
                <CodeEditor
                  value={inputXml}
                  onChange={(val) => setInputXml(val)}
                  placeholder="Paste or upload XML payload to validate..."
                  hasError={!isInputEmpty && !isActuallyValid}
                  height="100%"
                  minHeight="100%"
                />
              )}

              {/* Drag overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-primary-50/90 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none z-20 border-2 border-dashed border-primary-500 rounded-lg m-2">
                  <Upload className="h-8 w-8 text-primary-600 animate-bounce mb-2" />
                  <p className="text-sm font-semibold text-primary-900">Drop XML File Here to Validate</p>
                  <p className="text-xs text-primary-700">Supported: .xml, .xsd, .wsdl, .soap</p>
                </div>
              )}
            </div>

            {/* Editor Bottom Evaluation Bar */}
            <div className="flex items-center justify-between px-4 py-2 min-h-[40px] h-[40px] bg-neutral-50/80 border-t border-neutral-200 text-xs text-neutral-500 font-mono shrink-0">
              <span className="text-[11px] text-neutral-400 font-sans font-medium">
                {validationMode === 'xsd' && activeTab === 'xsd' ? 'Schema Definition' : 'Input Payload'}
              </span>
              <div className="flex items-center gap-2.5">
                <span>{linesCount.toLocaleString()} lines</span>
                <span>•</span>
                <span>{charCount.toLocaleString()} chars</span>
                <span>•</span>
                <span>{(sizeBytes / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>
        }
        rightPane={
          <div className="w-full h-[580px] lg:h-[620px] flex flex-col bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
            {/* Right Header */}
            <div className="flex items-center justify-between px-4 py-2.5 min-h-[46px] h-[46px] bg-neutral-50/80 border-b border-neutral-200 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-primary-600" />
                <span className="text-xs font-semibold text-neutral-800">
                  Validation Results & Diagnostics
                </span>
              </div>
              <div>
                {isInputEmpty ? (
                  <Badge variant="neutral" size="sm">
                    Awaiting Input
                  </Badge>
                ) : isActuallyValid ? (
                  <Badge variant="success" size="sm" dot>
                    PASS · Valid XML
                  </Badge>
                ) : (
                  <Badge variant="error" size="sm" dot>
                    FAIL · Syntax Error
                  </Badge>
                )}
              </div>
            </div>

            {/* Right Body */}
            <div className="flex-1 min-h-0 relative flex flex-col overflow-y-auto bg-neutral-50/30">
              {isInputEmpty ? (
                <div className="h-full flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-400 mb-4 shadow-2xs">
                    <FileCode className="h-7 w-7 stroke-[1.75]" />
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mb-2">
                    Input is Empty
                  </h3>

                  <p className="text-sm text-neutral-500 max-w-sm mb-6 leading-relaxed">
                    There is currently no XML document in the editor to inspect or validate.
                  </p>

                  <div className="w-full max-w-md flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-neutral-100/90 border border-neutral-200 text-neutral-700 text-sm shadow-2xs">
                    <span className="font-semibold text-neutral-800">Paste your XML code</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Status Card */}
                  {isActuallyValid ? (
                    <Card padding="lg" className="border-emerald-200 bg-emerald-50/60 shadow-xs">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-emerald-950">
                              {validationMode === 'xsd' ? 'Valid XML & Schema Match' : 'Well-Formed & Valid XML'}
                            </h3>
                            <Badge variant="success" size="sm" dot>
                              PASS
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                            {validationMode === 'xsd'
                              ? 'The document is structurally well-formed and conforms to the provided XSD schema rules.'
                              : 'No syntax errors detected. Root element is properly closed, tags are balanced, and special characters are escaped.'}
                          </p>

                          <div className="mt-3.5 pt-3 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] text-emerald-700 font-mono flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Validated in {diagnostic.metrics.executionTimeMs}ms
                            </span>
                            <Link
                              to="/tools/xml-formatter"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                            >
                              <span>Need to format this payload? Open XML Formatter</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card padding="lg" className="border-rose-200 bg-rose-50/70 shadow-xs">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                          <AlertCircle className="h-5 w-5 stroke-[2.5]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-rose-950">Syntax Error Detected</h3>
                            {primaryError?.category && (
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-200/80 text-rose-800 font-semibold">
                                {primaryError.category.replace('-', ' ')}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 text-xs font-medium text-rose-900 bg-white/80 p-2.5 rounded-lg border border-rose-200/90 font-mono">
                            {primaryError?.message || 'Malformed XML document.'}
                          </div>

                          {/* Location marker */}
                          {(primaryError?.line !== undefined || primaryError?.column !== undefined) && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-rose-800 font-semibold">
                              <span className="bg-rose-200/90 text-rose-900 px-2 py-0.5 rounded text-[11px] font-mono">
                                {primaryError.line !== undefined ? `Line ${primaryError.line}` : ''}
                                {primaryError.column !== undefined ? `, Col ${primaryError.column}` : ''}
                              </span>
                              <span className="text-neutral-500 font-normal">in source payload</span>
                            </div>
                          )}

                          {/* Code Snippet Box */}
                          {primaryError?.snippet && (
                            <div className="mt-3 bg-neutral-900 text-neutral-100 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed border border-neutral-800">
                              <pre className="text-[11px] whitespace-pre">{primaryError.snippet}</pre>
                            </div>
                          )}

                          {/* Suggestion & Fix */}
                          {primaryError?.suggestion && (
                            <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200/90 text-amber-900 text-xs">
                              <div className="flex items-start gap-2">
                                <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-amber-950">How to Fix (SAP CPI): </span>
                                  <span>{primaryError.suggestion}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="mt-3.5 flex items-center justify-between">
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Sparkles className="h-3.5 w-3.5" />}
                              onClick={handleAutoFix}
                              className="bg-rose-600 hover:bg-rose-700 text-white"
                            >
                              Auto-Fix with ToolSAP
                            </Button>
                            <span className="text-[11px] text-neutral-400 font-mono">
                              Error code: {primaryError?.category || 'xml-syntax'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Warnings & Advisories */}
                  {allWarnings.length > 0 && (
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900">
                      <div className="flex items-center gap-2 font-semibold text-amber-950 mb-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span>Integration Advisories ({allWarnings.length})</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px]">
                        {allWarnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Structure Metrics Dashboard */}
                  <Card padding="md" className="border-neutral-200 shadow-2xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-primary-600" />
                      <span>Payload Structure & Metrics</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
                        <div className="text-[10px] text-neutral-500 uppercase font-semibold">Total Tags</div>
                        <div className="text-base font-bold text-neutral-900 mt-0.5">
                          {diagnostic.metrics.elementCount.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
                        <div className="text-[10px] text-neutral-500 uppercase font-semibold">Attributes</div>
                        <div className="text-base font-bold text-neutral-900 mt-0.5">
                          {diagnostic.metrics.attributeCount.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
                        <div className="text-[10px] text-neutral-500 uppercase font-semibold">Max Depth</div>
                        <div className="text-base font-bold text-neutral-900 mt-0.5">
                          {diagnostic.metrics.maxDepth} levels
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
                        <div className="text-[10px] text-neutral-500 uppercase font-semibold">Namespaces</div>
                        <div className="text-base font-bold text-neutral-900 mt-0.5">
                          {diagnostic.metrics.namespaces.length}
                        </div>
                      </div>
                    </div>

                    {/* Root Element and Namespaces Detail */}
                    {diagnostic.metrics.rootElementName && (
                      <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500 font-medium">Root Element:</span>
                          <span className="font-mono font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                            &lt;{diagnostic.metrics.rootElementName}&gt;
                          </span>
                        </div>

                        {diagnostic.metrics.namespaces.length > 0 && (
                          <div className="mt-1">
                            <div className="text-[11px] text-neutral-500 font-medium mb-1.5">Declared Namespaces:</div>
                            <div className="space-y-1">
                              {diagnostic.metrics.namespaces.map((ns, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] font-mono bg-neutral-50 border border-neutral-200/60 rounded px-2 py-1 flex items-center justify-between gap-2 overflow-hidden"
                                >
                                  <span className="font-semibold text-neutral-700 shrink-0">
                                    xmlns{ns.prefix !== '(default)' ? `:${ns.prefix}` : ''}
                                  </span>
                                  <span className="text-neutral-500 truncate text-[10px]" title={ns.uri}>
                                    {ns.uri}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </div>

            {/* Right Bottom Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 min-h-[40px] h-[40px] bg-neutral-50/80 border-t border-neutral-200 text-xs text-neutral-500 font-mono shrink-0">
              <span className="text-[11px] text-neutral-400 font-sans font-medium">
                Diagnostic Engine
              </span>
              <div className="flex items-center gap-2">
                {isInputEmpty ? (
                  <span className="text-[11px] text-neutral-400 font-sans">Ready to validate</span>
                ) : isActuallyValid ? (
                  <span className="text-[11px] text-emerald-700 font-sans font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Validated in {diagnostic.metrics.executionTimeMs}ms
                  </span>
                ) : (
                  <span className="text-[11px] text-rose-700 font-sans font-medium">
                    {diagnostic.errors.length} error{diagnostic.errors.length > 1 ? 's' : ''} detected
                  </span>
                )}
              </div>
            </div>
          </div>
        }
        infoSection={
          <div className="border-t border-neutral-200/80 pt-10">
            {/* Guide Header */}
            <div className="max-w-3xl mb-8">
              <Badge variant="neutral" size="sm" className="mb-2">
                SAP Integration Knowledge
              </Badge>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Troubleshooting XML Errors in SAP Cloud Integration (CPI)
              </h2>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                XML parsing errors are the leading cause of HTTP 500 adapter crashes and mapping runtime exceptions in SAP Integration Suite. Here is how to diagnose and prevent them.
              </p>
            </div>

            {/* Common Issues Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Unescaped Characters in Text
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Legacy ERP or CRM payloads frequently include bare ampersands (e.g., &quot;AT&amp;T&quot;). In XML, these must be strictly encoded as <code className="text-primary-700 bg-neutral-100 px-1 py-0.5 rounded">&amp;amp;</code>.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Code2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Tag Casing Discrepancies
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Unlike HTML, XML is strictly case-sensitive. Closing <code className="text-primary-700 bg-neutral-100 px-1 py-0.5 rounded">&lt;Sender&gt;</code> with <code className="text-primary-700 bg-neutral-100 px-1 py-0.5 rounded">&lt;/sender&gt;</code> triggers an unrecoverable DOM parser failure.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Shield className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  100% Client-Side Privacy
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  ToolSAP processes all validation directly in your browser JavaScript engine. Sensitive ERP customer master data, financial records, and employee information never touch external servers.
                </p>
              </div>
            </div>

            {/* Cross-Links to Other Tools */}
            <div className="p-6 rounded-xl bg-neutral-50 border border-neutral-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Explore More Free SAP Developer Tools</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Speed up message transformations, Groovy scripting, and IDoc debugging.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/tools/xml-formatter">
                  <Button variant="secondary" size="sm">
                    XML Formatter &amp; Beautifier
                  </Button>
                </Link>
                <Link to="/tools">
                  <Button variant="primary" size="sm">
                    All Tools
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        }
      />
    </>
  );
}
