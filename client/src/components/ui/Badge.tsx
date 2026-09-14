import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'coming-soon' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-neutral-100/80 text-neutral-700 border border-neutral-200/80',
  neutral: 'bg-white text-neutral-600 border border-neutral-200 shadow-2xs',
  primary: 'bg-primary-50 text-primary-700 border border-primary-200/70',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
  warning: 'bg-amber-50 text-amber-800 border border-amber-200/70',
  error: 'bg-rose-50 text-rose-700 border border-rose-200/70',
  info: 'bg-sky-50 text-sky-700 border border-sky-200/70',
  'coming-soon': 'bg-primary-50/80 text-primary-700 border border-primary-200/80 font-mono tracking-tight',
};

const dotClasses = {
  default: 'bg-neutral-400',
  neutral: 'bg-neutral-400',
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
  info: 'bg-sky-500',
  'coming-soon': 'bg-primary-500',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[11px] gap-1.5',
  md: 'px-2.5 py-1 text-xs gap-1.5',
};

export function Badge({
  variant = 'default',
  size = 'sm',
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        font-medium rounded-full
        transition-colors duration-150
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotClasses[variant]}`} aria-hidden="true" />}
      {children}
    </span>
  );
}
