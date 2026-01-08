'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaBell,
  FaShoppingCart,
  FaWallet,
  FaTicketAlt,
  FaUserCog,
  FaCog,
  FaMoneyBillWave,
  FaPlug,
  FaBriefcase,
  FaSmileBeam,
  FaUserPlus,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaSync,
  FaEnvelope,
  FaCreditCard,
  FaArrowRight,
  FaArrowLeft,
  FaInfoCircle,
  FaGift,
  FaStar,
  FaHandPaper,
  FaKey,
  FaRocket,
  FaClock,
} from 'react-icons/fa';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface Notification {
  id: number;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  link?: string;
  createdAt?: string;
  created_at?: string;
}

interface HeaderNotificationBoxProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const HeaderNotificationBox = ({ open, onOpenChange }: HeaderNotificationBoxProps) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(5);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [seenUnreadCount, setSeenUnreadCount] = useState(0);
  const [seenNotificationIds, setSeenNotificationIds] = useState<Set<number>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('seenNotificationIds');
      if (stored) {
        try {
          const ids = JSON.parse(stored);
          return new Set(ids);
        } catch (e) {
          return new Set();
        }
      }
    }
    return new Set();
  });
  const openRef = useRef(open);
  const displayCountRef = useRef(displayCount);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async (limit: number = 5, offset: number = 0, append: boolean = false) => {
    try {
      if (!append) {
        setNotificationsLoading(true);
      }
      setNotificationsError(null);
      const response = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`);
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setNotifications(prev => {
            const newNotifications = data.notifications || [];
            if (open) {
              const newIds = newNotifications.map((n: Notification) => n.id);
              setSeenNotificationIds(prevSeen => new Set([...prevSeen, ...newIds]));
            }
            return [...prev, ...newNotifications];
          });
        } else {
          setNotifications(data.notifications || []);
        }
        setHasMore(data.hasMore || false);
        setTotalCount(data.totalCount || 0);
        setUnreadCount(data.unreadCount || 0);
      } else {
        setNotificationsError('Failed to load notifications');
        if (!append) {
          setNotifications([]);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotificationsError('Error loading notifications');
      if (!append) {
        setNotifications([]);
      }
    } finally {
      if (!append) {
        setNotificationsLoading(false);
      }
    }
  };

  const loadMoreNotifications = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const currentOffset = notifications.length;
      const response = await fetch(`/api/notifications?limit=5&offset=${currentOffset}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(prev => {
          const newNotifications = data.notifications || [];
          if (open) {
            const newIds = newNotifications.map((n: Notification) => n.id);
            setSeenNotificationIds(prevSeen => new Set([...prevSeen, ...newIds]));
          }
          return [...prev, ...newNotifications];
        });
        setHasMore(data.hasMore || false);
        setTotalCount(data.totalCount || 0);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading more notifications:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    displayCountRef.current = displayCount;
  }, [displayCount]);

  useEffect(() => {
    fetchNotifications(5, 0, false);
    fetchUnreadCount();
    
    const countInterval = setInterval(() => {
      if (!openRef.current) {
        fetchUnreadCount();
      }
    }, 1000);
    
    const notificationsInterval = setInterval(() => {
      if (!openRef.current) {
        fetchNotifications(displayCountRef.current, 0, false);
      }
    }, 5000);
    
    return () => {
      clearInterval(countInterval);
      clearInterval(notificationsInterval);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setDisplayCount(5);
      fetchNotifications(5, 0, false);
    }
  }, [open]);

  useEffect(() => {
    if (open && !notificationsLoading) {
      setSeenUnreadCount(unreadCount);
    }
  }, [open, notificationsLoading, unreadCount]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const idsArray = Array.from(seenNotificationIds);
      localStorage.setItem('seenNotificationIds', JSON.stringify(idsArray));
    }
  }, [seenNotificationIds]);

  useEffect(() => {
    if (open && notifications.length > 0 && !notificationsLoading) {
      const currentIds = new Set(notifications.map(n => n.id));
      setSeenNotificationIds(currentIds);
    }
  }, [open, notifications, notificationsLoading]);

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setSeenNotificationIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(notificationId);
          return newSet;
        });
        setUnreadCount(prev => Math.max(0, prev - 1));
        setSeenUnreadCount(prev => Math.min(prev, Math.max(0, unreadCount - 1)));
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      });
      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        setSeenNotificationIds(new Set());
        setUnreadCount(0);
        setSeenUnreadCount(0);
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const newUnreadCount = Math.max(0, unreadCount - seenUnreadCount);
  const unreadDotCount = notifications.filter(n => !n.read).length;
  const displayUnreadCount = open ? 0 : newUnreadCount;

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string, title?: string, message?: string) => {
    const titleLower = title?.toLowerCase() || '';
    const messageLower = message?.toLowerCase() || '';
    const combinedText = `${titleLower} ${messageLower}`;

    if (titleLower.includes('new contact message') || titleLower.includes('contact message')) {
      return {
        icon: FaEnvelope,
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        iconColor: 'text-yellow-600 dark:text-yellow-400'
      };
    }

    if (titleLower.includes('new support ticket') || titleLower.includes('support ticket')) {
      return {
        icon: FaTicketAlt,
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        iconColor: 'text-yellow-600 dark:text-yellow-400'
      };
    }

    if (titleLower.includes('welcome to') || titleLower.includes('welcome')) {
      return {
        icon: FaSmileBeam,
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        iconColor: 'text-purple-600 dark:text-purple-400'
      };
    }

    if (titleLower.includes('withdrawal request')) {
      if (titleLower.includes('approved') || titleLower.includes('success')) {
        return {
          icon: FaCheckCircle,
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          iconColor: 'text-green-600 dark:text-green-400'
        };
      }
      if (titleLower.includes('declined') || titleLower.includes('cancelled') || titleLower.includes('rejected')) {
        return {
          icon: FaTimesCircle,
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400'
        };
      }
      return {
        icon: FaWallet,
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        iconColor: 'text-yellow-600 dark:text-yellow-400'
      };
    }

    if (titleLower.includes('transferred to') || titleLower.includes('transferred')) {
      return {
        icon: FaArrowRight,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400'
      };
    }
    if (titleLower.includes('received from') || titleLower.includes('received')) {
      return {
        icon: FaArrowLeft,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400'
      };
    }

    if (titleLower.includes('new service added') || titleLower.includes('service added')) {
      return {
        icon: FaBriefcase,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400'
      };
    }
    if (titleLower.includes('service updated') || titleLower.includes('service update')) {
      return {
        icon: FaSync,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400'
      };
    }

    if (titleLower.includes('order') && (titleLower.includes('completed') || titleLower.includes('success'))) {
      return {
        icon: FaCheckCircle,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400'
      };
    }
    if (titleLower.includes('order') && (titleLower.includes('cancelled') || titleLower.includes('canceled'))) {
      return {
        icon: FaTimesCircle,
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400'
      };
    }
    if (titleLower.includes('order') && titleLower.includes('pending')) {
      return {
        icon: FaClock,
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        iconColor: 'text-yellow-600 dark:text-yellow-400'
      };
    }
    if (titleLower.includes('new order') || titleLower.includes('order created')) {
      return {
        icon: FaShoppingCart,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400'
      };
    }

    if (titleLower.includes('fund') && (titleLower.includes('added') || titleLower.includes('success'))) {
      return {
        icon: FaCheckCircle,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400'
      };
    }
    if (titleLower.includes('transaction') && titleLower.includes('pending')) {
      return {
        icon: FaClock,
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        iconColor: 'text-yellow-600 dark:text-yellow-400'
      };
    }
    if (titleLower.includes('transaction') && (titleLower.includes('failed') || titleLower.includes('error'))) {
      return {
        icon: FaExclamationTriangle,
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400'
      };
    }

    if (titleLower.includes('api key') || titleLower.includes('apikey')) {
      return {
        icon: FaKey,
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        iconColor: 'text-orange-600 dark:text-orange-400'
      };
    }

    if (titleLower.includes('new user') || titleLower.includes('user registered')) {
      return {
        icon: FaUserPlus,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400'
      };
    }
    if (titleLower.includes('account') || titleLower.includes('profile')) {
      return {
        icon: FaUserCog,
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        iconColor: 'text-indigo-600 dark:text-indigo-400'
      };
    }

    if (titleLower.includes('success') || titleLower.includes('completed') || titleLower.includes('approved')) {
      return {
        icon: FaCheckCircle,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400'
      };
    }

    if (titleLower.includes('error') || titleLower.includes('failed') || titleLower.includes('failure')) {
      return {
        icon: FaExclamationTriangle,
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400'
      };
    }

    if (titleLower.includes('warning') || titleLower.includes('pending') || titleLower.includes('processing')) {
      return {
        icon: FaClock,
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        iconColor: 'text-yellow-600 dark:text-yellow-400'
      };
    }

    if (titleLower.includes('info') || titleLower.includes('information')) {
      return {
        icon: FaInfoCircle,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400'
      };
    }

    const iconMap: { [key: string]: { icon: any; bgColor: string; iconColor: string } } = {
      order: { icon: FaShoppingCart, bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
      payment: { icon: FaWallet, bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
      ticket: { icon: FaTicketAlt, bgColor: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
      user: { icon: FaUserCog, bgColor: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
      system: { icon: FaPlug, bgColor: 'bg-gray-100 dark:bg-gray-900/30', iconColor: 'text-gray-600 dark:text-gray-400' },
      revenue: { icon: FaMoneyBillWave, bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
      transfer: { icon: FaArrowRight, bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
      default: { icon: FaBell, bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
    };
    return iconMap[type] || iconMap.default;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    if (notification.link) {
      onOpenChange(false);
      const titleLower = notification.title?.toLowerCase() || '';
      
      if (titleLower.includes('new contact message') || 
          titleLower.includes('contact message')) {
        let link = notification.link;
        const queryMatch = link.match(/\/admin\/contact-messages\?message=(\d+)/);
        if (queryMatch) {
          link = `/admin/contact-messages/${queryMatch[1]}`;
        }
        if (link.includes('/admin/contact-messages') && !link.match(/\/admin\/contact-messages\/\d+$/)) {
          const idMatch = link.match(/message[=:](\d+)/);
          if (idMatch) {
            link = `/admin/contact-messages/${idMatch[1]}`;
          }
        }
        window.location.href = link;
      } else if (titleLower.includes('new support ticket') || 
                 titleLower.includes('support ticket')) {
        let link = notification.link;
        const queryMatch = link.match(/\/admin\/support-tickets\?ticket=(\d+)/);
        if (queryMatch) {
          link = `/admin/tickets/${queryMatch[1]}`;
        }
        if (link.includes('/admin/tickets') || link.includes('/admin/support-tickets')) {
          const idMatch = link.match(/(\d+)$/);
          if (idMatch) {
            link = `/admin/tickets/${idMatch[1]}`;
          }
        }
        window.location.href = link;
      } else {
        router.push(notification.link);
      }
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className="h-10 w-10 sm:h-10 sm:w-10 rounded-lg header-theme-transition flex items-center justify-center hover:opacity-80 transition-all duration-200 flex-shrink-0 relative"
          style={{
            backgroundColor: 'var(--dropdown-bg)',
            border: `1px solid var(--header-border)`,
          }}
        >
          <FaBell
            className="h-4 w-4 sm:h-4 sm:w-4"
            style={{ color: 'var(--header-text)' }}
          />
          {displayUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {displayUnreadCount > 99 ? '99+' : displayUnreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 sm:w-80 header-theme-transition shadow-sm max-w-[calc(100vw-2rem)] mobile-notification-offset"
        style={{
          backgroundColor: 'var(--dropdown-bg)',
          border: `1px solid var(--header-border)`,
        }}
      >
        <div
          className="flex justify-between items-center p-3 sm:p-4"
          style={{ borderBottom: `1px solid var(--header-border)` }}
        >
          <h3
            className="text-lg sm:text-xl font-bold"
            style={{ color: 'var(--header-text)' }}
          >
            Notifications
          </h3>
          {unreadDotCount > 0 && (
            <button 
              className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              onClick={markAllAsRead}
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notificationsLoading ? (
            <div className="p-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg mb-2"
                  style={{ backgroundColor: 'var(--dropdown-hover)' }}
                >
                  <div className="w-8 h-8 rounded-full gradient-shimmer flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 w-3/4 gradient-shimmer rounded mb-1"></div>
                    <div className="h-3 w-full gradient-shimmer rounded mb-1"></div>
                    <div className="h-3 w-2/3 gradient-shimmer rounded mb-2"></div>
                    <div className="h-3 w-1/4 gradient-shimmer rounded"></div>
                  </div>
                  <div className="w-2 h-2 rounded-full gradient-shimmer flex-shrink-0 mt-2"></div>
                </div>
              ))}
            </div>
          ) : notificationsError ? (
            <div className="p-4 text-center">
              <p className="text-sm text-red-500 dark:text-red-400">{notificationsError}</p>
              <button
                onClick={() => fetchNotifications(5, 0, false)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
              >
                Retry
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center">
              <FaBell className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--header-text)', opacity: 0.3 }} />
              <p className="text-sm" style={{ color: 'var(--header-text)', opacity: 0.7 }}>
                No notifications
              </p>
            </div>
          ) : (
            <>
              <div className="p-2">
                {notifications.map((notification) => {
                  const { icon: IconComponent, bgColor, iconColor } = getNotificationIcon(notification.type || 'default', notification.title, notification.message);
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="flex items-start gap-3 p-3 rounded-lg mb-2 hover:opacity-80 transition-all duration-200 cursor-pointer"
                      style={{ backgroundColor: 'var(--dropdown-hover)' }}
                    >
                      <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`h-4 w-4 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: 'var(--header-text)' }}
                        >
                          {notification.title}
                        </p>
                        <p
                          className="text-xs mb-2"
                          style={{ color: 'var(--header-text)', opacity: 0.7 }}
                        >
                          {notification.message}
                        </p>
                        <span
                          className="text-xs"
                          style={{ color: 'var(--header-text)', opacity: 0.5 }}
                        >
                          {formatNotificationTime(notification.createdAt || notification.created_at || new Date().toISOString())}
                        </span>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  );
                })}
              </div>
              {hasMore && (
                <div
                  className="p-3 text-center border-t"
                  style={{ borderTop: `1px solid var(--header-border)` }}
                >
                  <button
                    onClick={loadMoreNotifications}
                    disabled={loadingMore}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? 'Loading...' : 'Show more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HeaderNotificationBox;