import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Wrench, ShieldCheck, Terminal, Sparkles } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { IntegrationFlowGraphic } from './IntegrationFlowGraphic';

export function HeroSection() {
  return (
    <section className="relative pt-8 pb-14 sm:pt-12 sm:pb-18 lg:pt-14 lg:pb-20 overflow-hidden border-b border-neutral-200/70 bg-gradient-to-b from-white via-neutral-50/20 to-white">
      {/* Subtle background technical grid pattern */}
      <div className="absolute inset-0 -z-10 bg-grid-subtle opacity-50 pointer-events-none" />

      {/* Soft gradient focal lights */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-primary-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

      <Container>
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
          {/* Left Column: Editorial Content (6 cols) */}
          <div className="lg:col-span-6 text-left flex flex-col justify-center">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/80 text-primary-700 text-xs font-semibold tracking-wide uppercase mb-4 shadow-2xs self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
              <span>SAP Integration Developer Platform</span>
            </div>

            {/* Main Headline - Controlled Height, No Artificial 4-line Stacking */}
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] xl:text-[2.9rem] font-extrabold text-neutral-900 tracking-tight leading-[1.18]">
              Learn SAP. Build Faster.{' '}
              <span className="text-primary-600 block sm:inline lg:block xl:inline">
                Solve Integration Problems.
              </span>
            </h1>

            {/* Value Proposition Copy */}
            <p className="mt-4 text-sm sm:text-base text-neutral-600 max-w-lg leading-relaxed font-normal">
              A modern, developer-first platform combining structured, production-grade SAP Integration Suite lessons with free, client-side tools designed for everyday SAP workflows.
            </p>

            {/* Action CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/learning"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all duration-150 shadow-xs hover:shadow-sm"
              >
                <BookOpen className="h-4 w-4" />
                <span>Start Learning Free</span>
                <ArrowRight className="h-4 w-4 ml-0.5 text-primary-200" />
              </Link>
              <Link
                to="/tools"
                className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-700 bg-white border border-neutral-200/90 rounded-xl hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-150 shadow-2xs"
              >
                <Wrench className="h-4 w-4 text-neutral-500" />
                <span>Explore Developer Tools</span>
              </Link>
            </div>

            {/* Authentic Trust / Architecture Badges */}
            <div className="mt-7 pt-5 border-t border-neutral-200/60 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neutral-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-neutral-700">100% Client-Side Privacy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-primary-600 shrink-0" />
                <span className="font-medium text-neutral-700">Zero Server Storage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-medium text-neutral-700">SAP Integration Suite Focused</span>
              </div>
            </div>
          </div>

          {/* Right Column: Technical Visual (6 cols) */}
          <div className="lg:col-span-6 w-full flex items-center justify-center">
            <IntegrationFlowGraphic />
          </div>
        </div>
      </Container>
    </section>
  );
}
