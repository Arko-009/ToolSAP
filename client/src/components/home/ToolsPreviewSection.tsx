import { Link } from 'react-router-dom';
import {
  FileCode,
  FileCheck,
  FileOutput,
  ArrowLeftRight,
  Search,
  Wand2,
  ArrowRight,
  Wrench,
  Shield,
  Code2,
} from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { tools } from '@/data/tools';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { CapsuleButton } from '@/components/common/CapsuleButton';

const iconMap: Record<string, React.ElementType> = {
  FileCode,
  FileCheck,
  FileOutput,
  ArrowLeftRight,
  Search,
  Wand2,
};

const formatTagMap: Record<string, string> = {
  'xml-formatter': 'XML · PRETTIFY',
  'xml-validator': 'XML · XSD SCHEMAS',
  'xml-to-xsd': 'XSD GENERATOR',
  'json-xml-converter': 'JSON ↔ XML',
  'xpath-tester': 'XPATH 1.0 / 2.0',
  'xslt-generator': 'XSLT MAPPING',
};

export function ToolsPreviewSection() {
  const [sectionRef, isSectionInView] = useScrollReveal<HTMLElement>(0.15, '-40px 0px -40px 0px', false);
  const [headerRef, headerVisible] = useScrollReveal<HTMLDivElement>();
  const [gridRef, gridVisible] = useScrollReveal<HTMLDivElement>(0.05);

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-24 bg-premium-neutral section-divider section-wave border-b border-neutral-200/70 relative"
    >
      {/* Background dot pattern */}
      <div className="absolute inset-0 bg-dots-subtle opacity-40 pointer-events-none -z-10" />

      {/* Decorative floating dots */}
      <div className="absolute top-[12%] right-[15%] w-2.5 h-2.5 rounded-full bg-primary-300/20 animate-float-slow pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[18%] left-[10%] w-2 h-2 rounded-full bg-emerald-300/20 animate-float-delayed pointer-events-none" aria-hidden="true" />

      <Container>
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 reveal-base reveal-up ${headerVisible ? 'reveal-visible' : ''}`}
        >
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200/80 text-neutral-700 text-xs font-semibold uppercase tracking-wider mb-3 shadow-2xs badge-bounce">
              <Wrench className="h-3.5 w-3.5 text-primary-600" />
              <span>Developer Toolbox</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight">
              Specialized Tools for SAP Payloads
            </h2>
            <p className="mt-2 text-base text-neutral-600 leading-relaxed">
              Fast, client-side developer utilities designed for common SAP integration payloads and schemas.
            </p>
          </div>

          <Link
            to="/tools"
            className="btn-press inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 hover:text-primary-600 transition-all duration-150 shadow-2xs self-start md:self-auto shrink-0"
          >
            <span>View All 6 Tools</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Tools Grid */}
        <div
          ref={gridRef}
          className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children ${gridVisible ? 'reveal-visible' : ''}`}
        >
          {tools.map((tool) => {
            const IconComponent = iconMap[tool.icon] || Code2;
            const formatTag = formatTagMap[tool.id] || 'TOOL';

            return (
              <div
                key={tool.id}
                className="tool-card-interactive group relative rounded-xl bg-white border border-neutral-200/90 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Card Top Metadata */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="tool-icon-smooth w-9 h-9 rounded-lg bg-primary-50/90 border border-primary-100/80 flex items-center justify-center text-primary-600 group-hover:bg-primary-100/70 group-hover:border-primary-200">
                      <IconComponent className="h-4.5 w-4.5" />
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border transition-all duration-700 ease-in-out ${
                        isSectionInView
                          ? 'bg-rose-50/90 text-rose-600 border-rose-200/90 shadow-2xs'
                          : 'bg-neutral-100 text-neutral-600 border-neutral-200/60'
                      }`}
                    >
                      {formatTag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors duration-300">
                    {tool.name}
                  </h3>
                  <p className="mt-2 text-xs text-neutral-600 leading-relaxed line-clamp-2">
                    {tool.shortDescription}
                  </p>
                </div>

                {/* Card Footer Action */}
                <div className="mt-5 pt-3.5 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                    <Shield className="h-3 w-3 text-emerald-600" />
                    <span>In-Browser</span>
                  </div>
                  <CapsuleButton
                    to={`/tools#${tool.id}`}
                    label="Inspect"
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
