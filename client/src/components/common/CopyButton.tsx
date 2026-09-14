import { Copy, Check } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

interface CopyButtonProps {
  text: string;
  size?: 'sm' | 'md';
  variant?: 'light' | 'dark';
  label?: string;
  className?: string;
}

export function CopyButton({
  text,
  size = 'md',
  variant = 'light',
  label = 'Copy',
  className = '',
}: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();

  const sizeClasses = {
    sm: 'p-1 [&_svg]:h-3.5 [&_svg]:w-3.5',
    md: 'p-1.5 [&_svg]:h-4 [&_svg]:w-4',
  };

  const variantClasses = {
    light: 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100',
    dark: 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700',
  };

  return (
    <button
      onClick={() => copy(text)}
      className={`
        rounded-md transition-all duration-150
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label={copied ? 'Copied!' : label}
      title={copied ? 'Copied!' : label}
    >
      {copied ? (
        <Check className="text-success-500" aria-hidden="true" />
      ) : (
        <Copy aria-hidden="true" />
      )}
    </button>
  );
}
