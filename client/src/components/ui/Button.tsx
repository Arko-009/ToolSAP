import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-xs hover:shadow-sm shadow-primary-600/20 active:translate-y-px',
  secondary:
    'bg-white text-neutral-800 border border-neutral-200/90 hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 shadow-2xs',
  ghost:
    'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 active:bg-neutral-200/80',
  danger:
    'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 shadow-xs',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs font-semibold gap-1.5',
  md: 'px-4 py-2 text-sm font-semibold gap-2',
  lg: 'px-5 py-2.5 text-sm sm:text-base font-semibold gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg
        transition-all duration-150 ease-in-out
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500
        disabled:opacity-50 disabled:pointer-events-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : icon ? (
        <span className="shrink-0" aria-hidden="true">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
