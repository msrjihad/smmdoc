'use client';

import { Fragment, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppNameWithFallback } from '@/contexts/app-name-context';

interface RootLayoutContentProps {
  children: React.ReactNode;
}


export default function RootLayoutContent({ children }: RootLayoutContentProps) {
  const pathname = usePathname();
  const { appName } = useAppNameWithFallback();

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': appName,
      '/about': 'About Us',
      '/our-services': 'Our Services',
      '/contact': 'Contact Us',
      '/blogs': 'Blog',
    };
    const base = pathname?.split('/').slice(0, 2).join('/') || '/';
    const pageTitle = titles[base] ?? titles[pathname ?? '/'] ?? appName;
    if (typeof document !== 'undefined' && pageTitle) {
      document.title = pageTitle === appName ? appName : `${pageTitle} — ${appName}`;
    }
  }, [pathname, appName]);

  return <Fragment key={pathname}>{children}</Fragment>;
}
