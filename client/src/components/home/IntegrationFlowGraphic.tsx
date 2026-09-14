import { useState } from 'react';
import {
  Cloud,
  Network,
  Shield,
  Database,
  FileCode,
  Link2,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

export function IntegrationFlowGraphic() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'XML' | 'JSON' | 'XSLT' | 'Groovy'>('XML');

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full select-none pt-6 pb-4">
      {/* Background Soft Glow & Dot Matrix */}
      <div className="absolute top-10 right-0 w-80 h-80 bg-gradient-to-br from-primary-200/30 via-sky-100/20 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-4 right-0 w-44 h-44 bg-dots-subtle opacity-40 -z-10 pointer-events-none" />

      {/* Sketched Hand-Drawn Annotation: Top Left */}
      <div className="absolute -top-3 left-16 sm:left-24 hidden sm:flex items-center gap-1.5 z-20 pointer-events-none">
        <div className="text-right leading-none">
          <span className="font-['Caveat',cursive] text-lg font-bold text-neutral-600 block">From Payload</span>
          <span className="font-['Caveat',cursive] text-xl font-bold text-primary-600 block">to Possibilities</span>
        </div>
        {/* Curved hand-drawn arrow pointing down-right */}
        <svg className="w-8 h-8 text-primary-500 -rotate-12 translate-y-2" viewBox="0 0 40 40" fill="none">
          <path
            d="M5 10 C 15 8, 28 14, 30 28"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="1 0"
          />
          <path
            d="M23 26 L 30 29 L 31 21"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Sketched Hand-Drawn Annotation: Top Right */}
      <div className="absolute -top-5 right-2 hidden md:flex items-start gap-1 z-20 pointer-events-none">
        <svg className="w-8 h-8 text-primary-500 rotate-45 translate-y-1" viewBox="0 0 40 40" fill="none">
          <path
            d="M5 25 C 10 12, 22 8, 30 14"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M23 10 L 31 14 L 28 22"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="text-left font-['Caveat',cursive] text-sm sm:text-base font-bold text-primary-600/90 leading-tight">
          <span className="block text-neutral-500 font-semibold">Transform</span>
          <span className="block">Validate</span>
          <span className="block">Integrate</span>
          <span className="block text-primary-700">Build Better</span>
        </div>
      </div>

      {/* Main Composition Wrapper */}
      <div className="relative flex items-center">
        {/* Left Tech Node Column (BTP, CPI, API Mgmt, S/4HANA) */}
        <div className="flex flex-col gap-2.5 z-10 shrink-0 mr-2 sm:mr-3">
          {/* Node 1: BTP */}
          <div className="group flex flex-col items-center justify-center w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:border-primary-300 hover:scale-105 transition-all duration-150">
            <div className="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center text-primary-600 mb-0.5">
              <Cloud className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-neutral-700 font-sans tracking-tight">BTP</span>
          </div>

          {/* Node 2: CPI */}
          <div className="group flex flex-col items-center justify-center w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:border-purple-300 hover:scale-105 transition-all duration-150">
            <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mb-0.5">
              <Network className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-neutral-700 font-sans tracking-tight">CPI</span>
          </div>

          {/* Node 3: API Mgmt */}
          <div className="group flex flex-col items-center justify-center w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:border-rose-300 hover:scale-105 transition-all duration-150">
            <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 mb-0.5">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-[9px] font-bold text-neutral-700 font-sans tracking-tight">API Mgmt</span>
          </div>

          {/* Node 4: S/4HANA */}
          <div className="group flex flex-col items-center justify-center w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:border-emerald-300 hover:scale-105 transition-all duration-150">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-0.5">
              <Database className="h-4 w-4" />
            </div>
            <span className="text-[9px] font-bold text-neutral-700 font-sans tracking-tight">S/4HANA</span>
          </div>
        </div>

        {/* Connecting SVG Dotted Lines */}
        <div className="hidden sm:block absolute left-14 top-8 bottom-8 w-10 pointer-events-none z-0">
          <svg className="w-full h-full text-primary-300" viewBox="0 0 40 240" fill="none">
            <path d="M 0 24 C 20 24, 30 110, 40 110" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 0 84 C 18 84, 28 115, 40 115" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 0 148 C 18 148, 28 125, 40 120" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 0 210 C 20 210, 30 130, 40 125" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          </svg>
        </div>

        {/* Main Layer 1: White "Integration Flow" Canvas Card */}
        <div className="flex-1 rounded-2xl bg-white/95 border border-neutral-200/90 shadow-xl shadow-neutral-900/5 pb-16 pt-3 px-3 sm:px-4 ml-0 sm:ml-2">
          {/* Top Window Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-bold text-neutral-800">Integration Flow</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-medium font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Flow Active</span>
            </div>
          </div>

          {/* 3 Horizontal Connected Pipeline Nodes */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-1 py-1 sm:py-2">
            {/* Step 1: XML/JSON */}
            <div className="flex-1 rounded-xl bg-neutral-50/80 border border-neutral-200/70 p-2 sm:p-2.5 text-center flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200/70 flex items-center justify-center text-primary-600 mb-1">
                <FileCode className="h-4 w-4" />
              </div>
              <div className="text-[11px] font-bold text-neutral-800 truncate">XML / JSON</div>
              <div className="text-[10px] text-neutral-500">Payload</div>
            </div>

            {/* Arrow 1 */}
            <span className="text-primary-500 font-bold text-sm shrink-0">→</span>

            {/* Step 2: Process */}
            <div className="flex-1 rounded-xl bg-primary-50/40 border border-primary-200/70 p-2 sm:p-2.5 text-center flex flex-col items-center shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-primary-100 border border-primary-300/80 flex items-center justify-center text-primary-700 mb-1">
                <Link2 className="h-4 w-4" />
              </div>
              <div className="text-[11px] font-bold text-neutral-900 truncate">Process</div>
              <div className="text-[10px] text-primary-700 font-medium">Transform</div>
            </div>

            {/* Arrow 2 */}
            <span className="text-primary-500 font-bold text-sm shrink-0">→</span>

            {/* Step 3: SAP System */}
            <div className="flex-1 rounded-xl bg-neutral-50/80 border border-neutral-200/70 p-2 sm:p-2.5 text-center flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-[10px] mb-1">
                SAP
              </div>
              <div className="text-[11px] font-bold text-neutral-800 truncate">SAP System</div>
              <div className="text-[10px] text-neutral-500">Connected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 2: Overlapping Foreground Floating Dark Code Editor Window */}
      <div className="relative -mt-14 sm:-mt-16 ml-8 sm:ml-12 mr-1 sm:mr-16 rounded-2xl bg-[#0f172a] border border-neutral-700/80 shadow-2xl shadow-neutral-950/25 overflow-hidden z-20 font-mono">
        {/* Code Editor Tabs Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e293b]/90 border-b border-neutral-800">
          <div className="flex items-center gap-1">
            {(['XML', 'JSON', 'XSLT', 'Groovy'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-[#334155] text-white font-semibold shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Copy snippet"
            aria-label="Copy snippet"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Code Body */}
        <div className="p-3 text-[11px] leading-relaxed text-neutral-300 overflow-x-auto">
          <div className="flex">
            <span className="text-neutral-500 select-none mr-3 text-right w-3">1</span>
            <span>
              <span className="text-sky-400">&lt;Invoice&gt;</span>
            </span>
          </div>
          <div className="flex">
            <span className="text-neutral-500 select-none mr-3 text-right w-3">2</span>
            <span className="pl-3">
              <span className="text-sky-400">&lt;InvoiceID&gt;</span>
              <span className="text-amber-300">INV-2024-001</span>
              <span className="text-sky-400">&lt;/InvoiceID&gt;</span>
            </span>
          </div>
          <div className="flex">
            <span className="text-neutral-500 select-none mr-3 text-right w-3">3</span>
            <span className="pl-3">
              <span className="text-sky-400">&lt;Customer&gt;</span>
            </span>
          </div>
          <div className="flex">
            <span className="text-neutral-500 select-none mr-3 text-right w-3">4</span>
            <span className="pl-6">
              <span className="text-sky-400">&lt;Name&gt;</span>
              <span className="text-emerald-300">SAP Customer</span>
              <span className="text-sky-400">&lt;/Name&gt;</span>
            </span>
          </div>
          <div className="flex">
            <span className="text-neutral-500 select-none mr-3 text-right w-3">5</span>
            <span className="pl-6">
              <span className="text-sky-400">&lt;Country&gt;</span>
              <span className="text-amber-300">IN</span>
              <span className="text-sky-400">&lt;/Country&gt;</span>
            </span>
          </div>
          <div className="flex">
            <span className="text-neutral-500 select-none mr-3 text-right w-3">6</span>
            <span className="pl-3">
              <span className="text-sky-400">&lt;/Customer&gt;</span>
            </span>
          </div>
          <div className="flex">
            <span className="text-neutral-500 select-none mr-3 text-right w-3">7</span>
            <span>
              <span className="text-sky-400">&lt;/Invoice&gt;</span>
            </span>
          </div>
        </div>
      </div>

      {/* Layer 3: Overlapping Floating Action Badge (Bottom Right) */}
      <div className="absolute -bottom-2 -right-1 sm:right-2 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-neutral-200/90 shadow-xl p-3 sm:p-3.5 flex items-start gap-2.5 max-w-[190px] animate-fade-in">
        <div className="w-7 h-7 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 shrink-0 mt-0.5">
          <Zap className="h-4 w-4 fill-primary-600" />
        </div>
        <div className="font-sans leading-tight">
          <div className="text-xs font-bold text-primary-700">Test</div>
          <div className="text-xs font-bold text-primary-700">Transform</div>
          <div className="text-xs font-bold text-primary-700">Validate</div>
          <div className="text-[10px] text-neutral-500 font-medium mt-1">All in your browser</div>
        </div>
      </div>
    </div>
  );
}
