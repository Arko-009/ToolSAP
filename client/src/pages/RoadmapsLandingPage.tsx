import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Route,
  ArrowRight,
  Search,
  ArrowLeft,
  Sparkles,
  Workflow,
  Cpu,
  Cloud,
  Layout,
  Package,
  Layers,
  Milestone,
  Compass,
  Briefcase,
  Zap,
} from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { PageHeader } from '@/components/common/PageHeader';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { getAllRoadmaps } from '@/data/roadmapsData';

const iconMap: Record<string, React.ElementType> = {
  Workflow,
  Cpu,
  Cloud,
  Layout,
  Package,
  Layers,
  Route,
  Compass,
};

// Theme presets for cards to give each a sweet, distinct aesthetic
const themeStyles: Record<
  string,
  {
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    nodeColor: string;
    starGradient: string;
    borderHover: string;
  }
> = {
  emerald: {
    iconBg: 'bg-emerald-50/90 border-emerald-200/60',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    nodeColor: 'border-emerald-500 text-emerald-700',
    starGradient: 'from-emerald-500 to-teal-400 ring-emerald-100',
    borderHover: 'hover:border-emerald-300 hover:shadow-emerald-500/5',
  },
  indigo: {
    iconBg: 'bg-indigo-50/90 border-indigo-200/60',
    iconColor: 'text-indigo-600',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    nodeColor: 'border-indigo-500 text-indigo-700',
    starGradient: 'from-indigo-500 to-violet-400 ring-indigo-100',
    borderHover: 'hover:border-indigo-300 hover:shadow-indigo-500/5',
  },
  sky: {
    iconBg: 'bg-sky-50/90 border-sky-200/60',
    iconColor: 'text-sky-600',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200/80',
    nodeColor: 'border-sky-500 text-sky-700',
    starGradient: 'from-sky-500 to-blue-400 ring-sky-100',
    borderHover: 'hover:border-sky-300 hover:shadow-sky-500/5',
  },
  purple: {
    iconBg: 'bg-purple-50/90 border-purple-200/60',
    iconColor: 'text-purple-600',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
    nodeColor: 'border-purple-500 text-purple-700',
    starGradient: 'from-purple-500 to-pink-400 ring-purple-100',
    borderHover: 'hover:border-purple-300 hover:shadow-purple-500/5',
  },
  teal: {
    iconBg: 'bg-teal-50/90 border-teal-200/60',
    iconColor: 'text-teal-600',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200/80',
    nodeColor: 'border-teal-500 text-teal-700',
    starGradient: 'from-teal-500 to-emerald-400 ring-teal-100',
    borderHover: 'hover:border-teal-300 hover:shadow-teal-500/5',
  },
  amber: {
    iconBg: 'bg-amber-50/90 border-amber-200/60',
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
    nodeColor: 'border-amber-500 text-amber-700',
    starGradient: 'from-amber-500 to-orange-400 ring-amber-100',
    borderHover: 'hover:border-amber-300 hover:shadow-amber-500/5',
  },
};

const categoryTabs = ['All', 'Development', 'Functional', 'Technical'] as const;

