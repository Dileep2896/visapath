import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, MessageCircle, FileText, Map, Menu, X, ListChecks, LogOut, User, AlertTriangle, Receipt } from 'lucide-react';
import Logo from './Logo';

interface LayoutProps {
  showNav: boolean;
  children: React.ReactNode;
  userEmail?: string;
  onLogout?: () => void;
  onReset?: () => void;
}

const navItems: { path: string; icon: typeof Clock; label: string }[] = [
  { path: '/timeline', icon: Map, label: 'Timeline' },
  { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { path: '/actions', icon: ListChecks, label: 'Action Items' },
  { path: '/chat', icon: MessageCircle, label: 'AI Chat' },
  { path: '/documents', icon: FileText, label: 'Documents' },
  { path: '/tax-guide', icon: Receipt, label: 'Tax Guide' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Layout({ showNav, children, userEmail, onLogout, onReset }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {showNav && (
        <>
          {/* Mobile top bar */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-navy-900 border-b border-navy-700 px-4 py-3 flex items-center justify-between">
            <Logo size="compact" />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile overlay */}
          {mobileOpen && (
            <div
              className="md:hidden fixed inset-0 z-30 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            fixed md:static z-30 top-0 bottom-0 left-0
            w-64 bg-navy-900 border-r border-navy-700 flex flex-col shrink-0
            transition-transform duration-300 ease-in-out
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
            pt-14 md:pt-0
          `}>
            <div className="p-6 border-b border-navy-700 hidden md:block">
              <Logo size="compact" />
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map(({ path, icon: Icon, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-teal-400/10 text-teal-400'
                        : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-navy-700 space-y-3">
              {userEmail && (
                <div className="flex items-center gap-2 px-2">
                  <User size={14} className="text-slate-500 shrink-0" />
                  <span className="text-xs text-slate-400 truncate">{userEmail}</span>
                </div>
              )}
              {userEmail && onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-navy-800 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              )}
              {onReset && (
                <button
                  onClick={onReset}
                  className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Reset & Start Over
                </button>
              )}
            </div>
          </aside>
        </>
      )}
      <main className={`flex-1 overflow-y-auto bg-grid ${showNav ? 'pt-14 md:pt-0' : ''}`}>
        {children}
      </main>
    </div>
  );
}
