'use client';

import { PriceDisplay } from '@/components/price-display';
import { useCurrency } from '@/contexts/currency-context';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getUserDetails } from '@/lib/actions/getUser';
import { useGetUserStatsQuery } from '@/lib/services/dashboard-api';
import { setUserDetails } from '@/lib/slice/userDetails';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
    FaChevronDown,
    FaCog,
    FaDesktop,
    FaEllipsisV,
    FaFileContract,
    FaHeadset,
    FaMoneyBillWave,
    FaMoon,
    FaPlus,
    FaSearch,
    FaShoppingCart,
    FaSignOutAlt,
    FaSun,
    FaTicketAlt,
    FaUserCog,
    FaUsers,
    FaWallet,
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { logger } from '@/lib/utils/logger';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger
} from '../ui/dropdown-menu';
import MobileSidebar from '../dashboard/mobile-siderbar';

const HeaderNotificationBox = dynamic(() => import('@/components/header/notification-box'), {
  ssr: false,
});

const ProfileCard = dynamic(() => import('@/components/header/profile-card'), {
  ssr: false,
});

const DropdownMenuContentComponent = dynamic(() => import('@/components/header/dropdown-menu-content'), {
  ssr: false,
});


const ThemeToggle = ({ 
  isMobile = false, 
  openDropdowns, 
  handleDropdownChange 
}: { 
  isMobile?: boolean;
  openDropdowns?: any;
  handleDropdownChange?: (dropdown: string, isOpen: boolean) => void;
}) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          // Check if element still exists in DOM before removing
          if (overlayRef.current.parentNode && document.body.contains(overlayRef.current)) {
            overlayRef.current.remove();
          }
        } catch (error) {
          // Element already removed or DOM not available
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
        // Check if element still exists in DOM before removing
        if (overlayRef.current.parentNode && document.body.contains(overlayRef.current)) {
          overlayRef.current.remove();
        }
      } catch (error) {
        // Element already removed or DOM not available
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
            // Check if element still exists in DOM before removing
            if (overlayRef.current.parentNode && document.body.contains(overlayRef.current)) {
              overlayRef.current.remove();
            }
          } catch (error) {
            // Element already removed or DOM not available
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
    }, 150);
  };

  const cycleTheme = () => {
    const themeOrder = ['system', 'light', 'dark'];
    const currentIndex = themeOrder.indexOf(theme || 'system');
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const nextTheme = themeOrder[nextIndex];
    handleThemeChange(nextTheme);
  };

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

  const currentTheme =
    themeOptions.find((option) => option.key === theme) || themeOptions[2];
  const CurrentIcon = currentTheme.icon;

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
                onClick={() => handleThemeChange(option.key)}
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

  return (
    <button
      onClick={cycleTheme}
      className="h-10 w-10 sm:h-10 sm:w-10 rounded-lg header-theme-transition flex items-center justify-center hover:opacity-80 group"
      style={{
        backgroundColor: 'var(--dropdown-bg)',
        border: `1px solid var(--header-border)`,
      }}
      aria-label={`Current theme: ${currentTheme.label}. Click to cycle themes.`}
      title={`Current: ${currentTheme.label}`}
    >
      <CurrentIcon
        className="h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200"
      />
    </button>
  );
};

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

const MobileMenuToggle = ({
  isMenuOpen,
  toggleMenu,
  openDropdowns,
  handleDropdownChange,
}: {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  openDropdowns?: any;
  handleDropdownChange?: (dropdown: string, isOpen: boolean) => void;
}) => (
  <DropdownMenu 
    open={openDropdowns?.mobile}
    onOpenChange={(isOpen) => handleDropdownChange?.('mobile', isOpen)}
  >
    <DropdownMenuTrigger asChild>
      <button
        className="lg:hidden h-10 w-10 sm:h-10 sm:w-10 rounded-lg header-theme-transition flex items-center justify-center hover:opacity-80 transition-all duration-200 group"
        style={{
          backgroundColor: 'var(--dropdown-bg)',
          border: `1px solid var(--header-border)`,
        }}
        type="button"
        aria-label="Open navigation menu"
      >
        <FaEllipsisV
          className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200"
          style={{ color: 'var(--header-text-hover)' }}
        />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      className="w-64 sm:w-72 header-theme-transition shadow-lg max-w-[calc(100vw-1rem)]"
      style={{
        backgroundColor: 'var(--dropdown-bg)',
        border: `1px solid var(--header-border)`,
      }}
    >
      <MobileSidebar />
    </DropdownMenuContent>
  </DropdownMenu>
);


