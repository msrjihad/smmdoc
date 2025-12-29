'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkSessionValidity, setupSessionInvalidationListener } from '@/lib/session-invalidation';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard component handles all authentication and authorization logic
 * without affecting the parent layout's DOM structure.
 * This prevents hydration mismatches by keeping the layout stable.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [hasImpersonationCookie, setHasImpersonationCookie] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const isDashboard = pathname === '/dashboard';
  const isAdminPage = pathname?.startsWith('/admin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';').reduce((acc: any, cookie: string) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key.trim()] = decodeURIComponent(value.trim());
        }
        return acc;
      }, {});
      const hasCookie = !!(cookies['impersonated-user-id'] && cookies['original-admin-id']);
      setHasImpersonationCookie(hasCookie);
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (status === 'loading') return;
      
      try {
        setUserDataLoading(true);
        const response = await fetch('/api/user/current', {
          credentials: 'include',
          cache: 'no-store'
        });
        const userDataResponse = await response.json();
        
        if (userDataResponse.success) {
          setUserData(userDataResponse.data);
          if (userDataResponse.data.isImpersonating) {
            setHasImpersonationCookie(true);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setUserDataLoading(false);
      }
    };
    
    if (status !== 'loading' && session?.user) {
      fetchUserData();
    }
  }, [status, session?.user]);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    const validateSessionOnMount = async () => {
      setIsValidating(true);
      
      try {
        if (status === 'unauthenticated') {
          const { clearAllSessionData } = await import('@/lib/logout-helper');
          clearAllSessionData();
          setIsValidating(false);
          window.location.href = '/sign-in';
          return;
        }
        
        if (status === 'authenticated' && session?.user?.id) {
          try {
            const response = await fetch('/api/auth/session-check', {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            });
            
            if (response.ok) {
              const data = await response.json();
              
              if (!data.valid || !data.session) {
                console.log('Session invalid on mount, clearing and redirecting...');
                const { clearAllSessionData } = await import('@/lib/logout-helper');
                clearAllSessionData();
                setIsValidating(false);
                await signOut({ callbackUrl: '/sign-in', redirect: true });
                return;
              }
            } else {
              console.warn('Session check failed with status:', response.status, '- continuing anyway');
            }
          } catch (error) {
            console.warn('Session check network error (will continue):', error);
          }
        } else if (status === 'authenticated' && !session?.user?.id) {
          console.log('Session missing user data, clearing and redirecting...');
          const { clearAllSessionData } = await import('@/lib/logout-helper');
          clearAllSessionData();
          setIsValidating(false);
          await signOut({ callbackUrl: '/sign-in', redirect: true });
          return;
        }
      } catch (error) {
        console.error('Error validating session on mount:', error);
        const { clearAllSessionData } = await import('@/lib/logout-helper');
        clearAllSessionData();
        setIsValidating(false);
        window.location.href = '/sign-in';
      } finally {
        setIsValidating(false);
      }
    };

    validateSessionOnMount();
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id || isValidating) return;

    const cleanup = setupSessionInvalidationListener(
      session.user.id,
      async () => {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        await signOut({ callbackUrl: '/sign-in', redirect: true });
      }
    );

    return cleanup;
  }, [session?.user?.id, isValidating]);

  useEffect(() => {
    if (!session?.user?.id || isValidating) return;

    const checkInterval = setInterval(async () => {
      try {
        const isValid = await checkSessionValidity();
        if (!isValid) {
          console.log('Session is no longer valid, logging out...');
          if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
          }
          await signOut({ callbackUrl: '/sign-in', redirect: true });
        }
      } catch (error) {
        console.error('Error checking session validity (will retry):', error);
      }
    }, 30000);

    return () => clearInterval(checkInterval);
  }, [session?.user?.id, isValidating]);

  useEffect(() => {
    if (status === 'loading' || isValidating) {
      setIsAuthorized(false);
      return;
    }

    const isImpersonating = userData?.isImpersonating || session?.user?.isImpersonating || hasImpersonationCookie || false;
    const userRole = userData?.role || session?.user?.role;

    if (status === 'unauthenticated' || (!session?.user && !isImpersonating)) {
      setIsAuthorized(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
      return;
    }

    if (isAdminPage && session?.user) {
      if (userRole !== 'admin' && userRole !== 'ADMIN' && userRole !== 'moderator') {
        setIsAuthorized(false);
        router.push('/dashboard');
        return;
      }
    }

    if (isDashboard && session?.user && !isImpersonating) {
      if (userRole === 'admin' || userRole === 'ADMIN' || userRole === 'moderator') {
        if (!userDataLoading && userData) {
          router.push('/admin');
          return;
        }
      }
    }

    if (isDashboard && !userDataLoading && userData && !isImpersonating) {
      const userRole = userData.role;
      if (userRole === 'admin' || userRole === 'ADMIN' || userRole === 'moderator') {
        router.push('/admin');
        return;
      }
    }

    setIsAuthorized(true);
  }, [
    status,
    session,
    pathname,
    isAdminPage,
    isDashboard,
    isValidating,
    hasImpersonationCookie,
    userData,
    userDataLoading,
    router,
  ]);

  const showLoadingOverlay = status === 'loading' || isValidating;

  return (
    <>
      {showLoadingOverlay && (
        <div className="fixed inset-0 bg-white dark:bg-slate-900 bg-opacity-75 dark:bg-opacity-75 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

