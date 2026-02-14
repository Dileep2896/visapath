import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthScreen from '../components/AuthScreen';
import { getMe } from '../utils/api';
import type { AuthUser, UserInput } from '../types';

export default function LoginPage() {
  const { user, userInput, draftStep, setUser, setUserInput, setTimelineData, setDraftStep, setCachedTaxGuide } = useAuth();

  if (user) {
    if (!userInput || draftStep) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/timeline" replace />;
  }

  async function handleAuth(authUser: AuthUser) {
    setUser(authUser);
    // Fetch profile so RequireOnboarded sees userInput immediately
    const me = await getMe();
    if (me?.profile) {
      const { _draft_step, ...profileData } = me.profile as UserInput & { _draft_step?: number };
      setUserInput(profileData as UserInput);
      if (_draft_step) setDraftStep(_draft_step);
      if (me.cached_timeline) setTimelineData(me.cached_timeline);
      if (me.cached_tax_guide) setCachedTaxGuide(me.cached_tax_guide);
    }
  }

  return <AuthScreen onAuth={handleAuth} />;
}
