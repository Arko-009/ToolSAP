interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={`
        animate-pulse-subtle bg-neutral-200
        ${variantClasses[variant]}
        ${className}
      `}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-5 rounded-xl border border-neutral-200 space-y-4">
      <Skeleton variant="rectangular" height="12px" width="60%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="75%" />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="rectangular" width="60px" height="24px" />
        <Skeleton variant="rectangular" width="80px" height="24px" />
      </div>
    </div>
  );
}
