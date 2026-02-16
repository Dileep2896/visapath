import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function RequireAdmin() {
  const { user } = useAuth();

  if (!user?.is_admin) {
    return <Navigate to="/timeline" replace />;
  }

  return <Outlet />;
}
