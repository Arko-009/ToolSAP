import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Cloud,
  Workflow,
  Cpu,
  Layout,
  ArrowRightLeft,
  Package,
  ArrowRight,
  Search,
  Sparkles,
  Layers,
  GraduationCap,
  CheckCircle2,
  Route,
  Compass,
  Map,
} from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { PageHeader } from '@/components/common/PageHeader';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Badge } from '@/components/ui/Badge';
import { learningDomains } from '@/data/learningDomains';

const iconMap: Record<string, React.ElementType> = {
  Workflow,
  Cloud,
  Cpu,
  Layout,
  ArrowRightLeft,
  Package,
  BookOpen,
  Layers,
  Route,
  Compass,
  Map,
};

// Color theme accent styling for each track
const accentStyles: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'group-hover:border-emerald-300',
    glow: 'group-hover:bg-emerald-100/60',
  },
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    border: 'group-hover:border-sky-300',
    glow: 'group-hover:bg-sky-100/60',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'group-hover:border-indigo-300',
    glow: 'group-hover:bg-indigo-100/60',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'group-hover:border-purple-300',
    glow: 'group-hover:bg-purple-100/60',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'group-hover:border-amber-300',
    glow: 'group-hover:bg-amber-100/60',
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'group-hover:border-teal-300',
    glow: 'group-hover:bg-teal-100/60',
  },
};

export function LearningHubPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter sections by title, subtitle, or highlights
  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return learningDomains;
    const q = searchQuery.toLowerCase();
    return learningDomains.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.subtitle && d.subtitle.toLowerCase().includes(q)) ||
        d.description.toLowerCase().includes(q) ||
        (d.highlights && d.highlights.some((h) => h.toLowerCase().includes(q)))
    );
  }, [searchQuery]);

  return (
    <>
      <SEOHead
        title="Learning Hub — SAP Tracks & Curriculum | ToolSAP"
        description="Structured, practical SAP learning designed for developers who build. Explore 6 specialized tracks covering Integration Suite, BTP, ABAP, Fiori, PI/PO Migration, and Logistics."
        canonical="/learning"
        keywords={[
          'SAP learning',
          'SAP Integration Suite',
          'SAP Cloud Integration',
          'SAP BTP',
          'SAP ABAP RAP',
          'SAP Fiori UI5',
          'PI PO Migration',
          'SAP tutorial',
        ]}
      />

      <PageHeader
        title="Learning Hub"
        description="Structured, practical SAP learning designed for developers who build."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Learning' },
        ]}
        align="center"
      />

      {/* Stats & Quick Highlights Strip */}
      <div className="bg-neutral-50/80 border-b border-neutral-200/80 py-4">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 flex-wrap text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-neutral-900">
                  {learningDomains.length} Major Learning Tracks
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-neutral-500">
                <GraduationCap className="h-3.5 w-3.5 text-neutral-400" />
                <span>Hands-on, Real-World SAP Scenarios</span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 text-neutral-500">
                <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
                <span>100% Free Developer Resources</span>
              </div>
            </div>

            {/* Quick Filter Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Filter tracks or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </Container>
      </div>

      <Section padding="lg">
        <Container>
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-neutral-900">Curriculum Tracks</h2>
              <Badge variant="coming-soon" size="sm">
                {learningDomains.length} Tracks Ready
              </Badge>
            </div>
            <p className="text-neutral-600 text-sm max-w-2xl">
              Choose a dedicated track below to explore its structured modules, lesson plans, and practical hands-on exercises.
            </p>
          </div>

          {/* 5-6 Major Learning Sections Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDomains.map((domain, index) => {
              const IconComponent = iconMap[domain.icon] || BookOpen;
              const accent = accentStyles[domain.accentColor || 'emerald'] || accentStyles.emerald;

              return (
                <Link
                  key={domain.id}
                  to={`/learning/${domain.slug}`}
                  className="group flex flex-col focus:outline-none"
                  aria-label={`View ${domain.title} curriculum track`}
                >
                  <div
                    className={`flex-1 flex flex-col justify-between rounded-2xl bg-white border border-neutral-200/80 p-5 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${accent.border} animate-fade-up animate-stagger-${Math.min(index + 1, 5)}`}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-3 mb-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl ${accent.bg} border border-neutral-200/60 flex items-center justify-center shrink-0 ${accent.glow} shadow-2xs group-hover:scale-108 group-hover:-rotate-3 transition-transform duration-300`}
                        >
                          <IconComponent className={`h-5 w-5 ${accent.text}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100/80 text-neutral-600 border border-neutral-200/60 shadow-2xs">
                            {domain.badge || 'Coming Soon'}
                          </span>
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <h3 className="text-base font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors mb-1 tracking-tight">
                        {domain.title}
                      </h3>
                      {domain.subtitle && (
                        <p className="text-xs font-medium text-neutral-500 mb-2.5">
                          {domain.subtitle}
                        </p>
                      )}

                      {/* Description */}
                      <p className="text-xs text-neutral-600 leading-relaxed mb-4 line-clamp-3">
                        {domain.description}
                      </p>

                      {/* Highlight Chips */}
                      {domain.highlights && domain.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {domain.highlights.map((item) => (
                            <span
                              key={item}
                              className="text-[11px] text-neutral-600 bg-neutral-50 px-2.5 py-0.5 rounded-lg border border-neutral-200/70"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer with Redirect Action */}
                    <div className="mt-4 pt-3.5 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-medium flex items-center gap-1.5 text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        {domain.customFooterCount || `${domain.categories.length} Modules`}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-white group-hover:bg-emerald-600 transition-colors shadow-2xs group-hover:shadow-xs">
                        <span>{domain.customCta || 'Explore Track'}</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Empty search state */}
          {filteredDomains.length === 0 && (
            <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-200/70">
              <Search className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-700">No tracks found</p>
              <p className="text-xs text-neutral-500 mt-1">
                Try searching for keywords like "CPI", "Groovy", "BTP", "ABAP", or "Fiori".
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs text-emerald-600 font-medium hover:underline"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Bottom Suggestion Callout */}
          <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-50/60 via-white to-sky-50/60 border border-neutral-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Customizing or Suggesting a Learning Track?
                </h3>
              </div>
              <p className="text-xs text-neutral-600 max-w-xl leading-relaxed">
                All tracks and sub-modules are ready for customized curriculum modules, real-world case studies, and interactive code sandboxes.
              </p>
            </div>
            <Link
              to="/tools"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 hover:text-emerald-600 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all shrink-0"
            >
              <span>Explore Free Developer Tools</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
