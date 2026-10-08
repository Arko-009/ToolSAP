import { BookOpen, Layers, GitBranch, Cpu, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { CapsuleButton } from '@/components/common/CapsuleButton';

const curriculumTracks = [
  {
    step: '01',
    title: 'Foundations & Architecture',
    description: 'SAP BTP environment, Integration Suite architecture, tenant setup, and fundamental message semantics.',
    icon: Layers,
    topics: ['BTP Subaccounts & Services', 'Integration Suite Capability Setup', 'Synchronous vs Asynchronous Patterns'],
  },
  {
    step: '02',
    title: 'Cloud Integration (CPI) Core',
    description: 'Designing end-to-end integration flows (iFlows), routing conditions, splitters, aggregators, and timers.',
    icon: GitBranch,
    topics: ['iFlow Design Guidelines', 'Router, Multicast & Splitter', 'Adapter Configuration (HTTPS, SFTP, IDoc)'],
  },
  {
    step: '03',
    title: 'Transformations & Scripting',
    description: 'Handling complex payload transformations with Apache Groovy, XSLT 2.0/3.0, and Message Mappings.',
    icon: Cpu,
    topics: ['Groovy Scripting for CPI', 'Content Modifier Deep Dive', 'XML to JSON & Schema Validation'],
  },
  {
    step: '04',
    title: 'Production Readiness & Security',
    description: 'Exception subprocesses, trace logs, OAuth2 / certificate authentication, and API Management.',
    icon: ShieldCheck,
    topics: ['Exception Handling & Alerts', 'Keystore & Certificate Management', 'API Management & Policy Templates'],
  },
];

export function CurriculumSection() {
  const [headerRef, headerVisible] = useScrollReveal<HTMLDivElement>();
  const [gridRef, gridVisible] = useScrollReveal<HTMLDivElement>(0.08);

  return (
    <section className="py-16 sm:py-24 bg-premium-white section-divider border-b border-neutral-200/70">
      <Container>
        {/* Header */}
        <div
          ref={headerRef}
          className={`text-center max-w-2xl mx-auto mb-14 reveal-base reveal-up ${headerVisible ? 'reveal-visible' : ''}`}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-3 badge-bounce">
            <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
            <span>Structured Learning Path</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight">
            Integration Developer Curriculum
          </h2>
          <p className="mt-3 text-base text-neutral-600 leading-relaxed">
            A progressive roadmap designed to take you from core SAP concepts to building robust enterprise integrations.
          </p>
        </div>

        {/* 4 Track Cards Grid */}
        <div
          ref={gridRef}
          className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children ${gridVisible ? 'reveal-visible' : ''}`}
        >
          {curriculumTracks.map((track) => {
            const Icon = track.icon;
            return (
              <div
                key={track.step}
                className="card-premium card-glow group relative rounded-xl bg-white border border-neutral-200/90 p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  {/* Step & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 chip-glow">
                      TRACK {track.step}
                    </span>
                    <div className="icon-lift w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 tracking-tight mb-2">
                    {track.title}
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                    {track.description}
                  </p>

                  {/* Key Topic Chips */}
                  <div className="space-y-1.5">
                    {track.topics.map((topic) => (
                      <div
                        key={topic}
                        className="chip-glow text-[11px] text-neutral-600 bg-neutral-50 px-2 py-1 rounded border border-neutral-100 flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                    <BookOpen className="h-3 w-3 text-emerald-600" />
                    <span>3 Topics</span>
                  </div>
                  <CapsuleButton
                    to="/learning"
                    label="View Module"
                    variant="emerald"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
