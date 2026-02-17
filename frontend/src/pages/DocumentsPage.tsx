import DocumentTracker from '../components/DocumentTracker';
import usePageTitle from '../hooks/usePageTitle';

export default function DocumentsPage() {
  usePageTitle('Documents');
  return <DocumentTracker />;
}
