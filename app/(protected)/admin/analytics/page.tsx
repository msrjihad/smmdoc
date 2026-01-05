'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FaChartLine,
  FaDollarSign,
  FaShoppingCart,
  FaCalendar,
  FaCog,
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import { PriceDisplay } from '@/components/price-display';
import { useCurrency } from '@/contexts/currency-context';
import { convertCurrency, formatCurrencyAmount } from '@/lib/currency-utils';

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendingDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChartSkeleton = () => {
  return (
    <div className="relative h-80 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="absolute inset-4 flex flex-col justify-between">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="border-t border-gray-200 dark:border-gray-700 border-dashed w-full"></div>
        ))}
      </div>
      <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-between">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 w-12 gradient-shimmer rounded mr-2"></div>
        ))}
      </div>
      <div className="absolute left-12 right-4 bottom-8 top-4 flex items-end justify-between gap-1">
        {Array.from({ length: 12 }).map((_, index) => {
          const heights = [65, 70, 55, 80, 75, 85, 90, 70, 65, 88, 92, 95];
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full gradient-shimmer rounded-t-sm"
                style={{ height: `${heights[index]}%` }}
              ></div>
            </div>
          );
        })}
      </div>
      <div className="absolute left-12 right-4 bottom-0 flex justify-between">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="flex-1 text-center">
            <div className="h-3 w-6 gradient-shimmer rounded mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PlatformChartSkeleton = () => {
  return (
    <div className="relative h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="absolute inset-4 flex flex-col justify-between">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="border-t border-gray-200 dark:border-gray-700 border-dashed w-full"></div>
        ))}
      </div>
      <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-between">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 w-12 gradient-shimmer rounded mr-2"></div>
        ))}
      </div>
      <div className="absolute left-12 right-4 bottom-8 top-4 flex items-end justify-between gap-1">
        {Array.from({ length: 12 }).map((_, index) => {
          const heights = [65, 70, 55, 80, 75, 85, 90, 70, 65, 88, 92, 95];
          return (
            <div key={index} className="flex flex-col justify-end items-center flex-1">
              <div className="w-full flex flex-col-reverse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i}
                    className="w-full gradient-shimmer"
                    style={{ height: `${heights[index] / 5}%` }}
                  ></div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute left-12 right-4 bottom-0 flex justify-between">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="flex-1 text-center">
            <div className="h-3 w-6 gradient-shimmer rounded mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
};


type AnalyticsData = {
  month: string;
  orders: number;
  profit: number;
  payments: number;
  instagramOrders: number;
  facebookOrders: number;
  youtubeOrders: number;
  tiktokOrders: number;
  twitterOrders: number;
};

const CustomChart = ({ data, activeTab, maxValue }: {
  data: AnalyticsData[];
  activeTab: string;
  maxValue: number;
}) => {
  const { currency, currentCurrencyData, availableCurrencies, currencySettings } = useCurrency();
  
  const formatValue = (value: number) => {
    if (activeTab === 'orders') {
      return value.toLocaleString();
    }
    if (!currentCurrencyData || !availableCurrencies || !currencySettings) {
      return `$${value.toFixed(0)}`;
    }
    
    let convertedAmount = value;
    if (currency !== 'USD') {
      convertedAmount = convertCurrency(value, 'USD', currency, availableCurrencies);
    }
    
    return formatCurrencyAmount(convertedAmount, currency, availableCurrencies, currencySettings);
  };

  const getBarColor = (index: number) => {
    const colors = [
      'bg-gradient-to-t from-purple-500 to-purple-600',
      'bg-gradient-to-t from-orange-500 to-orange-600',
      'bg-gradient-to-t from-blue-500 to-blue-600',
      'bg-gradient-to-t from-red-500 to-red-600',
    ];
    return colors[index % 4];
  };

  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dataMap = new Map(data.map(item => [item.month, item]));
  
  const completeData: AnalyticsData[] = allMonths.map(month => {
    const existingData = dataMap.get(month);
    if (existingData) {
      return existingData;
    }
    return {
      month,
      orders: 0,
      profit: 0,
      payments: 0,
      instagramOrders: 0,
      facebookOrders: 0,
      youtubeOrders: 0,
      tiktokOrders: 0,
      twitterOrders: 0,
    };
  });

  return (
    <div className="relative h-80 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="absolute inset-4 flex flex-col justify-between">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="border-t border-gray-200 dark:border-gray-700 border-dashed w-full"></div>
        ))}
      </div>
      <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-600 dark:text-gray-400">
        {[4, 3, 2, 1, 0].map((i) => {
          const value = (i * maxValue / 4);
          return (
            <div key={i} className="text-right pr-2">
              {formatValue(value)}
            </div>
          );
        })}
      </div>
      <div className="absolute left-12 right-4 bottom-8 top-4 flex items-end justify-between gap-2">
        {completeData.map((item, index) => {
          const value = activeTab === 'profit' ? item.profit :
                      activeTab === 'payments' ? item.payments :
                      item.orders;
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <div key={index} className="flex flex-col items-center justify-end flex-1 group h-full">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-8 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-100 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                {item.month}: {activeTab === 'orders' ? value.toLocaleString() : formatValue(value)}
              </div>
              <div 
                className={`${getBarColor(index)} rounded-t transition-all duration-300 hover:opacity-90 cursor-pointer shadow-sm`}
                style={{ height: `${height}%`, width: '75%', minHeight: height > 0 ? '2px' : '0' }}
              ></div>
            </div>
          );
        })}
      </div>
      <div className="absolute left-12 right-4 bottom-0 flex justify-between text-xs text-gray-600 dark:text-gray-400 pb-1">
        {completeData.map((item, index) => (
          <div key={index} className="flex-1 text-center">
            {item.month}
          </div>
        ))}
      </div>
    </div>
  );
};

