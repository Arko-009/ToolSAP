import type { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'main' | 'article';
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeClasses = {
  sm: 'max-w-4xl',
  md: 'max-w-6xl',
  lg: 'max-w-7xl',
  full: 'max-w-full',
};

export function Container({
  children,
  className = '',
  as: Component = 'div',
  size = 'lg',
}: ContainerProps) {
  return (
    <Component className={`mx-auto w-full ${sizeClasses[size]} px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </Component>
  );
}

