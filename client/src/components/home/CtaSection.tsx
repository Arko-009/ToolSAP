import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Wrench, Sparkles } from 'lucide-react';
import { Container } from '@/components/layout/Container';

export function CtaSection() {
  return (
    <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary-50/70 rounded-full blur-3xl -z-10 pointer-events-none" />

      <Container>
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/80 text-primary-700 text-xs font-semibold uppercase tracking-wider mb-5">
            <Sparkles className="h-3.5 w-3.5 text-primary-600" />
            <span>Start Building Today</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight">
            Ready to Accelerate Your SAP Integration Workflow?
          </h2>

          <p className="mt-4 text-base text-neutral-600 leading-relaxed">
            Begin with the structured Integration Suite curriculum or dive directly into our privacy-first browser utilities. Free forever, no registration needed.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/learning"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all duration-150 shadow-xs hover:shadow-sm"
            >
              <BookOpen className="h-4 w-4" />
              <span>Start Learning Free</span>
              <ArrowRight className="h-4 w-4 ml-0.5 text-primary-200" />
            </Link>

            <Link
              to="/tools"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-neutral-700 bg-white border border-neutral-200/90 rounded-xl hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-150 shadow-2xs"
            >
              <Wrench className="h-4 w-4 text-neutral-500" />
              <span>Explore Developer Tools</span>
            </Link>
          </div>

          <p className="mt-6 text-xs text-neutral-400 font-mono">
            Designed for SAP Integration Developers · SAP BTP · Cloud Integration (CPI)
          </p>
        </div>
      </Container>
    </section>
  );
}
