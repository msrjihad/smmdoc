import authConfig from '@/auth.config';
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { getClientIP } from './lib/activity-logger';
import {
    apiAuthPrefixes,
    authRoutes,
    DEFAULT_SIGN_IN_REDIRECT,
    publicRoutes,
} from './lib/routes';
import { getTicketSettings } from './lib/utils/ticket-settings';
import { getModuleSettings } from './lib/utils/module-settings';
import { getMaintenanceMode } from './lib/utils/general-settings';

export const { auth } = NextAuth(authConfig);

const isAdminOrModerator = (role: string | undefined | null): boolean => {
  return role === 'admin' || role === 'moderator';
};

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req?.auth?.user;
  const isApiAuthRoute = apiAuthPrefixes.some((prefix) =>
    nextUrl.pathname.startsWith(prefix)
  );
  let isPublicRoute = publicRoutes.some((route) =>
    nextUrl.pathname === route || nextUrl.pathname.startsWith(route + '/')
  );
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (nextUrl.pathname === '/transactions' && 
      (nextUrl.searchParams.get('payment') || nextUrl.searchParams.get('invoice_id'))) {
    const hostname = nextUrl.hostname;
    const currentPort = nextUrl.port;
    
    const hostHeader = req.headers.get('host') || '';
    const serverPort = hostHeader.includes(':') ? hostHeader.split(':')[1] : '80';
    
    if (hostname === 'localhost' && serverPort !== '80' && serverPort !== '443') {
      if (currentPort !== serverPort) {
        const fixedUrl = new URL(nextUrl);
        fixedUrl.port = serverPort;
        console.log('Middleware: Fixing redirect URL - redirecting to:', fixedUrl.toString());
        return NextResponse.redirect(fixedUrl);
      }
    }
  }

  const clientIP = getClientIP(req);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-client-ip', clientIP);

  const isTestDbApi = nextUrl.pathname === '/api/test-db';



  const impersonatedUserId = req.cookies.get('impersonated-user-id')?.value;
  const originalAdminId = req.cookies.get('original-admin-id')?.value;
  const isImpersonating = userRole?.isImpersonating || !!impersonatedUserId;

  const callbackUrl =
    nextUrl.searchParams.get('callbackUrl') || DEFAULT_SIGN_IN_REDIRECT;

  const isApiRoute = nextUrl.pathname.startsWith('/api');
  const isPaymentWebhook = nextUrl.pathname.startsWith('/api/payment/webhook');
  const isMaintenancePage = nextUrl.pathname === '/maintenance';
  const isSignInPage = nextUrl.pathname === '/sign-in';
  const isAdminRoute = nextUrl.pathname.startsWith('/admin');
  
  if (isApiRoute || isPaymentWebhook || isApiAuthRoute) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  try {
    const maintenanceMode = await getMaintenanceMode();
    const userRoleType = userRole?.role;
    const isAdmin = userRoleType === 'admin' || userRoleType === 'super_admin';
    const isModerator = userRoleType === 'moderator';
    const isAdminOrMod = isAdmin || isModerator;
    
    if (maintenanceMode === 'active') {
      if (isAdminRoute && !isAdminOrMod) {
        return NextResponse.redirect(new URL('/sign-in', nextUrl));
      }
      
      if (isAdmin) {
        if (isMaintenancePage) {
          return NextResponse.redirect(new URL('/admin', nextUrl));
        }
      } 
      else if (isModerator && isLoggedIn) {
        if (isMaintenancePage) {
          return NextResponse.redirect(new URL('/admin', nextUrl));
        }
        
        const isPublic = publicRoutes.some((route) =>
          nextUrl.pathname === route || nextUrl.pathname.startsWith(route + '/')
        );
        
        if (isPublic) {
        } else if (isAdminRoute) {
          const { hasPermission } = await import('@/lib/permissions');
          const userPermissions = (userRole as any)?.permissions as string[] | null | undefined;
          const normalizedPath = nextUrl.pathname.endsWith('/') && nextUrl.pathname !== '/' 
            ? nextUrl.pathname.slice(0, -1) 
            : nextUrl.pathname;
          
          if (!hasPermission(userRoleType, userPermissions, normalizedPath)) {
            return NextResponse.redirect(new URL('/sign-in', nextUrl));
          }
        } else {
          return NextResponse.redirect(new URL('/maintenance', nextUrl));
        }
      }
      else if (isSignInPage) {
        if (isLoggedIn && isAdminOrMod) {
          return NextResponse.redirect(new URL('/admin', nextUrl));
        }
      }
      else {
        if (!isMaintenancePage) {
          return NextResponse.redirect(new URL('/maintenance', nextUrl));
        }
      }
    } else if (maintenanceMode === 'inactive' && isMaintenancePage) {
      if (isLoggedIn) {
        const redirectPath = isAdminOrMod ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(redirectPath, nextUrl));
      } else {
        return NextResponse.redirect(new URL('/', nextUrl));
      }
    }
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
  }

  const ourServicesPage = '/our-services';
  const isOurServicesPage = nextUrl.pathname === ourServicesPage || nextUrl.pathname.startsWith(ourServicesPage + '/');

  if (isOurServicesPage) {
    try {
      const moduleSettings = await getModuleSettings(true);
      const servicesListPublic = moduleSettings?.servicesListPublic ?? true;
      if (!servicesListPublic) {
        isPublicRoute = false;
        if (!isLoggedIn) {
          return NextResponse.redirect(new URL(`/sign-in?callbackUrl=${encodeURIComponent(nextUrl.pathname)}&reason=services-restricted`, nextUrl));
        }
      }
    } catch (error) {
      console.error('Error checking services list public status in proxy:', error);
      isPublicRoute = false;
      if (!isLoggedIn) {
        return NextResponse.redirect(new URL(`/sign-in?callbackUrl=${encodeURIComponent(nextUrl.pathname)}&reason=services-restricted`, nextUrl));
      }
    }
  }

  const ticketPages = [
    '/admin/tickets',
    '/support-tickets',
  ];

  const isTicketPage = ticketPages.some(page => 
    nextUrl.pathname === page || nextUrl.pathname.startsWith(page + '/')
  );

  if (isTicketPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/sign-in', nextUrl));
    }
    
    try {
      const ticketSettings = await getTicketSettings(true);
      if (!ticketSettings.ticketSystemEnabled) {
        const redirectPath = (isAdminOrModerator(userRole?.role) && !isImpersonating) ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(redirectPath, nextUrl));
      }
    } catch (error) {
      console.error('Error checking ticket system status in proxy:', error);
      const redirectPath = (userRole?.role === 'admin' && !isImpersonating) ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(redirectPath, nextUrl));
    }
  }

  if (isAuthRoute) {
    if (isLoggedIn) {

      if (isImpersonating) {
        return NextResponse.redirect(new URL('/dashboard', nextUrl));
      }

      if (userRole?.role === 'admin' || userRole?.role === 'moderator') {
        const roleLabel = userRole?.role === 'admin' ? 'Admin' : 'Moderator';
        console.log(`${roleLabel} user detected, redirecting to admin dashboard`);
        return NextResponse.redirect(new URL('/admin', nextUrl));
      }
      console.log('Regular user detected, redirecting to user dashboard');
      return NextResponse.redirect(new URL(callbackUrl, nextUrl));
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const contactPages = [
    '/admin/contact-messages',
    '/contact-support',
    '/contact'
  ];

  const isContactPage = contactPages.some(page => 
    nextUrl.pathname === page || nextUrl.pathname.startsWith(page + '/')
  );

  if (isContactPage && isLoggedIn) {
    const isAdminContactMessages = nextUrl.pathname.startsWith('/admin/contact-messages');
    const isAdmin = isAdminOrModerator(userRole?.role) && !isImpersonating;
    
    if (isAdminContactMessages && isAdmin) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    console.log('Proxy: Contact page detected:', nextUrl.pathname);
    console.log('Proxy: User role:', userRole?.role);
    try {

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
      
      if (!baseUrl) {
        console.error('NEXT_PUBLIC_APP_URL or NEXTAUTH_URL environment variable is required');
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
      console.log('Proxy: Fetching contact status from:', `${baseUrl}/api/contact-system-status`);
      const response = await fetch(`${baseUrl}/api/contact-system-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Proxy: API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Proxy: Contact system enabled:', data.contactSystemEnabled);
        if (!data.contactSystemEnabled) {

          const redirectPath = isAdmin ? '/admin' : '/dashboard';
          console.log('Proxy: Redirecting to:', redirectPath);
          return NextResponse.redirect(new URL(redirectPath, nextUrl));
        }
      } else {
        console.log('Proxy: API error, redirecting to safe page');

        const redirectPath = isAdmin ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(redirectPath, nextUrl));
      }
    } catch (error) {
      console.error('Error checking contact system status in proxy:', error);

      const redirectPath = isAdmin ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(redirectPath, nextUrl));
    }
  }

  const affiliatePages = [
    '/admin/affiliates',
    '/affiliate',
    '/api/ref',
  ];

  const isAffiliatePage = affiliatePages.some(page => 
    nextUrl.pathname === page || nextUrl.pathname.startsWith(page + '/')
  );

  if (isAffiliatePage && isLoggedIn) {
    try {
      const moduleSettings = await getModuleSettings(true);
      if (!moduleSettings.affiliateSystemEnabled) {
        const redirectPath = (isAdminOrModerator(userRole?.role) && !isImpersonating) ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(redirectPath, nextUrl));
      }
    } catch (error) {
      console.error('Error checking affiliate system status in proxy:', error);
      const redirectPath = (userRole?.role === 'admin' && !isImpersonating) ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(redirectPath, nextUrl));
    }
  }

  const childPanelPages = [
    '/admin/child-panels',
    '/child-panel',
  ];

  const isChildPanelPage = childPanelPages.some(page => 
    nextUrl.pathname === page || nextUrl.pathname.startsWith(page + '/')
  );

  if (isChildPanelPage && isLoggedIn) {
    try {
      const moduleSettings = await getModuleSettings(true);
      if (!moduleSettings.childPanelSellingEnabled) {
        const redirectPath = (isAdminOrModerator(userRole?.role) && !isImpersonating) ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(redirectPath, nextUrl));
      }
    } catch (error) {
      console.error('Error checking child panel system status in proxy:', error);
      const redirectPath = (userRole?.role === 'admin' && !isImpersonating) ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(redirectPath, nextUrl));
    }
  }

  const massOrderPages = [
    '/mass-orders',
  ];

  const isMassOrderPage = massOrderPages.some(page => 
    nextUrl.pathname === page || nextUrl.pathname.startsWith(page + '/')
  );

  if (isMassOrderPage && isLoggedIn) {
    try {
      const moduleSettings = await getModuleSettings(true);
      if (!moduleSettings.massOrderEnabled) {
        const redirectPath = (isAdminOrModerator(userRole?.role) && !isImpersonating) ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(redirectPath, nextUrl));
      }
    } catch (error) {
      console.error('Error checking mass order system status in proxy:', error);
      const redirectPath = (userRole?.role === 'admin' && !isImpersonating) ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(redirectPath, nextUrl));
    }
  }

  const serviceUpdatePages = [
    '/services/updates',
  ];

  const isServiceUpdatePage = serviceUpdatePages.some(page => 
    nextUrl.pathname === page || nextUrl.pathname.startsWith(page + '/')
  );

  if (isServiceUpdatePage && isLoggedIn) {
    try {
      const moduleSettings = await getModuleSettings(true);
      if (!moduleSettings.serviceUpdateLogsEnabled) {
        const redirectPath = (isAdminOrModerator(userRole?.role) && !isImpersonating) ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(redirectPath, nextUrl));
      }
    } catch (error) {
      console.error('Error checking service update logs status in proxy:', error);
      const redirectPath = (userRole?.role === 'admin' && !isImpersonating) ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(redirectPath, nextUrl));
    }
  }

  if (nextUrl.pathname.startsWith('/admin')) {
    const originalAdminRole = (userRole as any)?.originalAdminRole;
    const hasAdminAccess = !isImpersonating 
      ? (userRole?.role === 'admin' || userRole?.role === 'moderator')
      : (originalAdminRole === 'admin' || originalAdminRole === 'moderator');

    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
  }

  const userPages = [
    '/dashboard',
    '/my-orders',
    '/new-order',
    '/transactions',
    '/add-funds',
    '/transfer-funds',
    '/services',
    '/support-tickets',
    '/affiliate',
    '/child-panel',
    '/api',
    '/mass-orders',
    '/contact-support',
  ];

  const isUserPage = userPages.some(page => 
    nextUrl.pathname === page || nextUrl.pathname.startsWith(page + '/')
  );

  if (isUserPage && isLoggedIn && !isImpersonating) {
    if (userRole?.role === 'admin' || userRole?.role === 'moderator') {
      return NextResponse.redirect(new URL('/admin', nextUrl));
    }
  }

  if (!isLoggedIn && !isPublicRoute) {
    let redirectUrl = `/sign-in`;
    if (nextUrl.pathname !== '/') {
      redirectUrl += `?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`;
    }
    return NextResponse.redirect(new URL(redirectUrl, nextUrl));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',

    '/(api|trpc)(.*)',
  ],
};
