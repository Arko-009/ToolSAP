import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Briefcase,
  Compass,
  Milestone,
  Sparkles,
  ArrowRight,
  Workflow,
  Cpu,
  Cloud,
  Layout,
  Package,
  Layers,
  Route,
  HelpCircle,
} from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { PageHeader } from '@/components/common/PageHeader';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Badge } from '@/components/ui/Badge';
import { getRoadmapBySlug, getAllRoadmaps } from '@/data/roadmapsData';

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

export function RoadmapDetailPage() {
  const { roadmapSlug } = useParams<{ roadmapSlug: string }>();
  const roadmap = getRoadmapBySlug(roadmapSlug || '');
  const allRoadmaps = getAllRoadmaps();

  if (!roadmap) {
    return (
      <>
        <SEOHead
          title="Roadmap Not Found | ToolSAP"
          description="The requested career roadmap could not be found."
          canonical="/learning/roadmaps"
        />
        <PageHeader
          title="Roadmap Not Found"
          description="The requested career journey could not be located."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Learning Hub', href: '/learning' },
            { label: 'Roadmaps', href: '/learning/roadmaps' },
            { label: 'Not Found' },
          ]}
        />
        <Section padding="lg">
          <Container>
            <div className="max-w-md mx-auto text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-400">
                <Compass className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Roadmap Not Found</h2>
              <p className="text-sm text-neutral-600 mb-6">
                We couldn't find the roadmap you were looking for. Explore our available SAP career roadmaps.
              </p>
              <Link
                to="/learning/roadmaps"
                className="inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
              >
                Browse All Roadmaps
              </Link>
            </div>
          </Container>
        </Section>
      </>
    );
  }

  const MainIcon = iconMap[roadmap.icon] || Route;
  const categoryBadge = categoryBadgeClasses[roadmap.category] || 'bg-neutral-100 text-neutral-700 border-neutral-200';

  // Find next roadmap for footer navigation
  const currentIndex = allRoadmaps.findIndex((r) => r.slug === roadmap.slug);
  const nextRoadmap = allRoadmaps[(currentIndex + 1) % allRoadmaps.length];

  return (
    <>
      <SEOHead
        title={`${roadmap.title} — Step-by-Step SAP Career Journey | ToolSAP`}
        description={roadmap.description}
        canonical={`/learning/roadmaps/${roadmap.slug}`}
        keywords={[
          roadmap.title,
          roadmap.role,
          'SAP roadmap',
          'SAP career journey',
          'SAP learning path',
          roadmap.category,
        ]}
      />

      <PageHeader
        title={roadmap.title}
        description={roadmap.description}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Learning Hub', href: '/learning' },
          { label: 'Roadmaps', href: '/learning/roadmaps' },
          { label: roadmap.title },
        ]}
        badge={
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryBadge}`}>
            {roadmap.category} Track
          </span>
        }
        actions={
          <Link
            to="/learning/roadmaps"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50/70 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Roadmaps</span>
          </Link>
        }
      />

      {/* Career Profile & Prerequisites Meta Bar */}
      <div className="bg-neutral-50/90 border-b border-neutral-200/80 py-5">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-neutral-600">
            <div>
              <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                Target Role
              </p>
              <p className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{roadmap.role}</span>
              </p>
            </div>

            <div>
              <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                Proficiency Level
              </p>
              <p className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <Milestone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{roadmap.level}</span>
              </p>
            </div>

            <div>
              <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                Structure
              </p>
              <p className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{roadmap.stages.length} Sequential Career Stages</span>
              </p>
            </div>

            <div>
              <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                Recommended Prerequisites
              </p>
              <p className="font-medium text-neutral-700 truncate" title={roadmap.prerequisites.join(' • ')}>
                {roadmap.prerequisites[0]}
              </p>
            </div>
          </div>
        </Container>
      </div>

      <Section padding="lg">
        <Container>
          {/* Roadmap Product Direction Banner */}
          <div className="mb-12 p-5 rounded-2xl bg-white border border-emerald-200/80 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <MainIcon className="h-5 w-5" />
            </div>
            <div className="text-xs">
              <h3 className="text-sm font-bold text-neutral-900 mb-1">
                How to Follow This Career Roadmap
              </h3>
              <p className="text-neutral-600 leading-relaxed max-w-3xl">
                This roadmap represents the optimal chronological progression for becoming an enterprise-ready <strong>{roadmap.role}</strong>. Work through each stage sequentially. Ensure you can accomplish the <em>Milestone Outcome</em> before moving to the next stage.
              </p>
            </div>
          </div>

          {/* Sequential Stages Career Journey Flow */}
          <div className="space-y-12">
            {roadmap.stages.map((stage, index) => {
              const isLastStage = index === roadmap.stages.length - 1;

              return (
                <div
                  key={stage.stageNumber}
                  className="relative pl-6 sm:pl-10 border-l-2 border-emerald-200/80 pb-6 last:pb-0"
                >
                  {/* Stage Number Marker Node */}
                  <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-emerald-500 text-white font-mono text-xs font-bold flex items-center justify-center ring-4 ring-white shadow-xs">
                    {stage.stageNumber}
                  </div>

                  {/* Stage Card */}
                  <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-xs transition-shadow p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4 pb-4 border-b border-neutral-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider">
                            {stage.stageLabel}
                          </span>
                          {stage.estimatedTimeline && (
                            <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                              Est. {stage.estimatedTimeline}
                            </span>
                          )}
                          {isLastStage && (
                            <Badge variant="coming-soon" size="sm">
                              Project Ready Milestone
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-neutral-900">
                          {stage.title}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                          {stage.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* 1. WHY THIS STAGE MATTERS */}
                    <div className="mb-6 p-4 rounded-xl bg-amber-50/60 border border-amber-200/70">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                        <HelpCircle className="h-4 w-4 text-amber-600" />
                        <span>Why This Stage Matters</span>
                      </div>
                      <p className="text-xs text-amber-950/80 leading-relaxed">
                        {stage.whyItMatters}
                      </p>
                    </div>

                    {/* 2. WHAT TO LEARN (IN RECOMMENDED ORDER) */}
                    <div className="mb-6">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
                        <Milestone className="h-3.5 w-3.5 text-emerald-600" />
                        <span>What to Learn (In Recommended Order)</span>
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {stage.whatToLearn.map((item, stepIndex) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl border border-neutral-200/80 bg-neutral-50/50 hover:bg-neutral-50 flex items-start gap-3 text-xs transition-colors"
                          >
                            <span className="w-5 h-5 rounded-md bg-white border border-neutral-200 text-neutral-700 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                              {stepIndex + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-neutral-900">
                                {item.title}
                              </p>
                              {item.isCoreMilestone && (
                                <span className="inline-block mt-1 text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                                  Core Milestone
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. MILESTONE OUTCOME */}
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Milestone Outcome — What You Can Build</span>
                      </div>
                      <p className="text-xs text-emerald-950/80 leading-relaxed font-medium">
                        {stage.milestoneOutcome}
                      </p>
                    </div>

                    {/* Future Learning Content Hook Placeholder */}
                    <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-neutral-400 font-mono border-t border-neutral-100">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-emerald-500" />
                        Curriculum lessons for this stage will link here
                      </span>
                      <span className="text-neutral-400">Roadmap Phase</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Target Career Roles Strip */}
          <div className="mt-16 p-6 sm:p-8 rounded-2xl bg-neutral-900 text-white">
            <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-400 mb-2">
              Career Readiness & Job Titles
            </h4>
            <p className="text-xs text-neutral-300 mb-4 max-w-xl">
              Following this roadmap prepares you for enterprise production roles and certifications across top SAP consulting practices and client teams:
            </p>
            <div className="flex flex-wrap gap-2">
              {roadmap.careerOutcomes.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-medium text-neutral-200"
                >
                  ✓ {role}
                </span>
              ))}
            </div>
          </div>

          {/* Next Roadmap Navigation */}
          {nextRoadmap && (
            <div className="mt-12 pt-8 border-t border-neutral-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-neutral-400 font-mono">Next Suggested Roadmap</p>
                <h4 className="text-base font-bold text-neutral-900">{nextRoadmap.title}</h4>
                <p className="text-xs text-neutral-500">{nextRoadmap.role}</p>
              </div>
              <Link
                to={`/learning/roadmaps/${nextRoadmap.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs transition-colors shrink-0"
              >
                <span>View {nextRoadmap.title}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}

