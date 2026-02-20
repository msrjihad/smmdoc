'use client';

import React, { useEffect, useState } from 'react';
import { FaTimes, FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaBullhorn } from 'react-icons/fa';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  isSticky: boolean;
  buttonEnabled: boolean;
  buttonText: string | null;
  buttonLink: string | null;
}

interface AnnouncementsProps {
  visibility?: 'dashboard' | 'all_pages';
}

const Announcements: React.FC<AnnouncementsProps> = ({ visibility }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const url = visibility 
          ? `/api/user/announcements?visibility=${visibility}`
          : '/api/user/announcements';
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          setAnnouncements(data.data);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [visibility]);

  const handleDismiss = async (id: number, isSticky: boolean) => {
    if (isSticky) {
      return;
    }

    try {
      const response = await fetch('/api/user/announcements/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: id }),
      });

      const data = await response.json();

      if (data.success) {
        setAnnouncements(prev => prev.filter(ann => ann.id !== id));
      }
    } catch (error) {
      console.error('Error dismissing announcement:', error);
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          border: 'border border-yellow-300 dark:border-yellow-700',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'critical':
        return {
          border: 'border border-red-200 dark:border-red-800',
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-800 dark:text-red-200',
          icon: 'text-red-600 dark:text-red-400',
        };
      case 'success':
        return {
          border: 'border border-green-200 dark:border-green-800',
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-800 dark:text-green-200',
          icon: 'text-green-600 dark:text-green-400',
        };
      default:
        return {
          border: 'border border-blue-200 dark:border-blue-800',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-800 dark:text-blue-200',
          icon: 'text-blue-600 dark:text-blue-400',
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <FaExclamationTriangle className="h-5 w-5" />;
      case 'critical':
        return <FaExclamationTriangle className="h-5 w-5" />;
      case 'success':
        return <FaCheckCircle className="h-5 w-5" />;
      default:
        return <FaInfoCircle className="h-5 w-5" />;
    }
  };

  if (loading) {
    return null;
  }

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {announcements.map((announcement) => {
        const styles = getTypeStyles(announcement.type);
        
        return (
          <div
            key={announcement.id}
            className={`${styles.border} ${styles.bg} ${styles.text} rounded-lg p-4 shadow-sm relative`}
          >
            <div className="flex items-start gap-3">
              <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
                {getTypeIcon(announcement.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`${styles.text} font-semibold text-lg mb-2`}>
                  {announcement.title}
                </h3>
                <p className={`${styles.text} text-sm mb-3`}>
                  {announcement.content}
                </p>
                
                {announcement.buttonEnabled && announcement.buttonText && announcement.buttonLink && (
                  <a
                    href={announcement.buttonLink}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      announcement.type === 'critical'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : announcement.type === 'warning'
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : announcement.type === 'success'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {announcement.buttonText}
                  </a>
                )}
              </div>

              {!announcement.isSticky && (
                <button
                  onClick={() => handleDismiss(announcement.id, announcement.isSticky)}
                  className={`${styles.icon} hover:opacity-70 transition-opacity flex-shrink-0 p-1 self-start`}
                  aria-label="Dismiss announcement"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Announcements;

