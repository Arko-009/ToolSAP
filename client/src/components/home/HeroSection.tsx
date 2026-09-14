import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Wrench,
  ShieldCheck,
  Zap,
  Layers,
  GraduationCap,
  Code2,
  Users2,
  Rocket,
  Puzzle,
  Database,
} from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { IntegrationFlowGraphic } from './IntegrationFlowGraphic';

export function HeroSection() {
  return (
    <section className="relative pt-8 pb-14 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-16 overflow-hidden border-b border-neutral-200/70 bg-gradient-to-b from-white via-neutral-50/25 to-white">
      {/* Background Soft Light & Dot Matrix */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary-100/25 rounded-full blur-3xl -z-10 pointer-events-none" />

      <Container>
        {/* Main 2-Column Grid */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-center">
          {/* Left Column: Editorial & Value Proposition (6 cols) */}
          <div className="lg:col-span-6 text-left flex flex-col justify-center">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50/90 border border-primary-200/80 text-primary-700 text-xs font-semibold tracking-wide uppercase mb-5 shadow-2xs self-start">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
              <span>SAP Integration Developer Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.35rem] font-extrabold text-neutral-950 tracking-tight leading-[1.08]">
              Learn SAP.<br />
              Build Faster.<br />
              <span className="text-primary-600">
                Solve Integration<br />
                Problems.
              </span>
            </h1>

            {/* Subheading / Copy */}
            <p className="mt-5 text-base sm:text-lg text-neutral-600 max-w-lg leading-relaxed font-normal">
              A modern, developer-first platform combining structured, practical SAP Integration Suite lessons with free, client-side tools designed for everyday SAP workflows.
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <Link
                to="/learning"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all duration-150 shadow-xs hover:shadow-sm"
              >
                <BookOpen className="h-4 w-4" />
                <span>Start Learning Free</span>
                <ArrowRight className="h-4 w-4 ml-0.5 text-primary-200" />
              </Link>
              <Link
                to="/tools"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-neutral-800 bg-white border border-neutral-200/90 rounded-xl hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-150 shadow-2xs"
              >
                <Wrench className="h-4 w-4 text-neutral-500" />
                <span>Explore Developer Tools</span>
              </Link>
            </div>

            {/* Trust & Value Indicators (6 items in responsive grid) */}
            <div className="mt-8 pt-6 border-t border-neutral-200/70 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3.5 gap-y-3.5">
              {/* Item 1 */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5 shadow-2xs">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900 leading-tight">100% Client-Side Privacy</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5 leading-tight">Your data stays in your browser</div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600 shrink-0 mt-0.5 shadow-2xs">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900 leading-tight">Zero Server Storage</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5 leading-tight">We don't store your payloads</div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0 mt-0.5 shadow-2xs">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900 leading-tight">SAP Integration Focused</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5 leading-tight">Built for real-world use cases</div>
                </div>
              </div>

              {/* Item 4: Built for Speed */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shrink-0 mt-0.5 shadow-2xs">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900 leading-tight">Built for Speed</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5 leading-tight">Fast tools, instant results, zero setup</div>
                </div>
              </div>

              {/* Item 5: Developer First */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-2xs">
                  <Puzzle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900 leading-tight">Developer First</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5 leading-tight">Practical workflows, not complicated documentation</div>
                </div>
              </div>

              {/* Item 6: Learn by Doing */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0 mt-0.5 shadow-2xs">
                  <Rocket className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900 leading-tight">Learn by Doing</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5 leading-tight">Examples, hands-on practice, real SAP scenarios</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual System (6 cols) */}
          <div className="lg:col-span-6 w-full flex items-center justify-center">
            <IntegrationFlowGraphic />
          </div>
        </div>

        {/* Bottom Feature Strip (Matching Mockup) */}
        <div className="mt-14 pt-8 border-t border-neutral-200/70 relative">
          <div className="text-center -mt-11 mb-6">
            <span className="inline-block px-4 py-1 bg-neutral-50 rounded-full border border-neutral-200/60 text-[11px] font-bold uppercase tracking-widest text-neutral-500 shadow-2xs">
              Trusted by SAP Developers Worldwide
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1 */}
            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white border border-neutral-200/80 shadow-xs hover:border-primary-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 shrink-0">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 truncate">Practical Learning</div>
                <div className="text-[11px] text-neutral-500 truncate">Concepts, examples, hands-on</div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white border border-neutral-200/80 shadow-xs hover:border-primary-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                <Code2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 truncate">Useful Developer Tools</div>
                <div className="text-[11px] text-neutral-500 truncate">Format, validate, convert, test</div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white border border-neutral-200/80 shadow-xs hover:border-purple-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Users2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 truncate">Real-World Scenarios</div>
                <div className="text-[11px] text-neutral-500 truncate">Built for actual development</div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white border border-neutral-200/80 shadow-xs hover:border-primary-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-primary-600 shrink-0">
                <Rocket className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 truncate">Developer First</div>
                <div className="text-[11px] text-neutral-500 truncate">Fast. Simple. Effective.</div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
