import { useAuth } from '../contexts/AuthContext';
import AIChatPanel from '../components/AIChatPanel';

export default function ChatPage() {
  const { userInput } = useAuth();
  return <AIChatPanel userContext={userInput} />;
}
