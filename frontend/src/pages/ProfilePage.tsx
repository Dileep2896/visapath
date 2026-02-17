import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfilePageComponent from '../components/ProfilePage';
import usePageTitle from '../hooks/usePageTitle';

export default function ProfilePageRoute() {
  usePageTitle('Profile');
  const navigate = useNavigate();
  const { userInput, setIsEditingProfile } = useAuth();

  function handleEdit() {
    setIsEditingProfile(true);
    navigate('/onboarding');
  }

  return (
    <ProfilePageComponent
      profile={userInput}
      onEdit={handleEdit}
      onStartOnboarding={() => navigate('/onboarding')}
    />
  );
}
