import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthScreen from '../components/AuthScreen';
import type { AuthUser } from '../types';

export default function LoginPage() {
  const { user, userInput, draftStep, setUser } = useAuth();

  if (user) {
    if (!userInput || draftStep) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/timeline" replace />;
  }

  function handleAuth(authUser: AuthUser) {
    setUser(authUser);
  }

  return <AuthScreen onAuth={handleAuth} />;
}
