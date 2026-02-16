import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function RequireOnboarded() {
  const { user, userInput, draftStep } = useAuth();

  if (!userInput || draftStep !== undefined) {
    // Admins skip onboarding — send them to the admin dashboard
    if (user?.is_admin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
