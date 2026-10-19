import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Wand2,
  Copy,
  Download,
  Upload,
  Trash2,
  Sparkles,
  Check,
  AlertCircle,
  FileCode,
  Code2,
  BookOpen,
  Play,
  ArrowRight,
  Table,
  Search,
  Eye,
  X,
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
  generateXsltFromSourceAndTarget,
  type InferredFieldMapping,
} from '@/utils/xslt/xsltGenerator';
import { executeXsltTransform } from '@/utils/xslt/xsltEngine';
import {
  XSLT_RECIPES,
  XSLT_RECIPE_CATEGORIES,
} from '@/utils/xslt/xsltRecipesData';
import {
  XSLT_MAPPING_SAMPLES,
} from '@/utils/xslt/xsltSamplesData';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

type ToolMode = 'smart-mapping' | 'recipes' | 'direct-tester';

export function XsltGeneratorPage() {
  const { addToast } = useToastContext();

  // Mode state
  const [activeMode, setActiveMode] = useState<ToolMode>('smart-mapping');

  // Selected sample preset
  const [selectedSampleId, setSelectedSampleId] = useState<string>('sap-idoc-to-order');
  const activeSample = useMemo(
    () => XSLT_MAPPING_SAMPLES.find((s) => s.id === selectedSampleId) || XSLT_MAPPING_SAMPLES[0],
    [selectedSampleId]
  );

  // Selected recipe
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('strip-namespaces');
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState<string>('all');
  const activeRecipe = useMemo(
    () => XSLT_RECIPES.find((r) => r.id === selectedRecipeId) || XSLT_RECIPES[0],
    [selectedRecipeId]
  );

  // Editor Inputs
  const [sourceXml, setSourceXml] = useState(activeSample.sourceXml);
  const [targetXml, setTargetXml] = useState(activeSample.targetXml);
  const [xsltCode, setXsltCode] = useState('');
  const [transformedOutput, setTransformedOutput] = useState('');

  // Generation options
  const [xsltVersion, setXsltVersion] = useState<'1.0' | '2.0' | '3.0'>('1.0');

  // Output Tab in Right Pane: 'xslt' | 'preview' | 'mappings'
  const [activeOutputTab, setActiveOutputTab] = useState<'xslt' | 'preview' | 'mappings'>('xslt');

  // Processing & Diagnostic states
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<{
    message: string;
    line?: number;
    column?: number;
    code?: string;
    suggestion?: string;
  } | null>(null);

  const [mappings, setMappings] = useState<InferredFieldMapping[]>([]);
  const [unmappedFields, setUnmappedFields] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [showRecipesModal, setShowRecipesModal] = useState(false);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');

  const sourceFileInputRef = useRef<HTMLInputElement>(null);
  const targetFileInputRef = useRef<HTMLInputElement>(null);

  // Expose automated test runner on window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/utils/xslt/xsltGenerator.testSuite').then((mod) => {
        (window as unknown as { __runXsltTestSuite?: () => unknown }).__runXsltTestSuite =
          mod.runXsltTestSuite;
      });
    }
  }, []);

  // Handle Smart Mapping Generation
  const handleGenerateXslt = useCallback(async () => {
    if (!sourceXml.trim()) {
      setError({
        message: 'Source XML is empty. Provide a Source XML document.',
        suggestion: 'Paste an XML payload or select a sample from the presets.',
      });
      return;
    }
    if (!targetXml.trim()) {
      setError({
        message: 'Target XML is empty. Provide a Target XML structure to map against.',
        suggestion: 'Paste your desired target XML format or load a sample pair.',
      });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await generateXsltFromSourceAndTarget(sourceXml, targetXml, {
        xsltVersion,
        indent: true,
        omitXmlDeclaration: false,
        generateComments: true,
      });

      if (res.success) {
        setXsltCode(res.xslt);
        setMappings(res.mappings);
        setUnmappedFields(res.unmappedFields);

        if (res.testTransform?.success && res.testTransform.outputXml) {
          setTransformedOutput(res.testTransform.outputXml);
        } else {
          setTransformedOutput('');
        }

        setError(null);
        addToast({
          type: 'success',
          title: 'XSLT Stylesheet Generated',
          description: `Inferred ${res.mappings.length} field mappings and generated XSLT ${xsltVersion} in ${res.executionTimeMs} ms.`,
        });
      } else {
        setError(res.error || { message: 'Failed to generate XSLT stylesheet.' });
        addToast({
          type: 'error',
          title: 'Generation Failed',
          description: res.error?.message || 'Check XML syntax in Source and Target editors.',
        });
      }
    } catch (ex: any) {
      setError({
        message: ex?.message || 'An unexpected error occurred during XSLT generation.',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [sourceXml, targetXml, xsltVersion, addToast]);

  // Handle Direct Transformation Execution
  const handleRunTransform = useCallback(async () => {
    if (!sourceXml.trim()) {
      setError({
        message: 'Source XML is empty. Provide Source XML to transform.',
      });
      return;
    }
    if (!xsltCode.trim()) {
      setError({
        message: 'XSLT Stylesheet is empty. Provide an XSLT transformation to execute.',
      });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await executeXsltTransform(sourceXml, xsltCode, {
        autoFormatOutput: true,
      });

      if (res.success) {
        setTransformedOutput(res.outputXml);
        setActiveOutputTab('preview');
        setError(null);
        addToast({
          type: 'success',
          title: 'Transformation Complete',
          description: `Applied XSLT transform successfully in ${res.executionTimeMs} ms (${res.engineUsed}).`,
        });
      } else {
        setError(res.error || { message: 'Transformation execution failed.' });
        addToast({
          type: 'error',
          title: 'Transform Error',
          description: res.error?.message || 'Check template rules and XPath expressions.',
        });
      }
    } catch (ex: any) {
      setError({
        message: ex?.message || 'Failed to execute XSLT transformation.',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [sourceXml, xsltCode, addToast]);

  // Switch Sample Preset
  const handleSelectSample = (sampleId: string) => {
    const s = XSLT_MAPPING_SAMPLES.find((item) => item.id === sampleId);
    if (s) {
      setSelectedSampleId(sampleId);
      setSourceXml(s.sourceXml);
      setTargetXml(s.targetXml);
      setXsltCode('');
      setTransformedOutput('');
      setMappings([]);
      setUnmappedFields([]);
      setError(null);
      addToast({
        type: 'info',
        title: `Loaded ${s.name}`,
        description: s.description,
      });
    }
  };

  // Switch Enterprise Recipe
  const handleSelectRecipe = (recipeId: string) => {
    const r = XSLT_RECIPES.find((item) => item.id === recipeId);
    if (r) {
      setSelectedRecipeId(recipeId);
      setSourceXml(r.sampleXml);
      setXsltCode(r.defaultXslt);
      setTransformedOutput('');
      setError(null);
      // Auto run preview transform for this recipe
      executeXsltTransform(r.sampleXml, r.defaultXslt).then((res) => {
        if (res.success) {
          setTransformedOutput(res.outputXml);
        }
      });
      addToast({
        type: 'info',
        title: `Loaded Recipe: ${r.name}`,
        description: r.description,
      });
    }
  };

  // Initial generation on component load for the active sample
  useEffect(() => {
    handleGenerateXslt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format Code in active editor
  const handleFormat = async (target: 'source' | 'target' | 'xslt') => {
    let content = '';
    if (target === 'source') content = sourceXml;
    else if (target === 'target') content = targetXml;
    else if (target === 'xslt') content = xsltCode;

    if (!content.trim()) return;

    const res = await formatXml(content, { tabWidth: 2 });
    if (res.success && res.output) {
      if (target === 'source') setSourceXml(res.output);
      else if (target === 'target') setTargetXml(res.output);
      else if (target === 'xslt') setXsltCode(res.output);
      addToast({ type: 'success', title: 'Formatted', description: 'XML formatted cleanly.' });
    }
  };

  // File Upload Handlers
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    destination: 'source' | 'target' | 'xslt'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError({
        message: `File size exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (destination === 'source') setSourceXml(text);
      else if (destination === 'target') setTargetXml(text);
      else if (destination === 'xslt') setXsltCode(text);
      addToast({ type: 'success', title: 'File Loaded', description: file.name });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Copy to Clipboard
  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast({ type: 'success', title: 'Copied', description: `${label} copied to clipboard.` });
  };

  // Download File
  const handleDownload = (content: string, filename: string, mime: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({ type: 'info', title: 'Downloaded', description: `Saved as ${filename}.` });
  };

  // Filtered recipes for modal
  const filteredRecipes = useMemo(() => {
    return XSLT_RECIPES.filter((r) => {
      const matchesCategory =
        recipeCategoryFilter === 'all' || r.category === recipeCategoryFilter;
      const matchesSearch =
        !recipeSearchQuery.trim() ||
        r.name.toLowerCase().includes(recipeSearchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(recipeSearchQuery.toLowerCase()) ||
        r.cpiTip.toLowerCase().includes(recipeSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [recipeCategoryFilter, recipeSearchQuery]);

  // Top Toolbar Component
  const toolbarActions = (
    <div className="w-full flex flex-col gap-3">
      {/* Hidden file inputs */}
      <input
        ref={sourceFileInputRef}
        type="file"
        accept=".xml,.txt"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'source')}
      />
      <input
        ref={targetFileInputRef}
        type="file"
        accept=".xml,.txt"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'target')}
      />

      {/* Row 1: Mode Switcher & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/80 pb-3">
        {/* Mode Selector Tabs */}
        <div className="flex items-center rounded-lg bg-neutral-100 p-1">
          <button
            onClick={() => {
              setActiveMode('smart-mapping');
              if (!xsltCode) handleGenerateXslt();
            }}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeMode === 'smart-mapping'
                ? 'bg-white text-primary-600 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            Smart Mapping Generator
          </button>

          <button
            onClick={() => {
              setActiveMode('recipes');
              handleSelectRecipe(selectedRecipeId);
            }}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeMode === 'recipes'
                ? 'bg-white text-primary-600 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Enterprise Recipes
            <span className="rounded-full bg-primary-100 px-1.5 py-0.2 text-[10px] font-bold text-primary-700">
              12
            </span>
          </button>

          <button
            onClick={() => setActiveMode('direct-tester')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeMode === 'direct-tester'
                ? 'bg-white text-primary-600 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            Direct XSLT Tester
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {activeMode === 'smart-mapping' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Sample:</span>
              <select
                value={selectedSampleId}
                onChange={(e) => handleSelectSample(e.target.value)}
                className="h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 focus:border-primary-500 focus:outline-none"
              >
                {XSLT_MAPPING_SAMPLES.map((sample) => (
                  <option key={sample.id} value={sample.id}>
                    [{sample.badge}] {sample.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeMode === 'recipes' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Recipe:</span>
              <select
                value={selectedRecipeId}
                onChange={(e) => handleSelectRecipe(e.target.value)}
                className="h-8 max-w-[260px] rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 focus:border-primary-500 focus:outline-none"
              >
                {XSLT_RECIPES.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </option>
                ))}
              </select>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowRecipesModal(true)}
                className="h-8 text-xs font-medium"
              >
                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                Recipe Catalog
              </Button>
            </div>
          )}

          {/* XSLT Version Selector */}
          <div className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs">
            <span className="text-[11px] font-medium text-neutral-500">XSLT:</span>
            {(['1.0', '2.0', '3.0'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setXsltVersion(v)}
                className={`rounded px-1.5 py-0.5 text-[11px] font-semibold transition-all ${
                  xsltVersion === v
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                v{v}
              </button>
            ))}
          </div>

          {/* Primary Action Button */}
          {activeMode === 'smart-mapping' ? (
            <Button
              variant="primary"
              onClick={handleGenerateXslt}
              disabled={isProcessing}
              className="h-8 px-3.5 text-xs font-semibold shadow-xs"
            >
              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
              {isProcessing ? 'Generating...' : 'Generate XSLT'}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleRunTransform}
              disabled={isProcessing}
              className="h-8 px-3.5 text-xs font-semibold shadow-xs bg-emerald-600 hover:bg-emerald-700"
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {isProcessing ? 'Transforming...' : 'Test Transform'}
            </Button>
          )}
        </div>
      </div>

      {/* Error / Diagnostic Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div className="flex-1">
            <div className="font-semibold">{error.message}</div>
            {error.suggestion && (
              <div className="mt-1 text-rose-700">
                <span className="font-semibold">Suggestion:</span> {error.suggestion}
              </div>
            )}
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Recipe CPI Tip Banner in Recipes Mode */}
      {activeMode === 'recipes' && activeRecipe.cpiTip && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <span className="font-semibold">SAP CPI Implementation Tip:</span> {activeRecipe.cpiTip}
          </div>
        </div>
      )}
    </div>
  );

  // Render Left Pane
  const leftPane = (
    <div className="flex flex-col gap-4">
      {/* Source XML Card */}
      <Card padding="none" className="flex flex-col overflow-hidden border-neutral-200 shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200/80 bg-neutral-50/70 px-3.5 py-2">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-primary-600" />
            <span className="text-xs font-semibold text-neutral-800">
              Source XML
            </span>
            <span className="text-[11px] text-neutral-400">
              ({sourceXml ? sourceXml.split('\n').length : 0} lines)
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => sourceFileInputRef.current?.click()}
              className="h-7 px-2 text-[11px]"
              title="Upload XML file"
            >
              <Upload className="mr-1 h-3 w-3" />
              Upload
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleFormat('source')}
              className="h-7 px-2 text-[11px]"
              title="Format Source XML"
            >
              Format
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSourceXml('')}
              className="h-7 px-2 text-[11px] text-rose-500 hover:text-rose-600"
              title="Clear editor"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="min-h-[260px] max-h-[340px] flex-1 overflow-hidden">
          <CodeEditor
            value={sourceXml}
            onChange={setSourceXml}
            language="xml"
            placeholder="Paste source XML payload here..."
            height="290px"
          />
        </div>
      </Card>

      {/* Smart Mapping Mode: Target XML Card */}
      {activeMode === 'smart-mapping' && (
        <Card padding="none" className="flex flex-col overflow-hidden border-neutral-200 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200/80 bg-neutral-50/70 px-3.5 py-2">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-neutral-800">
                Target XML Desired Output
              </span>
              <span className="text-[11px] text-neutral-400">
                ({targetXml ? targetXml.split('\n').length : 0} lines)
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => targetFileInputRef.current?.click()}
                className="h-7 px-2 text-[11px]"
                title="Upload Target XML sample"
              >
                <Upload className="mr-1 h-3 w-3" />
                Upload
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleFormat('target')}
                className="h-7 px-2 text-[11px]"
                title="Format Target XML"
              >
                Format
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTargetXml('')}
                className="h-7 px-2 text-[11px] text-rose-500 hover:text-rose-600"
                title="Clear editor"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="min-h-[260px] max-h-[340px] flex-1 overflow-hidden">
            <CodeEditor
              value={targetXml}
              onChange={setTargetXml}
              language="xml"
              placeholder="Paste target XML desired format here..."
              height="290px"
            />
          </div>
        </Card>
      )}
    </div>
  );

  // Render Right Pane
  const rightPane = (
    <div className="flex flex-col gap-4">
      <Card padding="none" className="flex h-full flex-col overflow-hidden border-neutral-200 shadow-xs">
        {/* Output Navigation Header */}
        <div className="flex items-center justify-between border-b border-neutral-200/80 bg-neutral-50/70 px-3.5 py-2">
          {/* Output Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveOutputTab('xslt')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                activeOutputTab === 'xslt'
                  ? 'bg-white text-primary-600 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              Generated XSLT
            </button>

            <button
              onClick={() => setActiveOutputTab('preview')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                activeOutputTab === 'preview'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Transformed Result
              {transformedOutput && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            {activeMode === 'smart-mapping' && (
              <button
                onClick={() => setActiveOutputTab('mappings')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  activeOutputTab === 'mappings'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Table className="h-3.5 w-3.5" />
                Mappings Summary
                <span className="rounded-full bg-neutral-200 px-1.5 py-0.2 text-[10px] font-bold text-neutral-700">
                  {mappings.length}
                </span>
              </button>
            )}
          </div>

          {/* Utility Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRunTransform}
              className="h-7 px-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
              title="Execute XSLT against Source XML"
            >
              <Play className="mr-1 h-3 w-3" />
              Run Transform
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const toCopy =
                  activeOutputTab === 'preview' ? transformedOutput : xsltCode;
                handleCopy(toCopy, activeOutputTab === 'preview' ? 'Result' : 'XSLT');
              }}
              className="h-7 px-2 text-[11px]"
              title="Copy to clipboard"
            >
              {copied ? <Check className="mr-1 h-3 w-3 text-emerald-600" /> : <Copy className="mr-1 h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (activeOutputTab === 'preview') {
                  handleDownload(transformedOutput, 'transformed_result.xml', 'application/xml');
                } else {
                  handleDownload(xsltCode, 'mapping_transformation.xslt', 'application/xslt+xml');
                }
              }}
              className="h-7 px-2 text-[11px]"
              title="Download File"
            >
              <Download className="mr-1 h-3 w-3" />
              Download
            </Button>
          </div>
        </div>

        {/* Tab 1: XSLT Code View */}
        {activeOutputTab === 'xslt' && (
          <div className="min-h-[580px] flex-1 overflow-hidden">
            <CodeEditor
              value={xsltCode}
              onChange={setXsltCode}
              language="xml"
              placeholder="Generated or custom XSLT stylesheet appears here..."
              height="620px"
            />
          </div>
        )}

        {/* Tab 2: Live Transformed Output Preview */}
        {activeOutputTab === 'preview' && (
          <div className="min-h-[580px] flex-1 overflow-hidden">
            {transformedOutput ? (
              <CodeEditor
                value={transformedOutput}
                readOnly
                language="xml"
                height="620px"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-neutral-400 min-h-[500px]">
                <Play className="mb-2 h-10 w-10 text-neutral-300" />
                <p className="text-sm font-medium text-neutral-700">
                  No Transformed Output Yet
                </p>
                <p className="mt-1 max-w-sm text-xs text-neutral-500">
                  Click the "Run Transform" button above to execute the XSLT against the Source XML and inspect the live result.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunTransform}
                  className="mt-4 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                >
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                  Run Transform Now
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Visual Mappings Table */}
        {activeOutputTab === 'mappings' && (
          <div className="min-h-[580px] flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold text-neutral-800">
                Inferred Field Mappings ({mappings.length})
              </div>
              {unmappedFields.length > 0 && (
                <div className="text-xs text-amber-700">
                  {unmappedFields.length} unmapped field(s) require constant or manual assignment
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Target Field</th>
                    <th className="px-3 py-2 font-semibold">Source Field</th>
                    <th className="px-3 py-2 font-semibold">Match Type</th>
                    <th className="px-3 py-2 font-semibold">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {mappings.map((m, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-neutral-50/60"
                    >
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-neutral-800">
                        {m.targetName}
                        {m.isAttribute && (
                          <span className="ml-1 text-[10px] text-neutral-400">(@attr)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-primary-600">
                        {m.sourceName}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700">
                          {m.matchType}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.round(m.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-neutral-600">
                            {Math.round(m.confidence * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Unmapped Fields List */}
            {unmappedFields.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-950">
                <div className="font-semibold">Unmapped Target Fields:</div>
                <ul className="mt-1 list-inside list-disc font-mono text-[11px] text-amber-800">
                  {unmappedFields.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-amber-700">
                  Placeholder comments have been added in the generated XSLT. You can edit the XSLT directly to specify hardcoded constants or mathematical expressions.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <>
      <SEOHead
        title="XSLT Generator & Transformer — Online XML Transformation Tool | ToolSAP"
        description="Generate XSLT stylesheets from XML samples with live in-browser testing, 12 enterprise SAP CPI recipes, and namespace stripping."
        keywords={[
          'xslt generator',
          'generate xslt online',
          'xslt tester',
          'xml to xslt',
          'sap cpi xslt',
          'xslt mapping',
          'strip namespaces xslt',
          'xslt 1.0 2.0',
        ]}
      />

      <ToolWorkspaceLayout
        toolName="XSLT Generator"
        toolDescription="Generate XSLT stylesheets from Source & Target XML samples, apply 12 production-grade enterprise recipes, or test transformations directly in-browser with zero latency."
        badgeLabel="Privacy-First · 100% In-Browser"
        toolbarActions={toolbarActions}
        leftPane={leftPane}
        rightPane={rightPane}
      />

      {/* ─── RECIPES CATALOG MODAL ───────────────────────────────────────────── */}
      {showRecipesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-neutral-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    SAP CPI Enterprise XSLT Recipes Catalog
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Production-ready stylesheets for integration patterns, namespaces, filtering, and standards.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRecipesModal(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Search & Category Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-5 py-3">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                {XSLT_RECIPE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setRecipeCategoryFilter(cat.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                      recipeCategoryFilter === cat.id
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'bg-white text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={recipeSearchQuery}
                  onChange={(e) => setRecipeSearchQuery(e.target.value)}
                  className="h-7 w-52 rounded-md border border-neutral-200 bg-white pl-8 pr-3 text-xs text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Recipes Grid */}
            <div className="grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto p-5 md:grid-cols-2">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => {
                    handleSelectRecipe(recipe.id);
                    setActiveMode('recipes');
                    setShowRecipesModal(false);
                  }}
                  className="group flex cursor-pointer flex-col justify-between rounded-lg border border-neutral-200 bg-white p-3.5 transition-all hover:border-primary-500 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-neutral-800 group-hover:text-primary-600">
                        {recipe.name}
                      </h4>
                      <Badge variant="neutral" size="sm" className="text-[10px]">
                        XSLT {recipe.xsltVersion}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {recipe.description}
                    </p>
                  </div>

                  {recipe.cpiTip && (
                    <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
                      <span className="font-semibold">CPI Tip:</span> {recipe.cpiTip}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-5 py-3 text-xs text-neutral-500">
              <span>Showing {filteredRecipes.length} recipes</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowRecipesModal(false)}
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
