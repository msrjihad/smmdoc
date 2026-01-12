'use client';

import Announcements from '@/components/dashboard/announcements';
import { useCurrency } from '@/contexts/currency-context';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { useGetUserStatsQuery } from '@/lib/services/dashboard-api';
import { logger } from '@/lib/utils/logger';
import { formatID, formatNumber, formatPrice } from '@/lib/utils';
import { PriceDisplay } from '@/components/price-display';
import moment from 'moment';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import {
    FaChartLine,
    FaCheckCircle,
    FaClipboardList,
    FaClock,
    FaDollarSign,
    FaExclamationTriangle,
    FaEye,
    FaHistory,
    FaPlus,
    FaShoppingBag,
    FaTicketAlt,
    FaTimes,
    FaTimesCircle,
    FaUser,
    FaWallet
} from 'react-icons/fa';

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'pending';
  onClose: () => void;
}) => (
  <div className={`toast toast-${type} toast-enter`}>
    {type === 'success' && <FaCheckCircle className="toast-icon" />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="toast-close">
      <FaTimes className="toast-close-icon" />
    </button>
  </div>
);

const DashboardPage = () => {
  const user = useCurrentUser();
  const { currency, rate: currencyRate, currentCurrencyData } = useCurrency();
  const router = useRouter();
  const { data: session } = useSession();
  const { data: userStatsResponse, error, isLoading } = useGetUserStatsQuery(undefined);
  const userStats = userStatsResponse?.data;

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [userInfoLoading, setUserInfoLoading] = useState(true);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');

  const userDetails = useSelector((state: any) => state.userDetails);
  const { appName } = useAppNameWithFallback();

  useEffect(() => {
    setPageTitle('Dashboard', appName);
  }, [appName]);

  useEffect(() => {
    const loadTimeFormat = async () => {
      try {
        if (userDetails?.timeFormat) {
          setTimeFormat(userDetails.timeFormat);
        } else {
          const user = await getUserDetails();
          if (user && 'timeFormat' in user && user.timeFormat) {
            setTimeFormat(user.timeFormat);
          }
        }
        if (userDetails?.timezone) {
          setUserTimezone(userDetails.timezone);
        } else {
          const user = await getUserDetails();
          if (user && 'timezone' in user && user.timezone) {
            setUserTimezone(user.timezone);
          }
        }
      } catch (error) {
        console.error('Error loading time format:', error);
      }
    };
    loadTimeFormat();
  }, [userDetails]);

  useEffect(() => {
    // Remove unnecessary setTimeout delays - set loading to false immediately
    // The actual data loading is handled by SWR/API calls
    setUserInfoLoading(false);
    setFinanceLoading(false);
    setStatisticsLoading(false);
    setOrdersLoading(false);

    const loadTickets = async () => {
      try {
        const response = await fetch('/api/support-tickets?page=1&limit=3');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.tickets) {
            setRecentTickets(data.tickets);
          }
        }
      } catch (error) {
        logger.error('Error fetching tickets', error);
      } finally {
        setTicketsLoading(false);
      }
    };

    loadTickets();
  }, []);

  const userOrders = userStats?.recentOrders || [];

  const balance = userStats?.balance != null ? Number(userStats.balance) : 0;
  const totalSpend = userStats?.totalSpent != null ? Number(userStats.totalSpent) : 0;
  const totalOrders = userStats?.totalOrders || 0;

  // Removed debug console.log - use logger.debug if needed in development
  // useEffect removed to prevent unnecessary rerenders
  const pendingOrders = userStats?.ordersByStatus?.pending || 0;
  const completedOrders = userStats?.ordersByStatus?.completed || 0;
  const processingOrders = userStats?.ordersByStatus?.processing || 0;
  const cancelledOrders = userStats?.ordersByStatus?.cancelled || 0;

  const formatCurrency = (amount: number) => {

    let convertedAmount = amount;
    let symbol = '৳';

    if (currency === 'BDT') {

      convertedAmount = amount;
      symbol = '৳';
    } else if (currency === 'USD') {

      const bdtToUsdRate = 110;
      convertedAmount = amount / bdtToUsdRate;
      symbol = '$';
    } else {

      const bdtToUsdRate = 110;
      const usdAmount = amount / bdtToUsdRate;
      convertedAmount = usdAmount * (currencyRate || 1);
      symbol = '$';
    }

    return `${symbol}${formatPrice(convertedAmount, 2)}`;
  };

  const handleCategoryClick = (categoryId: string | null) => {
    if (categoryId) {
      router.push(`/new-order?categoryId=${categoryId}`);
    } else {
      router.push('/new-order');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800';
      case 'in_progress':
        return 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800';
      case 'partial':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <FaCheckCircle className="w-4 h-4" />;
      case 'processing':
        return <FaClock className="w-4 h-4" />;
      case 'pending':
        return <FaExclamationTriangle className="w-4 h-4" />;
      case 'cancelled':
        return <FaTimesCircle className="w-4 h-4" />;
      default:
        return <FaClock className="w-4 h-4" />;
    }
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-GB', { timeZone: userTimezone }),
      time: date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: timeFormat === '12',
        timeZone: userTimezone,
      }),
    };
  };

  const mapApiStatusToFrontend = (apiStatus: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'open',
      'in_progress': 'in_progress',
      'on_hold': 'on_hold',
      'closed': 'closed',
      'Open': 'open',
      'Answered': 'answered',
      'Customer Reply': 'customer_reply',
      'Closed': 'closed'
    };
    return statusMap[apiStatus] || apiStatus.toLowerCase();
  };

  const getTicketStatusBadge = (status: string) => {
    const mappedStatus = mapApiStatusToFrontend(status);
    switch (mappedStatus) {
      case 'open':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800';
      case 'answered':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800';
      case 'customer_reply':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800';
      case 'on_hold':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800';
      case 'in_progress':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800';
      case 'closed':
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800';
    }
  };

  const formatTicketStatus = (status: string) => {
    const mappedStatus = mapApiStatusToFrontend(status);
    switch (mappedStatus) {
      case 'open':
        return 'Open';
      case 'answered':
        return 'Answered';
      case 'customer_reply':
        return 'Customer Reply';
      case 'on_hold':
        return 'On Hold';
      case 'in_progress':
        return 'In Progress';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  return (
    <div className="px-4 sm:px-8 py-4 sm:py-8 bg-[var(--page-bg)] dark:bg-[var(--page-bg)]">
      <div className="toast-container">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      {((session?.user?.role !== 'admin' && session?.user?.role !== 'ADMIN' && session?.user?.role !== 'moderator' && session?.user?.role !== 'MODERATOR') || session?.user?.isImpersonating) && (
        <Announcements />
      )}

      <div className="page-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="card card-padding">
            <div className="card-content">
              <div className="card-icon">
                <FaUser />
              </div>
              <div>
                <h3 className="card-title">User ID</h3>
                {userInfoLoading ? (
                  <div className="h-5 w-24 gradient-shimmer rounded" />
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {user?.id ? formatID(user.id) : 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-content">
              <div className="card-icon">
                <FaUser />
              </div>
              <div>
                <h3 className="card-title">Username</h3>
                {userInfoLoading ? (
                  <div className="h-5 w-20 gradient-shimmer rounded" />
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {user?.username || user?.email?.split('@')[0] || 'User'}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-content">
              <div className="card-icon">
                <FaUser />
              </div>
              <div>
                <h3 className="card-title">Full Name</h3>
                {userInfoLoading ? (
                  <div className="h-5 w-24 gradient-shimmer rounded" />
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {user?.name || 'User'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="card card-padding">
            <div className="card-content">
              <div className="card-icon">
                <FaWallet />
              </div>
              <div className="flex-1">
                <h3 className="card-title">Balance</h3>
                {financeLoading || isLoading ? (
                  <div className="h-8 w-24 gradient-shimmer rounded" />
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    <PriceDisplay
                      amount={balance || 0}
                      originalCurrency="USD"
                      className="text-2xl font-bold text-green-600"
                    />
                  </p>
                )}
              </div>
              <div className="ml-4 hidden sm:block">
                <Link
                  href="/add-funds"
                  className={`btn btn-primary flex items-center gap-2`}
                  >
                  <FaPlus className="w-4 h-4" />
                  Add
                </Link>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-content">
              <div className="card-icon">
                <FaShoppingBag />
              </div>
              <div>
                <h3 className="card-title">Total Orders</h3>
                {financeLoading || isLoading ? (
                  <div className="h-8 w-16 gradient-shimmer rounded" />
                ) : (
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(totalOrders)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-content">
              <div className="card-icon">
                <FaDollarSign />
              </div>
              <div>
                <h3 className="card-title">Total Spend</h3>
                {financeLoading || isLoading ? (
                  <div className="h-8 w-24 gradient-shimmer rounded" />
                ) : (
                  <p className="text-2xl font-bold text-purple-600">
                    <PriceDisplay
                      amount={totalSpend || 0}
                      originalCurrency="USD"
                      className="text-2xl font-bold text-purple-600"
                    />
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card card-padding">
              <div className="card-header mb-4">
                <div className="card-icon">
                  <FaChartLine />
                </div>
                <h3 className="card-title">Order Statistics Overview</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Link
                  href="/my-orders?status=completed"
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-green-600 dark:text-green-400 font-semibold">
                        Completed
                      </div>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {statisticsLoading || isLoading ? (
                          <div className="h-8 w-12 gradient-shimmer-green rounded" />
                        ) : (
                          formatNumber(completedOrders)
                        )}
                      </div>
                    </div>
                    <FaCheckCircle className="text-green-500 w-5 h-5" />
                  </div>
                </Link>
                <Link
                  href="/my-orders?status=processing"
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-blue-600 dark:text-blue-400 font-semibold">
                        Processing
                      </div>
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {statisticsLoading || isLoading ? (
                          <div className="h-8 w-12 gradient-shimmer-blue rounded" />
                        ) : (
                          formatNumber(processingOrders)
                        )}
                      </div>
                    </div>
                    <FaClock className="text-blue-500 w-5 h-5" />
                  </div>
                </Link>
                <Link
                  href="/my-orders?status=pending"
                  className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-yellow-600 dark:text-yellow-400 font-semibold">
                        Pending
                      </div>
                      <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                        {statisticsLoading || isLoading ? (
                          <div className="h-8 w-12 gradient-shimmer-yellow rounded" />
                        ) : (
                          formatNumber(pendingOrders)
                        )}
                      </div>
                    </div>
                    <FaExclamationTriangle className="text-yellow-500 w-5 h-5" />
                  </div>
                </Link>
                <Link
                  href="/my-orders?status=cancelled"
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-red-600 dark:text-red-400 font-semibold">
                        Cancelled
                      </div>
                      <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                        {statisticsLoading || isLoading ? (
                          <div className="h-8 w-12 gradient-shimmer-red rounded" />
                        ) : (
                          formatNumber(cancelledOrders)
                        )}
                      </div>
                    </div>
                    <FaTimesCircle className="text-red-500 w-5 h-5" />
                  </div>
                </Link>
              </div>
            </div>
            <div className="card card-padding">
              <div className="card-header mb-4">
                <div className="card-icon">
                  <FaHistory />
                </div>
                <h3 className="card-title">Recent Orders</h3>
                <div className="ml-auto hidden sm:block">
                  <Link
                    href="/my-orders"
                    className={`btn btn-secondary flex items-center gap-2`}
                    >
                    <FaEye className="w-4 h-4" />
                    <span className="font-bold text-sm">View All Orders</span>
                  </Link>
                </div>
              </div>

              {ordersLoading || isLoading ? (
                <div style={{ minHeight: '400px' }}>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
                          {Array.from({ length: 6 }).map((_, idx) => (
                            <th key={idx} className="text-left py-3 px-4 font-medium">
                              <div className="h-4 w-16 gradient-shimmer rounded" />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 5 }).map((_, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 px-4">
                              <div className="h-4 w-16 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-4 w-20 gradient-shimmer rounded mb-1" />
                              <div className="h-3 w-12 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              <div className="h-4 w-16 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              <div className="h-4 w-12 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell">
                              <div className="h-4 w-32 gradient-shimmer rounded mb-1" />
                              <div className="h-3 w-24 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-6 w-20 gradient-shimmer rounded-full" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : userOrders.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 first:rounded-tl-lg">
                          ID
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 hidden md:table-cell">
                          Charge
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 hidden md:table-cell">
                          Quantity
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 hidden lg:table-cell">
                          Service
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {userOrders.map((order: any, index: number) => {
                        const dateTime = formatDate(order.createdAt);
                        const isLastRow = index === userOrders.length - 1;
                        return (
                          <tr
                            key={order.id}
                            className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                              isLastRow ? 'last:border-b-0' : ''
                            }`}
                          >
                            <td
                              className={`py-3 px-4 ${
                                isLastRow ? 'first:rounded-bl-lg' : ''
                              }`}
                            >
                              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                {order.id}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {dateTime.date}
                              </span>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {dateTime.time}
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {(() => {

                                  const usdPrice = order.usdPrice || 0;

                                  if (!currentCurrencyData) {
                                    return `$${formatPrice(usdPrice, 2)}`;
                                  }

                                  let displayAmount = 0;

                                  if (currentCurrencyData.code === 'USD') {
                                    displayAmount = usdPrice;
                                  } else if (currentCurrencyData.code === 'BDT') {
                                    displayAmount = usdPrice * (order.user?.dollarRate || 121.52);
                                  } else {

                                    displayAmount = usdPrice * currentCurrencyData.rate;
                                  }

                                  return `${currentCurrencyData.symbol}${formatPrice(displayAmount, 2)}`;
                                })()}
                              </span>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {formatNumber(order.qty || 0)}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-[200px] hidden lg:table-cell">
                              <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                {order.service?.name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {order.category?.category_name || 'N/A'}
                              </div>
                            </td>
                            <td
                              className={`py-3 px-4 ${
                                isLastRow ? 'last:rounded-br-lg' : ''
                              }`}
                            >
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(
                                  order.providerStatus === 'forward_failed' && order.status === 'failed' ? 'pending' : order.status
                                )}`}
                              >
                                {order.providerStatus === 'forward_failed' && order.status === 'failed' ? 'pending' : order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  className="text-center py-8"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <FaClipboardList
                    className="w-16 h-16 mx-auto mb-4"
                    style={{ color: 'var(--text-muted)', opacity: 0.5 }}
                  />
                  <div className="text-lg font-medium mb-2">
                    No orders found
                  </div>
                  <div className="text-sm mb-4">
                    You haven't placed any orders yet.
                  </div>
                  <button
                    onClick={() => router.push('/new-order')}
                    className="btn btn-primary flex items-center gap-2 mx-auto"
                  >
                    <FaPlus className="w-4 h-4" />
                    Create Your First Order
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div className="card card-padding">
              <div className="card-header mb-4">
                <div className="card-icon">
                  <FaTicketAlt />
                </div>
                <h3 className="card-title">Support Tickets</h3>
                <div className="ml-auto hidden sm:block">
                  <Link
                    href="/support-tickets"
                    className={`btn btn-secondary flex items-center gap-2`}
                    >
                    <FaEye className="w-4 h-4" />
                    <span className="font-bold text-sm">View All</span>
                  </Link>
                </div>
              </div>

              {ticketsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                      <div className="h-3 w-24 gradient-shimmer rounded mb-2" />
                      <div className="h-6 w-20 gradient-shimmer rounded-full" />
                    </div>
                  ))}
                </div>
              ) : recentTickets.length > 0 ? (
                <div className="space-y-3">
                  {recentTickets.map((ticket: any) => {
                    const dateTime = formatDate(ticket.createdAt);
                    return (
                      <Link
                        key={ticket.id}
                        href={`/support-tickets/${ticket.id}`}
                        className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                            {ticket.subject}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <span>{dateTime.date}</span>
                            <span className="mx-1">•</span>
                            <span>{dateTime.time}</span>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getTicketStatusBadge(
                              ticket.status
                            )}`}
                          >
                            {formatTicketStatus(ticket.status)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="text-center py-8"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <FaTicketAlt
                    className="w-16 h-16 mx-auto mb-4"
                    style={{ color: 'var(--text-muted)', opacity: 0.5 }}
                  />
                  <div className="text-lg font-medium mb-2">
                    No Support Tickets found
                  </div>
                  <div className="text-sm">
                    You haven't created any Support Tickets yet.
                  </div>
                </div>
              )}
              <div className="mt-4 sm:hidden">
                <Link
                  href="/support-tickets"
                  className="btn btn-secondary flex w-full items-center justify-center gap-2"
                >
                  <FaEye className="w-4 h-4" />
                  <span className="font-bold text-sm">View All</span>
                </Link>
              </div>
            </div>
            <div className="card card-padding">
              <div className="card-header mb-4">
                <div className="card-icon">
                  <FaPlus />
                </div>
                <h3 className="card-title">Quick Actions</h3>
              </div>

              <div className="space-y-3">
                <Link
                  href="/new-order"
                  className={`btn btn-primary w-full flex items-center justify-center gap-2`}
                  >
                  <FaPlus className="w-4 h-4" />
                  New Order
                </Link>

                <Link
                  href="/add-funds"
                  className={`btn btn-secondary w-full flex items-center justify-center gap-2`}
                  >
                  <FaWallet className="w-4 h-4" />
                  Add Funds
                </Link>

                <Link
                  href="/my-orders"
                  className={`btn btn-secondary w-full flex items-center justify-center gap-2`}
                  >
                  <FaHistory className="w-4 h-4" />
                  Order History
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;