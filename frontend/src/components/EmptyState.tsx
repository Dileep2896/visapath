import { AlertCircle, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[80vh] p-6">
      <div className="text-center max-w-sm">
        {/* Icon with animated ring */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div
            className="absolute inset-0 rounded-full border-2 border-slate-500/20 animate-pulse"
            style={{ animationDuration: '3s' }}
          />
          <div
            className="absolute inset-1.5 rounded-full border border-slate-500/10 animate-pulse"
            style={{ animationDuration: '3.5s', animationDelay: '0.3s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
              {icon || <AlertCircle size={22} className="text-slate-500" />}
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white font-heading mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>

        {action && (
          <button
            onClick={action.onClick}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-400 text-navy-950 hover:from-teal-400 hover:to-teal-300 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
          >
            {action.label}
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
