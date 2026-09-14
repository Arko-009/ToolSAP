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

            {/* Quick Trust Badges */}
            <div className="mt-8 pt-5 border-t border-neutral-200/60 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-neutral-700">100% Client-Side Privacy</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-sky-600 shrink-0" />
                <span className="font-medium text-neutral-700">Instant In-Browser Execution</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary-600 shrink-0" />
                <span className="font-medium text-neutral-700">SAP Integration Suite</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual System (6 cols) */}
          <div className="lg:col-span-6 w-full flex items-center justify-center">
            <IntegrationFlowGraphic />
          </div>
        </div>

        {/* All 6 Indicators Spread Equally Throughout the Full Width Line */}
        <div className="mt-12 pt-8 border-t border-neutral-200/70 relative">
          <div className="text-center -mt-11 mb-6">
            <span className="inline-block px-4 py-1 bg-neutral-50 rounded-full border border-neutral-200/60 text-[11px] font-bold uppercase tracking-widest text-neutral-500 shadow-2xs">
              Trusted by SAP Developers Worldwide
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5 items-stretch w-full">
            {/* Card 1: 100% Client-Side Privacy */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all min-w-0 group">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 leading-tight">100% Privacy</div>
                <div className="text-[11px] text-neutral-500 mt-1 leading-snug">Data stays in browser</div>
              </div>
            </div>

            {/* Card 2: Zero Server Storage */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all min-w-0 group">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Database className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 leading-tight">Zero Storage</div>
                <div className="text-[11px] text-neutral-500 mt-1 leading-snug">No payloads saved</div>
              </div>
            </div>

            {/* Card 3: SAP Integration Focused */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all min-w-0 group">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Layers className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 leading-tight">SAP Focused</div>
                <div className="text-[11px] text-neutral-500 mt-1 leading-snug">Real-world use cases</div>
              </div>
            </div>

            {/* Card 4: Built for Speed */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all min-w-0 group">
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 leading-tight">Built for Speed</div>
                <div className="text-[11px] text-neutral-500 mt-1 leading-snug">Instant results, fast</div>
              </div>
            </div>

            {/* Card 5: Developer First */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all min-w-0 group">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Puzzle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 leading-tight">Developer First</div>
                <div className="text-[11px] text-neutral-500 mt-1 leading-snug">Practical workflows</div>
              </div>
            </div>

            {/* Card 6: Learn by Doing */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:border-rose-300 hover:shadow-xs transition-all min-w-0 group">
              <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Rocket className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 leading-tight">Learn by Doing</div>
                <div className="text-[11px] text-neutral-500 mt-1 leading-snug">Hands-on practice</div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
