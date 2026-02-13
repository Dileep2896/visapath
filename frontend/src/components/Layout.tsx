import { Clock, MessageCircle, FileText, Map } from 'lucide-react';
import type { AppView } from '../types';

interface LayoutProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  showNav: boolean;
  children: React.ReactNode;
}

const navItems: { view: AppView; icon: typeof Clock; label: string }[] = [
  { view: 'timeline', icon: Map, label: 'Timeline' },
  { view: 'chat', icon: MessageCircle, label: 'AI Chat' },
  { view: 'documents', icon: FileText, label: 'Documents' },
];

export default function Layout({ currentView, onNavigate, showNav, children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {showNav && (
        <aside className="w-64 bg-navy-900 border-r border-navy-700 flex flex-col shrink-0">
          <div className="p-6 border-b border-navy-700">
            <h1 className="text-xl font-bold font-heading text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center text-navy-950 font-extrabold text-sm">
                VP
              </span>
              VisaPath
            </h1>
            <p className="text-sm text-slate-400 mt-1">Immigration Timeline Planner</p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ view, icon: Icon, label }) => (
              <button
                key={view}
                onClick={() => onNavigate(view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  currentView === view
                    ? 'bg-teal-400/10 text-teal-400'
                    : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-navy-700">
            <button
              onClick={() => onNavigate('onboarding')}
              className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Reset & Start Over
            </button>
          </div>
        </aside>
      )}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
