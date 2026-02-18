import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthScreen from '../components/AuthScreen';
import { getMe, demoLogin } from '../utils/api';
import type { AuthUser, UserInput } from '../types';
import usePageTitle from '../hooks/usePageTitle';

export default function LoginPage() {
  usePageTitle('Login');
  const { user, userInput, draftStep, setUser, setUserInput, setTimelineData, setDraftStep, setCachedTaxGuide } = useAuth();

  if (user) {
    if (user.is_admin) return <Navigate to="/admin" replace />;
    if (!userInput || draftStep !== undefined) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/timeline" replace />;
  }

  async function handleAuth(authUser: AuthUser) {
    // Fetch profile BEFORE setting user to avoid race condition.
    // (setUser triggers re-render; if userInput is still null, it redirects to onboarding)
    const me = await getMe();
    if (me?.profile) {
      const { _draft_step, ...profileData } = me.profile as UserInput & { _draft_step?: number };
      setUserInput(profileData as UserInput);
      if (_draft_step !== undefined) setDraftStep(_draft_step);
      if (me.cached_timeline) setTimelineData(me.cached_timeline);
      if (me.cached_tax_guide) setCachedTaxGuide(me.cached_tax_guide);
    }
    // Set user last — this triggers navigation with all data already in place
    setUser(authUser);
  }

  async function handleDemo() {
    const authUser = await demoLogin();
    await handleAuth(authUser);
  }

  return <AuthScreen onAuth={handleAuth} onDemo={handleDemo} />;
}
