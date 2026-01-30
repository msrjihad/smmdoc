'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaChevronDown,
  FaFileContract,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaUserCog,
  FaWallet,
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getUserDetails } from '@/lib/actions/getUser';
import { useGetUserStatsQuery } from '@/lib/services/dashboard-api';
import { setUserDetails } from '@/lib/slice/userDetails';
import { useCurrency } from '@/contexts/currency-context';
import { PriceDisplay } from '@/components/price-display';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { FaDesktop, FaMoon, FaSun } from 'react-icons/fa';

const Avatar = ({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) => (
  <div
    className={`relative rounded-full overflow-hidden flex-shrink-0 ${className}`}
  >
    {children}
  </div>
);

const AvatarImage = ({ src, alt, onError }: { src: string; alt: string; onError?: () => void }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => {
        setHasError(true);
        onError?.();
      }}
    />
  );
};

const AvatarFallback = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-semibold text-sm">
    {children}
  </div>
);

const MobileCurrencyToggle = ({ onClose }: { onClose?: () => void }) => {
  const { currency, setCurrency, rate, isLoading, availableCurrencies, currentCurrencyData } = useCurrency();

  const handleCurrencyChange = async (newCurrency: string) => {
    await setCurrency(newCurrency);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className="p-2.5 rounded-lg"
      style={{
        backgroundColor: 'var(--dropdown-hover)',
        border: `1px solid var(--header-border)`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="font-semibold"
          style={{ color: 'var(--header-text)', fontSize: '11px' }}
        >
          Currency
        </span>
        {currentCurrencyData && !isLoading && (
          <span
            className="text-xs font-medium opacity-70"
            style={{ color: 'var(--header-text)', fontSize: '10px' }}
          >
            1USD = {currentCurrencyData.code === 'USD' ? '1.00USD' : `${currentCurrencyData.rate.toFixed(2)}${currentCurrencyData.code}`}
          </span>
        )}
      </div>
      <div className={`grid gap-2 ${availableCurrencies.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {availableCurrencies.map((curr) => (
          <button
            key={curr.code}
            onClick={() => handleCurrencyChange(curr.code)}
            disabled={isLoading}
            className={`flex items-center gap-1.5 p-1.5 rounded-md transition-all duration-200 ${
              currency === curr.code
                ? 'text-white shadow-sm'
                : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor:
                currency === curr.code ? 'var(--primary)' : 'transparent',
              color: currency === curr.code ? 'white' : 'var(--header-text)',
            }}
          >
            <span
              className={`text-xs font-bold ${
                currency === curr.code ? 'text-white' : ''
              }`}
              style={{
                color:
                  currency === curr.code ? 'white' : 'var(--header-text)',
              }}
            >
              {curr.symbol}
            </span>
            <span className="font-medium" style={{ fontSize: '10px' }}>{curr.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ThemeToggle = ({ isMobile = false }: { isMobile?: boolean }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`${isMobile ? 'w-full' : 'h-10 w-10 sm:h-10 sm:w-10'} rounded-lg header-theme-transition flex items-center justify-center animate-pulse`}
        style={{
          backgroundColor: 'var(--dropdown-bg)',
          border: `1px solid var(--header-border)`,
        }}
      >
        <div
          className="h-4 w-4 sm:h-5 sm:w-5 rounded"
          style={{ backgroundColor: 'var(--header-border)' }}
        ></div>
      </div>
    );
  }

  const themeOptions = [
    { key: 'light', label: 'Light', icon: FaSun },
    { key: 'dark', label: 'Dark', icon: FaMoon },
    { key: 'system', label: 'System', icon: FaDesktop },
  ];

  if (isMobile) {
    return (
      <div
        className="p-2.5 rounded-lg"
        style={{
          backgroundColor: 'var(--dropdown-hover)',
          border: `1px solid var(--header-border)`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="font-semibold"
            style={{ color: 'var(--header-text)', fontSize: '11px' }}
          >
            Theme
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {themeOptions.map((option) => {
            const IconComponent = option.icon;
            const isActive = theme === option.key;

            return (
              <button
                key={option.key}
                onClick={() => setTheme(option.key)}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-md text-center transition-all duration-200 ${
                  isActive ? 'text-white shadow-sm' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--header-text)',
                }}
              >
                <IconComponent
                  className={`h-2.5 w-2.5 transition-colors duration-200 ${
                    isActive ? 'text-white' : ''
                  }`}
                />
                <span className="font-medium" style={{ fontSize: '10px' }}>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

interface ProfileCardProps {
  user: any;
  openDropdowns?: any;
  handleDropdownChange?: (dropdown: string, isOpen: boolean) => void;
}

const ProfileCard = ({ 
  user, 
  openDropdowns, 
  handleDropdownChange 
}: ProfileCardProps) => {
  const currentUser = useCurrentUser();
  const dispatch = useDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [dropdownImageError, setDropdownImageError] = useState(false);

  const isOpen = openDropdowns?.profile || false;
  const setIsOpen = (open: boolean) => handleDropdownChange?.('profile', open);
  const { currency, rate, currentCurrencyData, availableCurrencies } = useCurrency();
  const userData = useSelector((state: any) => state.userDetails);

  const closeMenu = () => setIsOpen(false);
  const enableAuth = true;

  const isAdmin =
    user?.role?.toLowerCase() === 'admin' ||
    user?.userType?.toLowerCase() === 'admin' ||
    user?.isAdmin === true;
  
  const isModerator =
    user?.role?.toLowerCase() === 'moderator' ||
    user?.userType?.toLowerCase() === 'moderator';

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser?.id || user?.id) {
        try {
          const userDetailsData = await getUserDetails();
          if (userDetailsData) {
            dispatch(setUserDetails(userDetailsData));
            setImageError(false);
            setDropdownImageError(false);
          }
        } catch (error) {
          console.error('Failed to load user details in header:', error);
        }
      }
    };

    loadUserData();
  }, [currentUser?.id, user?.id, dispatch]);

  const { data: userStatsResponse, isLoading: isLoadingStats } = useGetUserStatsQuery(undefined);
  const balance = userStatsResponse?.data?.balance || userData?.balance || 0;
  const userStoredCurrency = userStatsResponse?.data?.currency || userData?.currency || 'USD';
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  useEffect(() => {
    const handleAvatarUpdate = async () => {
      try {
        const userDetailsData = await getUserDetails();
        if (userDetailsData) {
          dispatch(setUserDetails(userDetailsData));
          setImageError(false);
          setDropdownImageError(false);
        }
      } catch (error) {
        console.error('Failed to refresh user data after avatar update:', error);
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, [dispatch]);
  
  useEffect(() => {
    if (isOpen) {
      setIsInitialLoading(true);
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const imageUrl = user?.photo || user?.image || userData?.image || '/general/user-placeholder.jpg';

  useEffect(() => {
    if (imageUrl) {
      setImageError(false);
      setDropdownImageError(false);
    } else {
      setImageError(false);
      setDropdownImageError(false);
    }
  }, [user?.photo, user?.image, userData?.image]);

  const isLoading = isInitialLoading || isLoadingStats || !user;

  const menuItems = [
    {
      href: '/account-settings',
      icon: FaUserCog,
      label: 'Account Settings',
    },
    ...(isAdmin
      ? []
      : [
          {
            href: '/add-funds',
            icon: FaMoneyBillWave,
            label: 'Add Funds',
          },
          {
            href: '/transactions',
            icon: FaWallet,
            label: 'Transactions',
          },
        ]),
    ...(isAdmin
      ? []
      : [
          {
            href: '/terms',
            icon: FaFileContract,
            label: 'Terms & Conditions',
          },
        ]),
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      closeMenu();

      if (enableAuth) {
        const { signOut } = await import('next-auth/react');
        const { performCompleteLogout } = await import('@/lib/logout-helper');
        
        await performCompleteLogout(signOut, '/');
      } else {
        const { clearAllSessionData } = await import('@/lib/logout-helper');
        clearAllSessionData();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
      const { clearAllSessionData } = await import('@/lib/logout-helper');
      clearAllSessionData();
      window.location.href = '/';
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        className="relative focus:outline-none flex items-center justify-center !bg-transparent hover:!bg-transparent active:!bg-transparent border-0 shadow-none p-0 m-0"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        disabled={isLoggingOut}
        style={{ background: 'transparent', backgroundColor: 'transparent' }}
      >
        <Avatar className="h-10 w-10 sm:h-10 sm:w-10">
          {!imageError ? (
            <img
              key={`avatar-${imageUrl}-${Date.now()}`}
              src={`${imageUrl}${imageUrl?.includes('?') ? '&' : '?'}_t=${Date.now()}`}
              alt={user?.name || userData?.name || 'User'}
              className="w-full h-full object-cover relative z-10"
              onError={() => {
                setImageError(true);
              }}
              onLoad={() => {
                setImageError(false);
              }}
            />
          ) : null}
          <AvatarFallback>
            {(user?.username || user?.name || user?.email || userData?.username || userData?.name || userData?.email)?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1rem)] z-50 header-theme-transition rounded-lg shadow-lg transition-colors duration-200"
            style={{
              backgroundColor: 'var(--dropdown-bg)',
              border: `1px solid var(--header-border)`,
              left: 'auto',
              right: '0',
            }}
          >
            {isLoading ? (
              <div
                className="p-3 sm:p-6 bg-gray-100 dark:bg-gray-800"
              >
                <div className="flex items-center space-x-2 sm:space-x-4 mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full gradient-shimmer flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 sm:h-6 w-3/4 gradient-shimmer rounded mb-2"></div>
                    <div className="h-3 sm:h-4 w-2/3 gradient-shimmer rounded mb-2"></div>
                    <div className="h-5 w-16 gradient-shimmer rounded"></div>
                  </div>
                </div>
                <div className="rounded-lg p-2.5 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 w-32 gradient-shimmer rounded"></div>
                    <div className="h-4 w-4 gradient-shimmer rounded"></div>
                  </div>
                  <div className="h-6 sm:h-8 w-24 gradient-shimmer rounded"></div>
                </div>
              </div>
            ) : (
              <div
                className="p-3 sm:p-6 bg-gray-100 dark:bg-gray-800"
              >
                <div className="flex items-center space-x-2 sm:space-x-4 mb-3 sm:mb-4">
                  <Avatar className="h-10 w-10 sm:h-14 sm:w-14 ring-2 sm:ring-3 ring-[var(--primary)]/20">
                    {!dropdownImageError ? (
                      <img
                        key={`dropdown-avatar-${imageUrl}-${Date.now()}`}
                        src={`${imageUrl}${imageUrl?.includes('?') ? '&' : '?'}_t=${Date.now()}`}
                        alt={user?.name || userData?.name || 'User'}
                        className="w-full h-full object-cover relative z-10"
                        onError={() => {
                          setDropdownImageError(true);
                        }}
                        onLoad={() => {
                          setDropdownImageError(false);
                        }}
                      />
                    ) : null}
                    <AvatarFallback>
                      {(user?.username || user?.name || user?.email || userData?.username || userData?.name || userData?.email)?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm sm:text-xl font-bold truncate"
                      style={{ color: 'var(--header-text)' }}
                    >
                      {user?.username || user?.name || 'User'}
                    </h3>
                    <p
                      className="truncate text-xs sm:text-sm"
                      style={{ color: 'var(--header-text)', opacity: 0.7 }}
                    >
                      {user?.email || 'user@example.com'}
                    </p>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-medium mt-1 ${
                        isAdmin
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : isModerator
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      }`}
                    >
                      {isAdmin ? 'Admin' : isModerator ? 'Moderator' : 'User'}
                    </span>
                  </div>
                </div>

                {!isAdmin && !isModerator && (
                  <div
                    className="rounded-lg p-2.5 sm:p-4 text-white"
                    style={{
                      background: `linear-gradient(to right, var(--primary), var(--secondary))`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <FaWallet className="h-3 w-3 sm:h-5 sm:w-5" />
                        <span className="font-semibold text-xs sm:text-base">
                          Account Balance
                        </span>
                      </div>
                      <FaChevronDown className="h-2.5 w-2.5 sm:h-4 sm:w-4 opacity-70" />
                    </div>
                    <div className="mt-1.5 sm:mt-2">
                      <div className="text-lg sm:text-2xl font-bold">
                        <PriceDisplay
                          amount={balance}
                          originalCurrency="USD"
                          className="text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="sm:hidden p-2 space-y-2">
              <MobileCurrencyToggle onClose={() => handleDropdownChange?.('profile', false)} />
              <ThemeToggle isMobile={true} />
            </div>

            <div className="py-1 sm:py-2">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="w-full px-3 sm:px-6 py-2 sm:py-3 text-left hover:opacity-80 transition-colors duration-200 flex items-center space-x-2 sm:space-x-3 group block"
                >
                  <div
                    className="p-1.5 sm:p-2 rounded-lg group-hover:opacity-80 transition-colors duration-200"
                    style={{
                      background: `linear-gradient(to right, var(--primary), var(--secondary))`,
                    }}
                  >
                    <item.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <span
                    className="font-semibold transition-colors duration-200 text-xs sm:text-base"
                    style={{ color: 'var(--header-text)' }}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>

            <div style={{ borderTop: `1px solid var(--header-border)` }}></div>

            <div className="p-1 sm:p-2">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full px-3 sm:px-6 py-2 sm:py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center space-x-2 sm:space-x-3 group rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors duration-200">
                  <FaSignOutAlt className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 dark:text-red-400" />
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
};

export default ProfileCard;

