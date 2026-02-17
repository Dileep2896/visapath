import { useAuth } from '../contexts/AuthContext';
import AIChatPanel from '../components/AIChatPanel';
import usePageTitle from '../hooks/usePageTitle';

export default function ChatPage() {
  usePageTitle('AI Chat');
  const { userInput } = useAuth();
  return <AIChatPanel userContext={userInput} />;
}
