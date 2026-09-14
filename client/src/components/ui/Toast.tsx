import { createContext, useContext, type ReactNode } from 'react';
import { useToast, type ToastMessage } from '@/hooks/useToast';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastContextValue {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'border-success-500 bg-success-50',
  error: 'border-error-500 bg-error-50',
  warning: 'border-warning-500 bg-warning-50',
  info: 'border-info-500 bg-info-50',
};

const iconColorMap = {
  success: 'text-success-600',
  error: 'text-error-600',
  warning: 'text-warning-600',
  info: 'text-info-600',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type];
          return (
            <div
              key={toast.id}
              className={`
                pointer-events-auto
                flex items-start gap-3 p-4
                rounded-lg border-l-4 shadow-lg
                animate-slide-in-right
                ${colorMap[toast.type]}
              `}
              role="alert"
            >
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColorMap[toast.type]}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-xs text-neutral-600">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-0.5 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
