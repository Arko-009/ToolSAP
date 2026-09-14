import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <Loader2 className="h-8 w-8 text-primary-500 animate-spin mb-3" />
      <p className="text-sm text-neutral-500">{message}</p>
    </div>
  );
}
