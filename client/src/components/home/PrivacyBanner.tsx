import { ShieldCheck, Lock, EyeOff, ServerOff } from 'lucide-react';
import { Container } from '@/components/layout/Container';

export function PrivacyBanner() {
  return (
    <section className="py-12 sm:py-16 bg-neutral-50/50 border-b border-neutral-200/70">
      <Container>
        <div className="rounded-2xl bg-white border border-neutral-200/90 p-6 sm:p-8 lg:p-10 shadow-xs relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left Header */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Enterprise Privacy Guarantee</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Your Sensitive SAP Data Never Leaves Your Browser
              </h2>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Enterprise payloads contain sensitive pricing, customer details, and proprietary schemas. ToolSAP processes 100% of payload parsing, validation, and transformations locally.
              </p>
            </div>

            {/* Right Pillars */}
            <div className="lg:col-span-7 grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/70 flex items-center justify-center text-emerald-700 mb-2.5">
                  <ServerOff className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold text-neutral-900 mb-1">Zero Server Ingestion</h3>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  Payloads are never transmitted, logged, or cached to any backend server.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="w-8 h-8 rounded-lg bg-sky-100/70 flex items-center justify-center text-sky-700 mb-2.5">
                  <Lock className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold text-neutral-900 mb-1">Local Browser Engine</h3>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  All XML formatters, parsers, and converters run completely in your client DOM.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="w-8 h-8 rounded-lg bg-amber-100/70 flex items-center justify-center text-amber-700 mb-2.5">
                  <EyeOff className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold text-neutral-900 mb-1">No Tracking Walls</h3>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  No login required, no paywalls, and no cookie surveillance on your developer workflow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
