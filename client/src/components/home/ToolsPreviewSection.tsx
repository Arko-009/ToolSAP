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
  return (
    <section className="py-16 sm:py-24 bg-neutral-50/60 border-b border-neutral-200/70 relative">
      {/* Background dot pattern */}
      <div className="absolute inset-0 bg-dots-subtle opacity-40 pointer-events-none -z-10" />

      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200/80 text-neutral-700 text-xs font-semibold uppercase tracking-wider mb-3 shadow-2xs">
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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 hover:text-primary-600 transition-all duration-150 shadow-2xs self-start md:self-auto shrink-0"
          >
            <span>View All 6 Tools</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Tools Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => {
            const IconComponent = iconMap[tool.icon] || Code2;
            const formatTag = formatTagMap[tool.id] || 'TOOL';

            return (
              <div
                key={tool.id}
                className="group relative rounded-xl bg-white border border-neutral-200/90 p-5 shadow-xs hover:shadow-md hover:border-neutral-300/90 hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  {/* Card Top Metadata */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 border border-primary-100/80 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-150">
                      <IconComponent className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200/60">
                      {formatTag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
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
                  <Link
                    to={`/tools#${tool.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <span>Inspect</span>
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
