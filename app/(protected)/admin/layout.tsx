'use client';

import { RouteGuard } from '@/components/admin/route-guard';
import Announcements from '@/components/dashboard/announcements';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdminDashboard = pathname === '/admin';

  return (
    <RouteGuard>
      {!isAdminDashboard && (
        <Announcements visibility="all_pages" />
      )}
      <div className="admin-page-wrapper">
        {children}
      </div>
    </RouteGuard>
  );
}

