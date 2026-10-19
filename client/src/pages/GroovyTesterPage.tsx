import { useState, useCallback, useEffect } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Copy,
  Download,
  Check,
  AlertCircle,
  FileCode,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  ExternalLink,
  Plus,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useToastContext } from '@/components/ui/Toast';
import { ToolWorkspaceLayout } from '@/components/tools/ToolWorkspaceLayout';
import { CodeEditor } from '@/components/tools/CodeEditor';
import { GROOVY_TEMPLATES } from '@/utils/groovy/templates';
import { executeGroovyScript } from '@/utils/groovy/groovyRunner';
import type {
  ExecutionResult,
  GroovyRuntimeVersion,
  KeyValueDiff,
} from '@/utils/groovy/types';

export function GroovyTesterPage() {
  const { addToast } = useToastContext();

  // Active template & runtime
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default');
  const [runtime, setRuntime] = useState<GroovyRuntimeVersion>('4.0.29');

  // Input states
  const [script, setScript] = useState<string>(GROOVY_TEMPLATES[0].script);
  const [body, setBody] = useState<string>(GROOVY_TEMPLATES[0].sampleBody);
  const [headerRows, setHeaderRows] = useState<Array<{ id: string; key: string; value: string }>>(() =>
    Object.entries(GROOVY_TEMPLATES[0].sampleHeaders).map(([k, v], idx) => ({
      id: `h_${idx}_${Date.now()}`,
      key: k,
      value: v,
    }))
  );
  const [propRows, setPropRows] = useState<Array<{ id: string; key: string; value: string }>>(() =>
    Object.entries(GROOVY_TEMPLATES[0].sampleProperties).map(([k, v], idx) => ({
      id: `p_${idx}_${Date.now()}`,
      key: k,
      value: v,
    }))
  );

  // Tab selections
  const [activeInputTab, setActiveInputTab] = useState<'body' | 'headers' | 'properties'>('body');
  const [activeOutputTab, setActiveOutputTab] = useState<'output' | 'diff' | 'changes' | 'logs' | 'diagnostics' | 'attachments'>('output');

  // Execution states
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Expose automated test runner in browser window for developer regression testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/utils/groovy/groovyTester.testSuite').then((mod) => {
        (window as unknown as { __runGroovyTestSuite?: () => unknown }).__runGroovyTestSuite =
          mod.runGroovyTestSuite;
      });
    }
  }, []);

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    const tmpl = GROOVY_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    setSelectedTemplateId(templateId);
    setScript(tmpl.script);
    setBody(tmpl.sampleBody);
    setHeaderRows(
      Object.entries(tmpl.sampleHeaders).map(([k, v], idx) => ({
        id: `h_${idx}_${Date.now()}`,
        key: k,
        value: v,
      }))
    );
    setPropRows(
      Object.entries(tmpl.sampleProperties).map(([k, v], idx) => ({
        id: `p_${idx}_${Date.now()}`,
        key: k,
        value: v,
      }))
    );
    setResult(null);

    addToast({
      type: 'info',
      title: `Loaded Template: ${tmpl.name}`,
      description: tmpl.description,
    });
  };

  // Convert Header & Property rows to maps
  const getHeadersMap = useCallback(() => {
    const map: Record<string, string> = {};
    headerRows.forEach((r) => {
      if (r.key.trim()) {
        map[r.key.trim()] = r.value;
      }
    });
    return map;
  }, [headerRows]);

  const getPropertiesMap = useCallback(() => {
    const map: Record<string, string> = {};
    propRows.forEach((r) => {
      if (r.key.trim()) {
        map[r.key.trim()] = r.value;
      }
    });
    return map;
  }, [propRows]);

  // Execute Script
  const handleRun = useCallback(async () => {
    if (!script.trim()) {
      addToast({
        type: 'warning',
        title: 'Empty Script',
        description: 'Please write or paste a Groovy script to execute.',
      });
      return;
    }

    setIsExecuting(true);

    try {
      const headersMap = getHeadersMap();
      const propsMap = getPropertiesMap();

      const execResult = await executeGroovyScript({
        script,
        body,
        headers: headersMap,
        properties: propsMap,
        runtime,
      });

      setResult(execResult);

      if (execResult.success) {
        addToast({
          type: 'success',
          title: 'Script Executed Successfully',
          description: `Completed in ${execResult.durationMs}ms. Output payload and logs updated.`,
        });
      } else {
        const firstError = execResult.diagnostics.find((d) => d.severity === 'error');
        addToast({
          type: 'error',
          title: 'Execution Failed',
          description: firstError?.message || 'Script encountered errors during execution.',
        });
        setActiveOutputTab('diagnostics');
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Simulation Error',
        description: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsExecuting(false);
    }
  }, [script, body, getHeadersMap, getPropertiesMap, runtime, addToast]);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

  // Copy output
  const handleCopyOutput = () => {
    if (!result?.outputBody) return;
    navigator.clipboard.writeText(result.outputBody);
    setCopied(true);
    addToast({
      type: 'success',
      title: 'Copied to Clipboard',
      description: 'Resulting message body copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Download output
  const handleDownloadOutput = () => {
    if (!result?.outputBody) return;
    const ext = result.bodyType === 'xml' ? 'xml' : result.bodyType === 'json' ? 'json' : 'txt';
    const blob = new Blob([result.outputBody], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cpi_output_${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Add / remove header rows
  const addHeaderRow = () => {
    setHeaderRows((prev) => [...prev, { id: `h_${Date.now()}`, key: '', value: '' }]);
  };
  const removeHeaderRow = (id: string) => {
    setHeaderRows((prev) => prev.filter((r) => r.id !== id));
  };
  const updateHeaderRow = (id: string, field: 'key' | 'value', val: string) => {
    setHeaderRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  // Add / remove property rows
  const addPropRow = () => {
    setPropRows((prev) => [...prev, { id: `p_${Date.now()}`, key: '', value: '' }]);
  };
  const removePropRow = (id: string) => {
    setPropRows((prev) => prev.filter((r) => r.id !== id));
  };
  const updatePropRow = (id: string, field: 'key' | 'value', val: string) => {
    setPropRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  // Detect body syntax for editor
  const detectInputLanguage = (text: string): 'xml' | 'json' | 'text' => {
    const trimmed = text.trim();
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) return 'xml';
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      return 'json';
    }
    return 'text';
  };

  // Toolbar Actions Header
  const toolbarActions = (
    <div className="flex flex-wrap items-center gap-3">
      {/* Template Selector */}
      <div className="flex items-center gap-2 bg-neutral-100/80 px-2.5 py-1.5 rounded-lg border border-neutral-200/60">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-semibold text-neutral-600">Template:</span>
        <select
          value={selectedTemplateId}
          onChange={(e) => handleSelectTemplate(e.target.value)}
          className="text-xs font-medium text-neutral-800 bg-transparent border-none focus:outline-none cursor-pointer"
        >
          {GROOVY_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Runtime Selector */}
      <div className="flex items-center gap-2 bg-neutral-100/80 px-2.5 py-1.5 rounded-lg border border-neutral-200/60">
        <Terminal className="h-4 w-4 text-primary-600" />
        <span className="text-xs font-semibold text-neutral-600">Runtime:</span>
        <select
          value={runtime}
          onChange={(e) => setRuntime(e.target.value as GroovyRuntimeVersion)}
          className="text-xs font-semibold text-neutral-800 bg-transparent border-none focus:outline-none cursor-pointer"
        >
          <option value="4.0.29">Groovy 4.0.29 (Default)</option>
          <option value="2.4.21">Groovy 2.4.21 (Legacy)</option>
        </select>
      </div>

      {/* Run Button */}
      <Button
        variant="primary"
        size="md"
        onClick={handleRun}
        loading={isExecuting}
        className="font-semibold shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <Play className="h-4 w-4 mr-1.5 fill-current" />
        <span>Run Script</span>
        <span className="ml-2 text-[10px] font-mono opacity-80 border border-emerald-400/40 px-1.5 py-0.5 rounded">
          Ctrl+Enter
        </span>
      </Button>

      {/* Reset */}
      <Button
        variant="ghost"
        size="md"
        onClick={() => handleSelectTemplate(selectedTemplateId)}
        title="Reset script and inputs to template defaults"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );

  // Left Pane: Groovy Script Editor
  const leftPane = (
    <Card className="flex flex-col h-full border-neutral-200/80 shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50/90 border-b border-neutral-200/70">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-bold text-neutral-800">Groovy Script</span>
          <Badge variant="neutral" size="sm">
            {script.split('\n').length} lines
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(script);
              addToast({ type: 'success', title: 'Script Copied' });
            }}
            title="Copy script"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScript('')}
            title="Clear editor"
          >
            <Trash2 className="h-3.5 w-3.5 text-neutral-400 hover:text-rose-600" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-[480px] max-h-[620px] overflow-hidden flex flex-col">
        <CodeEditor
          value={script}
          onChange={(val) => setScript(val)}
          language="groovy"
          placeholder="// def Message processData(Message message) { ... }"
          height="100%"
          minHeight="480px"
          maxHeight="620px"
        />
      </div>

      <div className="px-4 py-2 bg-neutral-50/80 border-t border-neutral-200/60 flex items-center justify-between text-xs text-neutral-500">
        <span>Entry point: <code className="font-mono text-neutral-700 font-semibold">processData(Message message)</code></span>
        <span>{script.length} characters</span>
      </div>
    </Card>
  );

  // Right Pane: Input Deck + Results Deck
  const rightPane = (
    <div className="flex flex-col gap-6 h-full">
      {/* Top Deck: Input Message Configuration */}
      <Card className="flex flex-col border-neutral-200/80 shadow-xs overflow-hidden">
        {/* Input Tabs Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-50 border-b border-neutral-200/70">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveInputTab('body')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeInputTab === 'body'
                  ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-sky-600" />
                Message Body
              </span>
            </button>

            <button
              onClick={() => setActiveInputTab('headers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeInputTab === 'headers'
                  ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-600" />
                Headers ({headerRows.filter((r) => r.key.trim()).length})
              </span>
            </button>

            <button
              onClick={() => setActiveInputTab('properties')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeInputTab === 'properties'
                  ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-purple-600" />
                Properties ({propRows.filter((r) => r.key.trim()).length})
              </span>
            </button>
          </div>

          <div className="text-[11px] text-neutral-400 font-mono">
            {activeInputTab === 'body' && `${body.length} bytes`}
          </div>
        </div>

        {/* Tab Content: Body */}
        {activeInputTab === 'body' && (
          <div className="h-[220px] overflow-hidden flex flex-col">
            <CodeEditor
              value={body}
              onChange={(val) => setBody(val)}
              language={detectInputLanguage(body)}
              placeholder="Paste input XML, JSON, or text payload..."
              height="100%"
              minHeight="220px"
              maxHeight="220px"
            />
          </div>
        )}

        {/* Tab Content: Headers */}
        {activeInputTab === 'headers' && (
          <div className="p-3 h-[220px] overflow-y-auto space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-neutral-500">Camel Message Headers</span>
              <Button variant="ghost" size="sm" onClick={addHeaderRow} className="text-xs text-primary-600">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Header
              </Button>
            </div>

            {headerRows.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-400">No headers configured. Click &quot;Add Header&quot; to configure.</div>
            ) : (
              headerRows.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) => updateHeaderRow(row.id, 'key', e.target.value)}
                    placeholder="Header-Name"
                    className="flex-1 text-xs px-2.5 py-1.5 rounded border border-neutral-200 bg-white font-mono focus:border-primary-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => updateHeaderRow(row.id, 'value', e.target.value)}
                    placeholder="Header Value"
                    className="flex-1 text-xs px-2.5 py-1.5 rounded border border-neutral-200 bg-white font-mono focus:border-primary-500 focus:outline-none"
                  />
                  <button
                    onClick={() => removeHeaderRow(row.id)}
                    className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                    title="Remove header"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Content: Properties */}
        {activeInputTab === 'properties' && (
          <div className="p-3 h-[220px] overflow-y-auto space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-neutral-500">Camel Exchange Properties</span>
              <Button variant="ghost" size="sm" onClick={addPropRow} className="text-xs text-primary-600">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Property
              </Button>
            </div>

            {propRows.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-400">No exchange properties configured.</div>
            ) : (
              propRows.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) => updatePropRow(row.id, 'key', e.target.value)}
                    placeholder="propertyKey"
                    className="flex-1 text-xs px-2.5 py-1.5 rounded border border-neutral-200 bg-white font-mono focus:border-primary-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => updatePropRow(row.id, 'value', e.target.value)}
                    placeholder="Property Value"
                    className="flex-1 text-xs px-2.5 py-1.5 rounded border border-neutral-200 bg-white font-mono focus:border-primary-500 focus:outline-none"
                  />
                  <button
                    onClick={() => removePropRow(row.id)}
                    className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                    title="Remove property"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Bottom Deck: Results, Diffs, Logs & Diagnostics */}
      <Card className="flex flex-col flex-1 border-neutral-200/80 shadow-xs overflow-hidden">
        {/* Results Header Tabs */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-neutral-50 border-b border-neutral-200/70">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveOutputTab('output')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeOutputTab === 'output'
                  ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Output Body
            </button>

            <button
              onClick={() => setActiveOutputTab('changes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeOutputTab === 'changes'
                  ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Headers & Props
              {result && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200 text-neutral-700">
                  {result.headerDiffs.filter((d) => d.status !== 'unchanged').length +
                    result.propertyDiffs.filter((d) => d.status !== 'unchanged').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveOutputTab('logs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeOutputTab === 'logs'
                  ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Console Logs
              {result && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200 text-neutral-700">
                  {result.consoleLogs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveOutputTab('diagnostics')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeOutputTab === 'diagnostics'
                  ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Diagnostics
              {result && result.diagnostics.length > 0 && (
                <span
                  className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                    result.diagnostics.some((d) => d.severity === 'error')
                      ? 'bg-rose-100 text-rose-700 font-bold'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {result.diagnostics.length}
                </span>
              )}
            </button>

            {result && result.attachments.length > 0 && (
              <button
                onClick={() => setActiveOutputTab('attachments')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeOutputTab === 'attachments'
                    ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                MPL Attachments ({result.attachments.length})
              </button>
            )}
          </div>

          {result && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-500 font-mono flex items-center gap-1">
                <Clock className="h-3 w-3 text-neutral-400" />
                {result.durationMs}ms
              </span>
              <Badge variant={result.success ? 'success' : 'error'} size="sm">
                {result.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
          )}
        </div>

        {/* Tab 1: Output Body */}
        {activeOutputTab === 'output' && (
          <div className="flex-1 flex flex-col min-h-[300px]">
            {result ? (
              <>
                <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-50/80 border-b border-neutral-200/50 text-xs">
                  <span className="text-neutral-500">
                    Type: <strong className="text-neutral-800 uppercase">{result.bodyType}</strong> ({result.outputBody.length} bytes)
                  </span>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={handleCopyOutput}>
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownloadOutput}>
                      <Download className="h-3.5 w-3.5 mr-1" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>

                <div className="flex-1 min-h-[260px] overflow-hidden flex flex-col">
                  <CodeEditor
                    value={result.outputBody}
                    readOnly
                    language={result.bodyType === 'xml' ? 'xml' : result.bodyType === 'json' ? 'json' : 'text'}
                    height="100%"
                    minHeight="260px"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
                <Terminal className="h-10 w-10 text-neutral-300 mb-2 stroke-[1.5]" />
                <p className="text-sm font-medium text-neutral-600">Ready to execute</p>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                  Click <strong className="text-neutral-700">Run Script</strong> or press <code className="bg-neutral-100 px-1 py-0.5 rounded text-[11px]">Ctrl+Enter</code> to simulate message processing.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Headers & Properties Diff Inspector */}
        {activeOutputTab === 'changes' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {result ? (
              <>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                    Headers Changed / Processed ({result.headerDiffs.length})
                  </h4>
                  <div className="space-y-1.5">
                    {result.headerDiffs.length === 0 ? (
                      <p className="text-xs text-neutral-400">No headers present.</p>
                    ) : (
                      result.headerDiffs.map((diff) => (
                        <DiffItemRow key={diff.key} diff={diff} />
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                    Exchange Properties ({result.propertyDiffs.length})
                  </h4>
                  <div className="space-y-1.5">
                    {result.propertyDiffs.length === 0 ? (
                      <p className="text-xs text-neutral-400">No exchange properties present.</p>
                    ) : (
                      result.propertyDiffs.map((diff) => (
                        <DiffItemRow key={diff.key} diff={diff} />
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-neutral-400 text-center py-8">Run script to inspect header & property mutations.</p>
            )}
          </div>
        )}

        {/* Tab 3: Console Logs */}
        {activeOutputTab === 'logs' && (
          <div className="p-3 flex-1 flex flex-col bg-slate-950 font-mono text-xs overflow-y-auto max-h-[360px] text-slate-200">
            {result && result.consoleLogs.length > 0 ? (
              result.consoleLogs.map((log, idx) => (
                <div key={idx} className="py-0.5 border-b border-slate-900 flex items-start gap-2">
                  <span className="text-slate-500 select-none">{String(idx + 1).padStart(2, '0')}:</span>
                  <span className={log.startsWith('[ERROR]') ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                    {log}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic py-6 text-center">
                No console output. Use <code className="text-slate-400">println(&quot;...&quot;)</code> in your Groovy script to log output.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Diagnostics */}
        {activeOutputTab === 'diagnostics' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {result && result.diagnostics.length > 0 ? (
              result.diagnostics.map((diag, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs ${
                    diag.severity === 'error'
                      ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                      : diag.category === 'UNSUPPORTED_SAP_API'
                      ? 'bg-purple-50/80 border-purple-200 text-purple-900'
                      : 'bg-amber-50/80 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-start gap-2 font-semibold">
                    {diag.severity === 'error' ? (
                      <XCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                    ) : diag.category === 'UNSUPPORTED_SAP_API' ? (
                      <AlertCircle className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{diag.message}</span>
                        {diag.line && (
                          <span className="font-mono text-[11px] opacity-80">Line {diag.line}</span>
                        )}
                      </div>
                      {diag.snippet && (
                        <div className="mt-1.5 p-1.5 bg-black/5 rounded font-mono text-[11px] overflow-x-auto">
                          {diag.snippet}
                        </div>
                      )}
                      {diag.suggestion && (
                        <p className="mt-1.5 text-[11px] opacity-90 leading-relaxed font-normal">
                          💡 <strong>Advice:</strong> {diag.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-400 text-xs flex flex-col items-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1" />
                <span>Zero diagnostic errors detected.</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Attachments */}
        {activeOutputTab === 'attachments' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {result && result.attachments.length > 0 ? (
              result.attachments.map((att) => (
                <div key={att.id} className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-neutral-800">{att.id}</h5>
                    <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      {att.contentType} • {att.content.length} bytes
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([att.content], { type: att.contentType });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = att.id;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" /> Download
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-400 text-center py-8">No message attachments recorded.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );

  // SEO Info Section
  const infoSection = (
    <div className="space-y-12">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-5 border-neutral-200/80">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 mb-1">100% Client-Side Privacy</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Proprietary SAP order schemas, employee PII, and financial integration payloads never leave your browser. Zero server ingestion.
          </p>
        </Card>

        <Card className="p-5 border-neutral-200/80">
          <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mb-3">
            <Terminal className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 mb-1">Authentic CPI Message Contract</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Simulates <code className="text-neutral-800 font-semibold font-mono">com.sap.gateway.ip.core.customdev.util.Message</code>, typed body conversions, mutable maps, and <code className="text-neutral-800 font-semibold font-mono">messageLogFactory</code>.
          </p>
        </Card>

        <Card className="p-5 border-neutral-200/80">
          <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-3">
            <Info className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 mb-1">Upgrade & Tenant Diagnostics</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Automatically identifies Groovy 2.4 vs 4.0 deprecations, flags tenant-only services (Partner Directory, Value Mapping), and pinpoints runtime errors.
          </p>
        </Card>
      </div>

      <div className="rounded-xl bg-neutral-900 text-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              SAP Cloud Integration Best Practices
            </span>
            <h3 className="text-xl font-bold mt-1">Deploy Confidently to SAP Integration Suite</h3>
            <p className="text-neutral-400 text-sm mt-2 max-w-2xl leading-relaxed">
              Verify your Groovy script logic, message payload mutations, and regex transformations locally before pushing to SAP Cloud Integration. Eliminate lengthy iFlow redeployment cycles.
            </p>
          </div>
          <a
            href="https://help.sap.com/docs/integration-suite/sap-integration-suite/read-and-modify-message-header-message-body-and-exchange-properties"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/20 transition-all shrink-0"
          >
            <span>SAP Scripting Docs</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SEOHead
        title="Groovy Script Tester for SAP CPI | ToolSAP"
        description="Test and debug Groovy scripts for SAP Cloud Integration. Simulate Message headers, exchange properties, XML/JSON transformations, and diagnose errors in-browser."
        keywords={[
          'groovy script tester',
          'sap cpi groovy',
          'sap integration suite groovy',
          'groovy script simulator',
          'sap message object mock',
          'cpi groovy tester online',
          'toolsap',
        ]}
      />

      <ToolWorkspaceLayout
        toolName="Groovy Script Tester"
        toolDescription="Test and debug SAP Cloud Integration Groovy scripts with realistic Message object mutations, live header/property diffs, and upgrade diagnostics."
        badgeLabel="100% In-Browser · Zero Server Ingestion"
        toolbarActions={toolbarActions}
        leftPane={leftPane}
        rightPane={rightPane}
        infoSection={infoSection}
      />
    </>
  );
}

/**
 * Renders a single Key-Value diff row with visual status badges
 */
function DiffItemRow({ diff }: { diff: KeyValueDiff }) {
  const getBadge = () => {
    switch (diff.status) {
      case 'added':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">+ ADDED</span>;
      case 'modified':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">~ MODIFIED</span>;
      case 'deleted':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">- DELETED</span>;
      case 'unchanged':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600">UNCHANGED</span>;
    }
  };

  return (
    <div className="flex items-center justify-between p-2 rounded border border-neutral-100 bg-white text-xs">
      <div className="flex items-center gap-2 overflow-hidden">
        {getBadge()}
        <span className="font-mono font-semibold text-neutral-800 truncate">{diff.key}</span>
      </div>

      <div className="font-mono text-[11px] text-right truncate max-w-[50%]">
        {diff.status === 'modified' ? (
          <span className="flex items-center gap-1.5">
            <span className="text-neutral-400 line-through truncate">{diff.originalValue}</span>
            <span className="text-neutral-400">→</span>
            <span className="text-emerald-700 font-semibold truncate">{diff.newValue}</span>
          </span>
        ) : diff.status === 'added' ? (
          <span className="text-emerald-700 font-semibold truncate">{diff.newValue}</span>
        ) : diff.status === 'deleted' ? (
          <span className="text-rose-600 line-through truncate">{diff.originalValue}</span>
        ) : (
          <span className="text-neutral-600 truncate">{diff.newValue || diff.originalValue}</span>
        )}
      </div>
    </div>
  );
}
