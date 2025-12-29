'use client';

import AOS from 'aos';
import 'aos/dist/aos.css';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { SWRProvider } from './swr-provider';

function ThemeWatcher() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    const body = document.body;
    const currentTheme = theme === 'system' ? systemTheme : theme;
    
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    
    requestAnimationFrame(() => {
      if (currentTheme === 'dark') {
        root.classList.add('dark');
      }
      
      void root.offsetHeight;
      void body.offsetHeight;
      
      const computedStyle = window.getComputedStyle(root);
      void computedStyle.getPropertyValue('--primary');
      
      window.dispatchEvent(new CustomEvent('themechange', { 
        detail: { theme: currentTheme, previousTheme: hadDark ? 'dark' : 'light' } 
      }));
    });
  }, [theme, systemTheme, mounted]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    AOS.init({
      once: true,
      duration: 600,
      easing: 'ease-out-sine',
      offset: 0,
    });
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <NextThemesProvider {...props}>
      <ThemeWatcher />
      <SWRProvider>{children}</SWRProvider>
    </NextThemesProvider>
  );
}
