import { Link } from 'react-router-dom';
import {
  Code2,
  FileCode,
  FileCheck,
  FileOutput,
  ArrowLeftRight,
  Search,
  Wand2,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { PageHeader } from '@/components/common/PageHeader';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { tools } from '@/data/tools';

const toolIconMap: Record<string, React.ElementType> = {
  FileCode,
  FileCheck,
  FileOutput,
  ArrowLeftRight,
  Search,
  Wand2,
};

export function ToolsPage() {
  return (
    <>
      <SEOHead
        title="Developer Tools — Free SAP Integration Tools"
        description="Free browser-based developer tools for SAP integration development. Format XML, validate payloads, test XPath, convert JSON/XML, and more."
        canonical="/tools"
        keywords={['SAP tools', 'XML formatter', 'XML validator', 'XPath tester', 'SAP developer tools']}
      />

      <PageHeader
        title="Developer Tools"
        description="Free browser-based tools built for SAP integration development. All data is processed locally in your browser."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Tools' },
        ]}
        badge={
          <Badge variant="success" size="md">
            <Shield className="h-3 w-3 mr-1" />
            Privacy-First
          </Badge>
        }
      />

      <Section padding="lg">
        <Container>
          <div className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-1">Integration Developer Tools</h2>
            <p className="text-sm text-neutral-600">
              Essential utilities for SAP Cloud Integration and Integration Suite development.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tools.map((tool, index) => {
              const IconComponent = toolIconMap[tool.icon] || Code2;
              return (
                <Card
                  key={tool.id}
                  hover
                  padding="lg"
                  className={`group animate-fade-up animate-stagger-${Math.min(index + 1, 5)}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                      <IconComponent className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">{tool.name}</h3>
                      <Badge variant="coming-soon" size="sm" className="mt-1">Coming Soon</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                    {tool.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tool.features.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center px-2 py-0.5 text-xs text-neutral-500 bg-neutral-100 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-neutral-100">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-neutral-400 cursor-default">
                      Available soon
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Future tools hint */}
          <div className="mt-12 p-6 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
            <h3 className="text-base font-semibold text-neutral-900 mb-1">More tools coming</h3>
            <p className="text-sm text-neutral-500">
              SAP Expression Builder, Router Condition Builder, Error Decoder, and more.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
