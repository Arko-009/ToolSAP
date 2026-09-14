import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Wrench, CheckCircle2, Code2, ShieldCheck, Sparkles, Cpu } from 'lucide-react';
import { Container } from '@/components/layout/Container';

export function PillarsSection() {
  return (
    <section className="py-16 sm:py-24 bg-white border-b border-neutral-200/70">
      <Container>
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5 text-primary-600" />
            <span>Core Platform Pillars</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight">
            Built for Real SAP Development
          </h2>
          <p className="mt-3 text-base text-neutral-600 leading-relaxed">
            Two specialized pillars designed to replace scattered forum posts and ad-heavy generic websites with a modern, developer-first hub.
          </p>
        </div>

        {/* 2 Distinct Pillar Cards */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
          {/* Pillar 1: Learn */}
          <div className="group relative rounded-2xl bg-gradient-to-b from-white to-primary-50/20 border border-neutral-200/90 hover:border-primary-300 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/30 rounded-full blur-2xl pointer-events-none -z-10" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-xs shadow-primary-600/30 group-hover:scale-105 transition-transform duration-150">
                  <BookOpen className="h-6 w-6" />
                </div>
                <span className="text-xs font-mono font-semibold text-primary-700 bg-primary-100/70 px-2.5 py-1 rounded-full border border-primary-200">
                  PILLAR 01 · LEARN
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Structured SAP Learning
              </h3>
              <p className="mt-3 text-sm sm:text-base text-neutral-600 leading-relaxed">
                Step-by-step, concept-first tutorials designed for developers who build in SAP Integration Suite. Understand the architectural "why", not just button clicks.
              </p>

              <ul className="mt-6 space-y-2.5 text-sm text-neutral-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
                  <span>Real enterprise scenarios (IDocs, cXML, OData, REST APIs)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
                  <span>Deep dives into Groovy scripting, XSLT, and Content Modifiers</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
                  <span>Production troubleshooting and exception subprocess patterns</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-200/80">
              <Link
                to="/learning"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                <span>Browse Integration Curriculum</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Pillar 2: Build / Tools */}
          <div className="group relative rounded-2xl bg-gradient-to-b from-white to-emerald-50/20 border border-neutral-200/90 hover:border-emerald-300 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none -z-10" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs shadow-neutral-900/20 group-hover:scale-105 transition-transform duration-150">
                  <Wrench className="h-6 w-6" />
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-200">
                  PILLAR 02 · TOOLS
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Browser-Based Developer Tools
              </h3>
              <p className="mt-3 text-sm sm:text-base text-neutral-600 leading-relaxed">
                Free, privacy-first developer utilities designed for SAP integration data. Format messy XML, validate XSD schemas, and test XPath queries directly in your browser.
              </p>

              <ul className="mt-6 space-y-2.5 text-sm text-neutral-700">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>100% client-side: payloads never touch or leave to any server</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Cpu className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Instant formatting, minification, and syntax tree inspection</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Code2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Sample SAP payload presets (IDocs, cXML, OData) built in</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-200/80">
              <Link
                to="/tools"
                className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 hover:text-primary-600 transition-colors"
              >
                <span>Explore Developer Toolbox</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
