import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Layers, GitBranch, Cpu, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/layout/Container';

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
  return (
    <section className="py-16 sm:py-24 bg-white border-b border-neutral-200/70">
      <Container>
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/80 text-primary-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <BookOpen className="h-3.5 w-3.5 text-primary-600" />
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {curriculumTracks.map((track) => {
            const Icon = track.icon;
            return (
              <div
                key={track.step}
                className="group relative rounded-xl bg-white border border-neutral-200/90 p-5 shadow-xs hover:shadow-md hover:border-primary-300 transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  {/* Step & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-200/60">
                      TRACK {track.step}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
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
                        className="text-[11px] text-neutral-600 bg-neutral-50 px-2 py-1 rounded border border-neutral-100 flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 rounded-full bg-primary-500 shrink-0" />
                        <span className="truncate">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-100">
                  <Link
                    to="/learning"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <span>View Modules</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
