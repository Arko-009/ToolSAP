import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { PageHeader } from '@/components/common/PageHeader';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { integrationCategories } from '@/data/learningCategories';

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
};

export function LearningHubPage() {
  return (
    <>
      <SEOHead
        title="Learning Hub — SAP Integration Development"
        description="Learn SAP Integration Suite development with structured, practical lessons. From foundations to advanced integration patterns."
        canonical="/learning"
        keywords={['SAP learning', 'SAP Integration Suite', 'SAP Cloud Integration', 'SAP tutorial']}
      />

      <PageHeader
        title="Learning Hub"
        description="Structured, practical SAP learning designed for developers who build."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Learning' },
        ]}
      />

      <Section padding="lg">
        <Container>
          {/* Integration Development Domain */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-neutral-900">Integration Development</h2>
              <Badge variant="coming-soon" size="sm">Coming Soon</Badge>
            </div>
            <p className="text-neutral-600 text-sm max-w-2xl">
              Master SAP Integration Suite — from BTP fundamentals through advanced integration patterns, adapters, and API management.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrationCategories.map((category, index) => {
              const IconComponent = iconMap[category.icon] || BookOpen;
              return (
                <Card
                  key={category.id}
                  hover
                  padding="md"
                  className={`group animate-fade-up animate-stagger-${Math.min(index + 1, 5)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                      <IconComponent className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-neutral-900">{category.title}</h3>
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        {category.description}
                      </p>
                      <div className="mt-3">
                        <Badge variant="default" size="sm">Coming Soon</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Future domains hint */}
          <div className="mt-12 text-center">
            <p className="text-sm text-neutral-400">
              More SAP domains (ABAP, Fiori, UI5, CAP, OData) coming soon.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
