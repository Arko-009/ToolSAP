import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Search,
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
  Code2,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Wand2,
  Clock,
  Braces,
  CheckCircle2,
  X,
  ListFilter,
  SlidersHorizontal,
} from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useToastContext } from '@/components/ui/Toast';
import { ToolWorkspaceLayout } from '@/components/tools/ToolWorkspaceLayout';
import { CodeEditor } from '@/components/tools/CodeEditor';
import { formatXml } from '@/utils/xml/xmlFormatter';
import {
  evaluateXPathExpression,
  convertToNamespaceAgnostic,
  XPATH_PRESET_SAMPLES,
  type XPathEvaluationResult,
  type XPathEngine,
  type XPathReturnType,
  type XPathPresetSample,
} from '@/utils/xpath/xpathEvaluator';
import {
  XPATH_REFERENCE_ITEMS,
  XPATH_REFERENCE_CATEGORIES,
} from '@/utils/xpath/xpathFunctionsData';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function XPathTesterPage() {
  const { addToast } = useToastContext();

  // Selected preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>('sap-purchase-order');
  const activePreset = useMemo(
    () => XPATH_PRESET_SAMPLES.find((p) => p.id === selectedPresetId) || XPATH_PRESET_SAMPLES[0],
    [selectedPresetId]
  );

  // Input states
  const [xmlInput, setXmlInput] = useState<string>(activePreset.xml);
  const [xpathQuery, setXpathQuery] = useState<string>(activePreset.queries[0]?.xpath || '//E1EDP01');
  const [engine, setEngine] = useState<XPathEngine>('xpath-3.1');
  const [returnType, setReturnType] = useState<XPathReturnType>('auto');
  const [activeFileName, setActiveFileName] = useState<string | null>(null);

  // Result & Execution states
  const [result, setResult] = useState<XPathEvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [activeResultTab, setActiveResultTab] = useState<'inspector' | 'raw-xml' | 'json' | 'namespaces'>('inspector');
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // UI Drawer / Modal states
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(false);
  const [cheatSheetCategory, setCheatSheetCategory] = useState<string>('all');
  const [cheatSheetSearch, setCheatSheetSearch] = useState<string>('');
  const [showNamespaceDetails, setShowNamespaceDetails] = useState<boolean>(false);
  const [customPrefixBindings] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xpathInputRef = useRef<HTMLInputElement>(null);

  // Expose test suite on window for headless or browser-based testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/utils/xpath/xpathTester.testSuite').then((mod) => {
        (window as unknown as { __runXPathTestSuite?: () => unknown }).__runXPathTestSuite =
          mod.runXPathTestSuite;
      });
    }
  }, []);

  // Run evaluation
  const handleEvaluate = useCallback(
    async (overrideXml?: string, overrideQuery?: string, overrideEngine?: XPathEngine) => {
      const targetXml = overrideXml !== undefined ? overrideXml : xmlInput;
      const targetQuery = overrideQuery !== undefined ? overrideQuery : xpathQuery;
      const targetEngine = overrideEngine !== undefined ? overrideEngine : engine;

      if (!targetXml.trim()) {
        addToast({
          type: 'error',
          title: 'Empty XML Input',
          description: 'Please paste or upload an XML document to test XPath.',
        });
        return;
      }

      if (!targetQuery.trim()) {
        addToast({
          type: 'error',
          title: 'Empty XPath Expression',
          description: 'Please enter an XPath expression to evaluate.',
        });
        return;
      }

      setIsEvaluating(true);

      try {
        const evalResult = await evaluateXPathExpression(targetXml, targetQuery, {
          engine: targetEngine,
          returnType,
          customNamespaces: customPrefixBindings,
        });

        setResult(evalResult);
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Evaluation Error',
          description: err instanceof Error ? err.message : 'Failed to evaluate XPath',
        });
      } finally {
        setIsEvaluating(false);
      }
    },
    [xmlInput, xpathQuery, engine, returnType, customPrefixBindings, addToast]
  );

  // Initial evaluation on mount
  useEffect(() => {
    handleEvaluate(activePreset.xml, activePreset.queries[0]?.xpath, 'xpath-3.1');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Preset Selection
  const handleSelectPreset = useCallback(
    (preset: XPathPresetSample) => {
      setSelectedPresetId(preset.id);
      setXmlInput(preset.xml);
      const defaultQuery = preset.queries[0]?.xpath || '//node()';
      setXpathQuery(defaultQuery);
      setActiveFileName(null);
      handleEvaluate(preset.xml, defaultQuery);
      addToast({
        type: 'info',
        title: 'Sample Loaded',
        description: `Loaded ${preset.title}.`,
      });
    },
    [handleEvaluate, addToast]
  );

  // Format XML
  const handleFormatXml = useCallback(async () => {
    if (!xmlInput.trim()) return;
    const res = await formatXml(xmlInput, { tabWidth: 2 });
    if (res.success) {
      setXmlInput(res.output);
      addToast({
        type: 'success',
        title: 'XML Formatted',
        description: 'Formatted XML payload with 2-space indentation.',
      });
    }
  }, [xmlInput, addToast]);

  // Convert to Namespace Agnostic
  const handleConvertToNamespaceAgnostic = useCallback(() => {
    if (!xpathQuery.trim()) return;
    const agnostic = convertToNamespaceAgnostic(xpathQuery);
    setXpathQuery(agnostic);
    handleEvaluate(xmlInput, agnostic);
    addToast({
      type: 'info',
      title: 'Converted to Namespace-Agnostic',
      description: 'Transformed query to local-name() syntax.',
    });
  }, [xpathQuery, xmlInput, handleEvaluate, addToast]);

  // Handle File Upload
  const handleFileUpload = useCallback(
    (file: File) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        addToast({
          type: 'error',
          title: 'File Too Large',
          description: `Maximum file size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setXmlInput(content);
        setActiveFileName(file.name);
        handleEvaluate(content, xpathQuery);
        addToast({
          type: 'success',
          title: 'File Loaded',
          description: `Loaded ${file.name} (${Math.round(file.size / 1024)} KB).`,
        });
      };
      reader.readAsText(file);
    },
    [handleEvaluate, xpathQuery, addToast]
  );

  // Copy to clipboard helper
  const handleCopyText = useCallback(
    (text: string, id: string, label: string) => {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      addToast({
        type: 'success',
        title: 'Copied to Clipboard',
        description: `${label} copied.`,
      });
    },
    [addToast]
  );

  // Toggle node expand/collapse
  const toggleNodeExpand = (index: number) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Expand / Collapse all
  const toggleAllNodes = (expand: boolean) => {
    if (!result?.matches) return;
    const updated: Record<number, boolean> = {};
    result.matches.forEach((m) => {
      updated[m.index] = expand;
    });
    setExpandedNodes(updated);
  };

  // Insert function snippet from Cheat Sheet
  const handleInsertSnippet = (snippet: string) => {
    setXpathQuery(snippet);
    setShowCheatSheet(false);
    if (xpathInputRef.current) {
      xpathInputRef.current.focus();
    }
    handleEvaluate(xmlInput, snippet);
    addToast({
      type: 'info',
      title: 'Snippet Applied',
      description: `Inserted ${snippet}`,
    });
  };

  // Filtered Cheat Sheet Items
  const filteredCheatSheetItems = useMemo(() => {
    return XPATH_REFERENCE_ITEMS.filter((item) => {
      const matchesCat = cheatSheetCategory === 'all' || item.category === cheatSheetCategory;
      const q = cheatSheetSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.signature.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.example.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [cheatSheetCategory, cheatSheetSearch]);

  // Raw XML string of all matched nodes
  const rawMatchedXml = useMemo(() => {
    if (!result?.matches || result.matches.length === 0) return '';
    return result.matches.map((m) => m.outerXml).join('\n\n');
  }, [result]);

  // JSON representation of matches
  const jsonMatchedData = useMemo(() => {
    if (!result?.matches) return '[]';
    const data = result.matches.map((m) => ({
      index: m.index,
      nodeType: m.nodeType,
      name: m.name,
      path: m.path,
      value: m.value,
      line: m.line,
    }));
    return JSON.stringify(data, null, 2);
  }, [result]);

  // ───────────────────────────────────────────────────────────────────────────
  // Sub-components: Left Pane (XML Input)
  // ───────────────────────────────────────────────────────────────────────────
  const leftPaneContent = (
    <Card className="h-full flex flex-col shadow-sm border-neutral-200/90 overflow-hidden">
      {/* Editor Header */}
      <div className="px-4 py-3 bg-neutral-50/90 border-b border-neutral-200/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-bold text-neutral-800">Source XML Document</span>
          {activeFileName && (
            <Badge variant="neutral" size="sm" className="max-w-[160px] truncate">
              {activeFileName}
            </Badge>
          )}
          {result?.namespacesDetected && result.namespacesDetected.length > 0 && (
            <button
              onClick={() => setShowNamespaceDetails(!showNamespaceDetails)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
              title="Click to view detected XML namespaces"
            >
              <Layers className="h-3 w-3" />
              <span>{result.namespacesDetected.length} Namespaces</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showNamespaceDetails ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Editor Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFormatXml}
            disabled={!xmlInput.trim()}
            title="Format XML with clean indentation"
            className="text-xs h-8 px-2.5"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1 text-primary-600" />
            Format
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Upload XML file from your computer"
            className="text-xs h-8 px-2.5"
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,.xsd,.txt,.soap"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = '';
            }}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setXmlInput('');
              setActiveFileName(null);
              setResult(null);
            }}
            disabled={!xmlInput.trim()}
            title="Clear XML document"
            className="text-xs h-8 px-2.5 text-neutral-500 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Namespace Overlay Details */}
      {showNamespaceDetails && result?.namespacesDetected && result.namespacesDetected.length > 0 && (
        <div className="bg-primary-50/70 border-b border-primary-100 p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-primary-900 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              Detected XML Namespaces in Document:
            </span>
            <span className="text-primary-700 text-[11px]">
              Use <code className="bg-white px-1 py-0.5 rounded border border-primary-200 font-mono">dft:</code> for default namespace
            </span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {result.namespacesDetected.map((ns, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-primary-200/80 text-[11px]"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Badge variant={ns.isDefault ? 'primary' : 'neutral'} size="sm">
                    {ns.isDefault ? 'default (dft:)' : `${ns.prefix}:`}
                  </Badge>
                  <span className="font-mono text-neutral-600 truncate" title={ns.uri}>
                    {ns.uri}
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleCopyText(
                      ns.isDefault ? `xmlns="` + ns.uri + `"` : `xmlns:${ns.prefix}="` + ns.uri + `"`,
                      `ns-${idx}`,
                      'Namespace URI'
                    )
                  }
                  className="text-neutral-400 hover:text-primary-600 ml-2"
                  title="Copy declaration"
                >
                  {copiedId === `ns-${idx}` ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* XML Code Editor */}
      <div className="flex-1 min-h-[460px] bg-white relative">
        <CodeEditor
          value={xmlInput}
          onChange={(val) => setXmlInput(val)}
          language="xml"
          placeholder="Paste or upload XML payload here..."
          minHeight="460px"
          height="100%"
        />
      </div>

      {/* Editor Footer Status */}
      <div className="px-4 py-2 bg-neutral-50/70 border-t border-neutral-200/70 text-xs text-neutral-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>{xmlInput ? xmlInput.split('\n').length : 0} lines</span>
          <span>•</span>
          <span>{new Blob([xmlInput]).size.toLocaleString()} bytes</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <Shield className="h-3 w-3 text-emerald-600" />
          <span>In-Memory Evaluation Only</span>
        </div>
      </div>
    </Card>
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Sub-components: Right Pane (Results View)
  // ───────────────────────────────────────────────────────────────────────────
  const rightPaneContent = (
    <Card className="h-full flex flex-col shadow-sm border-neutral-200/90 overflow-hidden">
      {/* Results Header with View Tabs & Actions */}
      <div className="px-4 py-2.5 bg-neutral-50/90 border-b border-neutral-200/80 flex flex-wrap items-center justify-between gap-2">
        {/* Result Tabs */}
        <div className="flex items-center gap-1 bg-neutral-200/60 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setActiveResultTab('inspector')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeResultTab === 'inspector'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            <span>Inspector</span>
            {result?.matches && result.matches.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-primary-100 text-primary-800">
                {result.matches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveResultTab('raw-xml')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeResultTab === 'raw-xml'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Raw XML</span>
          </button>

          <button
            onClick={() => setActiveResultTab('json')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeResultTab === 'json'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Braces className="h-3.5 w-3.5" />
            <span>JSON</span>
          </button>
        </div>

        {/* Global Result Actions */}
        <div className="flex items-center gap-1.5">
          {result?.matches && result.matches.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyText(rawMatchedXml, 'copy-all-xml', 'All Matched XML')}
                className="text-xs h-8 px-2.5"
                title="Copy all matched XML nodes"
              >
                {copiedId === 'copy-all-xml' ? (
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1" />
                )}
                Copy XML
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const blob = new Blob([rawMatchedXml], { type: 'application/xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'xpath-results.xml';
                  a.click();
                  URL.revokeObjectURL(url);
                  addToast({
                    type: 'success',
                    title: 'Download Started',
                    description: 'Downloaded xpath-results.xml',
                  });
                }}
                className="text-xs h-8 px-2.5"
                title="Download matched XML"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Bar / Metric Ribbon */}
      <div className="px-4 py-2 bg-white border-b border-neutral-100 flex items-center justify-between text-xs">
        {result?.success ? (
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-neutral-800">
              {result.returnTypeDetected === 'nodes' ? (
                `${result.totalMatches} Node${result.totalMatches === 1 ? '' : 's'} Matched`
              ) : result.returnTypeDetected === 'string' ? (
                `String Result: "${result.primitiveValue}"`
              ) : result.returnTypeDetected === 'number' ? (
                `Numeric Result: ${result.primitiveValue}`
              ) : result.returnTypeDetected === 'boolean' ? (
                `Boolean Result: ${result.primitiveValue ? 'true' : 'false'}`
              ) : (
                '0 Matches'
              )}
            </span>
            <Badge variant="neutral" size="sm" className="font-mono text-[11px]">
              {result.engineUsed.toUpperCase()}
            </Badge>
          </div>
        ) : result?.error ? (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold truncate max-w-sm">Evaluation Failed</span>
          </div>
        ) : (
          <div className="text-neutral-500">Ready to evaluate.</div>
        )}

        <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
          {result?.executionTimeMs !== undefined && (
            <span className="flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3" />
              {result.executionTimeMs} ms
            </span>
          )}
        </div>
      </div>

      {/* Main Result Content Area */}
      <div className="flex-1 min-h-[460px] bg-neutral-50/40 p-4 overflow-y-auto">
        {/* Error Notification Alert */}
        {result?.error && (
          <div className="p-4 mb-4 rounded-xl bg-red-50/90 border border-red-200 text-red-900 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="font-bold text-sm text-red-950 flex items-center justify-between">
                  <span>XPath Evaluation Error</span>
                  {result.error.code && (
                    <span className="font-mono text-[11px] font-normal px-2 py-0.5 rounded bg-red-100 text-red-800">
                      {result.error.code}
                    </span>
                  )}
                </div>
                <p className="text-xs text-red-800 leading-relaxed font-mono whitespace-pre-wrap">
                  {result.error.message}
                </p>

                {result.error.suggestion && (
                  <div className="mt-3 p-3 bg-white/80 rounded-lg border border-red-200/80 text-xs text-neutral-800">
                    <span className="font-bold text-red-800 block mb-1">Recommendation:</span>
                    <span>{result.error.suggestion}</span>
                  </div>
                )}

                {/* Helpful quick-fix buttons for common mistakes */}
                {result.error.message.includes('prefix') && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleConvertToNamespaceAgnostic}
                      className="bg-white text-xs h-7"
                    >
                      <Wand2 className="h-3 w-3 mr-1 text-primary-600" />
                      Try Namespace-Agnostic Query
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Inspector (Match Cards) */}
        {activeResultTab === 'inspector' && (
          <div>
            {result?.success && result.matches.length > 0 ? (
              <div className="space-y-3">
                {/* Inspector Controls */}
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-semibold text-neutral-600">
                    Showing all {result.matches.length} matched elements & attributes:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAllNodes(true)}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      Expand All
                    </button>
                    <span className="text-neutral-300">•</span>
                    <button
                      onClick={() => toggleAllNodes(false)}
                      className="text-xs font-medium text-neutral-500 hover:text-neutral-700"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>

                {/* Match Cards List */}
                {result.matches.map((match) => {
                  const isExpanded = !!expandedNodes[match.index];
                  return (
                    <div
                      key={match.index}
                      className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs hover:border-primary-300/80 transition-all overflow-hidden"
                    >
                      {/* Card Header */}
                      <div
                        className="px-3.5 py-2.5 bg-neutral-50/50 flex items-center justify-between gap-3 cursor-pointer select-none"
                        onClick={() => toggleNodeExpand(match.index)}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <button
                            type="button"
                            className="text-neutral-400 hover:text-neutral-600 p-0.5 rounded"
                          >
                            <ChevronRight
                              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          </button>

                          <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-neutral-200 text-neutral-800">
                            #{match.index}
                          </span>

                          <Badge
                            variant={
                              match.nodeType === 'element'
                                ? 'primary'
                                : match.nodeType === 'attribute'
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                            className="uppercase text-[10px] tracking-wide"
                          >
                            {match.nodeType}
                          </Badge>

                          <span className="font-mono text-xs font-bold text-neutral-900 truncate">
                            {match.name}
                          </span>
                        </div>

                        {/* Location & Quick Copy */}
                        <div className="flex items-center gap-2 shrink-0">
                          {match.line && (
                            <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                              Line {match.line}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyText(match.path, `path-${match.index}`, 'Canonical XPath');
                            }}
                            className="p-1 rounded text-neutral-400 hover:text-primary-600 hover:bg-neutral-100 transition-colors"
                            title="Copy canonical path to this node"
                          >
                            {copiedId === `path-${match.index}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-3.5 pt-2.5 space-y-2.5">
                        {/* Canonical Path */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-neutral-500 font-medium shrink-0">Path:</span>
                          <code className="px-2 py-0.5 rounded bg-neutral-100 text-primary-700 font-mono text-[11px] truncate flex-1">
                            {match.path}
                          </code>
                        </div>

                        {/* Value Text Preview */}
                        {match.value && (
                          <div className="flex items-baseline gap-2 text-xs">
                            <span className="text-neutral-500 font-medium shrink-0">Value:</span>
                            <div className="font-mono text-xs text-neutral-800 bg-neutral-50 p-2 rounded border border-neutral-150 flex-1 break-all">
                              {match.value}
                            </div>
                          </div>
                        )}

                        {/* Expandable Outer XML Preview */}
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-neutral-100">
                            <div className="flex items-center justify-between mb-1 text-[11px] text-neutral-500">
                              <span className="font-medium">Outer XML Representation:</span>
                              <button
                                onClick={() =>
                                  handleCopyText(match.outerXml, `outer-${match.index}`, 'Node XML')
                                }
                                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
                              >
                                {copiedId === `outer-${match.index}` ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                <span>Copy XML</span>
                              </button>
                            </div>
                            <pre className="p-2.5 bg-neutral-900 text-neutral-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                              <code>{match.outerXml}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : result?.primitiveValue !== undefined ? (
              <div className="bg-white p-6 rounded-xl border border-neutral-200/90 shadow-xs text-center space-y-3">
                <Badge variant="success" size="md" className="px-3 py-1 font-mono uppercase">
                  {result.returnTypeDetected} Result
                </Badge>
                <div className="text-3xl font-extrabold text-neutral-900 font-mono py-2">
                  {String(result.primitiveValue)}
                </div>
                <p className="text-xs text-neutral-500 max-w-md mx-auto">
                  The evaluated XPath function returned an atomic {result.returnTypeDetected} value.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    handleCopyText(
                      String(result.primitiveValue),
                      'primitive-val',
                      'Evaluated Primitive Value'
                    )
                  }
                  className="text-xs mt-2"
                >
                  {copiedId === 'primitive-val' ? (
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  Copy Value
                </Button>
              </div>
            ) : result?.success && result.totalMatches === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-neutral-200/80 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
                  <Search className="h-6 w-6" />
                </div>
                <div className="font-bold text-base text-neutral-800">No Nodes Matched</div>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                  The expression is syntactically valid, but did not match any nodes in the XML document.
                  Verify element names, attribute spelling, or try the namespace-agnostic syntax.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleConvertToNamespaceAgnostic}
                  className="text-xs mt-1"
                >
                  <Wand2 className="h-3.5 w-3.5 mr-1.5 text-primary-600" />
                  Try Namespace-Agnostic Form
                </Button>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl border border-dashed border-neutral-300 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 mx-auto flex items-center justify-center">
                  <Code2 className="h-5 w-5" />
                </div>
                <div className="font-bold text-sm text-neutral-800">Enter an XPath Expression</div>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Type an XPath query above and click Evaluate or press Enter to inspect matched elements.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Raw XML Output */}
        {activeResultTab === 'raw-xml' && (
          <div className="h-full flex flex-col">
            {rawMatchedXml ? (
              <div className="bg-white rounded-xl border border-neutral-200/90 overflow-hidden flex-1 flex flex-col">
                <div className="px-3.5 py-2 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-xs text-neutral-600 font-medium">
                  <span>Combined XML of Matched Elements</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyText(rawMatchedXml, 'raw-xml-tab', 'Raw XML')}
                    className="text-xs h-7 px-2"
                  >
                    {copiedId === 'raw-xml-tab' ? (
                      <Check className="h-3 w-3 mr-1 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    Copy
                  </Button>
                </div>
                <div className="flex-1 min-h-[400px]">
                  <CodeEditor
                    value={rawMatchedXml}
                    language="xml"
                    readOnly
                    height="100%"
                    minHeight="400px"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl border border-neutral-200 text-center text-xs text-neutral-500">
                No XML content to display.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: JSON Representation */}
        {activeResultTab === 'json' && (
          <div className="h-full flex flex-col">
            <div className="bg-white rounded-xl border border-neutral-200/90 overflow-hidden flex-1 flex flex-col">
              <div className="px-3.5 py-2 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-xs text-neutral-600 font-medium">
                <span>Extracted Node Properties (JSON Array)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyText(jsonMatchedData, 'json-tab', 'JSON Result')}
                  className="text-xs h-7 px-2"
                >
                  {copiedId === 'json-tab' ? (
                    <Check className="h-3 w-3 mr-1 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  Copy JSON
                </Button>
              </div>
              <div className="flex-1 min-h-[400px]">
                <CodeEditor
                  value={jsonMatchedData}
                  language="json"
                  readOnly
                  height="100%"
                  minHeight="400px"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <>
      <SEOHead
        title="XPath Tester & Evaluator — Test XPath 3.1 & 1.0 Online | ToolSAP"
        description="Free online XPath tester and evaluator with full namespace support. Test XPath 3.1 and 1.0 expressions against SAP CPI IDocs, SOAP messages, and XML payloads."
        keywords={[
          'xpath tester',
          'xpath evaluator',
          'test xpath online',
          'sap xpath tester',
          'cpi xpath',
          'xpath 3.1 online',
          'xpath 1.0 tester',
          'toolsap xpath',
        ]}
      />

      <ToolWorkspaceLayout
        toolName="XPath Tester"
        toolDescription="Test and evaluate XPath 3.1 & 1.0 queries against XML documents with full namespace support. Essential for debugging SAP Cloud Integration Content-Based Routers, Splitters, and Content Modifiers."
        badgeLabel="Privacy-First · 100% In-Browser"
        toolbarActions={
          <div className="w-full flex flex-col gap-3">
            {/* Row 1: Sample Payloads & Quick Presets Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary-600" />
                  Sample Payloads:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {XPATH_PRESET_SAMPLES.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        selectedPresetId === preset.id
                          ? 'bg-primary-600 text-white shadow-xs'
                          : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {preset.title.split('(')[0]?.trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Cheat Sheet & Format */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCheatSheet(true)}
                  className="text-xs h-8 px-3 border-primary-200 bg-primary-50/60 text-primary-800 hover:bg-primary-100"
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5 text-primary-600" />
                  XPath Functions Cheat Sheet
                </Button>
              </div>
            </div>

            {/* Row 2: Prominent Floating XPath Query Input Box */}
            <div className="w-full bg-white p-3 rounded-xl border-2 border-primary-500/80 shadow-md flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
              {/* Query Input with Icon */}
              <div className="relative flex-1 flex items-center">
                <div className="absolute left-3 text-primary-600 pointer-events-none">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  ref={xpathInputRef}
                  type="text"
                  value={xpathQuery}
                  onChange={(e) => setXpathQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEvaluate();
                    }
                  }}
                  placeholder="Enter XPath expression (e.g. //E1EDP01[number(MENGE) > 10], /store/products/product/@sku)"
                  className="w-full pl-9 pr-9 py-2 text-sm font-mono text-neutral-900 bg-transparent placeholder:text-neutral-400 focus:outline-hidden"
                />
                {xpathQuery && (
                  <button
                    onClick={() => setXpathQuery('')}
                    className="absolute right-3 text-neutral-400 hover:text-neutral-600 p-0.5"
                    title="Clear query"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Controls & Evaluate Action Button */}
              <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-100">
                {/* Engine Selector */}
                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setEngine('xpath-3.1');
                      handleEvaluate(xmlInput, xpathQuery, 'xpath-3.1');
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      engine === 'xpath-3.1'
                        ? 'bg-white text-neutral-900 font-bold shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                    title="XPath 3.1 powered by FontoXPath engine (supports matches, sequences, modern functions)"
                  >
                    XPath 3.1
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEngine('xpath-1.0');
                      handleEvaluate(xmlInput, xpathQuery, 'xpath-1.0');
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      engine === 'xpath-1.0'
                        ? 'bg-white text-neutral-900 font-bold shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                    title="Strict XPath 1.0 (Exact standard compatibility for SAP CPI Content-Based Routers)"
                  >
                    XPath 1.0 (CPI)
                  </button>
                </div>

                {/* Return Type Filter */}
                <select
                  value={returnType}
                  onChange={(e) => {
                    const val = e.target.value as XPathReturnType;
                    setReturnType(val);
                  }}
                  className="text-xs font-semibold bg-neutral-100 border-0 rounded-lg px-2.5 py-2 text-neutral-700 focus:ring-1 focus:ring-primary-500 cursor-pointer"
                  title="Target return type"
                >
                  <option value="auto">Auto-Detect</option>
                  <option value="nodes">Nodeset</option>
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>

                {/* Evaluate Action */}
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleEvaluate()}
                  disabled={isEvaluating}
                  className="font-bold px-4 shadow-sm"
                >
                  <Search className="h-4 w-4 mr-1.5" />
                  Evaluate
                </Button>
              </div>
            </div>

            {/* Quick Query Pills for current sample */}
            {activePreset.queries && activePreset.queries.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-neutral-500 font-medium">Quick Queries:</span>
                {activePreset.queries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setXpathQuery(q.xpath);
                      handleEvaluate(xmlInput, q.xpath);
                    }}
                    className={`px-2.5 py-0.5 rounded-full border transition-all text-[11px] font-mono ${
                      xpathQuery === q.xpath
                        ? 'bg-primary-50 border-primary-300 text-primary-800 font-bold'
                        : 'bg-white border-neutral-200/90 text-neutral-600 hover:border-primary-300 hover:text-primary-700'
                    }`}
                    title={q.description}
                  >
                    {q.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
        leftPane={leftPaneContent}
        rightPane={rightPaneContent}
        infoSection={
          <div className="mt-8 space-y-6">
            {/* 3 High-Value SAP CPI Educational Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-5 border-neutral-200/80 bg-white space-y-3">
                <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">
                  SAP CPI Content-Based Router
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  In SAP Cloud Integration, router conditions execute in <strong>XPath 1.0</strong>. Use
                  expressions like <code className="bg-neutral-100 px-1 py-0.5 rounded text-primary-700">/Order/Type = 'EXP'</code> or{' '}
                  <code className="bg-neutral-100 px-1 py-0.5 rounded text-primary-700">count(//Item) &gt; 0</code>.
                  Select the <strong>XPath 1.0 (CPI)</strong> engine mode to ensure full compatibility.
                </p>
              </Card>

              <Card className="p-5 border-neutral-200/80 bg-white space-y-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">
                  Default Namespace (<code className="text-xs">xmlns="..."</code>) Trap
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  In standard XPath 1.0, unprefixed queries like <code className="bg-neutral-100 px-1 py-0.5 rounded">/root/item</code> only match elements in <em>no namespace</em>.
                  If your XML has a default namespace, use ToolSAP's automatically registered <code className="bg-neutral-100 px-1 py-0.5 rounded text-primary-700">dft:</code> prefix
                  (e.g., <code className="bg-neutral-100 px-1 py-0.5 rounded text-primary-700">//dft:item</code>) or the namespace-agnostic syntax.
                </p>
              </Card>

              <Card className="p-5 border-neutral-200/80 bg-white space-y-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Wand2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">
                  Namespace-Agnostic Syntax
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  When dealing with heterogeneous partner payloads where prefixes vary, use{' '}
                  <code className="bg-neutral-100 px-1 py-0.5 rounded text-primary-700">/*[local-name()='Order']</code>.
                  Click the <strong>Namespace-Agnostic</strong> button to automatically convert any query into this universal format.
                </p>
              </Card>
            </div>
          </div>
        }
      />

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* Slide-over / Modal: Comprehensive XPath Functions & Syntax Cheat Sheet */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {showCheatSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary-100 text-primary-700">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">
                    XPath Functions & Syntax Cheat Sheet
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Click any snippet to insert directly into your current XPath query.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCheatSheet(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Search & Filter Tabs */}
            <div className="p-4 bg-white border-b border-neutral-100 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  value={cheatSheetSearch}
                  onChange={(e) => setCheatSheetSearch(e.target.value)}
                  placeholder="Search functions (e.g. contains, count, local-name, cpi)..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:border-primary-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {XPATH_REFERENCE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCheatSheetCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      cheatSheetCategory === cat.id
                        ? 'bg-primary-600 text-white shadow-2xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {filteredCheatSheetItems.length > 0 ? (
                filteredCheatSheetItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-neutral-200/90 bg-white hover:border-primary-300 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900">{item.name}</span>
                        <code className="text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-mono">
                          {item.signature}
                        </code>
                        <Badge variant="neutral" size="sm" className="text-[10px]">
                          XPath {item.xpathVersion}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {item.description}
                      </p>
                      {item.cpiTip && (
                        <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>SAP CPI Tip: {item.cpiTip}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
                        <span className="text-neutral-400">Example:</span>
                        <code>{item.example}</code>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleInsertSnippet(item.example)}
                        className="text-xs h-8 px-3 font-semibold"
                      >
                        Apply Example
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-neutral-500 text-xs">
                  No matching functions found for "{cheatSheetSearch}".
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
              <span>{filteredCheatSheetItems.length} items available</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCheatSheet(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
