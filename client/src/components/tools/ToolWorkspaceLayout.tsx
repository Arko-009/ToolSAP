import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

export interface ToolWorkspaceLayoutProps {
  toolName: string;
  toolDescription: string;
  badgeLabel?: string;
  toolbarActions?: ReactNode;
  leftPane: ReactNode;
  rightPane: ReactNode;
  infoSection?: ReactNode;
}

export function ToolWorkspaceLayout({
  toolName,
  toolDescription,
  badgeLabel = 'Privacy-First · 100% In-Browser',
  toolbarActions,
  leftPane,
  rightPane,
  infoSection,
}: ToolWorkspaceLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50/50 pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="bg-white border-b border-neutral-200/80 pt-6 pb-6">
        <Container>
          <div className="flex flex-col gap-4">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between gap-4">
              <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Tools', href: '/tools' },
                  { label: toolName },
                ]}
              />

              <Link
                to="/tools"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-primary-600 transition-colors py-1 px-2.5 rounded-md hover:bg-neutral-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All Tools</span>
              </Link>
            </div>

            {/* Title & Badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                    {toolName}
                  </h1>
                  <Badge variant="success" size="md">
                    <Shield className="h-3 w-3 mr-1 text-emerald-600" />
                    {badgeLabel}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-600 max-w-2xl leading-relaxed">
                  {toolDescription}
                </p>
              </div>

              {/* Privacy Banner */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50/80 border border-emerald-200/70 text-emerald-800 text-xs">
                <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium">
                  Client-side only. Your XML payload is never uploaded to any server.
                </span>
              </div>
            </div>

            {/* Quick Action Bar (if provided) */}
            {toolbarActions && (
              <div className="pt-2 border-t border-neutral-100 mt-2 flex flex-wrap items-center justify-between gap-3">
                {toolbarActions}
              </div>
            )}
          </div>
        </Container>
      </div>

      {/* Main Workspace: 2-Pane Responsive Grid */}
      <Section padding="sm" className="pt-6">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left Pane (Input) */}
            <div className="w-full h-full flex flex-col">{leftPane}</div>

            {/* Right Pane (Output) */}
            <div className="w-full h-full flex flex-col">{rightPane}</div>
          </div>

          {/* Optional Educational / Tips / Reference Section */}
          {infoSection && <div className="mt-12">{infoSection}</div>}
        </Container>
      </Section>
    </div>
  );
}
