import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Wrench, ShieldCheck, Terminal, Sparkles } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { IntegrationFlowGraphic } from './IntegrationFlowGraphic';

export function HeroSection() {
  return (
    <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-24 overflow-hidden border-b border-neutral-200/70 bg-gradient-to-b from-white via-neutral-50/30 to-white">
      {/* Subtle background technical grid pattern */}
      <div className="absolute inset-0 -z-10 bg-grid-subtle opacity-60 pointer-events-none" />

      {/* Soft gradient focal lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary-100/35 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-12 right-10 w-72 h-72 bg-sky-100/25 rounded-full blur-3xl -z-10 pointer-events-none" />

      <Container>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Editorial Content */}
          <div className="lg:col-span-7 text-left">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/80 text-primary-700 text-xs font-semibold tracking-wide uppercase mb-6 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
              <span>SAP Integration Developer Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-neutral-900 tracking-tight leading-[1.12]">
              Learn SAP.<br />
              Build Faster.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-700 to-primary-900">
                Solve Integration Problems.
              </span>
            </h1>

            {/* Value Proposition Copy */}
            <p className="mt-5 text-base sm:text-lg text-neutral-600 max-w-xl leading-relaxed font-normal">
              A developer-first platform combining structured, practical SAP Integration Suite lessons with free, browser-based utilities engineered specifically for SAP workflows.
            </p>

            {/* Action CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 max-w-md sm:max-w-none">
              <Link
                to="/learning"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all duration-150 shadow-xs hover:shadow-sm"
              >
                <BookOpen className="h-4 w-4" />
                <span>Start Learning Free</span>
                <ArrowRight className="h-4 w-4 ml-0.5 text-primary-200" />
              </Link>
              <Link
                to="/tools"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm sm:text-base font-semibold text-neutral-700 bg-white border border-neutral-200/90 rounded-xl hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-150 shadow-2xs"
              >
                <Wrench className="h-4 w-4 text-neutral-500" />
                <span>Explore Developer Tools</span>
              </Link>
            </div>

            {/* Authentic Trust / Architecture Badges */}
            <div className="mt-10 pt-6 border-t border-neutral-200/60 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-neutral-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-neutral-700">100% Client-Side Privacy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-primary-600 shrink-0" />
                <span className="font-medium text-neutral-700">Zero Server Payload Storage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-medium text-neutral-700">SAP Integration Suite Focused</span>
              </div>
            </div>
          </div>

          {/* Right Column: Authentic Technical Visual */}
          <div className="lg:col-span-5 w-full">
            <IntegrationFlowGraphic />
          </div>
        </div>
      </Container>
    </section>
  );
}
