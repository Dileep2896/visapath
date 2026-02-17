import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OnboardingForm from '../components/OnboardingForm';
import type { UserInput } from '../types';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading, userInput, isEditingProfile, draftStep, handleOnboardingSubmit, handleSaveDraft } = useAuth();

  if (user?.is_admin) {
    return <Navigate to="/admin" replace />;
  }

  async function onSubmit(data: UserInput) {
    // Navigate immediately so the user sees the full-page loading animation
    // while the AI generates the timeline in the background
    handleOnboardingSubmit(data).catch(() => {
      // Error is handled via timelineError state on the timeline page
    });
    navigate('/timeline');
  }

  return (
    <OnboardingForm
      onSubmit={onSubmit}
      loading={loading}
      initialData={isEditingProfile || draftStep ? userInput : undefined}
      initialStep={isEditingProfile ? undefined : draftStep}
      onSaveDraft={handleSaveDraft}
    />
  );
}
