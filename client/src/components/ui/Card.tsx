import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'subtle';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const variantMap = {
  default: 'bg-white border border-neutral-200/80 shadow-xs',
  glass: 'glass-card shadow-xs',
  subtle: 'bg-neutral-50/70 border border-neutral-200/60 shadow-xs',
};

export function Card({
  children,
  hover = false,
  padding = 'md',
  variant = 'default',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl
        ${variantMap[variant]}
        ${hover ? 'transition-all duration-200 hover:shadow-md hover:border-neutral-300/90 hover:-translate-y-0.5' : ''}
        ${paddingMap[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`mb-3 ${className}`}>{children}</div>;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return <div className={`mt-4 pt-4 border-t border-neutral-100 ${className}`}>{children}</div>;
}
