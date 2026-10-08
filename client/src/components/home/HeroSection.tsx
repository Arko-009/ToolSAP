import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Wrench,
  Layers,
  Rocket,
} from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { IntegrationFlowGraphic } from './IntegrationFlowGraphic';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export function HeroSection() {
  const [headlineRef, headlineVisible] = useScrollReveal<HTMLDivElement>(0.1, '0px');
  const [graphicRef, graphicVisible] = useScrollReveal<HTMLDivElement>(0.1, '0px');
  const [pillarsRef, pillarsVisible] = useScrollReveal<HTMLDivElement>(0.1);

  return (
    <section className="relative pt-8 pb-14 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-16 overflow-hidden section-divider bg-gradient-to-b from-white via-neutral-50/25 to-white">
      {/* Background Soft Light & Dot Matrix */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary-100/25 rounded-full blur-3xl -z-10 pointer-events-none animate-glow" />

      {/* Floating decorative orb */}
      <div className="absolute top-[15%] right-[8%] w-3 h-3 rounded-full bg-primary-400/30 animate-float pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[20%] left-[5%] w-2 h-2 rounded-full bg-violet-400/25 animate-float-delayed pointer-events-none" aria-hidden="true" />

      <Container>
        {/* Main 2-Column Grid */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-center">
          {/* Left Column: Editorial & Value Proposition (6 cols) */}
          <div
            ref={headlineRef}
            className={`lg:col-span-6 text-left flex flex-col justify-center reveal-base reveal-left ${headlineVisible ? 'reveal-visible' : ''}`}
          >
            {/* Eyebrow Pill */}
            <div className="font-nunito inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50/90 border border-primary-200/80 text-primary-700 text-xs font-bold tracking-wider uppercase mb-5 shadow-2xs self-start badge-bounce">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse relative animate-pulse-ring" />
              <span>SAP Integration Developer Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-coiny text-4xl sm:text-5xl lg:text-[3.25rem] text-neutral-950 tracking-normal leading-[1.15]">
              Learn SAP.<br />
              Build Faster.<br />
              <span className="text-primary-600">
                Solve Integration<br />
                Problems.
              </span>
            </h1>

            {/* Editorial Description */}
            <p className="mt-5 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl font-normal">
              A modern, developer-first platform combining structured, practical SAP Integration Suite lessons with free, client-side tools designed for everyday SAP workflows.
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <Link
                to="/learning"
                className="btn-press inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all duration-150 shadow-xs hover:shadow-sm"
              >
                <BookOpen className="h-4 w-4" />
                <span>Start Learning Free</span>
                <ArrowRight className="h-4 w-4 ml-0.5 text-primary-200" />
              </Link>
              <Link
                to="/tools"
                className="btn-press inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-neutral-800 bg-white border border-neutral-200/90 rounded-xl hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-150 shadow-2xs"
              >
                <Wrench className="h-4 w-4 text-neutral-500" />
                <span>Explore Developer Tools</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Visual System (6 cols) */}
          <div
            ref={graphicRef}
            className={`lg:col-span-6 w-full flex items-center justify-center reveal-base reveal-right ${graphicVisible ? 'reveal-visible' : ''}`}
            style={{ transitionDelay: '150ms' }}
          >
            <IntegrationFlowGraphic />
          </div>
        </div>

        {/* Platform Pillars Section */}
        <div
          ref={pillarsRef}
          className={`mt-14 pt-8 border-t border-neutral-200/70 relative reveal-base reveal-up ${pillarsVisible ? 'reveal-visible' : ''}`}
        >
          <div className="text-center -mt-11 mb-6">
            <span className="inline-block px-4 py-1 bg-neutral-50 rounded-full border border-neutral-200/60 text-[11px] font-bold uppercase tracking-widest text-neutral-500 shadow-2xs badge-bounce">
              Trusted by SAP Developers Worldwide
            </span>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch stagger-children ${pillarsVisible ? 'reveal-visible' : ''}`}>
            <div className="card-premium card-glow flex items-start gap-3.5 p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:border-primary-200 transition-colors">
              <div className="icon-lift w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-primary-600 shrink-0 shadow-2xs">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-neutral-900 leading-tight">Practical Learning</div>
                <div className="text-xs text-neutral-500 mt-0.5 leading-snug">Concepts, examples, hands-on</div>
              </div>
            </div>

            <div className="card-premium card-glow flex items-start gap-3.5 p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:border-primary-200 transition-colors">
              <div className="icon-lift w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-primary-600 shrink-0 shadow-2xs">
                <Wrench className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-neutral-900 leading-tight">Useful Developer Tools</div>
                <div className="text-xs text-neutral-500 mt-0.5 leading-snug">Format, validate, convert, test</div>
              </div>
            </div>

            <div className="card-premium card-glow flex items-start gap-3.5 p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:border-purple-200 transition-colors">
              <div className="icon-lift w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs">
                <Layers className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-neutral-900 leading-tight">Real-World Scenarios</div>
                <div className="text-xs text-neutral-500 mt-0.5 leading-snug">Built for actual development</div>
              </div>
            </div>

            <div className="card-premium card-glow flex items-start gap-3.5 p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:border-indigo-200 transition-colors">
              <div className="icon-lift w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                <Rocket className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-neutral-900 leading-tight">Developer First</div>
                <div className="text-xs text-neutral-500 mt-0.5 leading-snug">Fast. Simple. Effective.</div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
