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
  CheckCircle2,
  Milestone,
  Compass,
  GraduationCap,
} from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { PageHeader } from '@/components/common/PageHeader';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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

const categoryBadgeClasses: Record<string, string> = {
  Development: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  Technical: 'bg-sky-50 text-sky-700 border-sky-200/80',
  Functional: 'bg-amber-50 text-amber-800 border-amber-200/80',
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
        description="Discover structured learning journeys for different SAP roles, modules and technologies."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Learning Hub', href: '/learning' },
          { label: 'Roadmaps' },
        ]}
        badge={
          <Badge variant="coming-soon" size="md">
            Career Roadmaps
          </Badge>
        }
        actions={
          <Link
            to="/learning"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50/70 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Learning Hub</span>
          </Link>
        }
      />

      {/* Core Principles Philosophy Banner */}
      <div className="bg-neutral-50/80 border-b border-neutral-200/80 py-4">
        <Container>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-6 flex-wrap text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <Milestone className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-neutral-900">
                  {allRoadmaps.length} Career Roadmaps Available
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-neutral-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>What to Learn • In Order • Why It Matters</span>
              </div>
              <div className="hidden lg:flex items-center gap-1.5 text-neutral-500">
                <GraduationCap className="h-3.5 w-3.5 text-neutral-400" />
                <span>Progress from Foundations to Project-Ready</span>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search roadmaps by role..."
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

          {/* Roadmaps Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoadmaps.map((roadmap, index) => {
              const IconComponent = iconMap[roadmap.icon] || Route;
              const badgeClass =
                categoryBadgeClasses[roadmap.category] || 'bg-neutral-100 text-neutral-700 border-neutral-200';

              return (
                <Link
                  key={roadmap.id}
                  to={`/learning/roadmaps/${roadmap.slug}`}
                  className="group flex flex-col focus:outline-none"
                  aria-label={`View ${roadmap.title}`}
                >
                  <Card
                    hover
                    padding="none"
                    className={`flex-1 flex flex-col justify-between overflow-hidden border border-neutral-200/90 hover:border-emerald-300 hover:shadow-md transition-all duration-200 animate-fade-up animate-stagger-${Math.min(
                      index + 1,
                      5
                    )}`}
                  >
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Top Bar: Icon + Category Badge */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center shrink-0 group-hover:bg-emerald-100/80 group-hover:scale-105 transition-all">
                            <IconComponent className="h-5 w-5 text-emerald-600" />
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}
                          >
                            {roadmap.category}
                          </span>
                        </div>

                        {/* Title & Role */}
                        <h3 className="text-base font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors mb-1">
                          {roadmap.title}
                        </h3>
                        <p className="text-xs font-semibold text-emerald-600 mb-2">
                          Role: {roadmap.role}
                        </p>

                        {/* Subtitle / Description */}
                        <p className="text-xs text-neutral-600 leading-relaxed mb-4 line-clamp-3">
                          {roadmap.description}
                        </p>
                      </div>

                      {/* Visual 4-Stage Pathway Timeline Preview */}
                      <div className="pt-3 border-t border-neutral-100">
                        <p className="text-[11px] font-medium text-neutral-500 mb-1.5 flex items-center justify-between">
                          <span>Career Progression</span>
                          <span className="font-mono text-neutral-400">4 Structured Stages</span>
                        </p>
                        <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                          <div className="bg-emerald-50 text-emerald-700 py-1 rounded border border-emerald-100 font-semibold truncate">
                            01 Found.
                          </div>
                          <div className="bg-emerald-50 text-emerald-700 py-1 rounded border border-emerald-100 font-semibold truncate">
                            02 Core
                          </div>
                          <div className="bg-emerald-50 text-emerald-700 py-1 rounded border border-emerald-100 font-semibold truncate">
                            03 Adv.
                          </div>
                          <div className="bg-emerald-500 text-white py-1 rounded font-semibold truncate">
                            04 Ready
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-neutral-500 font-mono truncate max-w-[140px]">
                        {roadmap.level}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 group-hover:text-emerald-700 transition-colors">
                        <span>View Roadmap</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Empty search */}
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

          {/* Educational Notice explaining the Roadmap Concept */}
          <div className="mt-14 p-6 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 max-w-3xl mx-auto">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 mb-1">
                  How ToolSAP Roadmaps Work
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed mb-3">
                  Our roadmaps are strictly designed as step-by-step career path blueprints. They outline <strong>what to learn</strong>, <strong>in which sequence</strong>, <strong>why each stage matters</strong>, and <strong>how to reach enterprise project-readiness</strong>. Individual roadmap steps will link directly to corresponding lessons in our separate Learning Materials library as they become available.
                </p>
                <div className="flex items-center gap-4 text-xs font-semibold text-emerald-600">
                  <Link to="/learning" className="hover:underline">
                    Browse Learning Hub Tracks →
                  </Link>
                  <Link to="/tools" className="hover:underline text-neutral-600 hover:text-neutral-900">
                    Explore Free SAP Tools →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
