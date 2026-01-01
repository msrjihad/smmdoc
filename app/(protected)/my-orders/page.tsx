'use client';

import { useCurrency } from '@/contexts/currency-context';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { useGetUserOrdersQuery } from '@/lib/services/user-order-api';
import { formatID, formatNumber, formatPrice, formatCount } from '@/lib/utils';
import moment from 'moment';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaBan,
  FaCheck,
  FaCheckCircle,
  FaCircleNotch,
  FaClipboardList,
  FaClock,
  FaExclamationTriangle,
  FaExternalLinkAlt,
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

const CancelModal = ({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  reason,
  setReason,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderId: number | null;
  reason: string;
  setReason: (reason: string) => void;
  isLoading?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">
          Cancel Order #{formatID(orderId || 0)}
        </h3>

        <div className="mb-4">
          <label className="form-label mb-2">
            Cancellation Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for cancelling this order..."
            className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none"
            rows={4}
            required
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Keep Order
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim() || isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Cancelling...' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

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

const RefillModal = ({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  reason,
  setReason,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderId: number | null;
  reason: string;
  setReason: (reason: string) => void;
  isLoading?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Request Refill
          </h3>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            You are requesting a refill for Order #{orderId ? formatID(orderId) : 'N/A'}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the issue (e.g., followers dropped, likes decreased, etc.)"
            className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OrdersList() {
  const { appName } = useAppNameWithFallback();

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

  const { currency, availableCurrencies, currentCurrencyData } = useCurrency();

  const { data, isLoading, error, refetch } = useGetUserOrdersQuery({
    page,
    limit,
    status,
    search: debouncedSearch,
  });

  useEffect(() => {
    setPageTitle('My Orders', appName);
  }, [appName]);

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
              refetch();
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

        refetch();
      } catch (error) {
        console.error('Error syncing provider orders on page reload:', error);
        refetch();
      }
    };

    syncProviderOrders();
  }, [refetch]);

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
          reason: refillModal.reason.trim() || 'Customer requested refill due to drop in count'
        })
      });

      const result = await response.json();

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
        setToastMessage({
          message: result.error || 'Failed to submit refill request',
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
      <CancelModal
        isOpen={cancelModal.isOpen}
        onClose={handleCancelClose}
        onConfirm={handleCancelConfirm}
        orderId={cancelModal.orderId}
        reason={cancelModal.reason}
        setReason={(reason) => setCancelModal(prev => ({ ...prev, reason }))}
        isLoading={cancelModal.isLoading || false}
      />
      <RefillModal
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
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)] rounded-t-lg">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 first:rounded-tl-lg">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Link
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Charge
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Start count
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Quantity
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Service
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Remains
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 last:rounded-tr-lg">
                    Quick Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4">
                          <div className="h-4 w-16 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-20 gradient-shimmer rounded mb-1" />
                          <div className="h-3 w-12 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-32 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-16 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-12 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-12 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="h-4 w-40 gradient-shimmer rounded mb-1" />
                          <div className="h-3 w-24 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-12 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-6 w-20 gradient-shimmer rounded-full" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-6 w-16 gradient-shimmer rounded" />
                        </td>
                      </tr>
                    ))}
                  </>
                ) : error ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-red-500 dark:text-red-400">
                      <div className="flex flex-col items-center">
                        <FaExclamationTriangle className="text-4xl mb-4" />
                        <div className="text-lg font-medium">Error loading orders!</div>
                        <div className="text-sm mt-2">Please try refreshing the page</div>
                      </div>
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((order: any, index: number) => {
                    const isLastRow = index === orders.length - 1;
                    return (
                      <tr
                        key={order.id}
                        className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] ${isLastRow ? 'last:border-b-0' : ''
                          }`}
                      >
                        <td
                          className={`py-3 px-4 ${isLastRow ? 'first:rounded-bl-lg' : ''
                            }`}
                        >
                          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                            {order.id}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {moment(order.createdAt).format('DD/MM/YYYY')}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {moment(order.createdAt).format('HH:mm')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-[120px]">
                            <a
                              href={order.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs flex items-center hover:underline"
                              title={order.link}
                            >
                              <span className="truncate mr-1">
                                {order.link?.replace(/^https?:\/\//, '') ||
                                  'N/A'}
                              </span>
                              <FaExternalLinkAlt className="w-3 h-3 flex-shrink-0" />
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {(() => {

                              const usdPrice = order.usdPrice || 0;

                              if (!currentCurrencyData) {
                                return `$${formatPrice(usdPrice)}`;
                              }

                              let displayAmount = 0;

                              if (currentCurrencyData.code === 'USD') {
                                displayAmount = usdPrice;
                              } else if (currentCurrencyData.code === 'BDT') {
                                displayAmount = usdPrice * (order.user?.dollarRate || 121.52);
                              } else {

                                displayAmount = usdPrice * currentCurrencyData.rate;
                              }

                              return `${currentCurrencyData.symbol}${formatPrice(displayAmount)}`;
                            })()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {formatCount(order.startCount || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatCount(order.qty || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {order.service?.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {order.category?.category_name || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {formatCount(order.remains || order.qty || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                              order.providerStatus === 'forward_failed' && order.status === 'failed' ? 'pending' : order.status
                            )}`}
                          >
                            {formatStatusDisplay(
                              order.providerStatus === 'forward_failed' && order.status === 'failed' ? 'pending' : order.status
                            )}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 ${isLastRow ? 'last:rounded-br-lg' : ''
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            {order.status === 'completed' && (
                              <>
                                {order.service?.refill && (() => {
                                  const refillDays = order.service?.refillDays;
                                  const completionTime = new Date(order.updatedAt).getTime();
                                  const currentTime = new Date().getTime();
                                  
                                  let isRefillTimeValid = true;

                                  if (refillDays) {
                                    const daysSinceCompletion = Math.floor(
                                      (currentTime - completionTime) / (1000 * 60 * 60 * 24)
                                    );
                                    isRefillTimeValid = daysSinceCompletion <= refillDays;
                                  }

                                  const refillRequests = (order as any).refillRequests || [];
                                  const hasRefillRequest = refillRequests.some((req: any) => 
                                    req.status === 'pending' || req.status === 'approved'
                                  );

                                  const canRefill = isRefillTimeValid && !hasRefillRequest;

                                  return (
                                    <button
                                      onClick={() => {
                                        if (canRefill) {
                                          setRefillModal({
                                            isOpen: true,
                                            orderId: order.id,
                                            reason: '',
                                            isLoading: false
                                          });
                                        }
                                      }}
                                      disabled={!canRefill}
                                      className={`text-xs px-2 py-1 border rounded transition-colors ${
                                        canRefill
                                          ? 'text-green-600 hover:text-green-800 border-green-300 hover:bg-green-50 cursor-pointer'
                                          : 'text-gray-400 border-gray-300 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                                      }`}
                                      title={
                                        hasRefillRequest
                                          ? 'A refill request has already been submitted for this order'
                                          : !isRefillTimeValid
                                          ? `Refill period has expired. Refill is only available for ${refillDays} days after order completion.`
                                          : 'Refill Order'
                                      }
                                    >
                                      {hasRefillRequest ? 'Refill Requested' : 'Refill'}
                                    </button>
                                  );
                                })()}
                                {order.service?.id && (
                                  <button
                                    onClick={() => router.push(`/new-order?sId=${order.service.id}`)}
                                    className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                                    title="Order Again"
                                  >
                                    Order Again
                                  </button>
                                )}
                              </>
                            )}
                            {order.status === 'pending' && order.service?.cancel && (() => {
                              const hasPendingCancelRequest =
                                (order.cancelRequests && order.cancelRequests.some((req: CancelRequest) => req.status === 'pending')) ||
                                localPendingCancelRequests.has(order.id);

                              const hasDeclinedCancelRequest =
                                order.cancelRequests && order.cancelRequests.some((req: CancelRequest) => req.status === 'declined');

                              if (hasDeclinedCancelRequest) {
                                return (
                                  <button
                                    disabled
                                    className="text-gray-500 text-xs px-2 py-1 border border-gray-400 rounded bg-gray-100 opacity-70 cursor-not-allowed"
                                    title="Cancel request was declined"
                                  >
                                    Cancel Declined
                                  </button>
                                );
                              }

                              return hasPendingCancelRequest ? (
                                <button
                                  disabled
                                  className="text-gray-400 text-xs px-2 py-1 border border-gray-300 rounded bg-gray-50 opacity-60 cursor-not-allowed"
                                  title="Cancel request submitted"
                                >
                                  Cancel Requested
                                </button>
                              ) : (
                                <button
                                  onClick={() => setCancelModal({
                                    isOpen: true,
                                    orderId: order.id,
                                    reason: '',
                                    isLoading: false
                                  })}
                                  className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                                  title="Cancel Order"
                                >
                                  Cancel
                                </button>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        <FaClipboardList className="text-4xl text-gray-400 dark:text-gray-500 mb-4" />
                        <div className="text-lg font-medium dark:text-gray-300">
                          No results found!
                        </div>
                        <div className="text-sm dark:text-gray-400">
                          Try adjusting your search or filter criteria
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page <span className="font-medium">{page}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
                {' '}({pagination.total || 0} orders total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={page === 1 || isLoading}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={page === totalPages || isLoading}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}