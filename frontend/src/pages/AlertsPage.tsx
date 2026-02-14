import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AlertsPageComponent from '../components/AlertsPage';
import EmptyState from '../components/EmptyState';
import { AlertTriangle } from 'lucide-react';

export default function AlertsPageRoute() {
  const navigate = useNavigate();
  const { timelineData, userInput } = useAuth();

  if (!timelineData) {
    return (
      <EmptyState
        icon={<AlertTriangle size={22} className="text-slate-500" />}
        title="No alerts yet"
        description={userInput
          ? "Your timeline hasn't been generated yet. Head to the Timeline tab to generate it."
          : "Complete the onboarding form to generate your timeline and see any risk alerts."}
        action={userInput
          ? { label: 'Go to Timeline', onClick: () => navigate('/timeline') }
          : { label: 'Start Onboarding', onClick: () => navigate('/onboarding') }}
      />
    );
  }

  return <AlertsPageComponent alerts={timelineData.risk_alerts} />;
}
