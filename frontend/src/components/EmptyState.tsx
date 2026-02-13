import { AlertCircle } from 'lucide-react';

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
    <div className="flex items-center justify-center min-h-[300px] p-6">
      <div className="text-center max-w-sm">
        <div className="mb-4">
          {icon || <AlertCircle size={32} className="text-slate-600 mx-auto" />}
        </div>
        <p className="text-slate-300 font-medium">{title}</p>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-4 px-4 py-2 bg-teal-400/10 text-teal-400 text-sm font-medium rounded-lg hover:bg-teal-400/20 transition-colors cursor-pointer"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
