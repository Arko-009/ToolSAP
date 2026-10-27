import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Trash2,
  X,
  ChevronDown,
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
  autoFixXmlWithXsd,
  type XmlValidationDiagnostic,
  type XsdValidationResult,
  type AutoFixReport,
  SAMPLE_SAP_XSD,
} from '@/utils/xml/xmlValidator';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const XML_VALIDATOR_FAQS = [
  {
    question: 'What is an XML Validator and why is it important?',
    answer:
      'An XML Validator is a developer utility that verifies whether an XML document adheres strictly to W3C XML specifications. It performs two critical levels of verification: Well-Formedness (ensuring valid root element, matching case-sensitive tags, proper nesting, and quoted attributes) and Schema Validity (checking elements, sequences, and data types against an XSD schema or DTD). Validating XML prevents parser exceptions, HTTP 500 adapter errors, and broken data integrations.',
  },
  {
    question: 'How do I validate an XML file online for free?',
    answer:
      'Paste your XML code directly into the editor or click "Upload File" to load any .xml, .xsd, or .wsdl document. ToolSAP runs real-time syntax checking in your browser, highlighting syntax errors with exact line and column numbers. You can also validate against a custom schema by switching to the "XSD Schema" mode.',
  },
  {
    question: 'What is the difference between Well-Formed XML and Valid XML?',
    answer:
      'Well-Formed XML satisfies general XML syntax rules (one root element, all tags closed, correct casing, properly escaped characters like &amp; and &lt;). Valid XML is well-formed XML that also strictly adheres to the structural rules, cardinality constraints, and data types defined in a corresponding XSD (XML Schema Definition) or DTD document.',
  },
  {
    question: 'How does the 1-Click Auto-Fix XML feature work?',
    answer:
      'ToolSAP includes an intelligent client-side Auto-Fix engine. When your XML has syntax errors—such as missing closing tags, unescaped ampersands (& to &amp;), unquoted attributes, unclosed comments, or duplicate XML declarations—clicking "Auto-Fix XML" automatically repairs the syntax and displays an audit diff of every change made.',
  },
  {
    question: 'Is my XML payload secure and private when validating online?',
    answer:
      'Yes, 100% private. All XML parsing, syntax checking, and schema validation execute entirely in your web browser using local client-side JavaScript. Your confidential ERP payloads, customer data, and API messages are never transmitted to any external server or stored anywhere.',
  },
  {
    question: 'Can I validate XML against a custom XSD Schema?',
    answer:
      'Yes. Toggle to the "XSD Schema" validation mode to input or upload your W3C XSD schema. ToolSAP validates element sequences, required attributes, enumeration constraints, and data types against the provided schema definition.',
  },
];

