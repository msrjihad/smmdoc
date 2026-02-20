'use client'
import React, { useEffect, useState } from 'react';
import { FaShoppingCart, FaServer, FaUsers, FaShareAlt } from 'react-icons/fa';
import { logger } from '@/lib/utils/logger';
import {
  getCachedHomepageStatsFromBrowser,
  setHomepageStatsInBrowser,
} from '@/lib/homepage-stats-browser-cache';

interface CounterItem {
  iconName: string;
  title: string;
  count: string;
}
const counterData: CounterItem[] = [
  { iconName: 'FaShoppingCart', title: 'Order Completed', count: '0' },
  { iconName: 'FaServer', title: 'Active Services', count: '0' },
  { iconName: 'FaUsers', title: 'Users using our services', count: '0' },
  { iconName: 'FaShareAlt', title: 'Affiliate Users', count: '0' },
];

const iconMap = {
  FaShoppingCart: FaShoppingCart,
  FaServer: FaServer,
  FaUsers: FaUsers,
  FaShareAlt: FaShareAlt,
};

export default function Statistics() {
  const [counts, setCounts] = useState<{
    completedOrders: number;
    activeServices: number;
    activeUsers: number;
    activeAffiliateUsers: number;
    totalOrders: number;
    totalUsers: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const cached = getCachedHomepageStatsFromBrowser();
      if (cached) {
        setCounts(cached);
        return;
      }

      try {
        const res = await fetch('/api/homepage/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        
        const json = await res.json();
        
        if (!res.ok || !json.success) {
          logger.error('Statistics: API error response', { response: json });
          throw new Error(json.error || 'Failed to load homepage stats');
        }
        
        const data = json.data;
        if (data && typeof data === 'object') {
          setHomepageStatsInBrowser(data);
          setCounts(data);
        }
      } catch (err: any) {
        logger.error('Statistics: Error fetching stats', err);
        setError(err.message || 'Failed to load stats');
      }
    };

    fetchStats();
  }, []);

  const dynamicCounterData: CounterItem[] = counterData.map((item) => {
    let countValue = item.count;
    if (counts) {
      if (item.title === 'Order Completed') {
        const value = typeof counts.completedOrders === 'number' ? counts.completedOrders : 0;
        countValue = value.toString();
      } else if (item.title === 'Active Services') {
        const value = typeof counts.activeServices === 'number' ? counts.activeServices : 0;
        countValue = value.toString();
      } else if (item.title === 'Users using our services') {
        const value = typeof counts.activeUsers === 'number' ? counts.activeUsers : 0;
        countValue = `${value.toLocaleString()}+`;
      } else if (item.title === 'Affiliate Users') {
        const value = typeof counts.activeAffiliateUsers === 'number' ? counts.activeAffiliateUsers : 0;
        countValue = value.toString();
      }
    }
    return { ...item, count: countValue };
  });

  return (
    <section className="pt-[30px] pb-[30px] lg:pt-[60px] lg:pb-[60px] transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto px-4">
        {error && (
          <div className="mb-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {dynamicCounterData.map((item, index) => {
            const IconComponent = iconMap[item.iconName as keyof typeof iconMap];
            return (
              <div
                key={index}
                className="text-center group"
                data-aos="fade-up"
                data-aos-duration="500"
                data-aos-delay={index * 100}
              >
                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg hover:shadow-xl dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:scale-105 group-hover:-translate-y-1">
                  {IconComponent && (
                    <IconComponent className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  )}
                </div>
                <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-semibold mb-1 transition-colors duration-200">
                  {item.title}
                </p>
                <h4 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
                  {item.count}
                </h4>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}