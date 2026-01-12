import '@/assets/styles/globals.css';
import { auth } from '@/auth';
import { CustomCodesInjector } from '@/components/custom-codes-injector';
import AnalyticsInjector from '@/components/analytics-injector';
import { ThemeProvider } from '@/components/theme-provider';
import OfflineDetector from '@/components/offline-detector';
import DatabaseConnectionDetector from '@/components/database-connection-detector';
import ServiceWorkerRegistration from '@/components/service-worker-registration';
import { APP_DESCRIPTION, APP_URL } from '@/lib/constants';
import { getAppName } from '@/lib/utils/general-settings';
import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';

import { AppNameProvider } from '@/contexts/app-name-context';
import { CurrencyProvider } from '@/contexts/currency-context';
import { getUserCurrency } from '@/lib/actions/currency';
import { Nunito } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'sonner';
import StoreProvider from './store-provider';
import UserSwitchWrapper from '@/components/admin/user-switch-wrapper';
import FaviconUpdater from '@/components/favicon-updater';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const appName = await getAppName();
  
  const faviconUrl = '/api/favicon';
  
  return {
    title: {
      template: `%s — ${appName}`,
      default: `${appName}`,
    },
    description: `${APP_DESCRIPTION}`,
    metadataBase: new URL(APP_URL || process.env.NEXT_PUBLIC_APP_URL!),
    icons: {
      icon: [
        { url: faviconUrl, type: 'image/png', sizes: 'any' },
        { url: faviconUrl, type: 'image/png', sizes: '32x32' },
        { url: faviconUrl, type: 'image/png', sizes: '16x16' },
      ],
      shortcut: [
        { url: faviconUrl, type: 'image/png' },
      ],
      apple: [
        { url: faviconUrl, type: 'image/png' },
      ],
    },
    manifest: '/api/manifest',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const serverCurrency = await getUserCurrency();
  const appName = await getAppName();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/api/manifest" />
        <link rel="icon" href="/api/favicon" type="image/png" />
        <link rel="shortcut icon" href="/api/favicon" type="image/png" />
        <link rel="apple-touch-icon" href="/api/favicon" />
        <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Fix redirect URL if gateway stripped the port (localhost -> localhost:3000)
                // This runs immediately, before React loads
                try {
                  if (typeof window !== 'undefined' && window.location) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const hasPaymentParams = urlParams.get('payment') || urlParams.get('invoice_id');
                    const isLocalhost = window.location.hostname === 'localhost';
                    const port = window.location.port;
                    const hasNoPort = !port || port === '' || port === '0' || port === '80' || port === '443';
                    
                    // Only redirect if we're on a non-standard port (not 80/443)
                    // For port 80, http://localhost (without port) is CORRECT - don't redirect!
                    if (hasPaymentParams && isLocalhost && hasNoPort) {
                      // Check if we need to redirect to a non-standard port
                      // This would only happen if the server is on a port other than 80/443
                      // For now, assume port 80 is correct and don't redirect
                      // The middleware handles server-side redirects if needed
                    }
                  }
                } catch (e) {
                  console.warn('Error in redirect URL fix script:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${nunito.variable} font-nunito antialiased text-black`}
        suppressHydrationWarning
      >
        <SessionProvider 
          session={session}
          refetchOnWindowFocus={false}
          refetchInterval={0}
          refetchWhenOffline={false}
        >
          <StoreProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange={false}
            >
              <Toaster richColors position="bottom-right" />
              <ServiceWorkerRegistration />
              <CustomCodesInjector />
              <AnalyticsInjector />
              <FaviconUpdater />
              <AppNameProvider initialAppName={appName}>
                <CurrencyProvider serverCurrency={serverCurrency}>
                  <OfflineDetector>
                    <DatabaseConnectionDetector>
                      <div className="non-sidebar-content font-nunito text-black">
                        {children}
                        <UserSwitchWrapper />
                      </div>
                    </DatabaseConnectionDetector>
                  </OfflineDetector>
                </CurrencyProvider>
              </AppNameProvider>
            </ThemeProvider>
          </StoreProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
