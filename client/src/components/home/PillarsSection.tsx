import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Wrench, Check } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { GlowingCards, GlowingCard } from '@/components/ui/GlowingCards';

export function PillarsSection() {
  const [headerRef, headerVisible] = useScrollReveal<HTMLDivElement>();
  const [columnsRef, columnsVisible] = useScrollReveal<HTMLDivElement>(0.08);

  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-white section-divider border-b border-neutral-200/60">
      <Container>
        {/* Section Header — Clean & Calm */}
        <div
          ref={headerRef}
          className={`text-center max-w-xl mx-auto mb-16 sm:mb-20 reveal-base reveal-up ${headerVisible ? 'reveal-visible' : ''}`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
            Built for Real SAP Development
          </h2>
          <p className="mt-3 text-base sm:text-lg text-neutral-500 font-normal">
            Everything you need to master concepts and build faster in one place.
          </p>
        </div>

        {/* Two Minimal Open Columns with Lightswind Glowing Cards Animation */}
        <div
          ref={columnsRef}
          className={`max-w-5xl mx-auto stagger-children ${columnsVisible ? 'reveal-visible' : ''}`}
        >
          <GlowingCards className="grid md:grid-cols-2 gap-8 lg:gap-12" glowRadius={360}>
            {/* Pillar 01: LEARN — Soft Green Glow Theme */}
            <GlowingCard
              glowColor="#10b981"
              className="p-8 sm:p-12"
            >
              <div>
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-105 transition-transform duration-200">
                  <BookOpen className="h-6 w-6 stroke-[2]" />
                </div>

                {/* Eyebrow */}
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Pillar 01 · Learn
                </span>

                {/* Heading */}
                <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mt-2 mb-3">
                  Structured SAP Learning
                </h3>

                {/* Description */}
                <p className="text-base text-neutral-600 leading-relaxed mb-8">
                  Learn SAP Integration Suite through practical, step-by-step lessons.
                </p>

                {/* 3 Short Benefits */}
                <ul className="space-y-3.5 mb-10 text-sm sm:text-base text-neutral-600">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Real-world scenarios</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Hands-on concepts</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Practical troubleshooting</span>
                  </li>
                </ul>
              </div>

              {/* Clean CTA */}
              <div>
                <Link
                  to="/learning"
                  className="inline-flex items-center gap-2 text-base font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group/link"
                >
                  <span>Explore Learning</span>
                  <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1.5 transition-transform" />
                </Link>
              </div>
            </GlowingCard>

            {/* Pillar 02: TOOLS — Soft Blue Glow Theme */}
            <GlowingCard
              glowColor="#3b82f6"
              className="p-8 sm:p-12"
            >
              <div>
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600 mb-6 group-hover:scale-105 transition-transform duration-200">
                  <Wrench className="h-6 w-6 stroke-[2]" />
                </div>

                {/* Eyebrow */}
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary-600">
                  Pillar 02 · Tools
                </span>

                {/* Heading */}
                <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mt-2 mb-3">
                  Developer Tools
                </h3>

                {/* Description */}
                <p className="text-base text-neutral-600 leading-relaxed mb-8">
                  Simple browser-based utilities for everyday SAP integration work.
                </p>

                {/* 3 Short Benefits */}
                <ul className="space-y-3.5 mb-10 text-sm sm:text-base text-neutral-600">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary-600 shrink-0 stroke-[2.5]" />
                    <span>Format & validate</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary-600 shrink-0 stroke-[2.5]" />
                    <span>Transform payloads</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary-600 shrink-0 stroke-[2.5]" />
                    <span>Test integration data</span>
                  </li>
                </ul>
              </div>

              {/* Clean CTA */}
              <div>
                <Link
                  to="/tools"
                  className="inline-flex items-center gap-2 text-base font-semibold text-primary-600 hover:text-primary-700 transition-colors group/link"
                >
                  <span>Explore Tools</span>
                  <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1.5 transition-transform" />
                </Link>
              </div>
            </GlowingCard>
          </GlowingCards>
        </div>
      </Container>
    </section>
  );
}
