'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaBell,
  FaShoppingCart,
  FaWallet,
  FaTicketAlt,
  FaUserCog,
  FaCog,
  FaMoneyBillWave,
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        setNotificationsError('Failed to load notifications');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotificationsError('Error loading notifications');
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

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
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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

  const getNotificationIcon = (type: string) => {
    const iconMap: { [key: string]: { icon: any; bgColor: string; iconColor: string } } = {
      order: { icon: FaShoppingCart, bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
      payment: { icon: FaWallet, bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
      ticket: { icon: FaTicketAlt, bgColor: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
      user: { icon: FaUserCog, bgColor: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
      system: { icon: FaCog, bgColor: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
      revenue: { icon: FaMoneyBillWave, bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
      default: { icon: FaBell, bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
    };
    return iconMap[type] || iconMap.default;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
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
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 sm:w-80 header-theme-transition shadow-sm max-w-[calc(100vw-2rem)]"
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
          {unreadCount > 0 && (
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
                onClick={fetchNotifications}
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
            <div className="p-2">
              {notifications.map((notification) => {
                const { icon: IconComponent, bgColor, iconColor } = getNotificationIcon(notification.type || 'default');
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
          )}
        </div>

        {notifications.length > 0 && (
          <div
            className="p-3 text-center border-t"
            style={{ borderTop: `1px solid var(--header-border)` }}
          >
            <Link
              href="/notifications"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              See all notifications
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HeaderNotificationBox;