'use client';

import { useCurrency } from '@/contexts/currency-context';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { useGetUserOrdersQuery } from '@/lib/services/user-order-api';
import { formatID, formatNumber, formatPrice, formatCount } from '@/lib/utils';
import { PriceDisplay } from '@/components/price-display';
import moment from 'moment';
import { useRouter, useSearchParams } from 'next/navigation';
import CancelOrderModal from '@/components/dashboard/my-orders/modals/cancel-order';
import RequestRefillModal from '@/components/dashboard/my-orders/modals/request-refill';
import OrderTable from '@/components/dashboard/my-orders/order-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import {
  FaBan,
  FaCheck,
  FaCheckCircle,
  FaCircleNotch,
  FaClock,
  FaList,
  FaRss,
  FaSearch,
  FaSpinner,
  FaSync,
  FaTimes
} from 'react-icons/fa';

interface CancelRequest {
  id: number;
  status: string;
  createdAt: string;
}

interface OrderWithCancelRequests {
  id: number;
  status: string;
  cancelRequests?: CancelRequest[];
  service?: {
    cancel?: boolean;
    refill?: boolean;
    name?: string;
  };
  [key: string]: any;
}

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'pending';
  onClose: () => void;
}) => (
  <div
    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm border ${type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
        : type === 'error'
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          : type === 'info'
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
      }`}
  >
    <div className="flex items-center space-x-2">
      {type === 'success' && <FaCheckCircle className="w-4 h-4" />}
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
      >
        <FaTimes className="w-3 h-3" />
      </button>
    </div>
  </div>
);

export default function OrdersList() {
  const { appName } = useAppNameWithFallback();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');

  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    orderId: number | null;
    reason: string;
    isLoading?: boolean;
  }>({
    isOpen: false,
    orderId: null,
    reason: '',
    isLoading: false
  });

  const [refillModal, setRefillModal] = useState<{
    isOpen: boolean;
    orderId: number | null;
    reason: string;
    isLoading?: boolean;
  }>({
    isOpen: false,
    orderId: null,
    reason: '',
    isLoading: false
  });

  const [localPendingCancelRequests, setLocalPendingCancelRequests] = useState<Set<number>>(new Set());
  const hasSyncedRef = useRef(false);
  const queryInitiatedRef = useRef(false);

  const { currency, availableCurrencies, currentCurrencyData } = useCurrency();

  const { data, isLoading, error, refetch } = useGetUserOrdersQuery({
    page,
    limit,
    status,
    search: debouncedSearch,
  });

  useEffect(() => {
    if (!isLoading && (data !== undefined || error !== undefined)) {
      queryInitiatedRef.current = true;
    }
  }, [isLoading, data, error]);

  useEffect(() => {
    setPageTitle('My Orders', appName);
  }, [appName]);

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

    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: userTimezone,
    });
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectRealtime = () => {
      try {
        eventSource = new EventSource('/api/user/orders/realtime');

        eventSource.onopen = () => {
          console.log('✅ Real-time sync connected for my-orders');
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'order_updated') {
              console.log('Order updated via real-time on my-orders:', data.orderId);

              if (queryInitiatedRef.current) {
                refetch();
              }
            } else if (data.type === 'ping') {
              console.log('Real-time ping received');
            }
          } catch (error) {
            console.error('Error parsing real-time message:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('Real-time sync error on my-orders:', error);
          if (eventSource && eventSource.readyState === EventSource.CLOSED) {
            eventSource = null;
            setTimeout(() => {
              if (!eventSource) {
                connectRealtime();
              }
            }, 5000);
          }
        };
      } catch (error) {
        console.error('Error setting up real-time sync on my-orders:', error);
      }
    };

    connectRealtime();

    return () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [refetch]);

  useEffect(() => {
    if (hasSyncedRef.current) return;

    if (!queryInitiatedRef.current) {
      return;
    }

    const syncProviderOrders = async () => {
      hasSyncedRef.current = true;
      try {
        const syncPromise = fetch('/api/user/orders/sync-provider', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ syncAll: true }),
        }).then(res => res.json()).catch(err => {
          console.error('Error syncing provider orders on reload:', err);
          return { success: false, error: err.message };
        });

        const syncTimeout = new Promise((resolve) => {
          setTimeout(() => resolve({ success: false, timeout: true }), 30000);
        });

        const syncResult: any = await Promise.race([syncPromise, syncTimeout]);

        if (syncResult.timeout) {
          console.log('Sync is taking longer than expected, refreshing orders...');
        } else if (syncResult.success) {
          const syncedCount = syncResult.data?.synced || 0;
          const totalProcessed = syncResult.data?.processed || 0;
          if (syncedCount > 0) {
            console.log(`Synced ${syncedCount} of ${totalProcessed} provider order(s) on page reload`);
          } else if (totalProcessed > 0) {
            console.log(`Checked ${totalProcessed} provider order(s) - all up to date`);
          } else {
            console.log('No provider orders to sync');
          }
        } else {
          console.warn('Provider sync had issues:', syncResult.error);
        }

        try {
          refetch();
        } catch (refetchError: any) {
          if (!refetchError?.message?.includes('has not been started')) {
            console.error('Error refetching orders:', refetchError);
          }
        }
      } catch (error) {
        console.error('Error syncing provider orders on page reload:', error);
        try {
          refetch();
        } catch (refetchError: any) {
          if (!refetchError?.message?.includes('has not been started')) {
            console.error('Error refetching orders:', refetchError);
          }
        }
      }
    };

    syncProviderOrders();
  }, [refetch, data, error]);

  useEffect(() => {
    const urlStatus = searchParams?.get('status');
    const newStatus = urlStatus ? urlStatus.replace('-', '_') : 'all';
    if (newStatus !== status) {
      setStatus(newStatus);
    }
  }, [searchParams, status]);

  useEffect(() => {
    if (data?.data) {
      const ordersWithDeclinedRequests = data.data.filter((order: any) =>
        order.cancelRequests &&
        order.cancelRequests.length > 0 &&
        order.cancelRequests[0].status === 'declined'
      );

      if (ordersWithDeclinedRequests.length > 0) {
        setLocalPendingCancelRequests(prev => {
          const newSet = new Set(prev);
          ordersWithDeclinedRequests.forEach((order: any) => {
            newSet.delete(order.id);
          });
          return newSet;
        });
      }
    }
  }, [data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    if (search.trim()) {
      setIsSearchLoading(true);
    } else {
      setIsSearchLoading(false);
    }

    return () => clearTimeout(timer);
  }, [search]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleStatusChange = (statusKey: string) => {
    setStatus(statusKey);
    setPage(1);

    const currentParams = searchParams?.toString() || '';
    const params = new URLSearchParams(currentParams);

    if (statusKey === 'all') {
      params.delete('status');
    } else {

      const urlStatus = statusKey.replace('_', '-');
      params.set('status', urlStatus);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : '/my-orders';
    router.push(newUrl);
  };

  const orders = useMemo(() => {
    let filteredOrders = data?.data || [];

    if (status !== 'all') {
      filteredOrders = filteredOrders.filter((order: any) => {
        const displayStatus = order.providerStatus === 'forward_failed' && order.status === 'failed' ? 'pending' : order.status;
        return displayStatus === status;
      });
    }

    if (debouncedSearch) {
      filteredOrders = filteredOrders.filter((order: any) =>
        order.id.toString().includes(debouncedSearch) ||
        order.service?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        order.category?.category_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        order.link?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    return filteredOrders;
  }, [data, status, debouncedSearch]);

  const pagination = useMemo(() => {
    return data?.pagination || {
      total: 0,
      page: page,
      limit: limit,
      totalPages: 1
    };
  }, [data, page, limit]);

  const totalPages = pagination.totalPages || 1;

  const handlePrevious = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handleLimitChange = (newLimit: string) => {
    setLimit(newLimit === 'all' ? 999999 : parseInt(newLimit));
    setPage(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();

      try {
        const syncPromise = fetch('/api/user/orders/sync-provider', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ syncAll: true }),
        }).then(res => res.json()).catch(err => {
          console.error('Error syncing provider orders on refresh:', err);
          return { success: false, error: err.message };
        });

        const syncTimeout = new Promise((resolve) => {
          setTimeout(() => resolve({ success: false, timeout: true }), 30000);
        });

        const syncResult: any = await Promise.race([syncPromise, syncTimeout]);

        if (syncResult.timeout) {
          console.log('Sync is taking longer than expected, refreshing orders...');
        } else if (syncResult.success) {
          const syncedCount = syncResult.data?.synced || 0;
          const totalProcessed = syncResult.data?.processed || 0;
          if (syncedCount > 0) {
            console.log(`Synced ${syncedCount} of ${totalProcessed} provider order(s) on refresh`);
          } else if (totalProcessed > 0) {
            console.log(`Checked ${totalProcessed} provider order(s) - all up to date`);
          } else {
            console.log('No provider orders to sync');
          }
        } else {
          console.warn('Provider sync had issues:', syncResult.error);
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        await refetch();
      } catch (syncError) {
        console.error('Error during provider sync:', syncError);
        await refetch();
      }

      showToast('Orders refreshed successfully!', 'success');
    } catch (error) {
      console.error('Error refreshing orders:', error);
      showToast('Error refreshing orders. Please try again.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefill = (orderId: number) => {
    showToast(`Refill request submitted for order #${formatID(orderId)}`, 'success');
  };

  const handleCancel = (orderId: number) => {
    setCancelModal({
      isOpen: true,
      orderId,
      reason: ''
    });
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal.orderId || !cancelModal.reason.trim()) {
      setToastMessage({
        message: 'Please provide a reason for cancellation',
        type: 'error'
      });
      return;
    }

    setCancelModal(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/user/orders/${cancelModal.orderId}/cancel-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancelModal.reason.trim()
        })
      });

      const result = await response.json();

      if (result.success) {

        setLocalPendingCancelRequests(prev => new Set(prev).add(cancelModal.orderId!));

        setToastMessage({
          message: result.data.message || 'Cancel request submitted successfully',
          type: 'success'
        });
        handleCancelClose();
      } else {
        setToastMessage({
          message: result.error || 'Failed to submit cancel request',
          type: 'error'
        });
        setCancelModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error submitting cancel request:', error);
      setToastMessage({
        message: 'Failed to submit cancel request',
        type: 'error'
      });
      setCancelModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancelClose = () => {
    setCancelModal({
      isOpen: false,
      orderId: null,
      reason: '',
      isLoading: false
    });
  };

  const handleRefillClose = () => {
    setRefillModal({
      isOpen: false,
      orderId: null,
      reason: '',
      isLoading: false
    });
  };

  const handleRefillConfirm = async () => {
    if (!refillModal.orderId) {
      setToastMessage({
        message: 'Invalid order ID',
        type: 'error'
      });
      return;
    }

    setRefillModal(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/user/refill-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: refillModal.orderId,
          reason: (refillModal.reason || '').trim() || 'Customer requested refill due to drop in count'
        })
      });

      let result;
      try {
        result = await response.json();
        console.log('Refill request response:', { status: response.status, ok: response.ok, result });
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        setToastMessage({
          message: 'Failed to parse server response. Please try again.',
          type: 'error'
        });
        setRefillModal(prev => ({ ...prev, isLoading: false }));
        return;
      }

      if (response.ok && result.success) {
        if (result.data?.providerRefillError) {
          setToastMessage({
            message: result.message || `Refill request saved, but provider submission failed: ${result.data.providerRefillError}`,
            type: 'info'
          });
        } else if (result.data?.providerRefillSubmitted) {
          setToastMessage({
            message: result.message || 'Refill request submitted successfully and forwarded to provider',
            type: 'success'
          });
        } else {
          setToastMessage({
            message: result.message || 'Refill request submitted successfully',
            type: 'success'
          });
        }
        handleRefillClose();
        refetch();
      } else {
        const errorMessage = result?.error || result?.message || 'Failed to submit refill request';
        setToastMessage({
          message: errorMessage,
          type: 'error'
        });
        setRefillModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error submitting refill request:', error);
      setToastMessage({
        message: 'Failed to submit refill request. Please try again.',
        type: 'error'
      });
      setRefillModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getStatusCount = (statusKey: string) => {
    const statusBreakdown = data?.stats?.statusBreakdown || {};

    if (statusKey === 'all') {
      return pagination.total || 0;
    }

    const statusKeyMap: Record<string, string> = {
      'in_progress': 'in_progress',
      'processing': 'processing',
      'pending': 'pending',
      'completed': 'completed',
      'partial': 'partial',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'failed': 'failed',
      'refunded': 'refunded'
    };

    const dbStatusKey = statusKeyMap[statusKey] || statusKey;
    return statusBreakdown[dbStatusKey] || statusBreakdown[statusKey] || 0;
  };

  const statusFilters = [
    {
      key: 'all',
      label: 'All',
      icon: FaList,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
    {
      key: 'pending',
      label: 'Pending',
      icon: FaClock,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
    {
      key: 'in_progress',
      label: 'In progress',
      icon: FaSpinner,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: FaCheck,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
    {
      key: 'partial',
      label: 'Partial',
      icon: FaCircleNotch,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
    {
      key: 'processing',
      label: 'Processing',
      icon: FaRss,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      icon: FaBan,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
  ];

  const formatStatusDisplay = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'failed':
        return 'Failed';
      case 'partial':
        return 'Partial';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  return (
    <div className="page-container">
      <CancelOrderModal
        isOpen={cancelModal.isOpen}
        onClose={handleCancelClose}
        onConfirm={handleCancelConfirm}
        orderId={cancelModal.orderId}
        reason={cancelModal.reason}
        setReason={(reason) => setCancelModal(prev => ({ ...prev, reason }))}
        isLoading={cancelModal.isLoading || false}
      />
      <RequestRefillModal
        isOpen={refillModal.isOpen}
        onClose={handleRefillClose}
        onConfirm={handleRefillConfirm}
        orderId={refillModal.orderId}
        reason={refillModal.reason}
        setReason={(reason) => setRefillModal(prev => ({ ...prev, reason }))}
        isLoading={refillModal.isLoading}
      />
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="page-content">
        <div className="card card-padding">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-4 h-12">
                <div className="relative">
                  <select
                    value={limit === 999999 ? 'all' : limit.toString()}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    className="form-field pl-4 pr-8 py-3 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm min-w-[160px] h-12"
                  >
                    {pagination.total > 0 && (
                      <>
                        {pagination.total >= 10 && <option value="10">10 per page</option>}
                        {pagination.total >= 25 && <option value="25">25 per page</option>}
                        {pagination.total >= 50 && <option value="50">50 per page</option>}
                        {pagination.total >= 100 && <option value="100">100 per page</option>}
                        {pagination.total >= 200 && <option value="200">200 per page</option>}
                        {pagination.total >= 500 && <option value="500">500 per page</option>}
                        <option value="all">Show All</option>
                      </>
                    )}
                    {pagination.total === 0 && (
                      <option value="10">No orders found</option>
                    )}
                  </select>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || isLoading}
                  className="btn btn-primary flex items-center gap-2 px-3 py-2.5 h-12"
                >
                  <FaSync className={refreshing || isLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
              <div className="flex-1 h-12 items-center">
                <div className="form-group mb-0 w-full">
                  <div className="relative flex items-center h-12">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FaSearch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <input
                      type="search"
                      placeholder="Search by ID, Service Name, Category..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="form-field w-full pl-10 pr-10 py-3 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm h-12"
                      autoComplete="off"
                    />
                    {isSearchLoading && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-10">
                        <div className="h-4 w-4 gradient-shimmer rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              {isLoading ? (
                <>
                  {Array.from({ length: 7 }).map((_, idx) => (
                    <div key={idx} className="h-9 w-24 gradient-shimmer rounded-full" />
                  ))}
                </>
              ) : (
                statusFilters.map((filter) => {
                  const IconComponent = filter.icon;
                  const isActive = status === filter.key;
                  const count = getStatusCount(filter.key);

                  return (
                    <button
                      key={filter.key}
                      onClick={() => handleStatusChange(filter.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white ${isActive
                          ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg'
                          : filter.color
                        }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {filter.label} ({count})
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <OrderTable
            orders={orders}
            isLoading={isLoading}
            error={error}
            formatDate={formatDate}
            formatTime={formatTime}
            getStatusBadge={getStatusBadge}
            formatStatusDisplay={formatStatusDisplay}
            localPendingCancelRequests={localPendingCancelRequests}
            onOpenRefillModal={(orderId) => setRefillModal({
              isOpen: true,
              orderId,
              reason: '',
              isLoading: false
            })}
            onOpenCancelModal={(orderId) => setCancelModal({
              isOpen: true,
              orderId,
              reason: '',
              isLoading: false
            })}
            totalPages={totalPages}
            page={page}
            pagination={pagination}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        </div>
      </div>
    </div>
  );
}