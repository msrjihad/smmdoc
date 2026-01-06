'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  FaBox,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaEdit,
  FaEllipsisH,
  FaExclamationCircle,
  FaExternalLinkAlt,
  FaEye,
  FaSearch,
  FaSync,
  FaTimes,
  FaTimesCircle,
} from 'react-icons/fa';
import useSWR from 'swr';

import { useCurrency } from '@/contexts/currency-context';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { formatID, formatNumber, formatPrice } from '@/lib/utils';
import { PriceDisplay } from '@/components/price-display';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios-instance';
import { userOrderApi } from '@/lib/services/user-order-api';
import { useAppDispatch } from '@/lib/store';

const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

const ChangeAllStatusModal = dynamic(() => import('@/components/admin/orders/modals/change-all-status'), {
  ssr: false,
});

const StartCountModal = dynamic(() => import('@/components/admin/orders/modals/start-count'), {
  ssr: false,
});

const MarkPartialModal = dynamic(() => import('@/components/admin/orders/modals/mark-partial'), {
  ssr: false,
});

const UpdateOrderStatusModal = dynamic(() => import('@/components/admin/orders/modals/update-order-status'), {
  ssr: false,
});

const EditOrderUrlModal = dynamic(() => import('@/components/admin/orders/modals/edit-order-url'), {
  ssr: false,
});

const RequestCancelOrderModal = dynamic(() => import('@/components/admin/orders/modals/request-cancel-order'), {
  ssr: false,
});

const OrdersTableContent = dynamic(() => import('@/components/admin/orders/orders-table'), {
  ssr: false,
});

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white"></div>
    </div>
  </div>
);

