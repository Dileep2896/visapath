import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TimelineSkeleton } from '../components/Skeleton';
import TimelineDashboard from '../components/TimelineDashboard';
import WhatIfPanel from '../components/WhatIfPanel';
import { Save, Check, Clock, RefreshCw, FileText, User, Map } from 'lucide-react';

export default function TimelinePage() {
  const navigate = useNavigate();
  const {
    user,
    userInput,
    timelineData,
    timelineError,
    loading,
    generating,
    saving,
    saved,
    simulating,
    whatIfModified,
    handleSaveTimeline,
    handleWhatIfSimulate,
    handleWhatIfReset,
    handleRetryTimeline,
  } = useAuth();

  // Explicit AI generation (onboarding submit, retry) → fancy skeleton
  if (generating && !timelineData) return <TimelineSkeleton />;
  if (simulating) return <TimelineSkeleton />;

  // Background loading (auth-check recovering timeline) → styled loader
  if (loading && !timelineData && !timelineError) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh] p-6">
        <div className="w-full max-w-sm text-center">
          {/* Animated rings — matching PageLoader style */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div
              className="absolute inset-0 rounded-full border-2 border-teal-400/20 animate-pulse"
              style={{ animationDuration: '2s' }}
            />
            <div
              className="absolute inset-1.5 rounded-full border border-teal-400/10 animate-pulse"
              style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-teal-400/10 border border-teal-400/30 flex items-center justify-center timeline-loader-spin">
                <Map size={22} className="text-teal-400" />
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white font-heading mb-2">Loading Your Timeline</h3>
          <p className="text-sm text-slate-400 mb-8">Fetching your saved data...</p>

          {/* Indeterminate progress bar */}
          <div className="h-1 bg-navy-800 rounded-full overflow-hidden">
            <div
              className="h-full w-1/3 bg-gradient-to-r from-teal-400 to-teal-300 rounded-full"
              style={{ animation: 'indeterminate 1.5s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!loading && !timelineData && timelineError) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh] p-6">
        <div className="w-full max-w-lg">
          <div className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500/60 via-amber-400 to-amber-500/60" />
            <div className="px-6 pt-8 pb-6 text-center">
              {/* Animated rings — amber variant */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div
                  className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-pulse"
                  style={{ animationDuration: '2s' }}
                />
                <div
                  className="absolute inset-1.5 rounded-full border border-amber-400/10 animate-pulse"
                  style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                    <Clock size={22} className="text-amber-400" />
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white font-heading mb-2">Hang Tight!</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto mb-6">
                {timelineError}
              </p>
              <button
                onClick={handleRetryTimeline}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-400 text-navy-950 hover:from-teal-400 hover:to-teal-300 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 text-center">While you wait, you can explore</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/documents')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-navy-700 bg-navy-800/50 hover:border-teal-400/30 hover:bg-navy-800 transition-all cursor-pointer group"
              >
                <FileText size={20} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
                <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Document Checklist</span>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-navy-700 bg-navy-800/50 hover:border-teal-400/30 hover:bg-navy-800 transition-all cursor-pointer group"
              >
                <User size={20} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
                <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Your Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!timelineData) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 pt-4 gap-3">
        {whatIfModified && (
          <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full font-medium">
            Viewing What-If Scenario
          </span>
        )}
        <div className="flex-1" />
        {user && (
          <button
            onClick={handleSaveTimeline}
            disabled={saving || saved}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border cursor-pointer disabled:opacity-50 bg-navy-800 border-navy-700 text-slate-300 hover:border-teal-400 hover:text-teal-400"
          >
            {saved ? (
              <>
                <Check size={16} className="text-teal-400" />
                Saved
              </>
            ) : saving ? (
              'Saving...'
            ) : (
              <>
                <Save size={16} />
                Save Timeline
              </>
            )}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {userInput && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
            <WhatIfPanel
              baseProfile={userInput}
              onSimulate={handleWhatIfSimulate}
              onReset={handleWhatIfReset}
              loading={simulating}
              isModified={whatIfModified}
            />
          </div>
        )}
        <TimelineDashboard data={timelineData} />
      </div>
    </div>
  );
}
