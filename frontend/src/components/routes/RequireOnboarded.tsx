import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function RequireOnboarded() {
  const { userInput, draftStep } = useAuth();

  if (!userInput || draftStep !== undefined) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
