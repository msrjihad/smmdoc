'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FaTicketAlt, FaExclamationTriangle } from 'react-icons/fa';

interface TicketSystemGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const TicketSystemGuard: React.FC<TicketSystemGuardProps> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const checkTicketSystem = async () => {
      try {
        const response = await fetch('/api/ticket-system-status');
        if (response.ok) {
          const data = await response.json();
          const enabled = data.ticketSystemEnabled || false;
          setIsEnabled(enabled);

          if (!enabled) {

            const isAdmin = session?.user?.role === 'admin';
            const redirectPath = isAdmin ? '/admin' : '/dashboard';
            router.push(redirectPath);
            return;
          }
        } else {

          const isAdmin = session?.user?.role === 'admin';
          const redirectPath = isAdmin ? '/admin' : '/dashboard';
          router.push(redirectPath);
          return;
        }
      } catch (error) {
        console.error('Error checking ticket system status:', error);

        const isAdmin = session?.user?.role === 'admin';
        const redirectPath = isAdmin ? '/admin' : '/dashboard';
        router.push(redirectPath);
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkTicketSystem();
  }, []);

  if (isLoading) {
    return null;
  }

  return <>{children}</>
};

export default TicketSystemGuard;