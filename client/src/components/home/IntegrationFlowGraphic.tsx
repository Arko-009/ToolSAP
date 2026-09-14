import { ArrowDown, CheckCircle2, Cpu, FileCode, Layers, ShieldCheck } from 'lucide-react';

export function IntegrationFlowGraphic() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Decorative ambient background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/10 via-primary-400/5 to-primary-600/10 rounded-2xl blur-xl -z-10" />

      {/* Main Terminal / Workbench Card */}
      <div className="relative rounded-2xl bg-white border border-neutral-200/90 shadow-lg shadow-neutral-900/5 overflow-hidden font-sans">
        {/* Card Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-50/90 border-b border-neutral-200/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            <span className="ml-2 text-xs font-mono font-medium text-neutral-500">
              iflow://sap-cpi/inbound-processor.xml
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[11px] font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Trace</span>
          </div>
        </div>

        {/* Pipeline Body */}
        <div className="p-4 sm:p-5 space-y-3 bg-gradient-to-b from-white to-neutral-50/40">
          {/* Step 1: Inbound Payload */}
          <div className="group p-3 rounded-xl border border-neutral-200/70 bg-white hover:border-primary-300/80 hover:shadow-xs transition-all duration-150">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-sky-50 border border-sky-200/70 flex items-center justify-center">
                  <FileCode className="h-3.5 w-3.5 text-sky-600" />
                </div>
                <span className="text-xs font-semibold text-neutral-900">1. Inbound Invoicing Payload</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200/60">
                cXML / IDoc
              </span>
            </div>
            <div className="bg-neutral-900 rounded-lg p-2.5 text-[11px] font-mono text-neutral-300 overflow-hidden leading-relaxed shadow-inner">
              <span className="text-sky-400">&lt;InvoiceDetailRequest&gt;</span>
              <div className="pl-3 text-neutral-400">
                &lt;PayloadID&gt;<span className="text-amber-300">INV-2026-0914</span>&lt;/PayloadID&gt;
              </div>
              <span className="text-sky-400">&lt;/InvoiceDetailRequest&gt;</span>
            </div>
          </div>

          {/* Connector Arrow 1 */}
          <div className="flex items-center justify-center py-0.5">
            <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-500 text-[10px] font-mono">
              <ArrowDown className="h-3 w-3 text-primary-600" />
              <span>Validate &amp; Transform</span>
            </div>
          </div>

          {/* Step 2: CPI Groovy / Transformation Node */}
          <div className="group p-3 rounded-xl border border-primary-200/80 bg-primary-50/20 hover:border-primary-300 transition-all duration-150">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary-100 border border-primary-300/80 flex items-center justify-center">
                  <Cpu className="h-3.5 w-3.5 text-primary-700" />
                </div>
                <span className="text-xs font-semibold text-neutral-900">2. Cloud Integration Pipeline</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary-100/70 text-primary-800 border border-primary-200">
                Groovy Script
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white border border-neutral-200/80 text-neutral-700">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                <span className="truncate">XML Schema (XSD) Valid</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white border border-neutral-200/80 text-neutral-700">
                <Layers className="h-3 w-3 text-primary-600 shrink-0" />
                <span className="truncate">OData Model Map</span>
              </div>
            </div>
          </div>

          {/* Connector Arrow 2 */}
          <div className="flex items-center justify-center py-0.5">
            <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-500 text-[10px] font-mono">
              <ArrowDown className="h-3 w-3 text-primary-600" />
              <span>OData Dispatch</span>
            </div>
          </div>

          {/* Step 3: Outbound System Result */}
          <div className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 border border-emerald-300/80 flex items-center justify-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-900">3. Target: SAP S/4HANA Cloud</div>
                  <div className="text-[10px] text-neutral-500 font-mono">POST /sap/opu/odata4/api_businesspartner/</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                  201 Created
                </span>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">38ms response</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-200/70 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            <span>Browser-Engine Sandbox</span>
          </div>
          <span className="text-neutral-400">Zero Server Uploads</span>
        </div>
      </div>
    </div>
  );
}
