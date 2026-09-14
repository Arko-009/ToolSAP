import { ArrowDown, CheckCircle2, Cpu, FileCode, Layers, ShieldCheck, Zap } from 'lucide-react';

export function IntegrationFlowGraphic() {
  return (
    <div className="relative w-full">
      {/* Decorative ambient background glow */}
      <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary-500/10 via-sky-400/10 to-primary-600/10 rounded-2xl blur-xl -z-10 pointer-events-none" />

      {/* Main Terminal Workbench Card */}
      <div className="rounded-2xl bg-white border border-neutral-200/90 shadow-lg shadow-neutral-900/5 overflow-hidden font-sans">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50/90 border-b border-neutral-200/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            <span className="ml-2 text-xs font-mono font-medium text-neutral-500 truncate max-w-[200px] sm:max-w-none">
              pipeline://sap-cpi/inbound-order.xml
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[11px] font-mono font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Trace Active</span>
          </div>
        </div>

        {/* Pipeline Steps Container */}
        <div className="p-4 sm:p-5 space-y-2.5 bg-gradient-to-b from-white to-neutral-50/40">
          {/* Node 1: Inbound Payload */}
          <div className="p-3 rounded-xl border border-neutral-200/80 bg-white hover:border-primary-200 transition-colors shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-sky-50 border border-sky-200/60 flex items-center justify-center text-sky-600">
                  <FileCode className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-neutral-900">1. Inbound cXML / IDoc Payload</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200/60">
                HTTPS Inbound
              </span>
            </div>
            <div className="bg-neutral-900/95 rounded-lg px-3 py-2 text-[11px] font-mono text-neutral-300 flex items-center justify-between shadow-inner">
              <span className="truncate text-sky-300">&lt;Invoice doc=&quot;INVOIC02&quot; id=&quot;INV-9014&quot; /&gt;</span>
              <span className="text-[10px] text-emerald-400 font-medium shrink-0 ml-2">Validated</span>
            </div>
          </div>

          {/* Stem Connector 1 */}
          <div className="flex items-center justify-center py-0.5">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100/90 border border-neutral-200/70 text-neutral-500 text-[10px] font-mono">
              <ArrowDown className="h-3 w-3 text-primary-600" />
              <span>Transform &amp; Map</span>
            </div>
          </div>

          {/* Node 2: CPI Runtime Processing */}
          <div className="p-3 rounded-xl border border-primary-200/80 bg-primary-50/20 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary-100 border border-primary-300/80 flex items-center justify-center text-primary-700">
                  <Cpu className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-neutral-900">2. Cloud Integration Pipeline</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary-100/70 text-primary-800 border border-primary-200">
                Groovy Script
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white border border-neutral-200/80 text-neutral-700">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                <span className="truncate">XSD Schema Valid</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white border border-neutral-200/80 text-neutral-700">
                <Layers className="h-3 w-3 text-primary-600 shrink-0" />
                <span className="truncate">OData Model Map</span>
              </div>
            </div>
          </div>

          {/* Stem Connector 2 */}
          <div className="flex items-center justify-center py-0.5">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100/90 border border-neutral-200/70 text-neutral-500 text-[10px] font-mono">
              <ArrowDown className="h-3 w-3 text-primary-600" />
              <span>OData Dispatch</span>
            </div>
          </div>

          {/* Node 3: Target Output */}
          <div className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 border border-emerald-300/80 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-900">3. Target: SAP S/4HANA Cloud</div>
                  <div className="text-[10px] text-neutral-500 font-mono">POST /sap/opu/odata4/api_businesspartner/</div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                  201 Created
                </span>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">38ms latency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Bar */}
        <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-200/70 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-primary-600" />
            <span>Browser-Engine Sandbox</span>
          </div>
          <span className="text-neutral-400">Zero Server Uploads</span>
        </div>
      </div>
    </div>
  );
}
