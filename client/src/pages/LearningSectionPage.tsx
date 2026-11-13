import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Cloud,
  Workflow,
  CloudCog,
  GitBranch,
  ArrowLeftRight,
  Route,
  Plug,
  Map,
  Shield,
  Database,
  Globe,
  Bug,
  MessageSquare,
  Layers,
  Cpu,
  Box,
  Terminal,
  Layout,
  Sparkles,
  Package,
  ArrowLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { PageHeader } from '@/components/common/PageHeader';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getLearningDomainBySlug, getAllLearningDomains } from '@/data/learningDomains';

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  Cloud,
  Workflow,
  CloudCog,
  GitBranch,
  ArrowLeftRight,
  Route,
  Plug,
  Map,
  Shield,
  Database,
  Globe,
  Bug,
  MessageSquare,
  Layers,
  Cpu,
  Box,
  Terminal,
  Layout,
  Sparkles,
  Package,
};

export function LearningSectionPage() {
  const { domainSlug } = useParams<{ domainSlug: string }>();
  const domain = getLearningDomainBySlug(domainSlug || '');
  const allDomains = getAllLearningDomains();

  if (!domain) {
    return (
      <>
        <SEOHead
          title="Track Not Found — Learning Hub | ToolSAP"
          description="The requested learning curriculum track was not found."
          canonical="/learning"
        />
        <PageHeader
          title="Track Not Found"
          description="The requested learning track does not exist or may have moved."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Learning Hub', href: '/learning' },
            { label: 'Not Found' },
          ]}
        />
        <Section padding="lg">
          <Container>
            <div className="max-w-md mx-auto text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-400">
                <BookOpen className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Track Not Found</h2>
              <p className="text-sm text-neutral-600 mb-6">
                We couldn't find the learning track you were looking for. Explore our other available SAP learning tracks.
              </p>
              <Link
                to="/learning"
                className="inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 shadow-xs transition-colors"
              >
                Back to Learning Hub
              </Link>
            </div>
          </Container>
        </Section>
      </>
    );
  }

  const MainIcon = iconMap[domain.icon] || BookOpen;

  return (
    <>
      <SEOHead
        title={`${domain.title} — SAP Curriculum | ToolSAP`}
        description={domain.description}
        canonical={`/learning/${domain.slug}`}
        keywords={domain.highlights || ['SAP learning', 'SAP training', domain.title]}
      />

      <PageHeader
        title={domain.title}
        description={domain.description}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Learning Hub', href: '/learning' },
          { label: domain.title },
        ]}
        badge={
          <Badge variant="coming-soon" size="md">
            {domain.badge || 'Coming Soon'}
          </Badge>
        }
        actions={
          <Link
            to="/learning"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50/70 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Learning Tracks</span>
          </Link>
        }
      />

      {/* Track Overview & Highlights Bar */}
      <div className="bg-neutral-50/70 border-b border-neutral-200/80 py-4">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-600">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 font-medium text-neutral-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {domain.categories.length} Modules in Curriculum
              </span>
              <span className="text-neutral-300">|</span>
              <span className="inline-flex items-center gap-1 font-mono text-neutral-600">
                <Clock className="h-3.5 w-3.5 text-neutral-400" />
                Level: {domain.level || 'All Levels'}
              </span>
              <span className="text-neutral-300">|</span>
              <span className="text-neutral-500">
                Track: <strong className="text-neutral-700 font-semibold">{domain.subtitle || domain.title}</strong>
              </span>
            </div>

            {domain.highlights && domain.highlights.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {domain.highlights.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-white border border-neutral-200/80 text-[11px] text-neutral-600 font-medium shadow-2xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Container>
      </div>

      <Section padding="lg">
        <Container>
          {/* Section Introduction */}
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-1 flex items-center gap-2">
                <MainIcon className="h-5 w-5 text-emerald-600" />
                Curriculum Modules & Lessons
              </h2>
              <p className="text-sm text-neutral-600 max-w-2xl">
                Structured, hands-on learning roadmap for {domain.title}. Master enterprise scenarios with clean patterns and code examples.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 font-mono">
                {domain.categories.length} modules planned
              </span>
            </div>
          </div>

          {/* Grid of Categories / Modules */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {domain.categories.map((category, index) => {
              const CategoryIcon = iconMap[category.icon] || BookOpen;
              return (
                <Card
                  key={category.id}
                  hover
                  padding="md"
                  className={`group relative transition-all duration-200 hover:border-emerald-300 animate-fade-up animate-stagger-${Math.min(index + 1, 5)}`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-100/80 group-hover:scale-105 transition-all">
                      <CategoryIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                          {category.title}
                        </h3>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                          #{String(category.order || index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed mb-3">
                        {category.description}
                      </p>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100">
                        <Badge variant="coming-soon" size="sm">
                          Coming Soon
                        </Badge>
                        <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-neutral-300" />
                          Curriculum draft
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Under active development notice */}
          <div className="mt-12 p-6 rounded-2xl bg-neutral-50 border border-neutral-200/90 text-center max-w-2xl mx-auto">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Curriculum in Active Development
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-lg mx-auto mb-4">
              We are crafting in-depth lessons, practical iflow architectures, Groovy script templates, and real-world exercises for {domain.title}.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/learning"
                className="inline-flex items-center justify-center font-medium rounded-lg px-3 py-1.5 text-xs font-semibold bg-white text-neutral-800 border border-neutral-200/90 hover:bg-neutral-50 shadow-2xs transition-colors"
              >
                Browse Other Tracks
              </Link>
              <Link
                to="/tools"
                className="inline-flex items-center justify-center font-medium rounded-lg px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
              >
                Try Free SAP Tools
              </Link>
            </div>
          </div>

          {/* Other Tracks Quick Navigation */}
          <div className="mt-16 pt-8 border-t border-neutral-200/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900">
                Explore Other Learning Tracks
              </h3>
              <Link to="/learning" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                View All Tracks →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allDomains
                .filter((d) => d.slug !== domain.slug)
                .slice(0, 3)
                .map((other) => {
                  const OtherIcon = iconMap[other.icon] || BookOpen;
                  return (
                    <Link
                      key={other.id}
                      to={`/learning/${other.slug}`}
                      className="group flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 shrink-0 transition-colors">
                          <OtherIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-neutral-900 truncate group-hover:text-emerald-700 transition-colors">
                            {other.title}
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate">
                            {other.categories.length} Modules
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </Link>
                  );
                })}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
