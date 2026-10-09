import { useState, useRef, useCallback } from 'react';
import {
  FileCode,
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
} from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
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
import { Link } from 'react-router-dom';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function XmlFormatterPage() {
  const { addToast } = useToastContext();

  // State
  const [inputXml, setInputXml] = useState('');
  const [outputXml, setOutputXml] = useState('');
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<'formatted' | 'minified' | null>(null);

  // Formatting options
  const [tabWidth, setTabWidth] = useState<2 | 4>(2);
  const [whitespaceSensitivity, setWhitespaceSensitivity] = useState<'ignore' | 'strict'>('ignore');
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
      xmlWhitespaceSensitivity: whitespaceSensitivity,
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
          title: result.error.message,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Formatting failed';
      setError({ message: msg });
      setOutputXml('');
      setStats(null);
      setLastMode(null);
      addToast({ type: 'error', title: msg });
    } finally {
      setIsFormatting(false);
    }
  }, [inputXml, tabWidth, whitespaceSensitivity, quoteStyle, addToast]);

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
        addToast({ type: 'error', title: result.error.message });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Minification failed';
      setError({ message: msg });
      setOutputXml('');
      setStats(null);
      setLastMode(null);
      addToast({ type: 'error', title: msg });
    } finally {
      setIsFormatting(false);
    }
  }, [inputXml, addToast]);

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
        title="XML Formatter & Beautifier — Free Online SAP Tool | ToolSAP"
        description="Free in-browser XML Formatter and Beautifier for SAP Cloud Integration, IDoc XML, SOAP Envelopes, XSD, and WSDL. Format, minify, and validate locally."
        canonical="/tools/xml-formatter"
        keywords={[
          'SAP XML Formatter',
          'XML Beautifier',
          'SAP CPI XML',
          'SOAP XML Formatter',
          'IDoc XML Formatter',
          'XML Minifier',
          'XSD Formatter',
          'WSDL Formatter',
        ]}
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

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-1">
                        Whitespace Handling
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setWhitespaceSensitivity('ignore')}
                          className={`py-1.5 px-2.5 rounded-lg border text-center font-medium transition-all ${
                            whitespaceSensitivity === 'ignore'
                              ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold'
                              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          Standard (Pretty)
                        </button>
                        <button
                          onClick={() => setWhitespaceSensitivity('strict')}
                          className={`py-1.5 px-2.5 rounded-lg border text-center font-medium transition-all ${
                            whitespaceSensitivity === 'strict'
                              ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold'
                              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          Strict
                        </button>
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
                  <div className="font-semibold text-rose-800">XML Syntax Error Detected</div>
                  <div className="mt-0.5 leading-relaxed">{error.message}</div>
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
          /* Developer Educational & Reference Section */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="md" className="border-neutral-200/90">
              <div className="flex items-center gap-2 mb-2 text-primary-600">
                <Shield className="h-4 w-4" />
                <h4 className="text-sm font-bold text-neutral-900">SAP Security & Privacy</h4>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Enterprise payloads, customer master data, and internal IDs are processed 100% locally in your web browser. No network payloads or third-party tracking APIs are executed.
              </p>
            </Card>

            <Card padding="md" className="border-neutral-200/90">
              <div className="flex items-center gap-2 mb-2 text-emerald-600">
                <Layers className="h-4 w-4" />
                <h4 className="text-sm font-bold text-neutral-900">Payload Integrity</h4>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Preserves CDATA blocks, SOAP Header namespaces, XML declarations, and tag attribute sequences required by SAP Integration Suite and SOAP receivers.
              </p>
            </Card>

            <Card padding="md" className="border-neutral-200/90">
              <div className="flex items-center gap-2 mb-2 text-primary-600">
                <FileCode className="h-4 w-4" />
                <h4 className="text-sm font-bold text-neutral-900">Related Tools</h4>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed mb-3">
                Need schema validation or XSD creation for your message mappings?
              </p>
              <div className="flex flex-col gap-1.5 text-xs">
                <Link
                  to="/tools"
                  className="text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-1"
                >
                  <span>Explore all Developer Tools</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  to="/learning"
                  className="text-neutral-600 hover:text-primary-600 inline-flex items-center gap-1"
                >
                  <span>Message Transformation Guide</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
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
