import { Link } from 'react-router-dom';
import { BookOpen, Wrench, Shield, Code2 } from 'lucide-react';
import { SEOHead } from '@/components/common/SEOHead';
import { PageHeader } from '@/components/common/PageHeader';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Card } from '@/components/ui/Card';

export function AboutPage() {
  return (
    <>
      <SEOHead
        title="About ToolSAP"
        description="ToolSAP is a developer platform for SAP professionals. Learn SAP technologies and use free developer tools — built for developers who actually build with SAP."
        canonical="/about"
      />

      <PageHeader
        title="About ToolSAP"
        description="A developer platform for SAP professionals."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'About' },
        ]}
      />

      <Section padding="lg">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-neutral max-w-none">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Our Mission</h2>
              <p className="text-neutral-600 leading-relaxed mb-6">
                ToolSAP exists to help SAP developers learn faster and get development work done faster.
                We believe that practical, structured learning combined with purpose-built developer tools
                creates a better experience than documentation alone.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mb-4">What We Offer</h2>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <Card padding="md" className="group">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-3">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 mb-2">Structured Learning</h3>
                  <p className="text-sm text-neutral-600">
                    Practical lessons designed for SAP developers. Understand concepts, experiment with examples,
                    and reference useful information — organized by domain and difficulty.
                  </p>
                </Card>

                <Card padding="md" className="group">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-3">
                    <Wrench className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 mb-2">Developer Tools</h3>
                  <p className="text-sm text-neutral-600">
                    Free browser-based tools for everyday SAP development tasks. Format XML, validate payloads,
                    test XPath expressions — all processed entirely in your browser for privacy.
                  </p>
                </Card>
              </div>

              <h2 className="text-xl font-bold text-neutral-900 mb-4">Our Principles</h2>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="h-4 w-4 text-success-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Privacy-First</h3>
                    <p className="text-sm text-neutral-600">
                      Tools process data locally in your browser. We don't upload, log, or persist your payloads.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Code2 className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Developer-Focused</h3>
                    <p className="text-sm text-neutral-600">
                      Every feature is built to help SAP developers learn faster or get development work done faster.
                      Nothing is added just because it looks impressive.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning-50 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="h-4 w-4 text-warning-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Accurate Content</h3>
                    <p className="text-sm text-neutral-600">
                      Technical content is based on authoritative SAP documentation. We explain concepts in
                      original, developer-friendly language — not copied documentation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
                <h3 className="text-base font-semibold text-neutral-900 mb-2">Get Started</h3>
                <p className="text-sm text-neutral-500 mb-4">
                  Explore structured SAP learning or try our developer tools.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    to="/learning"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Start Learning
                  </Link>
                  <Link
                    to="/tools"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Explore Tools
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
