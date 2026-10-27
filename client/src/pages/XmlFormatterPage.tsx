import { useState, useRef, useCallback } from 'react';
import {
  FileCode,
  FileCheck,
  Sparkles,
  Minimize2,
  Copy,
  Download,
  Upload,
  Trash2,
  AlertCircle,
  FileText,
  Settings2,
  Check,
  Info,
  ArrowRight,
  Shield,
  Clock,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToastContext } from '@/components/ui/Toast';
import { ToolWorkspaceLayout } from '@/components/tools/ToolWorkspaceLayout';
import { CodeEditor } from '@/components/tools/CodeEditor';
import {
  formatXml,
  minifyXml,
  SAP_SAMPLE_XML,
  type XmlFormatOptions,
  type XmlValidationError,
} from '@/utils/xml/xmlFormatter';
import { Link, useNavigate } from 'react-router-dom';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const XML_FORMATTER_FAQS = [
  {
    question: 'What is an XML Formatter and why should I use it?',
    answer:
      'An XML Formatter (or XML Beautifier / Pretty Printer) organizes raw, unformatted, or minified XML code by applying consistent indentation, line breaks, and tag alignment according to W3C specifications. It makes complex XML documents, SOAP messages, SAP IDocs, and API responses easy to read, debug, and maintain.',
  },
  {
    question: 'How do I format or pretty print XML online for free?',
    answer:
      'Simply paste your unformatted XML into the left code editor or click "Upload File" to select an XML file from your device. Choose your preferred indentation (2 spaces or 4 spaces) and quote style, then click "Format XML". Your beautified, syntax-highlighted XML appears instantly in the right pane ready to copy or download.',
  },
  {
    question: 'What is the difference between XML Formatting (Pretty Print) and Minification?',
    answer:
      'XML Formatting (Pretty Print) adds standardized indentation and newlines to maximize human readability for development and debugging. XML Minification removes all unnecessary whitespace, indentations, and line breaks without altering element data, significantly reducing payload file size for faster API transmission over networks.',
  },
  {
    question: 'Does this formatter preserve XML CDATA blocks and special entities?',
    answer:
      'Yes. ToolSAP uses an advanced enhanced parser that strictly preserves CDATA sections, DOCTYPE internal DTD subsets, special character entities (&amp;, &lt;, &gt;, &quot;, &apos;), XML namespace prefixes (xmlns), and mixed-content markup without corrupting data or breaking payload integrity.',
  },
  {
    question: 'Is my XML payload private and secure when formatting online?',
    answer:
      'Yes, 100% private. All formatting and minification execute entirely inside your web browser using client-side JavaScript. Your confidential ERP payloads, customer data, and API messages are never sent across the internet to any external server or stored anywhere.',
  },
  {
    question: 'What happens if my XML contains syntax errors?',
    answer:
      'If invalid XML is provided, ToolSAP detects syntax errors, highlights the issue, and provides a direct 1-click button to launch our XML Validator tool with your XML preloaded for automated syntax repair.',
  },
];