const GradientTableLoader = () => {
  const rows = Array.from({ length: 10 });
  
  return (
    <div className="lg:block">
      <table className="w-full text-sm min-w-[1200px]">
        <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
          <tr>
            {Array.from({ length: 14 }).map((_, idx) => (
              <th key={idx} className="text-left p-3 text-gray-900 dark:text-gray-100">
                <div className="h-4 rounded w-3/4 gradient-shimmer" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b dark:border-gray-700">
              {Array.from({ length: 14 }).map((_, colIdx) => {
                const widths = ['w-8', 'w-16', 'w-24', 'w-20', 'w-32', 'w-16', 'w-12', 'w-16', 'w-28', 'w-20', 'w-16', 'w-24', 'w-16', 'w-12'];
                return (
                  <td key={colIdx} className="p-3">
                    <div className={`h-4 rounded gradient-shimmer ${widths[colIdx] || 'w-20'}`} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
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
  <div className={`toast toast-${type} toast-enter`}>
    {type === 'success' && <FaCheckCircle className="toast-icon" />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="toast-close">
      <FaTimes className="toast-close-icon" />
    </button>
  </div>
);

interface Order {
  id: number;
  user: {
    id: number;
    email: string;
    name: string;
    username?: string;
    currency: string;
  };
  service: {
    id: number;
    name: string;
    rate: number;
    min_order: number;
    max_order: number;
    providerId?: number;
    providerName?: string;
    providerServiceId?: string;
  };
  category: {
    id: number;
    category_name: string;
  };
  qty: number;
  price: number;
  charge: number;
  profit: number;
  usdPrice: number;
  currency: string;
  status:
    | 'pending'
    | 'processing'
    | 'in_progress'
    | 'completed'
    | 'partial'
    | 'cancelled'
    | 'refunded'
    | 'failed';
  createdAt: string;
  updatedAt: string;
  link: string;
  startCount: number;
  remains: number;
  avg_time: string;
  seller: string;
  mode: string;

  isProviderService?: boolean;
  providerId?: string;
  providerServiceId?: string;
  providerOrderId?: string;
  providerStatus?: string;
  lastSyncAt?: string;
  apiResponse?: string;
  refillRequests?: Array<{
    id: number;
    status: string;
  }>;
  apiProvider?: {
    id: string;
    name: string;
    apiUrl: string;
    status: string;
  };
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayOrders: number;
  statusBreakdown: Record<string, number>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const AdminOrdersPage = () => {
  const { appName } = useAppNameWithFallback();
  const dispatch = useAppDispatch();

  useEffect(() => {
    setPageTitle('All Orders', appName);
  }, [appName]);

  const { availableCurrencies } = useCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    statusBreakdown: {},
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [editStartCountDialog, setEditStartCountDialog] = useState<{
    open: boolean;
    orderId: string | number;
    currentCount: number;
  }>({
    open: false,
    orderId: '',
    currentCount: 0,
  });
  const [updateStatusDialog, setUpdateStatusDialog] = useState<{
    open: boolean;
    orderId: string | number;
    currentStatus: string;
    isSelfService?: boolean;
  }>({
    open: false,
    orderId: '',
    currentStatus: '',
    isSelfService: false,
  });
  const [markPartialDialog, setMarkPartialDialog] = useState<{
    open: boolean;
    orderId: string | number;
  }>({
    open: false,
    orderId: '',
  });

  const [orderErrorsDialog, setOrderErrorsDialog] = useState<{
    open: boolean;
    orderId: string | number;
  }>({
    open: false,
    orderId: '',
  });

  const [editOrderUrlDialog, setEditOrderUrlDialog] = useState<{
    open: boolean;
    orderId: string | number;
    currentLink: string;
  }>({
    open: false,
    orderId: '',
    currentLink: '',
  });

  const [requestCancelOrderDialog, setRequestCancelOrderDialog] = useState<{
    open: boolean;
    orderId: number;
    orderPrice: number;
  }>({
    open: false,
    orderId: 0,
    orderPrice: 0,
  });

  const [bulkStatusDialog, setBulkStatusDialog] = useState<{
    open: boolean;
  }>({
    open: false,
  });
  const [bulkStatus, setBulkStatus] = useState('');

  const calculateStatusCounts = (ordersData: Order[]) => {
    const counts = {
      pending: 0,
      processing: 0,
      completed: 0,
      partial: 0,
      cancelled: 0,
      in_progress: 0,
      refunded: 0,
      failed: 0,
    };

    ordersData.forEach((order) => {
      if (order.status && counts.hasOwnProperty(order.status)) {
        counts[order.status as keyof typeof counts]++;
      }
    });

    return {
      pending: counts.pending,
      processing: counts.processing + counts.in_progress,
      completed: counts.completed,
      partial: counts.partial,
      cancelled: counts.cancelled + counts.refunded,
      failed: counts.failed,
    };
  };

  const isMountedRef = useRef<boolean>(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshStatsRef = useRef<(() => void) | null>(null);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const ordersUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(searchTerm && { search: searchTerm }),
    });
    return `/api/admin/orders?${params.toString()}`;
  }, [pagination.page, pagination.limit, statusFilter, searchTerm]);

  const {
    data: ordersData,
    error: ordersError,
    isLoading: ordersLoading,
    mutate: refreshOrders,
  } = useSWR(ordersUrl, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,
    dedupingInterval: 60000,
    keepPreviousData: true,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    onError: (error) => {
      console.error('SWR orders fetch error:', error);
      showToast('Failed to fetch orders', 'error');
    },
  });

  const {
    data: statsData,
    error: statsError,
    isLoading: statsLoading,
    mutate: refreshStats,
  } = useSWR('/api/admin/orders/stats?period=all', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,
    dedupingInterval: 30000,
    keepPreviousData: true,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    onError: (error) => {
      console.error('SWR stats fetch error:', error);
    },
  });

  useEffect(() => {
    refreshStatsRef.current = refreshStats;
  }, [refreshStats]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;

    const connectRealtime = () => {
      try {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        eventSource = new EventSource('/api/admin/orders/realtime');
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('✅ Real-time sync connected');
          reconnectAttempts = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'connected') {
              console.log('Real-time sync:', data.message);
            } else if (data.type === 'order_updated') {
              const updatedOrder = data.data;
              console.log('Order updated via real-time:', updatedOrder.id);

              setOrders((prevOrders) => {
                const orderIndex = prevOrders.findIndex((o) => o.id === updatedOrder.id);
                if (orderIndex !== -1) {
                  const newOrders = [...prevOrders];
                  newOrders[orderIndex] = {
                    ...newOrders[orderIndex],
                    status: updatedOrder.status,
                    providerStatus: updatedOrder.providerStatus,
                    startCount: updatedOrder.startCount,
                    remains: updatedOrder.remains,
                    charge: updatedOrder.charge,
                    lastSyncAt: updatedOrder.lastSyncAt,
                  };
                  return newOrders;
                }
                return prevOrders;
              });

              if (refreshStatsRef.current) {
                refreshStatsRef.current();
              }
              dispatch(userOrderApi.util.invalidateTags(['UserOrders']));
            } else if (data.type === 'sync_progress') {
              const progress = data.progress;
              if (progress.synced > 0) {
                console.log(`Sync progress: ${progress.synced}/${progress.total} synced`);
              }
            } else if (data.type === 'ping') {
            }
          } catch (error) {
            console.error('Error parsing real-time message:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('Real-time sync error:', error);
          eventSource?.close();

          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Reconnecting real-time sync (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
            reconnectTimeoutRef.current = setTimeout(() => {
              connectRealtime();
            }, reconnectDelay * reconnectAttempts);
          } else {
            console.error('Max reconnection attempts reached. Real-time sync disabled.');
          }
        };
      } catch (error) {
        console.error('Error setting up real-time sync:', error);
      }
    };

    connectRealtime();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (hasSyncedRef.current) return;
    
    const syncProviderOrders = async () => {
      hasSyncedRef.current = true;
      try {
        const syncPromise = fetch('/api/admin/provider-sync', {
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
          const syncedCount = syncResult.data?.syncedCount || 0;
          const totalProcessed = syncResult.data?.totalProcessed || 0;
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

        await Promise.all([
          refreshOrders(undefined, { revalidate: true }),
          refreshStats(undefined, { revalidate: true })
        ]);

        dispatch(userOrderApi.util.invalidateTags(['UserOrders']));
      } catch (error) {
        console.error('Error syncing provider orders on page reload:', error);
        await Promise.all([
          refreshOrders(undefined, { revalidate: true }),
          refreshStats(undefined, { revalidate: true })
        ]).catch(refreshError => {
          console.error('Error refreshing after sync failure:', refreshError);
        });
      }
    };

    syncProviderOrders();
  }, [refreshOrders, refreshStats, dispatch]);

  useEffect(() => {
    if (ordersData?.success && ordersData.data) {
      const transformed = (ordersData.data || []).map((o: any) => ({
        ...o,
        mode:
          o?.service?.providerId && o?.service?.providerServiceId
            ? 'Auto'
            : 'Manual',
      }));
      setOrders(transformed);
      setPagination(ordersData.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });

      const statusCounts = calculateStatusCounts(ordersData.data || []);
      setStats(prev => ({
        ...prev,
        pendingOrders: statusCounts.pending,
        processingOrders: statusCounts.processing,
        completedOrders: statusCounts.completed,
        totalOrders: ordersData.pagination?.total || prev.totalOrders,
      }));
    } else if (ordersError) {
      setOrders([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    }
  }, [ordersData, ordersError]);

  useEffect(() => {
    if (statsData?.success && statsData.data) {
      const data = statsData.data;
      const statusBreakdown: Record<string, number> = {};
      if (data.statusBreakdown && Array.isArray(data.statusBreakdown)) {
        data.statusBreakdown.forEach((item: any) => {
          statusBreakdown[item.status] = item.count || 0;
        });
      }

      const processedStats = {
        totalOrders: data.overview?.totalOrders || pagination.total,
        pendingOrders: statusBreakdown.pending || 0,
        processingOrders: statusBreakdown.processing || 0,
        completedOrders: statusBreakdown.completed || 0,
        totalRevenue: data.overview?.totalRevenue || 0,
        todayOrders: data.dailyTrends?.[0]?.orders || 0,
        statusBreakdown: statusBreakdown,
      };

      setStats(processedStats);
    }
  }, [statsData, statsError, pagination.total]);

  useEffect(() => {
    if (!isMountedRef.current) return;

    let syncInProgress = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let initialDelayTimeout: ReturnType<typeof setTimeout> | null = null;

    const syncProviderOrders = async () => {
      if (!isMountedRef.current || syncInProgress) return;
      syncInProgress = true;

      try {
        const syncResponse = await fetch('/api/admin/provider-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ syncAll: true }),
        });

        const syncResult = await syncResponse.json();
        if (syncResult.success && isMountedRef.current) {
          refreshOrders();
          refreshStats();
        }
      } catch (error) {
        console.error('Error syncing provider orders:', error);
      } finally {
        syncInProgress = false;
      }
    };

    initialDelayTimeout = setTimeout(() => {
      if (!isMountedRef.current) return;
      intervalId = setInterval(() => {
        syncProviderOrders();
      }, 30000);
    }, 10000);

    return () => {
      if (initialDelayTimeout) clearTimeout(initialDelayTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const renderCountRef = useRef(0);
  useEffect(() => {
    renderCountRef.current += 1;
    if (process.env.NODE_ENV === 'development' && renderCountRef.current % 50 === 0) {
      console.warn('[AdminOrdersPage] high render count:', renderCountRef.current);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />;
      case 'processing':
      case 'in_progress':
        return <FaSync className="h-3 w-3 text-blue-500 dark:text-blue-400" />;
      case 'completed':
        return <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />;
      case 'cancelled':
      case 'refunded':
        return <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />;
      case 'partial':
        return <FaExclamationCircle className="h-3 w-3 text-orange-500 dark:text-orange-400" />;
      case 'failed':
        return <FaTimesCircle className="h-3 w-3 text-gray-500 dark:text-gray-400" />;
      default:
        return <FaClock className="h-3 w-3 text-gray-500 dark:text-gray-400" />;
    }
  };

  const calculateProgress = (qty: number, remains: number) => {
    return qty > 0 ? Math.round(((qty - remains) / qty) * 100) : 0;
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencyData = availableCurrencies?.find(c => c.code === currency);
    const symbol = currencyData?.symbol || '$';
    
    if (currency === 'USD') {
      return `$${formatPrice(amount, 2)}`;
    }
    
    return `${symbol}${formatPrice(amount, 2)}`;
  };

  const handleSelectAll = () => {
    const selectableOrders = orders.filter((order) => {
      const status = order.status?.toLowerCase();
      return !['cancelled', 'canceled', 'completed'].includes(status);
    });
    
    const selectableIds = selectableOrders.map((order) => order.id);
    
    if (selectedOrders.length === selectableIds.length && selectableIds.length > 0) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(selectableIds);
    }
  };

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' | 'pending' = 'success',
      duration: number = 4000
    ) => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
      
      setToastNotification({ message, type });
      
      if (duration > 0) {
        toastTimeoutRef.current = setTimeout(() => {
          setToastNotification(null);
          toastTimeoutRef.current = null;
        }, duration);
      }
    },
    []
  );

  const handleRefresh = useCallback(async () => {
    try {
      showToast('Refreshing orders...', 'pending');
      
      await Promise.all([
        refreshOrders(undefined, { revalidate: true }),
        refreshStats(undefined, { revalidate: true })
      ]);
      
      dispatch(userOrderApi.util.invalidateTags(['UserOrders']));

      showToast('Syncing provider orders...', 'pending');

      const syncPromise = fetch('/api/admin/provider-sync', {
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
        showToast('Sync is taking longer than expected, refreshing orders...', 'info');
      } else if (syncResult.success) {
        const syncedCount = syncResult.data?.syncedCount || 0;
        const totalProcessed = syncResult.data?.totalProcessed || 0;
        if (syncedCount > 0) {
          showToast(`Synced ${syncedCount} of ${totalProcessed} provider order(s)`, 'success');
        } else if (totalProcessed > 0) {
        } else {
        }
      } else {
        console.warn('Provider sync had issues:', syncResult.error);
        showToast('Some provider orders may not have synced', 'info');
      }

      await Promise.all([
        refreshOrders(undefined, { revalidate: true }),
        refreshStats(undefined, { revalidate: true })
      ]);

      dispatch(userOrderApi.util.invalidateTags(['UserOrders']));

      showToast('All orders synced and refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing orders:', error);
      showToast('Error refreshing orders', 'error');
      
      try {
        await Promise.all([
          refreshOrders(undefined, { revalidate: true }),
          refreshStats(undefined, { revalidate: true })
        ]);
        dispatch(userOrderApi.util.invalidateTags(['UserOrders']));
      } catch (refreshError) {
        console.error('Error refreshing after sync failure:', refreshError);
      }
    }
  }, [refreshOrders, refreshStats, showToast, dispatch]);

  const handleDeleteOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showToast('Order deleted successfully', 'success');
        refreshOrders();
        refreshStats();
        setDeleteDialogOpen(false);
        setOrderToDelete(null);
      } else {
        showToast(result.error || 'Failed to delete order', 'error');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      showToast('Error deleting order', 'error');
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      const response = await fetch('/api/admin/orders/bulk/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds: selectedOrders,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          `${selectedOrders.length} orders status updated to ${newStatus}`,
          'success'
        );
        refreshOrders();
        refreshStats();
        setSelectedOrders([]);
        setBulkStatusDialog({ open: false });
        setBulkStatus('');
      } else {
        showToast(result.error || 'Failed to update orders status', 'error');
      }
    } catch (error) {
      console.error('Error updating orders status:', error);
      showToast('Error updating orders status', 'error');
    }
  };

  const openMarkPartialDialog = (orderId: string | number) => {
    setMarkPartialDialog({ open: true, orderId });
  };

  const openEditStartCountDialog = (orderId: string | number, currentCount: number) => {
    setEditStartCountDialog({ open: true, orderId, currentCount });
  };

  const openUpdateStatusDialog = (orderId: string | number, currentStatus: string) => {
    const order = orders.find(o => o.id === Number(orderId));
    const isSelfService = order ? !order.service?.providerId : false;
    setUpdateStatusDialog({ open: true, orderId, currentStatus, isSelfService });
  };

  const openRequestCancelOrderDialog = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setRequestCancelOrderDialog({
        open: true,
        orderId: order.id,
        orderPrice: order.charge || order.price || 0,
      });
    }
  };

  const handleRequestCancelOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/request-cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        showToast('Cancel request sent to provider successfully', 'success');
        refreshOrders();
        refreshStats();
        setRequestCancelOrderDialog({ open: false, orderId: 0, orderPrice: 0 });
      } else {
        showToast(result.error || 'Failed to request order cancellation', 'error');
      }
    } catch (error) {
      console.error('Error requesting cancel order:', error);
      showToast('Error requesting order cancellation', 'error');
    }
  };

  const openOrderErrorsDialog = (orderId: string | number) => {
    setOrderErrorsDialog({ open: true, orderId });
  };

  const openEditOrderUrlDialog = (orderId: string | number, currentLink: string) => {
    setEditOrderUrlDialog({ open: true, orderId, currentLink });
  };

  const handleViewOrderErrors = (orderId: string | number) => {
    showToast('Order Errors modal coming soon', 'info');
  };

  const handleEditOrderUrl = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      openEditOrderUrlDialog(orderId, order.link || '');
    }
  };

  const openBulkStatusDialog = () => {
    setBulkStatusDialog({ open: true });
    setBulkStatus('');
  };

  const handleResendOrder = async (orderId: number) => {
    showToast('Resending order to provider...', 'pending', 0);
    
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        showToast('Order resent successfully', 'success');
        refreshOrders();
        refreshStats();
      } else {
        if (result.errorType === 'insufficient_balance' || 
            (result.error && result.error.toLowerCase().includes('insufficient balance'))) {
          showToast('Insufficient balance', 'error');
        } else {
          showToast(result.error || 'Failed to resend order', 'error');
        }
      }
    } catch (error) {
      console.error('Error resending order:', error);
      showToast('Error resending order', 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="toast-container">
        {toastNotification && (
        <Toast
          message={toastNotification.message}
          type={toastNotification.type}
          onClose={() => setToastNotification(null)}
        />
      )}
      </div>

      <div className="page-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="card card-padding">
            <div className="card-content">
              <div className="card-icon">
                <FaBox />
              </div>
              <div>
                <h3 className="card-title">Total Orders</h3>
                {statsLoading ? (
                  <div className="h-8 w-16 gradient-shimmer rounded" />
                ) : (
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.totalOrders}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card card-padding">
            <div className="card-content">
              <div className="card-icon">
                <FaClock />
              </div>
              <div>
                <h3 className="card-title">Pending Orders</h3>
                {statsLoading ? (
                  <div className="h-8 w-16 gradient-shimmer rounded" />
                ) : (
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.pendingOrders}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card card-padding">
            <div className="card-content">
              <div className="card-icon">
                <FaCheckCircle />
              </div>
              <div>
                <h3 className="card-title">Completed Orders</h3>
                {statsLoading ? (
                  <div className="h-8 w-16 gradient-shimmer rounded" />
                ) : (
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.completedOrders}
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
                <h3 className="card-title">Total Revenue</h3>
                {statsLoading ? (
                  <div className="h-8 w-20 gradient-shimmer rounded" />
                ) : (
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    <PriceDisplay
                      amount={stats.totalRevenue || 0}
                      originalCurrency="USD"
                      className="text-2xl font-bold text-purple-600 dark:text-purple-400"
                    />
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <select
                value={pagination.limit}
                onChange={(e) =>
                  setPagination((prev) => ({
                    ...prev,
                    limit:
                      e.target.value === 'all'
                        ? 1000
                        : parseInt(e.target.value),
                    page: 1,
                  }))
                }
                className="pl-4 pr-8 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="all">All</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={ordersLoading || statsLoading}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
              >
                <FaSync
                  className={
                    ordersLoading || statsLoading ? 'animate-spin' : ''
                  }
                />
                Refresh
              </button>

            </div>
            <div className="flex flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder={`Search ${
                    statusFilter === 'all' ? 'all' : statusFilter
                  } orders...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header" style={{ padding: '24px 24px 0 24px' }}>
            <div className="mb-4">
              <div className="block space-y-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'all'
                      ? 'bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'all'
                        ? 'bg-white/20'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    }`}
                  >
                    {stats.totalOrders}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'pending'
                      ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Pending
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'pending'
                        ? 'bg-white/20'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}
                  >
                    {stats.pendingOrders}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('processing')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'processing'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Processing
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'processing'
                        ? 'bg-white/20'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}
                  >
                    {stats.processingOrders}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'completed'
                      ? 'bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Completed
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'completed'
                        ? 'bg-white/20'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}
                  >
                    {stats.completedOrders}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('partial')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'partial'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Partial
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'partial'
                        ? 'bg-white/20'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                    }`}
                  >
                    {stats.statusBreakdown?.partial || 0}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'cancelled'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Cancelled
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'cancelled'
                        ? 'bg-white/20'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {stats.statusBreakdown?.cancelled || 0}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('failed')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'failed'
                      ? 'bg-gradient-to-r from-red-600 to-red-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Failed
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'failed'
                        ? 'bg-white/20'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {stats.statusBreakdown?.failed || 0}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-2 py-4 border-b dark:border-gray-700 mb-4">
                <span
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {selectedOrders.length} selected
                </span>
                <button
                  onClick={openBulkStatusDialog}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <FaEdit />
                  Change All Orders Status
                </button>
              </div>
            )}

            {ordersLoading ? (
              <div className="py-6">
                <GradientTableLoader />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <FaBox
                  className="h-16 w-16 mx-auto mb-4"
                  style={{ color: 'var(--text-muted)' }}
                />
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  No information was found for you.
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No orders match your current filters or no orders exist yet.
                </p>
              </div>
            ) : (
              <>
                <OrdersTableContent
                  orders={orders}
                  selectedOrders={selectedOrders}
                  onSelectOrder={handleSelectOrder}
                  onSelectAll={handleSelectAll}
                  onResendOrder={handleResendOrder}
                  onEditStartCount={(orderId: number, currentCount: number) => {
                    openEditStartCountDialog(orderId, currentCount);
                  }}
                  onMarkPartial={(orderId: number) => {
                    openMarkPartialDialog(orderId);
                  }}
                  onUpdateStatus={(orderId: number, currentStatus: string) => {
                    openUpdateStatusDialog(orderId, currentStatus);
                  }}
                  onViewOrderErrors={(orderId: number) => {
                    handleViewOrderErrors(orderId);
                  }}
                  onEditOrderUrl={(orderId: number) => {
                    handleEditOrderUrl(orderId);
                  }}
                  onRequestCancelOrder={(orderId: number) => {
                    openRequestCancelOrderDialog(orderId);
                  }}
                  formatID={formatID}
                  formatNumber={formatNumber}
                  formatPrice={formatPrice}
                  getStatusIcon={getStatusIcon}
                  calculateProgress={calculateProgress}
                />
                <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700 px-6">
                  <div
                    className="text-sm mb-4 md:mb-0"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {ordersLoading ? (
                      <div className="flex items-center gap-2">
                        <span>Loading pagination...</span>
                      </div>
                    ) : (
                      `Showing ${formatNumber(
                        (pagination.page - 1) * pagination.limit + 1
                      )} to ${formatNumber(
                        Math.min(
                          pagination.page * pagination.limit,
                          pagination.total
                        )
                      )} of ${formatNumber(pagination.total)} orders`
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                      }
                      disabled={!pagination.hasPrev || ordersLoading}
                      className="btn btn-secondary"
                    >
                      Previous
                    </button>
                    <span
                      className="text-sm px-4"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {ordersLoading ? (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        `Page ${formatNumber(
                          pagination.page
                        )} of ${formatNumber(pagination.totalPages)}`
                      )}
                    </span>
                    <button
                      onClick={() =>
                        setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))
                      }
                      disabled={!pagination.hasNext || ordersLoading}
                      className="btn btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <ChangeAllStatusModal
        isOpen={bulkStatusDialog.open}
        onClose={() => setBulkStatusDialog({ open: false })}
        selectedOrdersCount={selectedOrders.length}
        bulkStatus={bulkStatus}
        setBulkStatus={setBulkStatus}
        onUpdate={handleBulkStatusUpdate}
      />
      <MarkPartialModal
        isOpen={markPartialDialog.open}
        onClose={() => setMarkPartialDialog({ open: false, orderId: '' })}
        orderId={markPartialDialog.orderId}
        onSuccess={() => {
          setMarkPartialDialog({ open: false, orderId: '' });
          refreshOrders();
          refreshStats();
          showToast('Order marked as partial successfully');
        }}
        showToast={showToast}
      />
      <StartCountModal
        isOpen={editStartCountDialog.open}
        onClose={() => setEditStartCountDialog({ open: false, orderId: '', currentCount: 0 })}
        orderId={editStartCountDialog.orderId}
        currentCount={editStartCountDialog.currentCount}
        onSuccess={() => {
          setEditStartCountDialog({ open: false, orderId: '', currentCount: 0 });
          refreshOrders();
          refreshStats();
          showToast('Start count updated successfully');
        }}
        showToast={showToast}
      />
      <UpdateOrderStatusModal
        isOpen={updateStatusDialog.open}
        onClose={() => setUpdateStatusDialog({ open: false, orderId: '', currentStatus: '', isSelfService: false })}
        orderId={updateStatusDialog.orderId}
        currentStatus={updateStatusDialog.currentStatus}
        isSelfService={updateStatusDialog.isSelfService}
        onSuccess={() => {
          setUpdateStatusDialog({ open: false, orderId: '', currentStatus: '', isSelfService: false });
          refreshOrders();
          refreshStats();
          showToast('Order status updated successfully');
        }}
        showToast={showToast}
      />
      <EditOrderUrlModal
        isOpen={editOrderUrlDialog.open}
        onClose={() => setEditOrderUrlDialog({ open: false, orderId: '', currentLink: '' })}
        orderId={editOrderUrlDialog.orderId}
        currentLink={editOrderUrlDialog.currentLink}
        onSuccess={() => {
          setEditOrderUrlDialog({ open: false, orderId: '', currentLink: '' });
          refreshOrders();
          refreshStats();
          showToast('Order link updated successfully');
        }}
        showToast={showToast}
      />
      <RequestCancelOrderModal
        isOpen={requestCancelOrderDialog.open}
        onClose={() => setRequestCancelOrderDialog({ open: false, orderId: 0, orderPrice: 0 })}
        orderId={requestCancelOrderDialog.orderId}
        orderPrice={requestCancelOrderDialog.orderPrice}
        onConfirm={handleRequestCancelOrder}
        showToast={showToast}
      />
    </div>
  );
};

export default AdminOrdersPage;