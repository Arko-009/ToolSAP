import type { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'muted' | 'white' | 'subtle-grid';
  borderTop?: boolean;
  borderBottom?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'py-8 sm:py-12',
  md: 'py-12 sm:py-16',
  lg: 'py-16 sm:py-24',
  xl: 'py-20 sm:py-28 lg:py-32',
};

const bgMap = {
  default: '',
  muted: 'bg-neutral-100/40',
  white: 'bg-white',
  'subtle-grid': 'bg-white bg-grid-subtle relative',
};

export function Section({
  children,
  className = '',
  id,
  padding = 'md',
  background = 'default',
  borderTop = false,
  borderBottom = false,
}: SectionProps) {
  const borderClasses = [
    borderTop ? 'border-t border-neutral-200/80' : '',
    borderBottom ? 'border-b border-neutral-200/80' : '',
  ].filter(Boolean).join(' ');

  return (
    <section
      id={id}
      className={`relative ${paddingMap[padding]} ${bgMap[background]} ${borderClasses} ${className}`}
    >
      {children}
    </section>
  );
}

