'use client';
import { adminNavItems } from '@/data/sidebar-nav/admin-nav-items';
import { userNavItems } from '@/data/sidebar-nav/user-nav-items';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { Session } from 'next-auth';
import * as FaIcons from 'react-icons/fa';
import { filterNavItemsByPermissions } from '@/lib/permissions';

interface NavItem {
  title: string;
  href: string;
  icon: string;
  label: string;
  roles: string[];
  permission?: string;
  badge?: string;
  statusColor?: string;
  disabled?: boolean;
  isLogout?: boolean;
}

interface AdminSections {
  dashboard: NavItem[];
  orders: NavItem[];
  services: NavItem[];
  managements: NavItem[];
  funds: NavItem[];
  transactions: NavItem[];
  support: NavItem[];
  posts: NavItem[];
  affiliates: NavItem[];
  additional: NavItem[];
  reseller: NavItem[];
  media: NavItem[];
  settings: NavItem[];
  emailSettings: NavItem[];
  security: NavItem[];
  account: NavItem[];
  [key: string]: NavItem[];
}

interface UserSections {
  core: NavItem[];
  orders: NavItem[];
  services: NavItem[];
  funds: NavItem[];
  support: NavItem[];
  integrations: NavItem[];
  affiliate: NavItem[];
  more: NavItem[];
  account: NavItem[];
  [key: string]: NavItem[];
}

interface SideBarNavProps {
  collapsed?: boolean;
  session?: Session | null;
  setOpen?: () => void;
  skipSkeleton?: boolean;
}

