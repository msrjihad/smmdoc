'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useSession } from 'next-auth/react';
import { FaChevronDown, FaDesktop, FaHome, FaMoon, FaSignOutAlt, FaSun, FaTachometerAlt, FaUserCog, FaWallet } from 'react-icons/fa';
import { useUserSettings } from '@/hooks/use-user-settings';
import { logger } from '@/lib/utils/logger';
import { cachedFetch } from '@/lib/utils/api-cache';

const useSafeSession = () => {
  const [sessionData, setSessionData] = useState({
    data: null,
    status: 'loading'
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    try {
      import('next-auth/react').then(({ useSession }) => {
        if (!isMounted) return;

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          if (isMounted) {
            setSessionData({
              data: null,
              status: 'unauthenticated'
            });
          }
        }, 1000);
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('NextAuth not available, continuing without authentication');
      }
      if (isMounted) {
        setSessionData({
          data: null,
          status: 'unauthenticated'
        });
      }
    }

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return sessionData;
};

interface HeaderProps {
  session?: any;
  status?: 'loading' | 'authenticated' | 'unauthenticated';
  enableAuth?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  session: propSession,
  status: propStatus = 'unauthenticated',
  enableAuth = true
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileImageError, setMobileImageError] = useState(false);

  const userSettingsHook = useUserSettings();
  const userSettings = useMemo(() => userSettingsHook.settings, [userSettingsHook.settings]);
  const settingsLoading = useMemo(() => userSettingsHook.loading, [userSettingsHook.loading]);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [siteDarkLogo, setSiteDarkLogo] = useState<string | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  const sessionHook = enableAuth ? useSession() : { data: null, status: 'unauthenticated' as const };

  const rawSession = propSession || sessionHook?.data || null;
  const rawStatus = propStatus !== 'unauthenticated' ? propStatus : (sessionHook?.status || 'unauthenticated');

  const sessionKeyRef = useRef<string>('');
  const prevSessionRef = useRef<any>(null);

  const memoizedSession = useMemo(() => {
    if (!rawSession) {
      sessionKeyRef.current = '';
      prevSessionRef.current = null;
      return null;
    }

    const currentKey = `${rawSession?.user?.id || ''}-${rawSession?.user?.email || ''}-${rawSession?.user?.role || ''}-${rawSession?.user?.photo || ''}-${rawSession?.user?.image || ''}`;

    if (currentKey !== sessionKeyRef.current) {
      sessionKeyRef.current = currentKey;
      prevSessionRef.current = rawSession;
      return rawSession;
    }

    return prevSessionRef.current || rawSession;
  }, [rawSession?.user?.id, rawSession?.user?.email, rawSession?.user?.role, rawSession?.user?.photo, rawSession?.user?.image]);

  const memoizedStatus = useMemo(() => rawStatus, [rawStatus]);

  const isAuthenticated = useMemo(() =>
    memoizedStatus === 'authenticated' && memoizedSession?.user,
    [memoizedStatus, memoizedSession?.user]
  );

  const isLoading = useMemo(() => memoizedStatus === 'loading', [memoizedStatus]);

  const userRole = useMemo(() =>
    memoizedSession?.user?.role?.toUpperCase() || '',
    [memoizedSession?.user?.role]
  );

  const isAdmin = useMemo(() => userRole === 'ADMIN', [userRole]);
  const isModerator = useMemo(() => userRole === 'MODERATOR', [userRole]);
  const dashboardRoute = useMemo(() =>
    (isAdmin || isModerator) ? '/admin' : '/dashboard',
    [isAdmin, isModerator]
  );

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      closeMenu();

      if (enableAuth) {
        const { signOut } = await import('next-auth/react');
        await signOut({ callbackUrl: '/', redirect: true });
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      logger.error('Logout failed', error);
      setIsLoggingOut(false);
      window.location.href = '/';
    }
  }, [enableAuth, closeMenu]);

  const Avatar = memo(({
    className,
    children,
  }: {
    className: string;
    children: React.ReactNode;
  }) => (
    <div className={`relative rounded-full overflow-hidden flex-shrink-0 ${className}`}>
      {children}
    </div>
  ));
  Avatar.displayName = 'Avatar';

  const AvatarImage = memo(({ src, alt }: { src: string; alt: string }) => {
    const [hasError, setHasError] = useState(false);
    const handleError = useCallback(() => {
      setHasError(true);
    }, []);

    if (!src || hasError) {
      return null;
    }

    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={handleError}
      />
    );
  });
  AvatarImage.displayName = 'AvatarImage';

  const AvatarFallback = memo(({ children }: { children: React.ReactNode }) => (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-semibold text-lg">
      {children}
    </div>
  ));
  AvatarFallback.displayName = 'AvatarFallback';

  const ThemeToggle = memo(({ inMenu = false }: { inMenu?: boolean }) => {
    const [theme, setTheme] = useState('system');
    const [mounted, setMounted] = useState(false);
    const themeInitialized = useRef(false);

    useEffect(() => {
      if (themeInitialized.current) return;
      themeInitialized.current = true;

      setMounted(true);
      const savedTheme = localStorage.getItem('theme') || 'system';
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }, []);

    const applyTheme = (theme: string) => {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        root.classList.remove('dark');
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        }
      }
    };

    const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      return () => {
        if (overlayTimeoutRef.current) {
          clearTimeout(overlayTimeoutRef.current);
          overlayTimeoutRef.current = null;
        }
        if (overlayRef.current) {
          try {

            if (overlayRef.current.parentNode && document.body.contains(overlayRef.current)) {
              overlayRef.current.remove();
            }
          } catch (error) {

          } finally {
            overlayRef.current = null;
          }
        }
      };
    }, []);

    const createFadeTransition = () => {
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }

      if (overlayRef.current) {
        try {

          if (overlayRef.current.parentNode && document.body.contains(overlayRef.current)) {
            overlayRef.current.remove();
          }
        } catch (error) {

        } finally {
          overlayRef.current = null;
        }
      }

      const overlay = document.createElement('div');
      overlay.className = 'theme-fade-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 0%, transparent 100%);
        pointer-events: none;
        z-index: 9999;
        opacity: 0;
      `;

      const styleId = 'theme-fade-animation-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @keyframes themeFadeDown {
            0% {
              opacity: 0;
              transform: translateY(-100%);
            }
            30% {
              opacity: 1;
              transform: translateY(0);
            }
            70% {
              opacity: 1;
              transform: translateY(0);
            }
            100% {
              opacity: 0;
              transform: translateY(100%);
            }
          }
          .theme-fade-overlay {
            animation: themeFadeDown 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
        `;
        document.head.appendChild(style);
      }

      overlayRef.current = overlay;
      document.body.appendChild(overlay);

      overlayTimeoutRef.current = setTimeout(() => {
        if (overlayRef.current) {
          try {

            if (overlayRef.current.parentNode && document.body.contains(overlayRef.current)) {
              overlayRef.current.remove();
            }
          } catch (error) {

          } finally {
            overlayRef.current = null;
          }
        }
        overlayTimeoutRef.current = null;
      }, 600);
    };

    const handleThemeChange = (newTheme: string) => {
      createFadeTransition();

      setTimeout(() => {
        setTheme(newTheme);
        if (newTheme === 'system') {
          localStorage.removeItem('theme');
        } else {
          localStorage.setItem('theme', newTheme);
        }
        applyTheme(newTheme);
      }, 150);
    };

    const cycleTheme = () => {
      const themeOrder = ['system', 'light', 'dark'];
      const currentIndex = themeOrder.indexOf(theme);
      const nextIndex = (currentIndex + 1) % themeOrder.length;
      const nextTheme = themeOrder[nextIndex];
      handleThemeChange(nextTheme);
    };

    if (!mounted) {
      return (
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center animate-pulse">
          <div className="h-4 w-4 sm:h-5 sm:w-5 rounded bg-gray-200 dark:bg-gray-600"></div>
        </div>
      );
    }

    const themeOptions = [
      { key: 'light', label: 'Light', icon: FaSun },
      { key: 'dark', label: 'Dark', icon: FaMoon },
      { key: 'system', label: 'System', icon: FaDesktop },
    ];

    if (inMenu) {
      return (
        <div className="w-full flex justify-around items-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {themeOptions.map((option) => {
            const IconComponent = option.icon;
            const isActive = theme === option.key;
            return (
              <button
                key={option.key}
                onClick={() => handleThemeChange(option.key)}
                className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md transition-all duration-200 ${isActive ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                <IconComponent className={`h-5 w-5 mb-1 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                <span className="font-medium text-xs">{option.label}</span>
              </button>
            );
          })}
        </div>
      );
    }

    const currentTheme = themeOptions.find((option) => option.key === theme) || themeOptions[2];
    const CurrentIcon = currentTheme.icon;

    return (
      <div className="relative flex items-center justify-center pl-4">
        <button
          onClick={cycleTheme}
          className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
          aria-label={`Current theme: ${currentTheme.label}. Click to cycle themes.`}
          title={`Current: ${currentTheme.label}`}
        >
          <CurrentIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300 transition-colors duration-200" />
        </button>
      </div>
    );
  });
  ThemeToggle.displayName = 'ThemeToggle';

  const UserMenu = memo(({ user }: { user: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [dropdownImageError, setDropdownImageError] = useState(false);
    const imageUrlRef = useRef<string | null>(null);
    const prevImageUrlRef = useRef<string | null>(null);

    const username = useMemo(() =>
      user?.username || user?.email?.split('@')[0] || user?.name || 'User',
      [user?.username, user?.email, user?.name]
    );
    const balance = 0;

    const avatarImageUrl = useMemo(() => {
      const url = user?.photo || user?.image || '/general/user-placeholder.jpg';
      if (imageUrlRef.current !== url) {
        imageUrlRef.current = url;
      }
      return imageUrlRef.current;
    }, [user?.photo, user?.image]);

    useEffect(() => {
      if (avatarImageUrl && avatarImageUrl !== prevImageUrlRef.current) {
        prevImageUrlRef.current = avatarImageUrl;
        setImageError(false);
        setDropdownImageError(false);
      }
    }, [avatarImageUrl]);

    const handleLogoutClick = useCallback(() => {
      setIsOpen(false);
      handleLogout();
    }, [handleLogout]);

    const handleImageError = useCallback(() => {
      setImageError(true);
    }, []);

    const handleImageLoad = useCallback(() => {
      setImageError(false);
    }, []);

    const handleDropdownImageError = useCallback(() => {
      setDropdownImageError(true);
    }, []);

    const handleDropdownImageLoad = useCallback(() => {
      setDropdownImageError(false);
    }, []);

    const toggleMenu = useCallback(() => {
      setIsOpen(prev => !prev);
    }, []);

    return (
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          className="pl-4 relative focus:outline-none flex items-center justify-center !bg-transparent hover:!bg-transparent active:!bg-transparent border-0 shadow-none p-0 m-0"
          onClick={toggleMenu}
          aria-label="User menu"
          disabled={isLoggingOut}
          style={{ background: 'transparent', backgroundColor: 'transparent' }}
        >
          <Avatar className="h-12 w-12">
            {avatarImageUrl && !imageError ? (
              <img
                key={avatarImageUrl}
                src={avatarImageUrl}
                alt={user?.name || 'User'}
                className="w-full h-full object-cover relative z-10"
                onError={handleImageError}
                onLoad={handleImageLoad}
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <AvatarFallback>{username?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={toggleMenu} />
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1rem)] z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="p-3 sm:p-6 bg-gray-50 dark:bg-gray-700/50 rounded-t-lg">
                <div className="flex items-center space-x-2 sm:space-x-4 mb-3 sm:mb-4">
                  <Avatar className="h-10 w-10 sm:h-14 sm:w-14 ring-2 sm:ring-3 ring-[var(--primary)]/20">
                    {avatarImageUrl && !dropdownImageError ? (
                      <img
                        key={`dropdown-${avatarImageUrl}`}
                        src={avatarImageUrl}
                        alt={user?.name || 'User'}
                        className="w-full h-full object-cover relative z-10"
                        onError={handleDropdownImageError}
                        onLoad={handleDropdownImageLoad}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                    <AvatarFallback>{username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-xl font-bold truncate text-gray-900 dark:text-white">{username}</h3>
                    <p className="truncate text-xs sm:text-sm text-gray-600 dark:text-gray-300">{user?.email}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-medium mt-1 ${
                      isAdmin
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : isModerator
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    }`}>
                      {isAdmin ? 'Admin' : isModerator ? 'Moderator' : 'User'}
                    </span>
                  </div>
                </div>

                {!isAdmin && !isModerator && (
                  <div className="rounded-lg p-2.5 sm:p-4 text-white bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <FaWallet className="h-3 w-3 sm:h-5 sm:w-5" />
                        <span className="font-semibold text-xs sm:text-base">Account Balance</span>
                      </div>
                      <FaChevronDown className="h-2.5 w-2.5 sm:h-4 sm:w-4 opacity-70" />
                    </div>
                    <div className="mt-1.5 sm:mt-2">
                      <p className="text-lg sm:text-2xl font-bold">${balance.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="py-1 sm:py-2">
                <Link href={dashboardRoute} onClick={toggleMenu} className="w-full px-3 sm:px-6 py-2 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 flex items-center space-x-2 sm:space-x-3 group block">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
                    {isAdmin ? <FaHome className="h-3 w-3 sm:h-4 sm:w-4 text-white" /> : <FaTachometerAlt className="h-3 w-3 sm:h-4 sm:w-4 text-white" />}
                  </div>
                  <span className="font-semibold text-xs sm:text-base text-gray-700 dark:text-gray-300">
                    {isAdmin ? 'Admin Panel' : 'Dashboard'}
                  </span>
                </Link>
                <Link href={'/account-settings'} onClick={toggleMenu} className="w-full px-3 sm:px-6 py-2 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 flex items-center space-x-2 sm:space-x-3 group block">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
                    <FaUserCog className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <span className="font-semibold text-xs sm:text-base text-gray-700 dark:text-gray-300">
                    Profile
                  </span>
                </Link>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600"></div>
              <div className="p-1 sm:p-2">
                <button
                  onClick={handleLogoutClick}
                  disabled={isLoggingOut}
                  className="w-full px-3 sm:px-6 py-2 sm:py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center space-x-2 sm:space-x-3 group rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors duration-200">
                    <FaSignOutAlt className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400 text-xs sm:text-base">
                    {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  });
  UserMenu.displayName = 'UserMenu';

  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);

  const logoFetchedRef = useRef(false);
  useEffect(() => {

    if (logoFetchedRef.current) {
      setMounted(true);
      setLogoLoaded(true);
      return;
    }

    let isMounted = true;
    let abortController: AbortController | null = null;

    const fetchSiteLogo = async () => {
      try {

        abortController = new AbortController();
        const data = await cachedFetch<{
          success: boolean;
          generalSettings?: {
            siteLogo?: string;
            siteDarkLogo?: string;
          };
        }>(
          '/api/public/general-settings',
          {
            method: 'GET',
            signal: abortController.signal,
          },
          300000
        );

        if (!isMounted) return;

        if (data.success && data.generalSettings) {
          const logo = data.generalSettings.siteLogo?.trim() || '/logo.png';
          const darkLogo = data.generalSettings.siteDarkLogo?.trim();

          setSiteLogo(logo);
          if (darkLogo) {
            setSiteDarkLogo(darkLogo);
          }
        } else {
          setSiteLogo('/logo.png');
        }
      } catch (error) {
        if (!isMounted || (error as any)?.name === 'AbortError') return;
        logger.error('Error fetching site logo', error);
        if (isMounted) {
          setSiteLogo('/logo.png');
        }
      } finally {
        if (isMounted) {
          logoFetchedRef.current = true;
          setLogoLoaded(true);
          setMounted(true);
        }
      }
    };

    setMounted(true);
    fetchSiteLogo();

    return () => {
      isMounted = false;
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  const mobileAvatarUrl = useMemo(() => {
    return memoizedSession?.user?.photo || memoizedSession?.user?.image || '/general/user-placeholder.jpg';
  }, [memoizedSession?.user?.photo, memoizedSession?.user?.image]);

  const prevMobileAvatarUrl = useRef<string | null>(null);
  useEffect(() => {
    if (mobileAvatarUrl && mobileAvatarUrl !== prevMobileAvatarUrl.current) {
      prevMobileAvatarUrl.current = mobileAvatarUrl;
      setMobileImageError(false);
    }
  }, [mobileAvatarUrl]);

  const displayLogo = useMemo(() => siteLogo || '/logo.png', [siteLogo]);
  const displayDarkLogo = useMemo(() => siteDarkLogo || displayLogo, [siteDarkLogo, displayLogo]);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[var(--header-bg)] shadow-sm dark:shadow-lg dark:shadow-black/20 transition-colors duration-200">
      <nav className="bg-white dark:bg-[var(--header-bg)]">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <div className="flex items-center justify-between py-3">
            <Link href="/" className="flex items-center">
              {siteDarkLogo && siteDarkLogo !== displayLogo ? (
                <>
                  <Image
                    src={displayLogo}
                    alt="SMMDOC"
                    width={400}
                    height={50}
                    className="h-14 lg:h-16 w-auto max-w-[400px] dark:hidden"
                    priority
                    unoptimized={displayLogo.startsWith('http')}
                  />
                  <Image
                    src={displayDarkLogo}
                    alt="SMMDOC"
                    width={400}
                    height={50}
                    className="h-14 lg:h-16 w-auto max-w-[400px] hidden dark:block"
                    priority
                    unoptimized={displayDarkLogo.startsWith('http')}
                  />
                </>
              ) : (
                <Image
                  src={displayLogo}
                  alt="SMMDOC"
                  width={400}
                  height={50}
                  className="h-14 lg:h-16 w-auto max-w-[400px]"
                  priority
                  unoptimized={displayLogo.startsWith('http')}
                />
              )}
            </Link>

            <div className="hidden lg:flex items-center space-x-1">
              <Link href="/about" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] font-medium transition-colors duration-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50">About</Link>
              <Link href="/our-services" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] font-medium transition-colors duration-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50">Services</Link>
              <Link href="/blogs" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] font-medium transition-colors duration-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50">Blogs</Link>
              <Link href="/contact" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] font-medium transition-colors duration-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50">Contact</Link>

              {!isLoading && !isAuthenticated && (
                <>
                  <Link href="/sign-in" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] font-medium transition-colors duration-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50">Sign In</Link>
                  {!settingsLoading && userSettings?.signUpPageEnabled !== false && (
                    <Link href="/sign-up" className="inline-flex items-center bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-[#4F0FD8] hover:to-[#A121E8]">
                      <span>Sign Up</span>
                    </Link>
                  )}
                </>
              )}

              {!isLoading && isAuthenticated && (
                <>
                  <Link href={dashboardRoute} className="inline-flex items-center bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:from-[#4F0FD8] hover:to-[#A121E8]">
                    <span>{isAdmin ? 'Admin Panel' : 'Dashboard'}</span>
                  </Link>
                  <UserMenu user={memoizedSession?.user} />
                </>
              )}

              <ThemeToggle />
            </div>

            <button
              className="lg:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              type="button"
              onClick={toggleMenu}
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>
      <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40" onClick={closeMenu}></div>
        <div className={`relative w-[80%] h-full bg-white dark:bg-[var(--header-bg)] shadow-lg transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <Link href="/" className="flex items-center">
                {siteDarkLogo && siteDarkLogo !== displayLogo ? (
                  <>
                    <Image
                      src={displayLogo}
                      alt="SMMDOC"
                      width={200}
                      height={25}
                      className="h-12 w-auto dark:hidden"
                      unoptimized={displayLogo.startsWith('http')}
                    />
                    <Image
                      src={displayDarkLogo}
                      alt="SMMDOC"
                      width={200}
                      height={25}
                      className="h-12 w-auto hidden dark:block"
                      unoptimized={displayDarkLogo.startsWith('http')}
                    />
                  </>
                ) : (
                  <Image
                    src={displayLogo}
                    alt="SMMDOC"
                    width={200}
                    height={25}
                    className="h-12 w-auto"
                    unoptimized={displayLogo.startsWith('http')}
                  />
                )}
              </Link>
              <button
                className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                type="button"
                onClick={toggleMenu}
                aria-label="Close navigation menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
          </div>
          <div className="py-4 space-y-1">
            {isAuthenticated ? (
              <>
                <div className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      {mobileAvatarUrl && !mobileImageError ? (
                        <img
                          key={`mobile-${mobileAvatarUrl}`}
                          src={mobileAvatarUrl}
                          alt={memoizedSession?.user?.name || 'User'}
                          className="w-full h-full object-cover relative z-10"
                          onError={() => {
                            setMobileImageError(true);
                          }}
                          onLoad={() => {
                            setMobileImageError(false);
                          }}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                      <AvatarFallback>{(memoizedSession?.user?.username || memoizedSession?.user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{memoizedSession?.user?.username || memoizedSession?.user?.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{memoizedSession?.user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
                <Link href={dashboardRoute} className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition-colors rounded-md" onClick={closeMenu}>{isAdmin ? 'Admin Panel' : 'Dashboard'}</Link>
                <Link href="/account-settings" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition-colors rounded-md" onClick={closeMenu}>Profile</Link>
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
                <Link href="/about" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition-colors rounded-md" onClick={closeMenu}>About</Link>
                <Link href="/our-services" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition-colors rounded-md" onClick={closeMenu}>Services</Link>
                <Link href="/blogs" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition-colors rounded-md" onClick={closeMenu}>Blogs</Link>
                <Link href="/contact" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition-colors rounded-md" onClick={closeMenu}>Contact</Link>
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
                <button onClick={handleLogout} disabled={isLoggingOut} className="block w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors rounded-md disabled:opacity-50">
                  {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                </button>
              </>
            ) : (
              <>
                <Link href="/sign-in" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition-colors rounded-md" onClick={closeMenu}>Sign In</Link>
                <Link href="/about" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition-colors rounded-md" onClick={closeMenu}>About</Link>
                <Link href="/our-services" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition-colors rounded-md" onClick={closeMenu}>Services</Link>
                <Link href="/blogs" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition-colors rounded-md" onClick={closeMenu}>Blogs</Link>
                <Link href="/contact" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium transition-colors rounded-md" onClick={closeMenu}>Contact</Link>
                {!settingsLoading && userSettings?.signUpPageEnabled !== false && (
                  <div className="pt-2 px-4">
                    <Link href="/sign-up" className="block w-full px-4 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold rounded-md hover:from-[#4F0FD8] hover:to-[#A121E8] transition-all duration-200 text-center" onClick={closeMenu}>Sign Up</Link>
                  </div>
                )}
              </>
            )}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 font-medium">Theme</div>
              <div className="px-4">
                <ThemeToggle inMenu={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;