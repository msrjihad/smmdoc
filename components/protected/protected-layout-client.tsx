'use client';

import Header from '@/components/header/page';
import SideBar from '@/components/dashboard/sidebar';
import Announcements from '@/components/dashboard/announcements';
import MobileBottomNav from '@/components/dashboard/mobile-bottom-nav';
import { AuthGuard } from '@/components/protected/auth-guard';
import { RouteGuard } from '@/components/admin/route-guard';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface ProtectedLayoutClientProps {
  children: React.ReactNode;
}

export default function ProtectedLayoutClient({ children }: ProtectedLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const isDashboard = pathname === '/dashboard';
  const isAdminPage = pathname?.startsWith('/admin');
  const isAdminDashboard = pathname === '/admin';

  return (
    <div className="flex min-h-screen">
      <div
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-30 bg-gradient-to-br from-[#0f172a] to-[#1e293b] transition-all duration-300 ${
          sidebarCollapsed ? 'w-[80px]' : 'w-[280px]'
        }`}
      >
        <SideBar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          session={session}
        />
      </div>

      <div
        className={`flex flex-col w-full transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'
        }`}
      >
        <div
          className={`fixed top-0 right-0 z-40 transition-all duration-300 ${
            sidebarCollapsed
              ? 'lg:w-[calc(100%-80px)]'
              : 'lg:w-[calc(100%-280px)]'
          } w-full bg-white dark:bg-slate-800`}
        >
          <Header />
        </div>

        <main className="w-full mt-16 lg:mt-20 pb-16 lg:pb-0">
          <div
            className={
              isDashboard
                ? 'p-0'
                : 'px-4 sm:px-8 py-4 sm:py-8 bg-[var(--page-bg)] dark:bg-[var(--page-bg)]'
            }
          >
            {isAdminPage ? (
              <RouteGuard>
                {!isAdminDashboard && (
                  <Announcements visibility="all_pages" />
                )}
                <div className="admin-page-wrapper">
                  {children}
                </div>
              </RouteGuard>
            ) : (
              <AuthGuard>
                {!isDashboard && (
                  <Announcements visibility="all_pages" />
                )}
                {children}
              </AuthGuard>
            )}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
