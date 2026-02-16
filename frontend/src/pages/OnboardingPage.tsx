import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OnboardingForm from '../components/OnboardingForm';
import type { UserInput } from '../types';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { loading, userInput, isEditingProfile, draftStep, handleOnboardingSubmit, handleSaveDraft } = useAuth();

  async function onSubmit(data: UserInput) {
    try {
      await handleOnboardingSubmit(data);
      navigate('/timeline');
    } catch {
      // Stay on onboarding page — error is displayed via timelineError state
    }
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
