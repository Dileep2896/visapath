import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TaxGuidePageComponent from '../components/TaxGuidePage';

export default function TaxGuidePageRoute() {
  const { userInput, cachedTaxGuide, setCachedTaxGuide } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGenerated = useCallback(
    (data: any) => {
      setCachedTaxGuide(data as Record<string, unknown>);
    },
    [setCachedTaxGuide]
  );

  return (
    <TaxGuidePageComponent
      userContext={userInput}
      cachedTaxGuide={cachedTaxGuide}
      onTaxGuideGenerated={handleGenerated}
    />
  );
}
