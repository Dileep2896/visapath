import { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export interface ToastData {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
}

let toastId = 0;
let addToastFn: ((toast: Omit<ToastData, 'id'>) => void) | null = null;

export function toast(message: string, type: ToastData['type'] = 'error') {
  addToastFn?.({ message, type });
}

const config = {
  error: {
    icon: AlertTriangle,
    bg: 'bg-red-500/10 border-red-500/30',
    text: 'text-red-400',
    iconColor: 'text-red-400',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-teal-400/10 border-teal-400/30',
    text: 'text-teal-400',
    iconColor: 'text-teal-400',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-400/10 border-blue-400/30',
    text: 'text-blue-400',
    iconColor: 'text-blue-400',
  },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    addToastFn = ({ message, type }) => {
      const id = ++toastId;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  function dismiss(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => {
        const c = config[t.type];
        const Icon = c.icon;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm ${c.bg} animate-slide-in-right`}
          >
            <Icon size={18} className={`${c.iconColor} shrink-0 mt-0.5`} />
            <p className={`text-sm flex-1 ${c.text}`}>{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-500 hover:text-slate-300 shrink-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
