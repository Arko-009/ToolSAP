import { createContext, useContext, type ReactNode } from 'react';
import { useToast, type ToastMessage } from '@/hooks/useToast';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';

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
              onClick={() => {
                if (toast.onClick) {
                  toast.onClick();
                  removeToast(toast.id);
                }
              }}
              className={`
                pointer-events-auto
                flex items-start gap-3 p-4
                rounded-lg border-l-4 shadow-lg
                animate-slide-in-right
                ${colorMap[toast.type]}
                ${toast.onClick ? 'cursor-pointer hover:shadow-xl transition-all' : ''}
              `}
              role="alert"
            >
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColorMap[toast.type]}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-xs text-neutral-600 leading-relaxed">{toast.description}</p>
                )}
                {toast.action && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.action!.onClick();
                      removeToast(toast.id);
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>{toast.action.label}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="shrink-0 p-0.5 rounded text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
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

