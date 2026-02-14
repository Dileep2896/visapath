import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ActionItems from '../components/ActionItems';
import EmptyState from '../components/EmptyState';
import { ListChecks } from 'lucide-react';

export default function ActionsPageRoute() {
  const navigate = useNavigate();
  const { timelineData, userInput } = useAuth();

  if (!timelineData) {
    return (
      <EmptyState
        icon={<ListChecks size={22} className="text-slate-500" />}
        title="No action items yet"
        description={userInput
          ? "Your timeline hasn't been generated yet. Head to the Timeline tab to generate it."
          : "Complete the onboarding form to generate your timeline and action items."}
        action={userInput
          ? { label: 'Go to Timeline', onClick: () => navigate('/timeline') }
          : { label: 'Start Onboarding', onClick: () => navigate('/onboarding') }}
      />
    );
  }

  return <ActionItems events={timelineData.timeline_events} />;
}
