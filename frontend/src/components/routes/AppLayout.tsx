import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../Layout';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, resetToOnboarding } = useAuth();
  const showNav = location.pathname !== '/onboarding';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleReset() {
    resetToOnboarding();
    navigate('/onboarding');
  }

  return (
    <Layout
      showNav={showNav}
      userEmail={user?.email}
      onLogout={handleLogout}
      onReset={handleReset}
    >
      <div key={location.pathname} className={showNav ? 'animate-fade-in h-full' : 'h-full'}>
        <Outlet />
      </div>
    </Layout>
  );
}
