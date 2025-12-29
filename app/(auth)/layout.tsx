'use client';

import Footer from '@/components/frontend/footer';
import Header from '@/components/frontend/header';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isSignInPage = pathname === '/sign-in';
  const [maintenanceMode, setMaintenanceMode] = useState<'inactive' | 'active'>('inactive');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/public/general-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.generalSettings?.maintenanceMode) {
            setMaintenanceMode(data.generalSettings.maintenanceMode);
          }
        }
      } catch (error) {
        console.error('Error fetching maintenance mode:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaintenanceMode();
  }, []);

  const showHeaderFooter = !(isSignInPage && maintenanceMode === 'active');

  if (isLoading) {
    return (
      <>
        {showHeaderFooter && <Header />}
        <main className="flex-center w-full">{children}</main>
        {showHeaderFooter && <Footer />}
      </>
    );
  }

  return (
    <>
      {showHeaderFooter && <Header />}
      <main className="flex-center w-full">{children}</main>
      {showHeaderFooter && <Footer />}
    </>
  );
}
