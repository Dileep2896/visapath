import { useState } from 'react';
import type { AppView, UserInput, TimelineResponse } from './types';
import { generateTimeline } from './utils/api';
import Layout from './components/Layout';
import OnboardingForm from './components/OnboardingForm';
import TimelineDashboard from './components/TimelineDashboard';
import AIChatPanel from './components/AIChatPanel';
import DocumentTracker from './components/DocumentTracker';

export default function App() {
  const [view, setView] = useState<AppView>('onboarding');
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOnboardingSubmit(data: UserInput) {
    setLoading(true);
    try {
      const result = await generateTimeline(data);
      setUserInput(data);
      setTimelineData(result);
      setView('timeline');
    } catch {
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
      {view === 'timeline' && timelineData && (
        <TimelineDashboard data={timelineData} />
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
