import AdminDashboard from '../components/AdminDashboard';
import usePageTitle from '../hooks/usePageTitle';

export default function AdminPage() {
  usePageTitle('Admin');
  return <AdminDashboard />;
}
