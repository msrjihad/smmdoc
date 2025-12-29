'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { hasPermission } from '@/lib/permissions';

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/sign-in');
      return;
    }

    const userRole = session.user.role;
    const userPermissions = (session.user as any)?.permissions as string[] | null | undefined;

    const normalizedPath = pathname.endsWith('/') && pathname !== '/' 
      ? pathname.slice(0, -1) 
      : pathname;

    if (normalizedPath === '/admin') {
      return;
    }

    const hasAccess = hasPermission(userRole, userPermissions, normalizedPath);
    
    if (!hasAccess) {
      router.push('/admin');
    }
  }, [session, pathname, router, status]);

  if (session?.user) {
    const userRole = session.user.role;
    const userPermissions = (session.user as any)?.permissions as string[] | null | undefined;
    
    const normalizedPath = pathname.endsWith('/') && pathname !== '/' 
      ? pathname.slice(0, -1) 
      : pathname;
    
    if (!hasPermission(userRole, userPermissions, normalizedPath)) {
      return null;
    }
  }

  return <>{children}</>;
}