export function RoadmapsLandingPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const allRoadmaps = useMemo(() => getAllRoadmaps(), []);

  const filteredRoadmaps = useMemo(() => {
    return allRoadmaps.filter((roadmap) => {
      const matchesCategory =
        selectedCategory === 'All' || roadmap.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        roadmap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roadmap.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roadmap.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roadmap.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allRoadmaps, selectedCategory, searchQuery]);

  return (
    <>
      <SEOHead
        title="Explore SAP Roadmaps — Career Journeys Across the SAP Ecosystem | ToolSAP"
        description="Discover structured learning journeys for different SAP roles, modules and technologies. Step-by-step guidance on what to learn, in which order, and why."
        canonical="/learning/roadmaps"
        keywords={[
          'SAP roadmaps',
          'SAP career roadmap',
          'SAP developer roadmap',
          'SAP MM roadmap',
          'SAP SD roadmap',
          'SAP FICO roadmap',
          'SAP Integration Suite roadmap',
          'SAP BTP roadmap',
          'SAP ABAP roadmap',
        ]}
      />

      <PageHeader
        title="Explore SAP Roadmaps"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Learning Hub', href: '/learning' },
          { label: 'Roadmaps' },
        ]}
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            Career Journeys
          </span>
        }
        actions={
          <Link
            to="/learning"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-emerald-700 transition-colors bg-white hover:bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-200 shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Learning Hub</span>
          </Link>
        }
      />

      {/* Philosophy Sub-strip */}
      <div className="bg-neutral-50/60 border-b border-neutral-200/70 py-3.5">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap text-xs text-neutral-600">
              <span className="flex items-center gap-1.5 font-semibold text-neutral-900">
                <Milestone className="h-3.5 w-3.5 text-emerald-600" />
                {allRoadmaps.length} Step-by-Step Roadmaps
              </span>
              <span className="hidden md:inline text-neutral-300">•</span>
              <span className="hidden md:inline text-neutral-500">
                What to learn, in which sequence, and why each stage matters
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search roadmaps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
              />
            </div>
          </div>
        </Container>
      </div>

      <Section padding="lg">
        <Container>
          {/* Category Tabs */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-8 border-b border-neutral-200/80 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {categoryTabs.map((tab) => {
                const count =
                  tab === 'All'
                    ? allRoadmaps.length
                    : allRoadmaps.filter((r) => r.category.toLowerCase() === tab.toLowerCase()).length;
                const isActive = selectedCategory === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedCategory(tab)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                    }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-neutral-500 font-mono">
              Showing {filteredRoadmaps.length} of {allRoadmaps.length} roadmaps
            </p>
          </div>

          {/* Sweet & Cool Roadmaps Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoadmaps.map((roadmap) => {
              const IconComponent = iconMap[roadmap.icon] || Route;
              const theme = themeStyles[roadmap.accentColor || 'emerald'] || themeStyles.emerald;

              return (
                <Link
                  key={roadmap.id}
                  to={`/learning/roadmaps/${roadmap.slug}`}
                  className="group focus:outline-none flex flex-col"
                  aria-label={`View ${roadmap.title}`}
                >
                  <div
                    className={`flex-1 flex flex-col justify-between rounded-2xl bg-white border border-neutral-200/80 p-5 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${theme.borderHover}`}
                  >
                    {/* Upper Half: Header & Content */}
                    <div>
                      {/* Top Row: Squircle Avatar + Pill Badges */}
                      <div className="flex items-start justify-between gap-3 mb-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl ${theme.iconBg} border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-108 group-hover:-rotate-3 transition-transform duration-300`}
                        >
                          <IconComponent className={`h-5 w-5 ${theme.iconColor}`} />
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {roadmap.badge && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 shadow-2xs">
                              <Zap className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                              <span>{roadmap.badge}</span>
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${theme.badgeBg} shadow-2xs`}
                          >
                            {roadmap.category}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors tracking-tight mb-1.5">
                        {roadmap.title}
                      </h3>

                      {/* Sweet Role Chip */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-50 border border-neutral-200/70 text-[11px] font-medium text-neutral-600 mb-2.5 max-w-full">
                        <Briefcase className="h-3 w-3 text-neutral-400 shrink-0" />
                        <span className="truncate">{roadmap.role}</span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-neutral-500 leading-relaxed mb-4 line-clamp-2">
                        {roadmap.description}
                      </p>
                    </div>

                    {/* Lower Half: Cute Mini Roadmap Trail & Footer */}
                    <div>
                      {/* Cute Visual Milestone Journey Trail */}
                      <div className="pt-3 pb-2 border-t border-neutral-100">
                        <div className="flex items-center justify-between text-[11px] font-medium text-neutral-400 mb-2.5">
                          <span className="flex items-center gap-1 font-semibold text-neutral-700">
                            <Route className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Career Path</span>
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100/90 text-neutral-500">
                            4 Stages
                          </span>
                        </div>

                        {/* Connected Milestone Nodes Trail */}
                        <div className="relative flex items-center justify-between px-2 pt-1 pb-1">
                          {/* Dotted / solid connecting line */}
                          <div className="absolute left-4 right-4 top-3.5 h-[2px] bg-neutral-200 -z-0" />

                          {/* Node 1 */}
                          <div className="relative z-10 flex flex-col items-center gap-1">
                            <div
                              className={`w-5 h-5 rounded-full bg-white border-2 ${theme.nodeColor} font-mono text-[9px] font-bold flex items-center justify-center shadow-2xs`}
                            >
                              1
                            </div>
                            <span className="text-[10px] text-neutral-500 font-medium">Found.</span>
                          </div>

                          {/* Node 2 */}
                          <div className="relative z-10 flex flex-col items-center gap-1">
                            <div
                              className={`w-5 h-5 rounded-full bg-white border-2 ${theme.nodeColor} font-mono text-[9px] font-bold flex items-center justify-center shadow-2xs`}
                            >
                              2
                            </div>
                            <span className="text-[10px] text-neutral-500 font-medium">Core</span>
                          </div>

                          {/* Node 3 */}
                          <div className="relative z-10 flex flex-col items-center gap-1">
                            <div
                              className={`w-5 h-5 rounded-full bg-white border-2 ${theme.nodeColor} font-mono text-[9px] font-bold flex items-center justify-center shadow-2xs`}
                            >
                              3
                            </div>
                            <span className="text-[10px] text-neutral-500 font-medium">Adv.</span>
                          </div>

                          {/* Node 4 (Star Trophy Finish) */}
                          <div className="relative z-10 flex flex-col items-center gap-1">
                            <div
                              className={`w-5 h-5 rounded-full bg-gradient-to-tr ${theme.starGradient} text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs ring-2`}
                            >
                              ★
                            </div>
                            <span className="text-[10px] font-bold text-neutral-900">Ready</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer with Clean Level & CTA */}
                      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                          <Compass className="h-3 w-3 text-neutral-400 shrink-0" />
                          <span>{roadmap.level}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-white group-hover:bg-emerald-600 transition-all duration-200 shadow-2xs group-hover:shadow-xs">
                          <span>View Path</span>
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Empty search state */}
          {filteredRoadmaps.length === 0 && (
            <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-200/70 max-w-md mx-auto">
              <Search className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-800">No matching roadmaps</p>
              <p className="text-xs text-neutral-500 mt-1">
                Try selecting "All" or searching for a role like "CPI", "ABAP", "MM", or "FICO".
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs text-emerald-600 font-semibold hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}

          {/* Clean Bottom Note */}
          <div className="mt-14 p-5 sm:p-6 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 max-w-2xl mx-auto text-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mx-auto mb-2.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900 mb-1">
              Structured Chronological Career Paths
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-lg mx-auto mb-3">
              Each roadmap defines what to learn, in which order, why each stage matters, and how to reach enterprise project-readiness.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs">
              <Link
                to="/learning"
                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Browse Learning Hub Tracks →
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
