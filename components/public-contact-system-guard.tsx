'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PublicContactSystemGuardProps {
  children: React.ReactNode;
}

const PublicContactSystemGuard: React.FC<PublicContactSystemGuardProps> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkContactSystem = async () => {
      try {
        const response = await fetch('/api/contact-system-status');
        if (response.ok) {
          const data = await response.json();
          const enabled = data.contactSystemEnabled || false;
          setIsEnabled(enabled);

          if (!enabled) {
            router.push('/');
            return;
          }
        } else {

          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Error checking contact system status:', error);

        router.push('/');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkContactSystem();
  }, [router]);

  if (isLoading) {
    return null;
  }

  if (!isEnabled) {
    return null;
  }

  return <>{children}</>;
};

export default PublicContactSystemGuard;