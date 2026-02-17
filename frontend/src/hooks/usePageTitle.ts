import { useEffect } from 'react';

export default function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | VisaPath` : 'VisaPath';
    return () => { document.title = 'VisaPath'; };
  }, [title]);
}