export function XmlFormatterPage() {
  const { addToast } = useToastContext();
  const navigate = useNavigate();

  // State
  const [inputXml, setInputXml] = useState('');
  const [outputXml, setOutputXml] = useState('');
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<'formatted' | 'minified' | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Redirect to XML Validator tool
  const redirectToValidator = useCallback(
    (xmlCode?: string) => {
      const xml = xmlCode !== undefined ? xmlCode : inputXml;
      if (xml) {
        sessionStorage.setItem('toolsap_xml_to_validate', xml);
      }
      navigate('/tools/xml-validator', { state: { xml } });
    },
    [inputXml, navigate]
  );

  // Formatting options
  const [tabWidth, setTabWidth] = useState<2 | 4>(2);
  const [quoteStyle, setQuoteStyle] = useState<'preserve' | 'double' | 'single'>('double');
  const [showOptions, setShowOptions] = useState(false);

  // Status and Diagnostics
  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState<XmlValidationError | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    lineCount: number;
    charCount: number;
    sizeBytes: number;
    executionTimeMs: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived input metrics
  const inputLineCount = inputXml ? inputXml.split('\n').length : 0;
  const inputCharCount = inputXml.length;
  const inputSizeBytes = new Blob([inputXml]).size;

  // Format action
  const handleFormat = useCallback(async (customInput?: string) => {
    const xmlToFormat = customInput !== undefined ? customInput : inputXml;
    if (!xmlToFormat.trim()) {
      setError({ message: 'Please enter or upload an XML document to format.' });
      return;
    }

    setIsFormatting(true);
    setError(null);
    setWarning(null);

    const options: XmlFormatOptions = {
      tabWidth,
      xmlWhitespaceSensitivity: 'ignore',
      xmlQuoteAttributes: quoteStyle,
      xmlSelfClosingSpace: true,
    };

    try {
      const result = await formatXml(xmlToFormat, options);
      if (result.success) {
        setOutputXml(result.output);
        setStats(result.stats);
        setLastMode('formatted');
        addToast({
          type: 'success',
          title: `XML formatted successfully in ${result.stats.executionTimeMs}ms`,
        });
      } else if (result.error) {
        setError(result.error);
        setOutputXml('');
        setStats(null);
        setLastMode(null);
        addToast({
          type: 'error',
          title: 'First Fix XML code With Validator',
          description: result.error.message || 'Syntax error detected. Click to open XML Validator and repair issues.',
          duration: 9000,
          action: {
            label: 'Open XML Validator',
            onClick: () => redirectToValidator(xmlToFormat),
          },
          onClick: () => redirectToValidator(xmlToFormat),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Formatting failed';
      setError({ message: msg });
      setOutputXml('');
      setStats(null);
      setLastMode(null);
      addToast({
        type: 'error',
        title: 'First Fix XML code With Validator',
        description: `${msg}. Click to open XML Validator and repair issues.`,
        duration: 9000,
        action: {
          label: 'Open XML Validator',
          onClick: () => redirectToValidator(xmlToFormat),
        },
        onClick: () => redirectToValidator(xmlToFormat),
      });
    } finally {
      setIsFormatting(false);
    }
  }, [inputXml, tabWidth, quoteStyle, addToast, redirectToValidator]);

  // Minify action
  const handleMinify = useCallback(() => {
    if (!inputXml.trim()) {
      setError({ message: 'Please enter or upload an XML document to minify.' });
      return;
    }

    setIsFormatting(true);
    setError(null);
    setWarning(null);

    try {
      const result = minifyXml(inputXml);
      if (result.success) {
        setOutputXml(result.output);
        setStats(result.stats);
        setLastMode('minified');
        if (result.warning) {
          setWarning(result.warning);
        }
        addToast({
          type: 'success',
          title: `XML minified safely (${result.stats.charCount} chars)`,
        });
      } else if (result.error) {
        setError(result.error);
        setOutputXml('');
        setStats(null);
        setLastMode(null);
        addToast({
          type: 'error',
          title: 'First Fix XML code With Validator',
          description: result.error.message || 'Syntax error detected. Click to open XML Validator and repair issues.',
          duration: 9000,
          action: {
            label: 'Open XML Validator',
            onClick: () => redirectToValidator(inputXml),
          },
          onClick: () => redirectToValidator(inputXml),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Minification failed';
      setError({ message: msg });
      setOutputXml('');
      setStats(null);
      setLastMode(null);
      addToast({
        type: 'error',
        title: 'First Fix XML code With Validator',
        description: `${msg}. Click to open XML Validator and repair issues.`,
        duration: 9000,
        action: {
          label: 'Open XML Validator',
          onClick: () => redirectToValidator(inputXml),
        },
        onClick: () => redirectToValidator(inputXml),
      });
    } finally {
      setIsFormatting(false);
    }
  }, [inputXml, addToast, redirectToValidator]);

  // Load sample XML
  const handleLoadSample = useCallback(() => {
    setInputXml(SAP_SAMPLE_XML);
    setActiveFileName('SAP_CPI_OrderRequest.xml');
    setError(null);
    setWarning(null);
    addToast({
      type: 'info',
      title: 'Sample SAP Cloud Integration payload loaded.',
    });
  }, [addToast]);

  // Clear all
  const handleClear = useCallback(() => {
    setInputXml('');
    setOutputXml('');
    setActiveFileName(null);
    setError(null);
    setWarning(null);
    setStats(null);
    setLastMode(null);
  }, []);

  // File upload reader
  const processUploadedFile = (file: File) => {
    const validExtensions = ['.xml', '.xsd', '.wsdl'];
    const lowerName = file.name.toLowerCase();
    const isSupported = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isSupported) {
      setError({
        message: `Unsupported file format "${file.name}". Please upload a valid XML document (.xml, .xsd, or .wsdl).`,
      });
      addToast({
        type: 'error',
        title: 'Unsupported file type. Use .xml, .xsd, or .wsdl',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setError({
        message: `File exceeds the 5 MB limit (size: ${sizeMB} MB). For browser stability, please upload a document under 5 MB.`,
      });
      addToast({
        type: 'error',
        title: 'File size exceeds 5 MB limit',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (typeof content === 'string') {
        setInputXml(content);
        setActiveFileName(file.name);
        setError(null);
        setWarning(null);
        addToast({
          type: 'success',
          title: `Loaded ${file.name} (${formatBytes(file.size)})`,
        });
      }
    };
    reader.onerror = () => {
      setError({ message: `Failed to read file "${file.name}". Check file permissions.` });
      addToast({ type: 'error', title: 'Failed to read file' });
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
    // reset input value so re-uploading the same file triggers change
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!outputXml) return;
    try {
      await navigator.clipboard.writeText(outputXml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast({
        type: 'success',
        title: 'Formatted XML copied to clipboard!',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Unable to copy. Please allow clipboard permissions.',
      });
    }
  };

  // Download formatted XML
  const handleDownload = () => {
    if (!outputXml) return;

    let downloadName = 'formatted.xml';
    if (activeFileName) {
      const dotIdx = activeFileName.lastIndexOf('.');
      if (dotIdx > 0) {
        const base = activeFileName.substring(0, dotIdx);
        const ext = activeFileName.substring(dotIdx);
        downloadName = `${base}.${lastMode || 'formatted'}${ext}`;
      } else {
        downloadName = `${activeFileName}.${lastMode || 'formatted'}.xml`;
      }
    }

    try {
      const blob = new Blob([outputXml], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      addToast({
        type: 'success',
        title: `Downloaded as ${downloadName}`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Download failed. Please try copying the output.',
      });
    }
  };

  return (
    <>
      <SEOHead
        title="Free XML Formatter Online — Beautify & Pretty Print XML | ToolSAP"
        description="Free online XML formatter and beautifier. Pretty print XML with clean indentation, minify payloads, and highlight syntax with 100% in-browser privacy."
        canonical="/tools/xml-formatter"
        keywords={[
          'free xml formatter online',
          'free xml formatter',
          'xml formatter online',
          'xml formatter',
          'xml beautifier online',
          'pretty print xml online',
          'format xml online',
          'xml minifier online',
          'xml pretty print',
          'sap xml formatter',
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
                name: 'Free XML Formatter Online — Beautify & Pretty Print XML | ToolSAP',
                url: 'https://tool-sap.vercel.app/tools/xml-formatter',
                description:
                  'Free online XML formatter and beautifier. Pretty print XML with clean indentation, minify payloads, and highlight syntax with 100% in-browser privacy.',
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
                    name: 'Free XML Formatter Online',
                    item: 'https://tool-sap.vercel.app/tools/xml-formatter',
                  },
                ],
              },
              {
                '@type': 'FAQPage',
                mainEntity: XML_FORMATTER_FAQS.map((faq) => ({
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

      {/* Hidden file input for file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,.xsd,.wsdl,text/xml,application/xml"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <ToolWorkspaceLayout
        toolName="XML Formatter"
        toolDescription="Format, beautify, and safely minify XML documents with proper indentation and syntax highlighting. Built for SAP Cloud Integration payloads, SOAP messages, IDocs, XSD schemas, and WSDL definitions."
        badgeLabel="100% In-Browser Privacy"
        toolbarActions={
          <>
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="secondary"
                size="md"
                onClick={handleMinify}
                disabled={isFormatting || !inputXml.trim()}
                icon={<Minimize2 className="h-4 w-4" />}
              >
                Minify XML
              </Button>

              <Link to="/tools/xml-validator">
                <Button
                  variant="secondary"
                  size="md"
                  icon={<FileCheck className="h-4 w-4 text-emerald-600" />}
                  title="Validate XML well-formedness and schemas"
                >
                  Validate XML
                </Button>
              </Link>

              {/* Options Toggle */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setShowOptions(!showOptions)}
                  className={`text-neutral-700 ${showOptions ? 'bg-neutral-100' : ''}`}
                  icon={<Settings2 className="h-4 w-4" />}
                >
                  Options
                </Button>

                {/* Dropdown Popover */}
                {showOptions && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-neutral-200 p-4 z-40 animate-fade-in text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                      <span className="font-bold text-neutral-900 text-sm">Formatting Settings</span>
                      <button
                        onClick={() => setShowOptions(false)}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        ✕
                      </button>
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-1">
                        Indentation Size
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setTabWidth(2)}
                          className={`py-1.5 px-3 rounded-lg border text-center font-medium transition-all ${
                            tabWidth === 2
                              ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold'
                              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          2 Spaces
                        </button>
                        <button
                          onClick={() => setTabWidth(4)}
                          className={`py-1.5 px-3 rounded-lg border text-center font-medium transition-all ${
                            tabWidth === 4
                              ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold'
                              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          4 Spaces
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-1">
                        Attribute Quotes
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['double', 'single', 'preserve'] as const).map((q) => (
                          <button
                            key={q}
                            onClick={() => setQuoteStyle(q)}
                            className={`py-1 px-2 rounded-lg border capitalize text-center font-medium transition-all ${
                              quoteStyle === q
                                ? 'bg-primary-50 border-primary-500 text-primary-700'
                                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Utility Helpers */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadSample}
                className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
              >
                Load SAP Sample
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={!inputXml && !outputXml}
                className="text-neutral-500 hover:text-rose-600 hover:bg-rose-50"
                icon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Clear
              </Button>
            </div>
          </>
        }
        leftPane={
          /* Left Pane: Input Editor & Tools */
          <div
            className={`w-full h-full flex flex-col justify-between bg-white rounded-xl border transition-all duration-200 shadow-xs overflow-hidden ${
              isDragging
                ? 'border-primary-500 ring-2 ring-primary-400 bg-primary-50/20'
                : error
                ? 'border-error-300'
                : 'border-neutral-200'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Input Header */}
            <div className="px-4 py-2.5 min-h-[52px] bg-neutral-50/90 border-b border-neutral-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary-600" />
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Input XML
                </span>
                {activeFileName && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-200/80 text-neutral-700">
                    {activeFileName}
                  </span>
                )}
              </div>

              {/* Upload & Counter Actions */}
              <div className="flex items-center gap-3 h-8">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-primary-600 transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-neutral-100/80"
                  title="Upload .xml, .xsd, or .wsdl file"
                >
                  <Upload className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Upload File</span>
                </button>

                <div className="text-[11px] font-mono text-neutral-400 border-l border-neutral-200 pl-3">
                  {inputLineCount > 0 ? (
                    <span>
                      {inputLineCount} lines · {formatBytes(inputSizeBytes)}
                    </span>
                  ) : (
                    <span>Ready</span>
                  )}
                </div>
              </div>
            </div>

            {/* Error Diagnostics Banner */}
            {error && (
              <div className="px-4 py-3 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 animate-fade-in">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="font-semibold text-rose-800">XML Syntax Error Detected</div>
                    <button
                      type="button"
                      onClick={() => redirectToValidator(inputXml)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>First Fix XML code With Validator</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-1 leading-relaxed">{error.message}</div>
                  {(error.line !== undefined || error.column !== undefined) && (
                    <div className="mt-1 font-mono text-[11px] text-rose-700">
                      Location:{' '}
                      {error.line !== undefined && <span>Line {error.line}</span>}
                      {error.column !== undefined && <span>, Column {error.column}</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CodeMirror 6 Editor Container */}
            <div className="relative min-h-[480px] flex-1 flex flex-col">
              <CodeEditor
                value={inputXml}
                onChange={setInputXml}
                placeholder="Paste or type raw XML here, or drag & drop a .xml, .xsd, or .wsdl file..."
                minHeight="480px"
                hasError={!!error}
              />

              {/* Drag overlay notice */}
              {isDragging && (
                <div className="absolute inset-0 bg-primary-50/90 border-2 border-dashed border-primary-500 rounded-b-xl flex flex-col items-center justify-center pointer-events-none z-30">
                  <Upload className="h-10 w-10 text-primary-600 animate-bounce mb-2" />
                  <span className="text-sm font-bold text-primary-900">
                    Drop your XML, XSD, or WSDL file here
                  </span>
                  <span className="text-xs text-primary-600 mt-1">Up to 5 MB supported</span>
                </div>
              )}
            </div>

            {/* Input Bottom Bar */}
            <div className="h-10 min-h-[40px] px-4 py-2 bg-neutral-50/80 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
              <div className="flex items-center gap-2">
                <span>Supports .xml, .xsd, .wsdl</span>
                <span>·</span>
                <span>Max 5 MB</span>
              </div>
              <div>{inputCharCount.toLocaleString()} characters</div>
            </div>
          </div>
        }
        rightPane={
          /* Right Pane: Formatted Output */
          <div className="w-full h-full flex flex-col justify-between bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
            {/* Output Header */}
            <div className="px-4 py-2.5 min-h-[52px] bg-neutral-50/90 border-b border-neutral-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  {lastMode === 'minified' ? 'Minified Output' : 'Formatted XML'}
                </span>
                {outputXml && (
                  <Badge variant="success" size="sm" dot>
                    Valid
                  </Badge>
                )}
              </div>

              {/* Copy & Download Actions */}
              <div className="flex items-center gap-2 h-8">
                {outputXml && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleFormat()}
                    loading={isFormatting}
                    className="h-8 px-3 text-xs font-semibold shadow-xs"
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                  >
                    Format XML
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!outputXml}
                  className="h-8 px-2.5 text-xs font-medium"
                  icon={
                    copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )
                  }
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!outputXml}
                  className="h-8 px-2.5 text-xs font-medium"
                  icon={<Download className="h-3.5 w-3.5" />}
                >
                  Download
                </Button>
              </div>
            </div>

            {/* Safe Minify Warning Banner if applicable */}
            {warning && (
              <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-start gap-2 animate-fade-in">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{warning}</div>
              </div>
            )}

            {/* Output Editor Container */}
            <div className="relative min-h-[480px] flex-1 flex flex-col">
              {outputXml ? (
                <CodeEditor
                  value={outputXml}
                  readOnly
                  placeholder="Formatted XML output will appear here..."
                  minHeight="480px"
                />
              ) : (
                /* Empty state when no output */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white min-h-[480px]">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 mb-3 shadow-2xs">
                    <FileCode className="h-6 w-6 stroke-[1.8]" />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-800 mb-1">
                    No Formatted Output Yet
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-sm mb-4 leading-relaxed">
                    Paste raw XML in the left pane and click &quot;Format XML&quot; to generate beautified output with clean indentation.
                  </p>
                  <div className="flex items-center gap-2.5">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleFormat()}
                      loading={isFormatting}
                      icon={<Sparkles className="h-4 w-4" />}
                      className="shadow-xs"
                    >
                      Format XML
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleLoadSample}
                      className="text-xs"
                    >
                      Try Sample XML
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Output Bottom Bar */}
            <div className="h-10 min-h-[40px] px-4 py-2 bg-neutral-50/80 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
              <div className="flex items-center gap-3">
                {stats ? (
                  <>
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <Clock className="h-3 w-3" />
                      {stats.executionTimeMs}ms
                    </span>
                    <span>·</span>
                    <span>{stats.lineCount} lines</span>
                    <span>·</span>
                    <span>{formatBytes(stats.sizeBytes)}</span>
                  </>
                ) : (
                  <span>Awaiting execution</span>
                )}
              </div>

              {stats && <div>{stats.charCount.toLocaleString()} chars</div>}
            </div>
          </div>
        }
        infoSection={
          <div className="border-t border-neutral-200/80 pt-12 space-y-14">
            {/* Section 1: How to Format XML Online (3 Steps) */}
            <div>
              <div className="max-w-3xl mb-8">
                <Badge variant="neutral" size="sm" className="mb-2">
                  Step-by-Step Guide
                </Badge>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  How to Format &amp; Beautify XML Online in 3 Easy Steps
                </h2>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Transform messy, compact, or unformatted XML into clean, properly indented markup with zero setup.
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
                    Paste raw XML markup into the left code editor or click <strong className="text-neutral-800">Upload File</strong> to load any <code className="text-primary-700 bg-neutral-100 px-1 py-0.5 rounded">.xml</code>, <code className="text-primary-700 bg-neutral-100 px-1 py-0.5 rounded">.xsd</code>, or <code className="text-primary-700 bg-neutral-100 px-1 py-0.5 rounded">.wsdl</code> payload up to 5 MB.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs relative">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-sm flex items-center justify-center mb-3">
                    2
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                    Choose Indentation Options
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Select your preferred tab width (2 spaces or 4 spaces) and quote style (double quotes or single quotes) using the formatting toolbar.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs relative">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 font-bold text-sm flex items-center justify-center mb-3">
                    3
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                    Format XML or Minify
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Click <strong className="text-neutral-800">Format XML</strong> for pretty print indentation, or click <strong className="text-neutral-800">Minify</strong> to compress. Copy or download your clean output instantly.
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
                  Free Online XML Formatter Features
                </h2>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Built for web developers, data engineers, and SAP integration specialists who require clean, reliable, and secure XML formatting.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">W3C Pretty Print Formatting</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Standardizes nested element indentation, aligns attributes, and cleanly formats closing tags adhering to strict W3C XML rules.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <Minimize2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">Safe XML Minification</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Compresses XML by stripping unnecessary whitespace and newlines while strictly preserving text content, CDATA blocks, and comments.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">100% In-Browser Privacy</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    All formatting processes locally inside your browser via client-side JavaScript. No sensitive business data or credentials ever touch an external server.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">CDATA &amp; Entity Integrity</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Enhanced parser guarantees strict protection for CDATA sections, DOCTYPE DTD subsets, special entity escapes (&amp;amp;, &amp;lt;), and namespace prefixes.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                    <Settings2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">Customizable Indentation</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Easily toggle between 2-space and 4-space tab widths, double quotes, and single quotes to match your team&apos;s code formatting style guidelines.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">Syntax Error Auto-Detection</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Instant error detection with a 1-click shortcut to launch our XML Validator tool preloaded with your XML to inspect and auto-fix issues.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Formatting vs Minification Comparison */}
            <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-2xs">
              <div className="max-w-3xl mb-6">
                <Badge variant="neutral" size="sm" className="mb-2">
                  Technical Comparison
                </Badge>
                <h2 className="text-lg font-bold text-neutral-900">
                  XML Pretty Print vs. XML Minification
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Understanding when to format for human readability versus minifying for production network performance.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 text-xs">
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                  <h4 className="font-semibold text-neutral-900 mb-1.5 flex items-center gap-1.5 text-primary-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>XML Formatting (Pretty Print)</span>
                  </h4>
                  <p className="text-neutral-600 leading-relaxed">
                    Adds standardized indentation (2 or 4 spaces) and newlines between child tags. Best for code reviews, inspecting API payloads, debugging SOAP messages, and editing configuration files.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                  <h4 className="font-semibold text-neutral-900 mb-1.5 flex items-center gap-1.5 text-emerald-700">
                    <Minimize2 className="h-3.5 w-3.5" />
                    <span>XML Minification (Compress)</span>
                  </h4>
                  <p className="text-neutral-600 leading-relaxed">
                    Removes all unnecessary whitespace, indentations, and line breaks while keeping text content intact. Reduces payload size by 30% to 60% for faster HTTP transmission over networks.
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
                  Free XML Formatter FAQs
                </h2>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Answers to common questions about XML pretty printing, minification, and data security.
                </p>
              </div>

              <div className="space-y-3">
                {XML_FORMATTER_FAQS.map((faq, idx) => {
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
                  Speed up XML validation, schema generation, XPath testing, and payload debugging.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/tools/xml-validator">
                  <Button variant="secondary" size="sm">
                    XML Validator
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