const Header = () => {
  const currentUser = useCurrentUser();
  const dispatch = useDispatch();
  const { currency, setCurrency, rate, isLoading, availableCurrencies, currentCurrencyData } = useCurrency();
  const userData = useSelector((state: any) => state.userDetails);

  // Memoize user object to prevent rerenders when reference changes
  const user = useMemo(() => {
    return userData?.id ? userData : currentUser;
  }, [userData?.id, userData, currentUser]);
  
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [contactSystemEnabled, setContactSystemEnabled] = useState(true);
  const [childPanelSellingEnabled, setChildPanelSellingEnabled] = useState(true);

  const [openDropdowns, setOpenDropdowns] = useState({
    notifications: false,
    currency: false,
    theme: false,
    plus: false,
    profile: false,
    mobile: false
  });

  const handleDropdownChange = useCallback((dropdownName: string, isOpen: boolean) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdownName]: isOpen
    }));
  }, []);

  // Memoize isAnyDropdownOpen to prevent rerenders
  const isAnyDropdownOpen = useMemo(() => {
    return Object.values(openDropdowns).some(Boolean);
  }, [openDropdowns]);

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const response = await fetch('/api/contact-system-status');
        if (response.ok) {
          const data = await response.json();
          setContactSystemEnabled(data.contactSystemEnabled ?? true);
        }
      } catch (error) {
        logger.error('Error fetching contact settings', error);
        setContactSystemEnabled(true);
      }
    };

    fetchContactSettings();
  }, []);

  useEffect(() => {
    const fetchChildPanelSettings = async () => {
      try {
        const response = await fetch('/api/child-panel-system-status');
        if (response.ok) {
          const data = await response.json();
          setChildPanelSellingEnabled(data.childPanelSellingEnabled ?? false);
        }
      } catch (error) {
        logger.error('Error fetching child panel settings', error);
        setChildPanelSellingEnabled(false);
      }
    };

    fetchChildPanelSettings();
  }, []);

  // Memoize isAdmin to prevent rerenders
  const isAdmin = useMemo(() => {
    return user?.role?.toLowerCase() === 'admin' ||
           user?.userType?.toLowerCase() === 'admin' ||
           user?.isAdmin === true;
  }, [user?.role, user?.userType, user?.isAdmin]);

  const { data: userStatsResponse } = useGetUserStatsQuery(undefined);
  // Memoize balance and currency to prevent rerenders
  const balance = useMemo(() => {
    return userStatsResponse?.data?.balance || userData?.balance || 0;
  }, [userStatsResponse?.data?.balance, userData?.balance]);
  
  const userStoredCurrency = useMemo(() => {
    return userStatsResponse?.data?.currency || userData?.currency || 'USD';
  }, [userStatsResponse?.data?.currency, userData?.currency]);

  // Memoize formatCurrency to prevent rerenders
  const formatCurrency = useCallback((amount: number) => {
    if (!currentCurrencyData || !availableCurrencies || availableCurrencies.length === 0) {
      return `$${amount.toFixed(2)}`;
    }

    let convertedAmount = amount;

    if (currentCurrencyData.code === userStoredCurrency) {
      convertedAmount = amount;
    } else {
      const storedCurrencyData = availableCurrencies.find(c => c.code === userStoredCurrency);

      if (storedCurrencyData && currentCurrencyData) {
        if (userStoredCurrency === 'USD') {
          convertedAmount = amount * currentCurrencyData.rate;
        } else if (currentCurrencyData.code === 'USD') {
          convertedAmount = amount / storedCurrencyData.rate;
        } else {
          const usdAmount = amount / storedCurrencyData.rate;
          convertedAmount = usdAmount * currentCurrencyData.rate;
        }
      }
    }

    return `${currentCurrencyData.symbol}${convertedAmount.toFixed(2)}`;
  }, [currentCurrencyData, availableCurrencies, userStoredCurrency]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const fetchUserRef = useRef(false);
  async function fetchUser() {
    // Prevent duplicate calls
    if (fetchUserRef.current) return;
    fetchUserRef.current = true;
    
    try {
      setIsRefreshing(true);
      const userDetails = await getUserDetails();
      if (userDetails) {
        dispatch(setUserDetails(userDetails));
      }
    } catch (error) {
      logger.error('Error fetching user details', error);
    } finally {
      setIsRefreshing(false);
      // Reset after a delay to allow retries
      setTimeout(() => {
        fetchUserRef.current = false;
      }, 2000);
    }
  }

  useEffect(() => {
    fetchUser();

    // Increase interval to 60 seconds to reduce API calls
    const intervalId = setInterval(() => {
      fetchUser();
    }, 60000); // Changed from 30s to 60s

    const handleCurrencyUpdate = () => {

      setTimeout(() => {
        window.location.reload();
      }, 100);
    };

    const handleAvatarUpdate = () => {
      fetchUser();
    };

    window.addEventListener('currencyUpdated', handleCurrencyUpdate);
    window.addEventListener('avatarUpdated', handleAvatarUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('currencyUpdated', handleCurrencyUpdate);
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, []);

  useEffect(() => {

    if (typeof document !== 'undefined') {

      const originalOverflow = document.body.style.overflow;

      document.body.style.overflowY = 'scroll';

      return () => {

        document.body.style.overflow = originalOverflow;
      };
    }
  }, []);

  const handleCurrencyChange = useCallback(async (newCurrency: string) => {
    await setCurrency(newCurrency);
    handleDropdownChange('currency', false);
  }, [setCurrency, handleDropdownChange]);

  return (
    <nav
      className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 header-theme-transition"
      style={{
        height: '4.5rem',
        backgroundColor: 'var(--header-bg)',
        borderBottom: `1px solid var(--header-border)`,
        color: 'var(--header-text)',
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (min-width: 640px) {
            nav {
              height: 5rem !important;
            }
          }
        `
      }} />
      <Link href="/" className="flex lg:hidden items-center">
        <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
      </Link>
      <div className="hidden lg:flex items-center gap-3 flex-grow max-w-md">
        <div className="relative w-full h-10 flex items-center">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4">
            <FaSearch className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="search"
            placeholder="Search..."
            className="form-field w-full h-full pl-10 pr-4 rounded-lg placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            style={{
              backgroundColor: 'var(--dropdown-bg)',
            }}
          />
        </div>
        {isAdmin ? (
          <Link
            href="/admin/settings"
            className="h-10 w-10 rounded-lg text-white shadow-sm hover:shadow-lg gradient-button-hover transition-all duration-300 hover:-translate-y-0.5 flex-shrink-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(to right, var(--primary), var(--secondary))`,
            }}
            title="General Settings"
          >
            <FaCog className="h-4 w-4 text-white" />
          </Link>
        ) : (
          <DropdownMenuContentComponent
            open={openDropdowns.plus}
            onOpenChange={(isOpen) => handleDropdownChange('plus', isOpen)}
            contactSystemEnabled={contactSystemEnabled}
            childPanelSellingEnabled={childPanelSellingEnabled}
          />
        )}
      </div>
      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        <div className="hidden sm:flex items-center gap-3">
          <DropdownMenu 
            open={openDropdowns.currency}
            onOpenChange={(isOpen) => handleDropdownChange('currency', isOpen)}
          >
            <DropdownMenuTrigger asChild>
              <button
                className="h-10 sm:h-10 px-3 sm:px-4 rounded-lg header-theme-transition flex items-center gap-2 sm:gap-2 hover:opacity-80 transition-all duration-200 group min-w-[80px] sm:min-w-[80px] flex-shrink-0"
                style={{
                  backgroundColor: 'var(--dropdown-bg)',
                  border: `1px solid var(--header-border)`,
                }}
                disabled={isLoading}
              >
                <span
                  className="text-base sm:text-lg font-bold transition-colors duration-200"
                  style={{ color: 'var(--header-text)' }}
                >
                  {currentCurrencyData?.symbol || '$'}
                </span>
                <span
                  className="hidden sm:block font-medium transition-colors duration-200 text-xs sm:text-sm"
                  style={{ color: 'var(--header-text)' }}
                >
                  {currency}
                </span>
                <FaChevronDown
                  className="hidden sm:block w-3 h-3 sm:w-4 sm:h-4 transition-colors duration-200"
                  style={{ color: 'var(--header-text)', opacity: 0.7 }}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 header-theme-transition shadow-sm"
              style={{
                backgroundColor: 'var(--dropdown-bg)',
                border: `1px solid var(--header-border)`,
              }}
            >
              <div className="p-1">
                {availableCurrencies.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => handleCurrencyChange(curr.code)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 ${
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
                      className={`text-lg font-bold min-w-[24px] ${
                        currency === curr.code ? 'text-white' : ''
                      }`}
                      style={{
                        color:
                          currency === curr.code ? 'white' : 'var(--header-text)',
                      }}
                    >
                      {curr.symbol}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{curr.code}</span>
                      <span
                        className={`text-xs ${
                          currency === curr.code ? 'text-white/80' : ''
                        }`}
                        style={{
                          color:
                            currency === curr.code
                              ? 'rgba(255,255,255,0.8)'
                              : 'var(--header-text)',
                          opacity: currency === curr.code ? 1 : 0.7,
                        }}
                      >
                        {curr.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {!isAdmin && (
          <Link
            href="/add-funds"
            className="hidden sm:flex items-center gap-2 h-10 text-white rounded-lg px-4 shadow-lg gradient-button-hover transition-all duration-300 group flex-shrink-0"
            style={{
              background: `linear-gradient(to right, var(--primary), var(--secondary))`,
            }}
          >
            <FaWallet className="text-white h-4 w-4" />
            <span className="font-bold text-sm">
              <PriceDisplay
                amount={balance}
                originalCurrency="USD"
                className="text-white"
              />
            </span>
          </Link>
        )}
        <HeaderNotificationBox
          open={openDropdowns.notifications}
          onOpenChange={(isOpen) => handleDropdownChange('notifications', isOpen)}
        />
        <div className="hidden sm:flex items-center">
          <ThemeToggle 
            openDropdowns={openDropdowns}
            handleDropdownChange={handleDropdownChange}
          />
        </div>
        <div className="flex items-center justify-center">
          {user && <ProfileCard 
            user={user} 
            openDropdowns={openDropdowns}
            handleDropdownChange={handleDropdownChange}
          />}
        </div>
        <div className="flex items-center lg:hidden">
          <MobileSidebar />
        </div>
      </div>
    </nav>
  );
};

export default Header;