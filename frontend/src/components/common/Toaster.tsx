import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      className="pointer-events-none fixed bottom-0 right-0 left-0 sm:left-auto z-50 flex flex-col gap-2 p-4"
      role="region"
      aria-live="polite"
      aria-label="通知"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className={cn('pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg', {
        'bg-green-50 text-green-800': type === 'success',
        'bg-red-50 text-red-800': type === 'error',
        'bg-blue-50 text-blue-800': type === 'info',
        'bg-yellow-50 text-yellow-800': type === 'warning',
      })}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-auto rounded-md p-1 hover:bg-black/10 focus-visible-ring"
        aria-label="通知を閉じる"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