const PlatformChart = ({ data, totalOrders }: { data: AnalyticsData[]; totalOrders: number }) => {
  const platforms = [
    { name: 'Instagram', key: 'instagramOrders', color: 'bg-pink-500' },
    { name: 'Facebook', key: 'facebookOrders', color: 'bg-blue-600' },
    { name: 'YouTube', key: 'youtubeOrders', color: 'bg-red-500' },
    { name: 'TikTok', key: 'tiktokOrders', color: 'bg-gray-900' },
    { name: 'Twitter', key: 'twitterOrders', color: 'bg-cyan-500' },
  ];

  const maxValue = Math.max(...data.map(item => 
    platforms.reduce((sum, platform) => sum + (item[platform.key as keyof AnalyticsData] as number), 0)
  ));

  return (
    <div className="relative h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="absolute inset-4 flex flex-col justify-between">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="border-t border-gray-200 dark:border-gray-700 border-dashed w-full"></div>
        ))}
      </div>
      <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-600 dark:text-gray-400">
        {[0, 1, 2, 3, 4].map((i) => {
          const value = maxValue - (i * maxValue / 4);
          return (
            <div key={i} className="text-right pr-2">
              {Math.round(value).toLocaleString()}
            </div>
          );
        })}
      </div>
      <div className="absolute left-12 right-4 bottom-8 top-4 flex items-end justify-between gap-1">
        {data.map((item, index) => {

          return (
            <div key={index} className="flex flex-col justify-end items-center flex-1 group relative">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-8 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-100 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                {item.month}: {platforms.reduce((sum, platform) => sum + (item[platform.key as keyof AnalyticsData] as number), 0).toLocaleString()}
              </div>
              <div className="w-full flex flex-col-reverse">
                {platforms.map((platform) => {
                  const value = item[platform.key as keyof AnalyticsData] as number;
                  const height = (value / maxValue) * 100;

                  return (
                    <div 
                      key={platform.name}
                      className={`w-full ${platform.color} transition-all duration-300 hover:opacity-80`}
                      style={{ height: `${height}%` }}
                      title={`${platform.name}: ${value.toLocaleString()}`}
                    ></div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute left-12 right-4 bottom-0 flex justify-between text-xs text-gray-600 dark:text-gray-400">
        {data.map((item, index) => (
          <div key={index} className="flex-1 text-center">
            {item.month}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');

  useEffect(() => {
    document.title = `Analytics — SMM Panel`;
  }, []);

  useEffect(() => {
    const loadTimeFormat = async () => {
      const storedTimeFormat = (userDetails as any)?.timeFormat;
      const storedTimezone = (userDetails as any)?.timezone;
      
      if (storedTimeFormat === '12' || storedTimeFormat === '24') {
        setTimeFormat(storedTimeFormat);
      }
      
      if (storedTimezone) {
        setUserTimezone(storedTimezone);
      }

      if ((storedTimeFormat === '12' || storedTimeFormat === '24') && storedTimezone) {
        return;
      }

      try {
        const userData = await getUserDetails();
        const userTimeFormat = (userData as any)?.timeFormat || '24';
        const userTz = (userData as any)?.timezone || 'Asia/Dhaka';
        setTimeFormat(userTimeFormat === '12' || userTimeFormat === '24' ? userTimeFormat : '24');
        setUserTimezone(userTz);
      } catch (error) {
        console.error('Error loading time format:', error);
        setTimeFormat('24');
        setUserTimezone('Asia/Dhaka');
      }
    };

    loadTimeFormat();
  }, [userDetails]);

  const formatTime = (dateString: string | Date): string => {
    if (!dateString) return 'null';
    
    let date: Date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'null';
    }
    
    if (isNaN(date.getTime())) return 'null';

    if (timeFormat === '12') {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: userTimezone,
      });
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: userTimezone,
      });
    }
  };

  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return 'null';
    
    let date: Date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'null';
    }
    
    if (isNaN(date.getTime())) return 'null';

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: userTimezone,
    });
  };

  const [activeTab, setActiveTab] = useState<'profit' | 'payments' | 'orders'>('profit');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const availableMonths = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const formatCurrency = useCallback((amount: number) => {
    return `৳${amount.toFixed(2)}`;
  }, []);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams();
        if (selectedYear !== null) {
          params.append('year', selectedYear.toString());
        }
        if (selectedMonth !== null) {
          params.append('month', selectedMonth.toString());
        }

        const response = await fetch(`/api/admin/analytics?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          const formattedData = result.data.map((item: any) => ({
            month: item.month,
            orders: typeof item.orders === 'number' ? item.orders : Number(item.orders || 0),
            profit: typeof item.profit === 'number' ? item.profit : Number(item.profit || 0),
            payments: typeof item.payments === 'number' ? item.payments : Number(item.payments || 0),
            instagramOrders: typeof item.instagramOrders === 'number' ? item.instagramOrders : Number(item.instagramOrders || 0),
            facebookOrders: typeof item.facebookOrders === 'number' ? item.facebookOrders : Number(item.facebookOrders || 0),
            youtubeOrders: typeof item.youtubeOrders === 'number' ? item.youtubeOrders : Number(item.youtubeOrders || 0),
            tiktokOrders: typeof item.tiktokOrders === 'number' ? item.tiktokOrders : Number(item.tiktokOrders || 0),
            twitterOrders: typeof item.twitterOrders === 'number' ? item.twitterOrders : Number(item.twitterOrders || 0),
          }));
          setAnalyticsData(formattedData);
          
          if (result.availableYears && Array.isArray(result.availableYears)) {
            setAvailableYears(result.availableYears);
          }
        } else {
          throw new Error(result.message || 'Failed to fetch analytics data');
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setAnalyticsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (availableYears.length > 0) {
      if (selectedYear === null) {
        setSelectedYear(availableYears[0]);
      }
      else if (!availableYears.includes(selectedYear)) {
        setSelectedYear(availableYears[0]);
      }
    }
  }, [availableYears, selectedYear]);

  const calculateMetrics = () => {
    if (!analyticsData.length) return { total: 0, trend: 0, isPositive: true, maxValue: 0 };

    const currentData = analyticsData;
    const values = currentData.map(item => {
      switch (activeTab) {
        case 'profit': return item.profit;
        case 'payments': return item.payments;
        case 'orders': return item.orders;
        default: return 0;
      }
    });

    const total = values.reduce((sum, value) => sum + value, 0);
    const maxValue = Math.max(...values);

    let trend = 0;
    if (selectedMonth === null && values.length >= 12) {
      const firstHalf = values.slice(0, 6).reduce((sum, value) => sum + value, 0);
      const secondHalf = values.slice(6, 12).reduce((sum, value) => sum + value, 0);
      trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
    } else if (selectedMonth === null && values.length > 1) {
      const midPoint = Math.floor(values.length / 2);
      const firstHalf = values.slice(0, midPoint).reduce((sum, value) => sum + value, 0);
      const secondHalf = values.slice(midPoint).reduce((sum, value) => sum + value, 0);
      trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
    }

    return { total, trend, isPositive: trend >= 0, maxValue };
  };

  const metrics = calculateMetrics();

  const TabButton = ({ 
    id, 
    label, 
    icon, 
    isActive, 
    onClick 
  }: { 
    id: string; 
    label: string; 
    icon: React.ReactNode; 
    isActive: boolean; 
    onClick: () => void; 
  }) => {
    const getGradientColors = () => {
      switch (id) {
        case 'profit': return isActive 
          ? 'bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700';
        case 'payments': return isActive 
          ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700';
        case 'orders': return isActive 
          ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white shadow-lg'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700';
        default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
      }
    };

    return (
      <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${getGradientColors()}`}
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="mb-6">
        <div className="card card-padding">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="card-icon">
                <FaChartLine />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track your SMM panel performance and growth</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => {
                    setIsMonthDropdownOpen(!isMonthDropdownOpen);
                    setIsYearDropdownOpen(false);
                  }}
                  className="form-field w-full pl-4 pr-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer flex items-center gap-2 min-w-[160px]"
                >
                  <FaCalendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium">
                    {selectedMonth !== null 
                      ? availableMonths.find(m => m.value === selectedMonth)?.label || 'Select Month'
                      : 'All Months'}
                  </span>
                </button>

                {isMonthDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedMonth(null);
                        setIsMonthDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 rounded-t-lg ${
                        selectedMonth === null ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      All Months
                    </button>
                    {availableMonths.map((month) => (
                      <button
                        key={month.value}
                        onClick={() => {
                          setSelectedMonth(month.value);
                          setIsMonthDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                          month.value === selectedMonth ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                        } ${month.value === availableMonths[availableMonths.length - 1].value ? 'rounded-b-lg' : ''}`}
                      >
                        {month.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => {
                    setIsYearDropdownOpen(!isYearDropdownOpen);
                    setIsMonthDropdownOpen(false);
                  }}
                  className="form-field w-full pl-4 pr-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer flex items-center gap-2 min-w-[120px]"
                >
                  <FaCalendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium">
                    {selectedYear !== null ? selectedYear : 'All Years'}
                  </span>
                </button>

                {isYearDropdownOpen && availableYears.length > 0 && (
                  <div className="absolute right-0 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-20">
                    <button
                      onClick={() => {
                        setSelectedYear(null);
                        setIsYearDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 rounded-t-lg ${
                        selectedYear === null ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      All Years
                    </button>
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                          year === selectedYear ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                        } ${year === availableYears[availableYears.length - 1] ? 'rounded-b-lg' : ''}`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <div className="card card-padding">
          <div className="flex flex-wrap gap-3 mb-6">
            <TabButton
              id="profit"
              label="Profit from Orders"
              icon={<FaDollarSign />}
              isActive={activeTab === 'profit'}
              onClick={() => setActiveTab('profit')}
            />
            <TabButton
              id="payments"
              label="Earning from Payments"
              icon={<FaChartLine />}
              isActive={activeTab === 'payments'}
              onClick={() => setActiveTab('payments')}
            />
            <TabButton
              id="orders"
              label="Number of Orders"
              icon={<FaShoppingCart />}
              isActive={activeTab === 'orders'}
              onClick={() => setActiveTab('orders')}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 font-semibold">
                    Total {selectedYear !== null ? selectedYear : 'All Years'}
                  </p>
                  {loading ? (
                    <div className="h-8 w-24 gradient-shimmer rounded mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {activeTab === 'orders' 
                        ? metrics.total.toLocaleString()
                        : <PriceDisplay amount={metrics.total} originalCurrency="USD" className="text-2xl font-bold text-blue-700 dark:text-blue-300" />
                      }
                    </p>
                  )}
                </div>
                <div className="text-blue-500 dark:text-blue-400 w-6 h-6">
                  {activeTab === 'profit' && <FaDollarSign className="w-6 h-6" />}
                  {activeTab === 'payments' && <FaChartLine className="w-6 h-6" />}
                  {activeTab === 'orders' && <FaShoppingCart className="w-6 h-6" />}
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 font-semibold">Growth Rate</p>
                  {loading ? (
                    <div className="h-8 w-20 gradient-shimmer rounded mt-2" />
                  ) : (
                    <p className={`text-2xl font-bold ${metrics.isPositive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {Math.abs(metrics.trend).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div className="text-green-500 dark:text-green-400 w-6 h-6">
                  {metrics.isPositive ? (
                    <TrendingUpIcon className="w-6 h-6" />
                  ) : (
                    <TrendingDownIcon className="w-6 h-6" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 font-semibold">Monthly Average</p>
                  {loading ? (
                    <div className="h-8 w-24 gradient-shimmer rounded mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {activeTab === 'orders'
                        ? Math.round(metrics.total / (selectedMonth !== null ? 1 : Math.max(analyticsData.length, 1))).toLocaleString()
                        : <PriceDisplay amount={metrics.total / (selectedMonth !== null ? 1 : Math.max(analyticsData.length, 1))} originalCurrency="USD" className="text-2xl font-bold text-purple-700 dark:text-purple-300" />
                      }
                    </p>
                  )}
                </div>
                <FaCog className="text-purple-500 dark:text-purple-400 w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="card-title mb-4">
              {selectedMonth !== null 
                ? `${activeTab === 'profit' ? 'Profit Analysis' :
                   activeTab === 'payments' ? 'Payment Revenue' :
                   'Order Volume'} - ${availableMonths.find(m => m.value === selectedMonth)?.label} ${selectedYear !== null ? selectedYear : 'All Years'}`
                : `${activeTab === 'profit' ? 'Monthly Profit Analysis' :
                   activeTab === 'payments' ? 'Monthly Payment Revenue' :
                   'Monthly Order Volume'} - ${selectedYear !== null ? selectedYear : 'All Years'}`
              }
            </h3>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <CustomChart
                data={analyticsData}
                activeTab={activeTab}
                maxValue={metrics.maxValue}
              />
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}