import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface CapsuleButtonProps {
  to: string;
  label: string;
  variant?: 'blue' | 'emerald';
  className?: string;
}

export function CapsuleButton({
  to,
  label,
  variant = 'blue',
  className = '',
}: CapsuleButtonProps) {
  const variantClass = variant === 'emerald' ? 'capsule-btn-emerald' : '';

  return (
    <Link
      to={to}
      className={`capsule-inspect-btn ${variantClass} ${className}`.trim()}
    >
      <span className="pointer-events-none">{label}</span>
      <span className="capsule-inspect-circle pointer-events-none" aria-hidden="true">
        <svg
          className="capsule-inspect-svg"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            className="capsule-track"
          />
          <circle
            cx="12"
            cy="12"
            r="9"
            className="capsule-arc capsule-arc-top"
          />
          <circle
            cx="12"
            cy="12"
            r="9"
            className="capsule-arc capsule-arc-bottom"
          />
        </svg>
        <ArrowRight className="capsule-inspect-arrow" />
      </span>
    </Link>
  );
}