export function XmlValidatorPage() {
  const { addToast } = useToastContext();
  const location = useLocation();

  // State
  const [inputXml, setInputXml] = useState('');
  const [inputXsd, setInputXsd] = useState(SAMPLE_SAP_XSD);
  const [validationMode, setValidationMode] = useState<'syntax' | 'xsd'>('syntax');
  const [activeTab, setActiveTab] = useState<'xml' | 'xsd'>('xml');
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Load XML forwarded from XML Formatter (on syntax error) or other tools
  useEffect(() => {
    const forwardedXml = (location.state as { xml?: string } | null)?.xml;
    if (forwardedXml) {
      setInputXml(forwardedXml);
      return;
    }
    const sessionXml = sessionStorage.getItem('toolsap_xml_to_validate');
    if (sessionXml) {
      setInputXml(sessionXml);
      sessionStorage.removeItem('toolsap_xml_to_validate');
    }
  }, [location.state]);

  // Diagnostics state
  const [diagnostic, setDiagnostic] = useState<XmlValidationDiagnostic>(() =>
    validateXmlStructure('')
  );
  const [xsdResult, setXsdResult] = useState<XsdValidationResult | null>(null);
  const [lastFixReport, setLastFixReport] = useState<AutoFixReport | null>(null);
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

  // Expose automated test suite for browser verification in development
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/utils/xml/xmlValidator.testSuite').then((mod) => {
        (window as unknown as { __runXmlValidatorTestSuite?: () => unknown }).__runXmlValidatorTestSuite =
          mod.runXmlValidatorTestSuite;
      });
    }
  }, []);

  // Handle Auto-Fix
  const handleAutoFix = () => {
    if (!inputXml.trim()) return;
    const { fixedXml, fixes, report } = autoFixXml(inputXml);
    setLastFixReport(report);

    if (fixes.length === 0) {
      addToast({
        type: 'info',
        title: 'No automatic fixes needed',
        description: 'Document is already valid or no safe automated fixes could be determined.',
      });
      return;
    }

    setInputXml(fixedXml);
    addToast({
      type: 'success',
      title: 'Auto-Fix Applied',
      description: fixes.length === 1 ? fixes[0] : `Successfully repaired ${fixes.length} issues in ${report.totalPasses} pass${report.totalPasses > 1 ? 'es' : ''}.`,
    });
  };

  // Dedicated Validate with XSD Pipeline (Validation + Schema-Guided Auto-Repair)
  const handleValidateWithXsd = () => {
    if (!inputXml.trim()) {
      addToast({
        type: 'error',
        title: 'Input XML is empty',
        description: 'Please paste or upload an XML document to validate.',
      });
      return;
    }
    if (!inputXsd.trim()) {
      addToast({
        type: 'error',
        title: 'XSD Schema is empty',
        description: 'Please provide an XSD schema definition in the schema tab.',
      });
      return;
    }

    // Execute full 5-stage validation and repair pipeline
    const { fixedXml, fixes, report } = autoFixXmlWithXsd(inputXml, inputXsd);
    setLastFixReport(report);

    if (fixes.length > 0) {
      setInputXml(fixedXml);
      const schemaRes = validateAgainstXsd(fixedXml, inputXsd);
      setXsdResult(schemaRes);
      setDiagnostic(validateXmlStructure(fixedXml));

      addToast({
        type: report.finalValid ? 'success' : 'info',
        title: report.finalValid ? 'Validated & Repaired with XSD' : 'Partially Repaired with XSD',
        description: report.finalValid
          ? `Repaired ${fixes.length} issue(s) to conform with XSD schema rules.`
          : `Applied ${fixes.length} safe fix(es). Some issues require manual confirmation.`,
      });
    } else {
      const schemaRes = validateAgainstXsd(inputXml, inputXsd);
      setXsdResult(schemaRes);
      setDiagnostic(validateXmlStructure(inputXml));

      if (schemaRes.isValid) {
        addToast({
          type: 'success',
          title: 'Valid XML & Schema Match',
          description: 'Document is structurally well-formed and conforms to the provided XSD schema rules.',
        });
      } else {
        addToast({
          type: 'warning',
          title: 'XSD Validation Completed',
          description: `${schemaRes.errors.length} schema violation(s) detected. Check diagnostics below.`,
        });
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      setLastFixReport(null);
      setActiveFileName(file.name);
      addToast({
        type: 'success',
        title: 'File uploaded',
        description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Clear
  const handleClear = () => {
    if (!inputXml && !activeFileName) return;
    setInputXml('');
    setLastFixReport(null);
    setActiveFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addToast({
      type: 'info',
      title: 'Editor Cleared',
      description: 'XML input payload has been reset.',
    });
  };

  // Copy
  const handleCopy = async () => {
    const textToCopy = validationMode === 'xsd' && activeTab === 'xsd' ? inputXsd : inputXml;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
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
      setLastFixReport(null);
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

  const activeErrors =
    validationMode === 'xsd' && xsdResult && !xsdResult.isValid && xsdResult.errors.length > 0
      ? xsdResult.errors
      : diagnostic.errors;

  const allWarnings = [
    ...diagnostic.warnings,
    ...(validationMode === 'xsd' && xsdResult ? xsdResult.warnings : []),
  ];

  return (
    <>
      <SEOHead
        title="Free XML Validator Online | ToolSAP"
        description="Validate XML syntax, find errors with line numbers, and check XML against an XSD schema using ToolSAP’s free online XML Validator."
        canonical="/tools/xml-validator"
        keywords={[
          'free xml validator online',
          'xml validator',
          'validate xml online',
          'xml syntax checker',
          'sap xml validator',
          'xsd validator online',
          'cpi xml validator',
          'toolsap',
        ]}
      />

      {/* JSON-LD Structured Data with @graph for WebApplication, BreadcrumbList, and FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebApplication',
                name: 'Free XML Validator Online | ToolSAP',
                url: 'https://tool-sap.vercel.app/tools/xml-validator',
                description:
                  'Validate XML syntax, find errors with line numbers, and check XML against an XSD schema using ToolSAP’s free online XML Validator.',
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
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: 'https://tool-sap.vercel.app/',
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Tools',
                    item: 'https://tool-sap.vercel.app/tools',
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: 'Free XML Validator Online',
                    item: 'https://tool-sap.vercel.app/tools/xml-validator',
                  },
                ],
              },
              {
                '@type': 'FAQPage',
                mainEntity: XML_VALIDATOR_FAQS.map((faq) => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer,
                  },
                })),
              },
            ],
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

      {/* Hidden file input for file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,.xsd,.wsdl,.soap,text/xml,application/xml"
        onChange={handleFileInputChange}
        className="hidden"
      />

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
              {validationMode === 'xsd' ? (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<FileCheck2 className="h-3.5 w-3.5 text-white" />}
                    onClick={handleValidateWithXsd}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs font-bold"
                  >
                    Validate with XSD
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Sparkles className="h-3.5 w-3.5 text-emerald-600" />}
                    onClick={handleValidateWithXsd}
                    title="Auto-repair schema violations, sequence ordering, and namespaces"
                  >
                    Auto-Fix with XSD
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
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
            <div className="flex items-center justify-between px-4 py-2 min-h-[46px] h-[46px] bg-neutral-50/80 border-b border-neutral-200 shrink-0">
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

              {/* Editor Top-Right Action Buttons: Upload, Clear, Copy */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-md transition-all shadow-2xs cursor-pointer"
                  title="Upload XML file"
                >
                  <Upload className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Upload</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!inputXml && !activeFileName}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-neutral-200 hover:border-rose-200 rounded-md transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-neutral-600 disabled:hover:border-neutral-200"
                  title="Clear editor"
                >
                  <Trash2 className="h-3.5 w-3.5 text-neutral-500 hover:text-rose-600" />
                  <span>Clear</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!inputXml}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-md transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-neutral-600"
                  title="Copy XML"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-neutral-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
              {validationMode === 'xsd' && activeTab === 'xsd' ? (
                <CodeEditor
                  value={inputXsd}
                  onChange={(val) => {
                    setInputXsd(val);
                    setLastFixReport(null);
                  }}
                  placeholder="Paste or type XSD Schema (<xs:schema>)..."
                  height="100%"
                  minHeight="100%"
                />
              ) : (
                <CodeEditor
                  value={inputXml}
                  onChange={(val) => {
                    setInputXml(val);
                    setLastFixReport(null);
                  }}
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
                    {validationMode === 'xsd' ? 'PASS · Valid XML & Schema Match' : 'PASS · Valid XML'}
                  </Badge>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                    onClick={validationMode === 'xsd' ? handleValidateWithXsd : handleAutoFix}
                    className={
                      validationMode === 'xsd'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs font-bold'
                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                    }
                  >
                    {validationMode === 'xsd' ? 'Auto-Fix with XSD' : 'Auto-Fix with ToolSAP'}
                  </Button>
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
                  {/* Auto-Fix Audit & Diff Card */}
                  {lastFixReport && lastFixReport.fixes.length > 0 && (
                    <Card padding="md" className="border-indigo-200 bg-linear-to-br from-indigo-50/70 to-purple-50/40 shadow-xs">
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-indigo-200/70">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-indigo-950">Auto-Fix Engine Audit & Diff</h4>
                            <p className="text-[11px] text-indigo-700 font-medium">
                              {lastFixReport.fixes.length} correction{lastFixReport.fixes.length > 1 ? 's' : ''} applied across {lastFixReport.totalPasses} pass{lastFixReport.totalPasses > 1 ? 'es' : ''} ({lastFixReport.executionTimeMs}ms)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="primary" size="sm">
                            {isActuallyValid || lastFixReport.finalValid ? 'REPAIRED & VERIFIED' : 'PARTIALLY REPAIRED'}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => setLastFixReport(null)}
                            className="p-1 rounded-md text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100/50 transition-colors cursor-pointer"
                            title="Dismiss audit report"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Security Warnings if any */}
                      {lastFixReport.securityWarnings.length > 0 && (
                        <div className="mb-3 p-2.5 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                          <Shield className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold">Security Hardening Triggered:</span>
                            {lastFixReport.securityWarnings.map((w, wIdx) => (
                              <p key={wIdx} className="text-[11px] text-amber-800">{w}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Changes List */}
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {lastFixReport.fixes.map((item, fIdx) => (
                          <div
                            key={fIdx}
                            className="p-2.5 rounded-lg bg-white/90 border border-indigo-100 flex flex-col gap-1 text-xs shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    item.classification === 'safe-automatic'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : item.classification === 'confirmation-required'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                                  }`}
                                >
                                  {item.classification === 'safe-automatic'
                                    ? 'Safe Fix'
                                    : item.classification === 'confirmation-required'
                                    ? 'Decision Fix'
                                    : 'Diagnosis'}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-100 text-neutral-700 border border-neutral-200 font-semibold">
                                  {item.code}
                                </span>
                                {item.line !== undefined && (
                                  <span className="text-[10px] font-mono text-neutral-500">
                                    Line {item.line}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-semibold ${
                                  item.confidence === 'high'
                                    ? 'text-emerald-600'
                                    : item.confidence === 'medium'
                                    ? 'text-amber-600'
                                    : 'text-neutral-500'
                                }`}
                              >
                                Confidence: {item.confidence.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-neutral-800 text-[11px] font-mono leading-relaxed pl-0.5">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Unresolved / Confirmation Required Issues */}
                      {!isActuallyValid && lastFixReport.unresolvedIssues && lastFixReport.unresolvedIssues.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-indigo-200/70">
                          <div className="text-[11px] font-bold text-amber-950 mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            <span>
                              {lastFixReport.unresolvedIssues.some((i) => i.classification === 'confirmation-required')
                                ? 'Issues Requiring User Confirmation (Preserving Business Data)'
                                : 'Unresolved Issues Requiring Manual Action'} ({lastFixReport.unresolvedIssues.length})
                            </span>
                          </div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {lastFixReport.unresolvedIssues.map((issue, iIdx) => (
                              <div
                                key={iIdx}
                                className="p-2 rounded-lg bg-white/90 border border-amber-200/80 text-xs shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                                    {issue.code || 'SCHEMA_VIOLATION'}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      issue.classification === 'confirmation-required'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                                    }`}
                                  >
                                    {issue.classification === 'confirmation-required'
                                      ? 'Confirmation Required'
                                      : 'Diagnosis Only'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-neutral-800 mt-1 font-mono">
                                  {issue.message}
                                </p>
                                {issue.suggestion && (
                                  <p className="text-[10px] text-amber-800 mt-1 bg-amber-50/80 p-1.5 rounded border border-amber-100">
                                    <strong>Recommendation:</strong> {issue.suggestion}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  )}

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
                    <div className="space-y-4">
                      {activeErrors.length > 1 && (
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-950 text-xs font-semibold shadow-2xs">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            <span>
                              {activeErrors.length}{' '}
                              {validationMode === 'xsd'
                                ? activeErrors.length > 1
                                  ? 'Schema Violations Detected'
                                  : 'Schema Violation Detected'
                                : activeErrors.length > 1
                                ? 'Syntax Mistakes Detected'
                                : 'Syntax Mistake Detected'}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-rose-800 bg-white/90 px-2.5 py-0.5 rounded-md border border-rose-200">
                            {validationMode === 'xsd' ? 'All schema violations listed below' : 'All mistakes listed below'}
                          </span>
                        </div>
                      )}

                      {activeErrors.map((err, errIdx) => (
                        <Card key={errIdx} padding="lg" className="border-rose-200 bg-rose-50/70 shadow-xs">
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                              <AlertCircle className="h-5 w-5 stroke-[2.5]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-base font-bold text-rose-950">
                                  {err.source === 'xsd' || err.code === 'ERR_XSD_COMPILATION'
                                    ? activeErrors.length > 1
                                      ? `Schema Error #${errIdx + 1}: XSD Syntax Issue`
                                      : 'XSD Schema Syntax Issue'
                                    : err.category === 'schema-violation' || err.code?.startsWith('ERR_XSD_')
                                    ? activeErrors.length > 1
                                      ? `Violation #${errIdx + 1}: Schema Constraint`
                                      : 'Schema Constraint Violation'
                                    : err.category === 'namespace'
                                    ? activeErrors.length > 1
                                      ? `Violation #${errIdx + 1}: Namespace Mismatch`
                                      : 'Namespace Mismatch'
                                    : activeErrors.length > 1
                                    ? `Mistake #${errIdx + 1}: Syntax Error`
                                    : 'Syntax Error Detected'}
                                </h3>
                                {err.category && (
                                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-200/80 text-rose-800 font-semibold shrink-0">
                                    {err.category.replace('-', ' ')}
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 text-xs font-medium text-rose-900 bg-white/80 p-2.5 rounded-lg border border-rose-200/90 font-mono break-words">
                                {err.message || 'Malformed XML document.'}
                              </div>

                              {/* Location marker */}
                              {(err.line !== undefined || err.column !== undefined) && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-rose-800 font-semibold">
                                  <span className="bg-rose-200/90 text-rose-900 px-2 py-0.5 rounded text-[11px] font-mono">
                                    {err.line !== undefined ? `Line ${err.line}` : ''}
                                    {err.column !== undefined ? `, Col ${err.column}` : ''}
                                  </span>
                                  <span className="text-neutral-500 font-normal">in source payload</span>
                                </div>
                              )}

                              {/* Code Snippet Box */}
                              {err.snippet && (
                                <div className="mt-3 bg-neutral-900 text-neutral-100 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed border border-neutral-800">
                                  <pre className="text-[11px] whitespace-pre">{err.snippet}</pre>
                                </div>
                              )}

                              {/* Suggestion & Fix */}
                              {err.suggestion && (
                                <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200/90 text-amber-900 text-xs">
                                  <div className="flex items-start gap-2">
                                    <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-semibold text-amber-950">How to Fix (SAP CPI): </span>
                                      <span>{err.suggestion}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-end">
                                <span className="text-[11px] text-neutral-400 font-mono">
                                  Error code: {err.category || 'xml-syntax'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
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
                    {activeErrors.length} error{activeErrors.length > 1 ? 's' : ''} detected
                  </span>
                )}
              </div>
            </div>
          </div>
        }
        infoSection={
          <div className="border-t border-neutral-200/80 pt-12 space-y-14">
            {/* Section 1: How to Validate XML Online (3 Steps) */}
            <div>
              <div className="max-w-3xl mb-8">
                <Badge variant="neutral" size="sm" className="mb-2">
                  Step-by-Step Guide
                </Badge>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  How to Validate XML Online in 3 Easy Steps
                </h2>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Validate XML well-formedness, inspect syntax error line numbers, and check XML against W3C XSD schemas with zero setup.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs relative">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 font-bold text-sm flex items-center justify-center mb-3">
                    1
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                    Paste or Upload XML
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Paste your raw XML markup into the code editor or click <strong className="text-neutral-800">Upload File</strong> to load any <code className="text-primary-700 bg-neutral-100 px-1 py-0.5 rounded">.xml</code>, <code className="text-primary-700 bg-neutral-100 px-1 py-0.5 rounded">.xsd</code>, or <code className="text-primary-700 bg-neutral-100 px-1 py-0.5 rounded">.wsdl</code> payload up to 5 MB.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs relative">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-sm flex items-center justify-center mb-3">
                    2
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                    Instant Real-Time Diagnosis
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    ToolSAP automatically parses your XML as you type. If an error is detected, exact line numbers, column coordinates, and detailed error explanations appear in real time.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs relative">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 font-bold text-sm flex items-center justify-center mb-3">
                    3
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                    1-Click Auto-Fix or Validate XSD
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Click <strong className="text-neutral-800">Auto-Fix XML</strong> to repair unclosed tags, bare ampersands, and unquoted attributes, or switch to the XSD tab to validate against an XSD schema.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Key Capabilities Grid */}
            <div>
              <div className="max-w-3xl mb-8">
                <Badge variant="neutral" size="sm" className="mb-2">
                  Tool Capabilities
                </Badge>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  Free Online XML Validator Features
                </h2>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Engineered for developers, enterprise architects, and integration engineers who require fast, private, and dependable XML validation.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">W3C Well-Formedness Check</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Validates syntax according to official W3C XML standards. Checks root elements, closing tag pairs, nested hierarchies, and attribute quoting.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">W3C XML Schema (XSD) Validation</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Validate XML payloads against complete XSD schemas. Verifies element sequences, required child tags, min/max occurrences, and data types.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">1-Click Auto-Fix Engine</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Automatically repairs broken XML syntax with intelligent entity escaping, missing tag closure, and quote corrections, complete with an interactive audit diff.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">Exact Line & Column Mapping</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Identifies the exact character coordinate of XML parser failures. Click any diagnostic error to jump your cursor directly to the offending line.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">100% In-Browser Privacy</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    All validation executes purely in your browser JavaScript engine. Sensitive financial data, customer payloads, and credentials never touch any external server.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">Enterprise Payload Support</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Engineered to handle complex SAP IDoc XML, SOAP envelopes, REST XML API responses, multiple declared namespaces (xmlns), and CDATA blocks.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Troubleshooting Guide */}
            <div>
              <div className="max-w-3xl mb-8">
                <Badge variant="neutral" size="sm" className="mb-2">
                  Troubleshooting Guide
                </Badge>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  Common XML Syntax Errors &amp; Solutions
                </h2>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  XML parsing errors are the leading cause of HTTP 500 adapter crashes and message mapping exceptions in enterprise systems and SAP Cloud Integration (CPI).
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
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
                    Unclosed Comments &amp; CDATA
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Missing closing comment delimiters (<code className="text-primary-700 bg-neutral-100 px-1 py-0.5 rounded">--&gt;</code>) or CDATA tags (<code className="text-primary-700 bg-neutral-100 px-1 py-0.5 rounded">]]&gt;</code>) cause parser engines to swallow entire subsequent payloads.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Frequently Asked Questions (FAQ) Accordion */}
            <div>
              <div className="max-w-3xl mb-8">
                <Badge variant="neutral" size="sm" className="mb-2">
                  Frequently Asked Questions
                </Badge>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  Free XML Validator FAQs
                </h2>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Everything you need to know about XML validation, XSD schema checking, and browser privacy.
                </p>
              </div>

              <div className="space-y-3">
                {XML_VALIDATOR_FAQS.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-neutral-200 bg-white shadow-2xs overflow-hidden transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-neutral-900 hover:text-primary-600 transition-colors cursor-pointer"
                        aria-expanded={isOpen}
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-primary-600' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3 animate-fade-in">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 5: Cross-Links to Other Tools */}
            <div className="p-6 rounded-xl bg-neutral-50 border border-neutral-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Explore More Free Developer Tools</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Speed up XML formatting, XSD schema generation, XPath testing, and IDoc debugging.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/tools/xml-formatter">
                  <Button variant="secondary" size="sm">
                    XML Formatter
                  </Button>
                </Link>
                <Link to="/tools/xml-to-xsd">
                  <Button variant="secondary" size="sm">
                    XML to XSD
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
