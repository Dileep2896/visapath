import { useState } from 'react';
import type { AppView, UserInput, TimelineResponse } from './types';
import { generateTimeline } from './utils/api';
import Layout from './components/Layout';
import OnboardingForm from './components/OnboardingForm';
import TimelineDashboard from './components/TimelineDashboard';
import ActionItems from './components/ActionItems';
import AIChatPanel from './components/AIChatPanel';
import DocumentTracker from './components/DocumentTracker';
import { TimelineSkeleton } from './components/Skeleton';

export default function App() {
  const [view, setView] = useState<AppView>('onboarding');
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOnboardingSubmit(data: UserInput) {
    setLoading(true);
    setUserInput(data);
    setView('timeline');
    try {
      const result = await generateTimeline(data);
      setTimelineData(result);
    } catch {
      setView('onboarding');
      alert('Failed to generate timeline. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  function handleNavigate(target: AppView) {
    if (target === 'onboarding') {
      setUserInput(null);
      setTimelineData(null);
    }
    setView(target);
  }

  return (
    <Layout
      currentView={view}
      onNavigate={handleNavigate}
      showNav={view !== 'onboarding'}
    >
      {view === 'onboarding' && (
        <OnboardingForm onSubmit={handleOnboardingSubmit} loading={loading} />
      )}
      {view === 'timeline' && !timelineData && (
        <TimelineSkeleton />
      )}
      {view === 'timeline' && timelineData && (
        <TimelineDashboard data={timelineData} />
      )}
      {view === 'actions' && timelineData && (
        <ActionItems events={timelineData.timeline_events} />
      )}
      {view === 'actions' && !timelineData && (
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-navy-900 rounded-xl border border-navy-700 p-8 text-center">
            <ListChecksIcon />
            <p className="text-slate-300 font-medium mt-3">No action items yet</p>
            <p className="text-sm text-slate-500 mt-1">Complete the onboarding form to generate your timeline and action items.</p>
          </div>
        </div>
      )}
      {view === 'chat' && (
        <AIChatPanel userContext={userInput} />
      )}
      {view === 'documents' && (
        <DocumentTracker />
      )}
    </Layout>
  );
}

function ListChecksIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 mx-auto">
      <path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>
    </svg>
  );
}
