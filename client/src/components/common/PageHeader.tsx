import type { ReactNode } from 'react';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';
import { Container } from '@/components/layout/Container';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  badge,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`border-b border-neutral-200 bg-white ${className}`}>
      <Container>
        <div className="py-6 sm:py-8">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs items={breadcrumbs} className="mb-3" />
          )}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
                  {title}
                </h1>
                {badge}
              </div>
              {description && (
                <p className="mt-2 text-neutral-600 text-base sm:text-lg max-w-2xl">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </div>
      </Container>
    </div>
  );
}
