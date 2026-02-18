import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page Not Found');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 p-6">
      <div className="text-center max-w-md">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-teal-400/20 animate-pulse" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-teal-400/10 border border-teal-400/30 flex items-center justify-center">
              <MapPin size={22} className="text-teal-400" />
            </div>
          </div>
        </div>
        <h1 className="text-6xl font-bold text-white font-heading mb-2">404</h1>
        <h2 className="text-lg font-semibold text-white mb-2">Wrong route on your journey</h2>
        <p className="text-sm text-slate-400 mb-8">This page doesn't exist. Let's get you back on track.</p>
        <button
          onClick={() => navigate('/timeline')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-400 text-navy-950 hover:from-teal-400 hover:to-teal-300 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
        >
          <ArrowLeft size={16} />
          Back to Timeline
        </button>
      </div>
    </div>
  );
}