export default function SideBarNav({
  collapsed = false,
  session,
  setOpen = () => {},
  skipSkeleton = false,
}: SideBarNavProps) {
  const path = usePathname() || '';
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'moderator';
  const [ticketSystemEnabled, setTicketSystemEnabled] = useState(true);
  const [contactSystemEnabled, setContactSystemEnabled] = useState(true);
  const [affiliateSystemEnabled, setAffiliateSystemEnabled] = useState(true);
  const [childPanelSellingEnabled, setChildPanelSellingEnabled] = useState(true);
  const [massOrderEnabled, setMassOrderEnabled] = useState(true);
  const [serviceUpdateLogsEnabled, setServiceUpdateLogsEnabled] = useState(true);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  const sectionIcons: Record<string, string> = {
    'Orders': 'FaBox',
    'Services': 'FaBriefcase',
    'Managements': 'FaUsers',
    'Funds': 'FaDollarSign',
    'Transactions': 'FaExchangeAlt',
    'Support': 'FaTicketAlt',
    'Posts': 'FaRegNewspaper',
    'Affiliates': 'FaShareAlt',
    'Additional': 'FaChartBar',
    'Reseller Panels': 'FaSitemap',
    'Media': 'FaImages',
    'Settings': 'FaCog',
    'Email Settings': 'FaEnvelope',
    'Security': 'FaLock',
    'Account': 'FaUserCog',
    'Integrations': 'FaPlug',
    'Affiliate': 'FaShareAlt',
    'More': 'FaEllipsisH',
  };
  
  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  useEffect(() => {
    const fetchTicketSettings = async () => {
      try {
        const response = await fetch('/api/ticket-system-status');
        if (response.ok) {
          const data = await response.json();
          setTicketSystemEnabled(data.ticketSystemEnabled ?? true);
        }
      } catch (error) {
        console.error('Error fetching ticket settings:', error);

        setTicketSystemEnabled(true);
      }
    };

    fetchTicketSettings();
  }, []);

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const response = await fetch('/api/contact-system-status');
        if (response.ok) {
          const data = await response.json();
          setContactSystemEnabled(data.contactSystemEnabled ?? true);
        }
      } catch (error) {
        console.error('Error fetching contact settings:', error);

        setContactSystemEnabled(true);
      }
    };

    fetchContactSettings();
  }, []);

  useEffect(() => {
    const fetchAffiliateSettings = async () => {
      try {
        const response = await fetch('/api/affiliate-system-status');
        if (response.ok) {
          const data = await response.json();
          setAffiliateSystemEnabled(data.affiliateSystemEnabled ?? false);
        }
      } catch (error) {
        console.error('Error fetching affiliate settings:', error);

        setAffiliateSystemEnabled(false);
      }
    };

    fetchAffiliateSettings();
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
        console.error('Error fetching child panel settings:', error);

        setChildPanelSellingEnabled(false);
      }
    };

    fetchChildPanelSettings();
  }, []);

  useEffect(() => {
    const fetchMassOrderSettings = async () => {
      try {
        const response = await fetch('/api/mass-order-system-status');
        if (response.ok) {
          const data = await response.json();
          setMassOrderEnabled(data.massOrderEnabled ?? false);
        }
      } catch (error) {
        console.error('Error fetching mass order settings:', error);

        setMassOrderEnabled(false);
      }
    };

    fetchMassOrderSettings();
  }, []);

  useEffect(() => {
    const fetchServiceUpdateLogsSettings = async () => {
      try {
        const response = await fetch('/api/service-update-logs-status');
        if (response.ok) {
          const data = await response.json();
          setServiceUpdateLogsEnabled(data.serviceUpdateLogsEnabled ?? true);
        }
      } catch (error) {
        console.error('Error fetching service update logs settings:', error);

        setServiceUpdateLogsEnabled(true);
      }
    };

    fetchServiceUpdateLogsSettings();
  }, []);

  const items = useMemo(() => {
    if (!isAdmin) {
      return userNavItems.filter((item: NavItem) =>
        item.roles.includes(session?.user?.role || 'user')
      );
    }

    const userRole = session?.user?.role || 'user';
    const userPermissions = (session?.user as any)?.permissions as string[] | null | undefined;
    
    let filteredItems = adminNavItems.filter((item: NavItem) => {
      if (userRole === 'admin' || userRole === 'super_admin') {
        return true;
      }
      
      if (userRole === 'moderator') {
        if (item.href === '/admin' || item.href === '/admin/') {
          return true;
        }
        
        if (item.permission) {
          const permissionsArray = Array.isArray(userPermissions) ? userPermissions : [];
          return permissionsArray.includes(item.permission);
        }
        
        return false;
      }
      
      return false;
    });

    return filteredItems;
  }, [isAdmin, session?.user?.role, (session?.user as any)?.permissions]);

  const sections = useMemo<AdminSections | UserSections>(() => {
    if (isAdmin) {

      return {
        dashboard: items.filter((item) => ['Dashboard'].includes(item.title)),
        orders: items.filter((item) =>
          [
            'All Orders',
            'Refill Requests',
            'Cancel Requests',
          ].includes(item.title)
        ),
        services: items.filter((item) =>
          [
            'All Services',
            'Import Services',
            'Service Types',
            'Modify Bulk Services',
            'Update Price',
            'API Sync Logs',
          ].includes(item.title)
        ),
        managements: items.filter((item) =>
          [
            'Users',
            'Admins',
            'Moderators',
            'User Activity Logs',
          ].includes(item.title)
        ),
        funds: items.filter((item) =>
          [
            'Add Funds',
            'Transfer Funds',
          ].includes(item.title)
        ),
        transactions: items.filter((item) =>
          [
            'All Transactions',
          ].includes(item.title)
        ),
        support: items.filter((item) => {
          const supportItems = ['Support Tickets', 'Contact Messages'];
          if (!ticketSystemEnabled && item.title === 'Support Tickets') {
            return false;
          }
          if (!contactSystemEnabled && item.title === 'Contact Messages') {
            return false;
          }
          return supportItems.includes(item.title);
        }),
        posts: items.filter((item) =>
          ['Blogs', 'Announcements'].includes(item.title)
        ),
        affiliates: items.filter((item) => {
          const affiliateItems = ['Affiliate Users', 'Withdrawals'];
          if (!affiliateSystemEnabled && affiliateItems.includes(item.title)) {
            return false;
          }
          return affiliateItems.includes(item.title);
        }),
        additional: items.filter((item) =>
          ['Analytics & Reports'].includes(item.title)
        ),
        reseller: items.filter((item) => {
          const resellerItems = ['Child Panels'];
          if (!childPanelSellingEnabled && item.title === 'Child Panels') {
            return false;
          }
          return resellerItems.includes(item.title);
        }),
        media: items.filter((item) => ['Media'].includes(item.title)),
        settings: items.filter((item) =>
          [
            'General Settings',
            'Providers',
            'Payment Gateway',
            'Payment Currency',
            'Notification Settings',
            'Integrations',
            'Custom Codes',
          ].includes(item.title)
        ),
        emailSettings: items.filter((item) =>
          ['SMTP Configuration', 'Email Templates'].includes(item.title)
        ),
        security: items.filter((item) =>
          [
            'Security Settings',
            'Two Factor Authentication',
          ].includes(item.title)
        ),
        account: items.filter((item) =>
          ['Account Settings', 'Logout'].includes(item.title)
        ),
      } as AdminSections;
    } else {

      return {
        core: items.filter((item) => ['Dashboard'].includes(item.title)),
        orders: items.filter((item) => {
          const orderItems = ['New Order', 'Mass Orders', 'My Orders'];
          if (!massOrderEnabled && item.title === 'Mass Orders') {
            return false;
          }
          return orderItems.includes(item.title);
        }),
        services: items.filter((item) => {
          const serviceItems = ['All Services', 'Favorite Services', 'Service Updates'];
          if (!serviceUpdateLogsEnabled && item.title === 'Service Updates') {
            return false;
          }
          return serviceItems.includes(item.title);
        }),
        funds: items.filter((item) =>
          ['Add Funds', 'Transfer Funds', 'Transactions'].includes(item.title)
        ),
        support: items.filter((item) => {
          const supportItems = [
            'Support Tickets',
            'Tickets History',
            'Contact Support',
          ];
          if (!ticketSystemEnabled && (item.title === 'Support Tickets' || item.title === 'Tickets History')) {
            return false;
          }
          if (!contactSystemEnabled && item.title === 'Contact Support') {
            return false;
          }
          return supportItems.includes(item.title);
        }),
        integrations: items.filter((item) => {
          const integrationItems = ['API Integration', 'Child Panel'];
          if (!childPanelSellingEnabled && item.title === 'Child Panel') {
            return false;
          }
          return integrationItems.includes(item.title);
        }),
        affiliate: items.filter((item) => {
          const affiliateItems = ['Affiliate Program', 'Withdrawals'];
          if (!affiliateSystemEnabled && (item.title === 'Affiliate Program' || item.title === 'Withdrawals')) {
            return false;
          }
          return affiliateItems.includes(item.title);
        }),
        more: items.filter((item) => {
          const moreItems = ['FAQs', 'Terms'];
          return moreItems.includes(item.title);
        }),
        account: items.filter((item) =>
          ['Account Settings', 'Logout'].includes(item.title)
        ),
      } as UserSections;
    }
  }, [isAdmin, items, ticketSystemEnabled, contactSystemEnabled, affiliateSystemEnabled, childPanelSellingEnabled, massOrderEnabled, serviceUpdateLogsEnabled]);

  const isActive = (itemPath: string) => {

    if (path === itemPath) return true;

    if (itemPath === '/' && path === '/') return true;

    if (path.startsWith(itemPath + '/')) {

      const allItems = Object.values(sections).flat() as NavItem[];
      const hasMoreSpecificMatch = allItems.some((item) => {
        return (
          item.href !== itemPath &&
          item.href.startsWith(itemPath) &&
          (path === item.href || path.startsWith(item.href + '/'))
        );
      });

      return !hasMoreSpecificMatch;
    }

    return false;
  };

  const renderIcon = useMemo(() => {
    return (iconName: string) => {
      const Icon = (FaIcons as Record<string, React.ComponentType>)[iconName];
      return Icon ? <Icon /> : null;
    };
  }, []);

  const renderNavSection = (title: string, sectionItems: NavItem[]) => {
    if (!sectionItems || !sectionItems.length) return null;

    const isSingleItem = sectionItems.length === 1;
    const sectionIcon = title ? sectionIcons[title] : null;
    const isExpanded = title ? (expandedSections[title] === true) : true;

    if (collapsed) {
      return (
        <ul className="nav-links space-y-0">
          {sectionItems.map((item, index) => {
            const active = isActive(item.href);

            const handleClick = async () => {
              if (item.isLogout) {
                try {
                  const { performCompleteLogout } = await import('@/lib/logout-helper');
                  await performCompleteLogout(signOut, '/');
                } catch (error) {
                  console.error('Logout failed:', error);
                  const { clearAllSessionData } = await import('@/lib/logout-helper');
                  clearAllSessionData();
                  window.location.href = '/';
                }
              } else {
                setOpen();
              }
            };

            return (
              <li key={index} className="nav-item relative group">
                <div
                  className={cn(
                    'absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--primary)] to-[var(--secondary)] z-10 transition-opacity duration-200',
                    active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                ></div>

                {item.isLogout ? (
                  <button
                    onClick={handleClick}
                    className={cn(
                      'flex items-center transition-all duration-200 relative group justify-center py-3 px-0 w-full',
                      'text-slate-300 hover:text-white hover:bg-slate-700/50',
                      item.disabled &&
                        'opacity-50 pointer-events-none cursor-not-allowed'
                    )}
                    title={item.title}
                  >
                    <span
                      className={cn(
                        'flex items-center justify-center transition-colors duration-200 text-lg',
                        'text-slate-400 group-hover:text-white'
                      )}
                    >
                      {renderIcon(item.icon)}
                    </span>
                  </button>
                ) : (
                  <Link
                    href={item.disabled ? '/' : item.href}
                    className={cn(
                      'flex items-center transition-all duration-200 relative group justify-center py-3 px-0',
                      active
                        ? 'bg-slate-700/50 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50',
                      item.disabled &&
                        'opacity-50 pointer-events-none cursor-not-allowed'
                    )}
                    onClick={handleClick}
                    title={item.title}
                  >
                    <span
                      className={cn(
                        'flex items-center justify-center transition-colors duration-200 text-lg',
                        active
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-white'
                      )}
                    >
                      {renderIcon(item.icon)}
                    </span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      );
    }

    const hasActiveSubmenu = sectionItems.some(item => isActive(item.href));
    
    return (
      <div className="nav-section px-0">
        {title && !isSingleItem ? (
          <button
            onClick={() => toggleSection(title)}
            className={cn(
              "w-full flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 group relative",
              hasActiveSubmenu && !isExpanded
                ? "text-white bg-slate-700/50"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            )}
          >
            {!isExpanded && (
              <div
                className={cn(
                  'absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--primary)] to-[var(--secondary)] z-10 transition-opacity duration-200',
                  hasActiveSubmenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
              ></div>
            )}
            {isExpanded && (
              <div
                className={cn(
                  'absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--primary)] to-[var(--secondary)] z-10 transition-opacity duration-200',
                  'opacity-0 group-hover:opacity-100'
                )}
              ></div>
            )}
            {sectionIcon && (
              <span className={cn(
                "flex items-center justify-center text-lg mr-3 transition-colors duration-200",
                hasActiveSubmenu && !isExpanded
                  ? "text-white"
                  : "text-slate-400 group-hover:text-white"
              )}>
                {renderIcon(sectionIcon)}
              </span>
            )}
            <span className="flex-1 text-left capitalize tracking-wide">{title}</span>
            <span className={cn(
              "text-xs text-white/50 transition-transform duration-150 flex items-center",
              isExpanded ? "rotate-90" : "rotate-0"
            )}>
              {renderIcon('FaChevronRight')}
            </span>
          </button>
        ) : title && isSingleItem ? (
          null
        ) : null}
        
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isSingleItem || isExpanded 
              ? "max-h-[5000px] opacity-100" 
              : "max-h-0 opacity-0"
          )}
          style={{
            transitionProperty: 'max-height, opacity',
          }}
        >
          <ul className="nav-links space-y-0">
            {sectionItems.map((item, index) => {
              const active = isActive(item.href);

              const handleClick = async () => {
                if (item.isLogout) {
                  try {
                    const { performCompleteLogout } = await import('@/lib/logout-helper');
                    await performCompleteLogout(signOut, '/');
                  } catch (error) {
                    console.error('Logout failed:', error);
                    const { clearAllSessionData } = await import('@/lib/logout-helper');
                    clearAllSessionData();
                    window.location.href = '/';
                  }
                } else {
                  setOpen();
                }
              };

              const useDiscIcon = !isSingleItem && title;
              const iconToUse = useDiscIcon ? 'FaCircle' : item.icon;
              const isSubmenuItem = !isSingleItem && title;

              return (
                <li key={index} className="nav-item relative group">
                  {isSubmenuItem && (
                    <>
                      <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-500/20"></div>
                      <div 
                        className={cn(
                          "absolute left-[29.5px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-colors duration-200 z-20",
                          active ? "bg-white" : "bg-slate-400/40 group-hover:bg-white"
                        )}
                        style={active ? { backgroundColor: 'rgb(255, 255, 255)' } : undefined}
                      ></div>
                    </>
                  )}
                  
                  {!isSubmenuItem && (
                    <div
                      className={cn(
                        'absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--primary)] to-[var(--secondary)] z-10 transition-opacity duration-200',
                        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}
                    ></div>
                  )}

                  {item.isLogout ? (
                    <button
                      onClick={handleClick}
                      className={cn(
                        isSubmenuItem
                          ? 'flex items-center pl-12 pr-4 py-2.5 ml-2 mr-2 transition-all duration-200 relative group w-full text-left rounded-md'
                          : 'flex items-center px-6 py-3 transition-all duration-200 relative group w-full text-left',
                        'text-slate-300 hover:text-white hover:bg-slate-700/50',
                        item.disabled &&
                          'opacity-50 pointer-events-none cursor-not-allowed'
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      {!isSubmenuItem && (
                        <span
                          className={cn(
                            'flex items-center justify-center transition-colors duration-200 text-lg mr-3',
                            'text-slate-400 group-hover:text-white'
                          )}
                        >
                          {renderIcon(item.icon)}
                        </span>
                      )}
                      <span
                        className={cn(
                          isSubmenuItem
                            ? 'text-sm font-medium transition-all duration-200 capitalize'
                            : 'text-sm font-medium transition-all duration-200 opacity-100',
                          'text-slate-300 group-hover:text-white'
                        )}
                      >
                        {item.title}
                      </span>
                    </button>
                  ) : (
                    <Link
                      href={item.disabled ? '/' : item.href}
                      className={cn(
                        isSubmenuItem
                          ? 'flex items-center pl-12 pr-4 py-2.5 ml-2 mr-2 transition-all duration-200 relative group rounded-md'
                          : 'flex items-center px-6 py-3 transition-all duration-200 relative group',
                        active
                          ? isSubmenuItem
                            ? 'bg-slate-700/70 text-white shadow-sm'
                            : 'bg-slate-700/50 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/50',
                        item.disabled &&
                          'opacity-50 pointer-events-none cursor-not-allowed'
                      )}
                      onClick={handleClick}
                      title={collapsed ? item.title : undefined}
                    >
                      {!isSubmenuItem && (
                        <span
                          className={cn(
                            'flex items-center justify-center transition-colors duration-200 text-lg mr-3',
                            active
                              ? 'text-white'
                              : 'text-slate-400 group-hover:text-white'
                          )}
                        >
                          {renderIcon(item.icon)}
                        </span>
                      )}
                      <span
                        className={cn(
                          isSubmenuItem
                            ? 'text-sm font-medium transition-all duration-200 capitalize'
                            : 'text-sm font-medium transition-all duration-200 opacity-100',
                          active
                            ? 'text-white'
                            : 'text-slate-300 group-hover:text-white'
                        )}
                      >
                        {item.title}
                      </span>
                      {item.badge && (
                        <div className="badge ml-auto py-1 px-2 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          {item.badge}
                        </div>
                      )}
                      {item.statusColor && (
                        <div className="ml-auto">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              item.statusColor === 'green' &&
                                'bg-green-400 shadow-green-400/50',
                              item.statusColor === 'red' &&
                                'bg-red-400 shadow-red-400/50',
                              item.statusColor === 'yellow' &&
                                'bg-yellow-400 shadow-yellow-400/50'
                            )}
                            style={{
                              boxShadow: `0 0 8px ${
                                item.statusColor === 'green'
                                  ? 'rgba(34, 197, 94, 0.6)'
                                  : item.statusColor === 'red'
                                  ? 'rgba(239, 68, 68, 0.6)'
                                  : 'rgba(245, 158, 11, 0.6)'
                              }`,
                            }}
                          />
                        </div>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (skipSkeleton) {
      setIsLoading(false);
      return;
    }
    if (session?.user) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true);
    }
  }, [session, skipSkeleton]);

  if (!skipSkeleton && (!session?.user || isLoading)) {
    return (
      <div className="sidebar-nav-container">
        <div className="py-2">
          {Array.from({ length: 8 }).map((_, sectionIndex) => (
            <div key={sectionIndex} className="nav-section mb-4 px-0">
              <div className="h-4 w-20 bg-slate-700/50 animate-pulse rounded mx-4 mt-6 mb-2 ml-6"></div>
              <ul className="nav-links space-y-0">
                {Array.from({ length: 3 }).map((_, itemIndex) => (
                  <li key={itemIndex} className="nav-item relative">
                    <div className="flex items-center px-8 py-3">
                      <div className="w-5 h-5 bg-slate-700/50 animate-pulse rounded mr-3"></div>
                      <div className="h-4 w-32 bg-slate-700/50 animate-pulse rounded"></div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getSectionItems = (sectionKey: keyof (AdminSections | UserSections)): NavItem[] => {
    return sections[sectionKey] || [];
  };

  const accountItems = getSectionItems('account');
  const logoutItem = accountItems.find(item => item.isLogout);
  const accountSettingsItem = accountItems.find(item => item.title === 'Account Settings');
  const accountItemsWithoutLogoutAndSettings = accountItems.filter(item => !item.isLogout && item.title !== 'Account Settings');

  const renderBottomMenuItem = (item: NavItem, isLogout: boolean = false) => {
    const active = isActive(item.href);

    const handleClick = async () => {
      if (isLogout) {
        try {
          const { performCompleteLogout } = await import('@/lib/logout-helper');
          await performCompleteLogout(signOut, '/');
        } catch (error) {
          console.error('Logout failed:', error);
          const { clearAllSessionData } = await import('@/lib/logout-helper');
          clearAllSessionData();
          window.location.href = '/';
        }
      } else {
        setOpen();
      }
    };

    const displayTitle = item.title === 'Account Settings' ? 'Profile' : item.title;

    if (collapsed) {
      return (
        <button
          onClick={handleClick}
          className="flex items-center transition-all duration-200 relative group justify-center py-3 px-0 w-full text-slate-300 hover:text-white hover:bg-slate-700/50"
          title={displayTitle}
        >
          <span className="flex items-center justify-center transition-colors duration-200 text-lg text-slate-400 group-hover:text-white">
            {renderIcon(item.icon)}
          </span>
        </button>
      );
    }

    if (isLogout) {
      return (
        <button
          onClick={handleClick}
          className="flex items-center px-6 py-3 transition-all duration-200 relative group w-full text-left text-slate-300 hover:text-white hover:bg-slate-700/50"
          title={displayTitle}
        >
          <div
            className={cn(
              'absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--primary)] to-[var(--secondary)] z-10 transition-opacity duration-200',
              'opacity-0 group-hover:opacity-100'
            )}
          ></div>
          <span className="flex items-center justify-center transition-colors duration-200 text-lg mr-3 text-slate-400 group-hover:text-white">
            {renderIcon(item.icon)}
          </span>
          <span className="text-sm font-medium transition-all duration-200 opacity-100 text-slate-300 group-hover:text-white">
            {displayTitle}
          </span>
        </button>
      );
    }

    return (
      <Link
        href={item.href}
        onClick={handleClick}
        className={cn(
          "flex items-center px-6 py-3 transition-all duration-200 relative group w-full text-left",
          active
            ? "bg-slate-700/50 text-white"
            : "text-slate-300 hover:text-white hover:bg-slate-700/50"
        )}
        title={displayTitle}
      >
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--primary)] to-[var(--secondary)] z-10 transition-opacity duration-200',
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        ></div>
        <span className={cn(
          "flex items-center justify-center transition-colors duration-200 text-lg mr-3",
          active
            ? "text-white"
            : "text-slate-400 group-hover:text-white"
        )}>
          {renderIcon(item.icon)}
        </span>
        <span className={cn(
          "text-sm font-medium transition-all duration-200 opacity-100",
          active
            ? "text-white"
            : "text-slate-300 group-hover:text-white"
        )}>
          {displayTitle}
        </span>
      </Link>
    );
  };

  return (
    <div className="sidebar-nav-container">
      <div className="py-2">
        {isAdmin ? (
          <>
            {renderNavSection('', getSectionItems('dashboard'))}
            {renderNavSection('Orders', getSectionItems('orders'))}
            {renderNavSection('Services', getSectionItems('services'))}
            {renderNavSection('Managements', getSectionItems('managements'))}
            {renderNavSection('Funds', getSectionItems('funds'))}
            {renderNavSection('Transactions', getSectionItems('transactions'))}
            {renderNavSection('Support', getSectionItems('support'))}
            {renderNavSection('Posts', getSectionItems('posts'))}
            {renderNavSection('Affiliates', getSectionItems('affiliates'))}
            {renderNavSection('Additional', getSectionItems('additional'))}
            {renderNavSection('Reseller Panels', getSectionItems('reseller'))}
            {renderNavSection('Media', getSectionItems('media'))}
            {renderNavSection('Settings', getSectionItems('settings'))}
            {renderNavSection('Email Settings', getSectionItems('emailSettings'))}
            {renderNavSection('Security', getSectionItems('security'))}
            {renderNavSection('Account', accountItemsWithoutLogoutAndSettings)}
          </>
        ) : (
          <>
            {renderNavSection('', getSectionItems('core'))}
            {renderNavSection('Orders', getSectionItems('orders'))}
            {renderNavSection('Services', getSectionItems('services'))}
            {renderNavSection('Funds', getSectionItems('funds'))}
            {renderNavSection('Support', getSectionItems('support'))}
            {renderNavSection('Integrations', getSectionItems('integrations'))}
            {renderNavSection('Affiliate', getSectionItems('affiliate'))}
            {renderNavSection('More', getSectionItems('more'))}
            {renderNavSection('Account', accountItemsWithoutLogoutAndSettings)}
          </>
        )}
      </div>
    </div>
  );
}

export function SidebarFooter({
  collapsed = false,
  session,
  setOpenAction = () => {},
}: {
  collapsed?: boolean;
  session?: Session | null;
  setOpenAction?: () => void;
}) {
  const path = usePathname() || '';
  
  const renderIcon = useMemo(() => {
    return (iconName: string) => {
      const Icon = (FaIcons as Record<string, React.ComponentType>)[iconName];
      return Icon ? <Icon /> : null;
    };
  }, []);

  const isActive = (itemPath: string) => {
    if (path === itemPath) return true;
    if (itemPath === '/' && path === '/') return true;
    return false;
  };

  const accountItems = useMemo(() => {
    const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'moderator';
    const items = isAdmin ? adminNavItems : userNavItems;
    return items.filter((item: NavItem) => 
      item.title === 'Account Settings' || item.isLogout
    );
  }, [session?.user?.role]);

  const accountSettingsItem = accountItems.find(item => item.title === 'Account Settings');
  const logoutItem = accountItems.find(item => item.isLogout);

  const renderBottomMenuItem = (item: NavItem, isLogout: boolean = false) => {
    const active = isActive(item.href);

    const handleClick = async () => {
      if (isLogout) {
        try {
          const { performCompleteLogout } = await import('@/lib/logout-helper');
          await performCompleteLogout(signOut, '/');
        } catch (error) {
          console.error('Logout failed:', error);
          const { clearAllSessionData } = await import('@/lib/logout-helper');
          clearAllSessionData();
          window.location.href = '/';
        }
      } else {
        setOpenAction();
      }
    };

    const displayTitle = item.title === 'Account Settings' ? 'Profile' : item.title;

    if (collapsed) {
      return (
        <button
          onClick={handleClick}
          className="flex items-center transition-all duration-200 relative group justify-center py-3 px-0 w-full text-slate-300 hover:text-white hover:bg-slate-700/50"
          title={displayTitle}
        >
          <span className="flex items-center justify-center transition-colors duration-200 text-lg text-slate-400 group-hover:text-white">
            {renderIcon(item.icon)}
          </span>
        </button>
      );
    }

    if (isLogout) {
      return (
        <button
          onClick={handleClick}
          className="flex items-center px-6 py-3 transition-all duration-200 relative group w-full text-left text-slate-300 hover:text-white hover:bg-slate-700/50"
          title={displayTitle}
        >
          <div
            className={cn(
              'absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--primary)] to-[var(--secondary)] z-10 transition-opacity duration-200',
              'opacity-0 group-hover:opacity-100'
            )}
          ></div>
          <span className="flex items-center justify-center transition-colors duration-200 text-lg mr-3 text-slate-400 group-hover:text-white">
            {renderIcon(item.icon)}
          </span>
          <span className="text-sm font-medium transition-all duration-200 opacity-100 text-slate-300 group-hover:text-white">
            {displayTitle}
          </span>
        </button>
      );
    }

    return (
      <Link
        href={item.href}
        onClick={handleClick}
        className={cn(
          "flex items-center px-6 py-3 transition-all duration-200 relative group w-full text-left",
          active
            ? "bg-slate-700/50 text-white"
            : "text-slate-300 hover:text-white hover:bg-slate-700/50"
        )}
        title={displayTitle}
      >
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--primary)] to-[var(--secondary)] z-10 transition-opacity duration-200',
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        ></div>
        <span className={cn(
          "flex items-center justify-center transition-colors duration-200 text-lg mr-3",
          active
            ? "text-white"
            : "text-slate-400 group-hover:text-white"
        )}>
          {renderIcon(item.icon)}
        </span>
        <span className={cn(
          "text-sm font-medium transition-all duration-200 opacity-100",
          active
            ? "text-white"
            : "text-slate-300 group-hover:text-white"
        )}>
          {displayTitle}
        </span>
      </Link>
    );
  };

  if (!accountSettingsItem && !logoutItem) return null;

  return (
    <div className={`sidebar-footer ${
      collapsed ? 'py-1 flex-col space-y-2' : 'py-1'
    } flex items-center border-t border-slate-700/50`}>
      {collapsed ? (
        <>
          {accountSettingsItem && (
            <div className="w-full">
              {renderBottomMenuItem(accountSettingsItem)}
            </div>
          )}
          {logoutItem && (
            <div className="w-full">
              {renderBottomMenuItem(logoutItem, true)}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col w-full space-y-0">
            {accountSettingsItem && renderBottomMenuItem(accountSettingsItem)}
            {logoutItem && (
              <div className="border-t border-slate-700/50">
                {renderBottomMenuItem(logoutItem, true)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

SideBarNav.displayName = 'SideBarNav';