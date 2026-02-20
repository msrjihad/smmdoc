'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    FaCheckCircle,
    FaClock,
    FaExclamationCircle,
    FaExternalLinkAlt,
    FaEye,
    FaRedo,
    FaSearch,
    FaSync,
    FaTimes,
    FaTimesCircle,
    FaEllipsisH,
    FaExclamationTriangle
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { formatID, formatNumber, formatPrice } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import { PriceDisplay } from '@/components/price-display';
import RefillRequestDetailsModal from '@/components/admin/orders/refill-requests/modals/refill-request-details';
import CreateRefillOrderModal from '@/components/admin/orders/refill-requests/modals/create-refill-order';
import RefillTable from '@/components/admin/orders/refill-requests/refill-table';

const cleanLinkDisplay = (link: string): string => {
  if (!link) return link;
  let cleaned = link;
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./i, '');
  return cleaned;
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
    balance: number;
  };
  service: {
    id: number;
    name: string;
    rate: number;
    min_order: number;
    max_order: number;
    status: string;
    provider?: string;
    providerId?: number | null;
  };
  category: {
    id: number;
    category_name: string;
  };
  qty: number;
  price: number;
  charge: number;
  usdPrice: number;
  currency: string;
  status: 'completed' | 'partial';
  createdAt: string;
  updatedAt: string;
  link: string;
  startCount: number;
  remains: number;
  avg_time: string;
  providerOrderId?: string | null;
  refillRequest?: {
    id: string;
    reason: string;
    status: string;
    adminNotes?: string;
    processedBy?: string;
    processedAt?: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface RefillInfo {
  eligible: boolean;
  reason?: string;
  order: {
    id: number;
    status: string;
    totalQuantity: number;
    remainingQuantity: number;
    deliveredQuantity: number;
    startCount: number;
  };
  service: {
    id: number;
    name: string;
    rate: number;
    status: string;
    minOrder: number;
    maxOrder: number;
  };
  user: {
    balance: number;
    currency: string;
  };
  refillOptions: {
    full: {
      quantity: number;
      costUsd: number;
      costBdt: number;
      cost: number;
      affordable: boolean;
    };
    remaining: {
      quantity: number;
      costUsd: number;
      costBdt: number;
      cost: number;
      affordable: boolean;
    };
  };
}

interface RefillOrderStats {
  totalEligible: number;
  partialOrders: number;
  completedOrders: number;
  todayRefills: number;
  totalRefillAmount: number;
  statusBreakdown?: Record<string, number>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const RefillOrdersPage = () => {
  const { appName } = useAppNameWithFallback();
  const userDetails = useSelector((state: any) => state.userDetails);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');

  useEffect(() => {
    setPageTitle('Refill Orders', appName);
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
      month: '2-digit',
      day: '2-digit',
      timeZone: userTimezone,
    });
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<RefillOrderStats>({
    totalEligible: 0,
    partialOrders: 0,
    completedOrders: 0,
    todayRefills: 0,
    totalRefillAmount: 0,
    statusBreakdown: {},
  });

  const refillStatusFilter = searchParams.get('status') || 'all';
  const searchTerm = searchParams.get('search') || '';

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const updateQueryParams = useCallback((updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams();
    
    const newStatus = 'status' in updates 
      ? (updates.status === 'all' || updates.status === null ? null : updates.status)
      : (refillStatusFilter !== 'all' ? refillStatusFilter : null);
    const newSearch = 'search' in updates 
      ? (updates.search === null || updates.search === '' ? null : updates.search)
      : (searchTerm || null);
    
    if (newStatus && newStatus !== 'all' && newStatus !== null && newStatus !== '') {
      params.set('status', String(newStatus));
    }
    
    if (newSearch && newSearch !== null && newSearch !== '') {
      params.set('search', String(newSearch));
    }
    
    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : window.location.pathname, { scroll: false });
    
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [refillStatusFilter, searchTerm, router]);

  const [searchInput, setSearchInput] = useState(searchTerm);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      updateQueryParams({ search: value });
    }, 500);
  }, [updateQueryParams]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [statsLoading, setStatsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [refillDialogOpen, setRefillDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refillInfo, setRefillInfo] = useState<RefillInfo | null>(null);
  const [processing, setProcessing] = useState(false);

  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    order: Order | null;
  }>({
    open: false,
    order: null,
  });

  const fetchEligibleOrders = async () => {
    try {
      setOrdersLoading(true);

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(refillStatusFilter !== 'all' && { status: refillStatusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      console.log('Fetching refill orders with params:', queryParams.toString());

      const response = await fetch(`/api/admin/refill-requests?${queryParams}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to fetch eligible orders');
      }

      console.log('Refill requests fetched successfully:', result);

      const transformedOrders = (result.data || [])
        .filter((request: any, index: number, self: any[]) =>

          index === self.findIndex(r => r.order?.id === request.order?.id)
        )
        .map((request: any) => {
          const service = request.order?.service;
          const isSelfService = !service?.providerId && !service?.providerName;
          const providerName = isSelfService ? 'Self' : (service?.providerName || 'API Provider');
          
          return {
            id: request.order?.id || 0,
            qty: request.order?.qty || 0,
            remains: request.order?.remains || 0,
            price: request.order?.price || 0,
            usdPrice: request.order?.usdPrice || 0,
            link: request.order?.link || '',
            status: request.order?.status || 'unknown',
            createdAt: request.order?.createdAt || new Date(),
            providerOrderId: request.order?.providerOrderId || null,
            user: request.user || {},
            service: {
              id: service?.id || 0,
              name: service?.name || 'Unknown Service',
              refill: service?.refill || true,
              rate: service?.rate || 0,
              min_order: 0,
              max_order: 0,
              status: 'active',
              provider: providerName,
              providerId: service?.providerId || null
            },
            category: request.order?.category || { category_name: 'Unknown Category' },
            refillRequest: request
          };
        });

      setOrders(transformedOrders);
      setPagination({
        page: result.pagination?.page || 1,
        limit: result.pagination?.limit || 20,
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.totalPages || 0,
        hasNext: result.pagination?.hasNext || false,
        hasPrev: result.pagination?.hasPrev || false,
      });
    } catch (error) {
      console.error('Error fetching eligible orders:', error);
      showToast('Error fetching eligible orders. Please try again.', 'error');
      setOrders([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching refill stats from API...');

      const response = await fetch('/api/admin/refill-requests/stats');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      console.log('Refill stats fetched successfully:', result);

      setStats({
        totalEligible: result.data?.eligibleOrdersCount || 0,
        partialOrders: result.data?.partialOrdersCount || 0,
        completedOrders: result.data?.completedOrdersCount || 0,
        todayRefills: result.data?.totalRequests || 0,
        totalRefillAmount: 0,
        statusBreakdown: {
          pending: result.data?.pendingRequests || 0,
          refilling: result.data?.refillingRequests || 0,
          completed: result.data?.completedRequests || 0,
          rejected: result.data?.rejectedRequests || 0,
          error: result.data?.errorRequests || 0,
          approved: result.data?.approvedRequests || 0,
          declined: result.data?.declinedRequests || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching refill stats:', error);
      setStats({
        totalEligible: 0,
        partialOrders: 0,
        completedOrders: 0,
        todayRefills: 0,
        totalRefillAmount: 0,
        statusBreakdown: {
          pending: 0,
          refilling: 0,
          completed: 0,
          rejected: 0,
          error: 0,
          approved: 0,
          declined: 0,
        },
      });
      showToast('Error fetching statistics. Please refresh the page.', 'error');
    }
  };

  useEffect(() => {
    fetchEligibleOrders();
  }, [pagination.page, pagination.limit, refillStatusFilter, searchTerm]);

  useEffect(() => {
    setStatsLoading(true);

    const loadData = async () => {
      await Promise.all([fetchStats()]);
      setStatsLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative.inline-block') && !target.closest('[id^="status-menu-"]')) {
        document.querySelectorAll('[id^="status-menu-"]').forEach((menu) => {
          menu.classList.add('hidden');
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (pagination.total > 0) {
      setStats((prev) => ({
        ...prev,
        totalEligible: pagination.total,
      }));
    }
  }, [pagination.total]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const safeFormatOrderId = (id: any) => {
    return formatID(String(id || 'null'));
  };

  const getRefillRequestStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <FaClock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />;
      case 'refilling':
        return <FaSync className="h-3 w-3 text-blue-500 dark:text-blue-400" />;
      case 'completed':
        return <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />;
      case 'rejected':
        return <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />;
      case 'error':
      case 'failed':
        return <FaExclamationTriangle className="h-3 w-3 text-orange-500 dark:text-orange-400" />;
      case 'approved':
        return <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />;
      case 'declined':
        return <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />;
      default:
        return <FaClock className="h-3 w-3 text-gray-500 dark:text-gray-400" />;
    }
  };

  const formatRefillRequestStatus = (status: string) => {
    if (status?.toLowerCase() === 'error') {
      return 'Failed';
    }
    return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || status;
  };

  const calculateProgress = (qty: number, remains: number) => {
    const validQty = Number(qty) || 0;
    const validRemains = Number(remains) || 0;
    
    if (validQty <= 0 || isNaN(validQty)) {
      return 0;
    }
    
    const delivered = validQty - validRemains;
    const progress = (delivered / validQty) * 100;
    
    const result = Math.round(progress);
    return isNaN(result) ? 0 : Math.max(0, Math.min(100, result));
  };

  const handleRefresh = async () => {
    setOrdersLoading(true);
    setStatsLoading(true);

    try {
      showToast('Refreshing refill requests...', 'pending');
      
      await Promise.all([fetchEligibleOrders(), fetchStats()]);

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
        showToast('Sync is taking longer than expected, refreshing refill requests...', 'info');
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

      showToast('Syncing refill request statuses from provider...', 'pending');

      try {
        const refillSyncResponse = await fetch('/api/admin/refill-requests/sync-provider', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const refillSyncResult = await refillSyncResponse.json();
        
        if (refillSyncResult.success) {
          const refillSynced = refillSyncResult.data?.synced || 0;
          const refillFailed = refillSyncResult.data?.failed || 0;
          const refillTotal = refillSyncResult.data?.total || 0;
          
          if (refillSynced > 0) {
            showToast(`Synced ${refillSynced} refill request status(es) from provider`, 'success');
          } else if (refillTotal > 0) {
          }
          
          if (refillFailed > 0) {
            console.warn(`Failed to sync ${refillFailed} refill request(s)`);
          }
        } else {
          console.warn('Refill sync had issues:', refillSyncResult.error);
        }
      } catch (refillSyncError) {
        console.error('Error syncing refill request statuses:', refillSyncError);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      await Promise.all([fetchEligibleOrders(), fetchStats()]);

      showToast('All refill requests synced and refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing refill requests:', error);
      showToast('Error refreshing refill requests', 'error');
      
      try {
        await Promise.all([fetchEligibleOrders(), fetchStats()]);
      } catch (refreshError) {
        console.error('Error refreshing after sync failure:', refreshError);
      }
    } finally {
      setOrdersLoading(false);
      setStatsLoading(false);
    }
  };

  const handleOpenRefillDialog = async (order: Order) => {
    try {
      setSelectedOrder(order);
      setRefillDialogOpen(true);

      const response = await fetch(`/api/admin/orders/${order.id}/refill`);
      const result = await response.json();

      if (result.success) {
        setRefillInfo(result.data);
      } else {
        showToast(result.error || 'Failed to fetch refill information', 'error');
        setRefillDialogOpen(false);
      }
    } catch (error) {
      console.error('Error fetching refill info:', error);
      showToast('Error fetching refill information', 'error');
      setRefillDialogOpen(false);
    }
  };

  const handleViewRefillRequestDetails = (order: Order) => {
    setViewDialog({
      open: true,
      order: order,
    });
  };

  const handleResendRefillToProvider = async (order: Order) => {
    if (!order.refillRequest?.id) {
      showToast('Refill request ID not found', 'error');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/refill-requests/${order.refillRequest.id}/resend-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message || 'Refill request resent to provider successfully', 'success');
        await fetchEligibleOrders();
      } else {
        showToast(result.error || 'Failed to resend refill request to provider', 'error');
      }
    } catch (error) {
      console.error('Error resending refill request to provider:', error);
      showToast('Error resending refill request to provider', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateRefillStatus = async (refillRequestId: string, newStatus: string) => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/refill-requests/${refillRequestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();

      if (result.success) {
        showToast(`Refill request status updated to ${newStatus}`, 'success');
        await fetchEligibleOrders();
      } else {
        showToast(result.error || 'Failed to update refill request status', 'error');
      }
    } catch (error) {
      console.error('Error updating refill request status:', error);
      showToast('Error updating refill request status', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateRefill = async (startCount: number, quantity: number) => {
    if (!selectedOrder || !refillInfo) return;
    
    if (!startCount || startCount < refillInfo.order.startCount || startCount > refillInfo.order.startCount + refillInfo.order.totalQuantity) {
      showToast(`Start count must be between ${formatNumber(refillInfo.order.startCount)} and ${formatNumber(refillInfo.order.startCount + refillInfo.order.totalQuantity)}`, 'error');
      return;
    }
    
    if (!quantity || quantity <= 0) {
      showToast('Calculated refill quantity is invalid', 'error');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/refill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: quantity,
          startCount: startCount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Refill data stored successfully', 'success');
        setRefillDialogOpen(false);
        setSelectedOrder(null);
        setRefillInfo(null);
        fetchEligibleOrders();
      } else {
        showToast(result.error || 'Failed to store refill data', 'error');
      }
    } catch (error) {
      console.error('Error creating refill:', error);
      showToast('Error creating refill order', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page-container">
      <div className="toast-container">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      <div className="page-content">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <select
                value={pagination.limit}
                onChange={(e) =>
                  setPagination((prev) => ({
                    ...prev,
                    limit: e.target.value === 'all' ? 1000 : parseInt(e.target.value),
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
                <FaSync className={ordersLoading || statsLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder={`Search ${refillStatusFilter === 'all' ? 'all' : refillStatusFilter} refill requests...`}
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full md:w-80 pl-10 pr-4 py-2.5 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header" style={{ padding: '24px 24px 0 24px' }}>
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateQueryParams({ status: null })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    refillStatusFilter === 'all'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      refillStatusFilter === 'all' ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    }`}
                  >
                    {statsLoading ? 0 : (stats.statusBreakdown?.pending || 0) + (stats.statusBreakdown?.refilling || 0) + (stats.statusBreakdown?.completed || 0) + (stats.statusBreakdown?.rejected || 0) + (stats.statusBreakdown?.error || 0)}
                  </span>
                </button>
                <button
                  onClick={() => updateQueryParams({ status: 'pending' })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    refillStatusFilter === 'pending'
                      ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Pending
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      refillStatusFilter === 'pending' ? 'bg-white/20' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}
                  >
                    {statsLoading ? 0 : stats.statusBreakdown?.pending || 0}
                  </span>
                </button>
                <button
                  onClick={() => updateQueryParams({ status: 'refilling' })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    refillStatusFilter === 'refilling'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Refilling
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      refillStatusFilter === 'refilling' ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}
                  >
                    {statsLoading ? 0 : stats.statusBreakdown?.refilling || 0}
                  </span>
                </button>
                <button
                  onClick={() => updateQueryParams({ status: 'completed' })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    refillStatusFilter === 'completed'
                      ? 'bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Completed
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      refillStatusFilter === 'completed' ? 'bg-white/20' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}
                  >
                    {statsLoading ? 0 : stats.statusBreakdown?.completed || 0}
                  </span>
                </button>
                <button
                  onClick={() => updateQueryParams({ status: 'rejected' })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    refillStatusFilter === 'rejected'
                      ? 'bg-gradient-to-r from-red-600 to-red-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Rejected
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      refillStatusFilter === 'rejected' ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {statsLoading ? 0 : stats.statusBreakdown?.rejected || 0}
                  </span>
                </button>
                <button
                  onClick={() => updateQueryParams({ status: 'error' })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    refillStatusFilter === 'error'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Failed
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      refillStatusFilter === 'error' ? 'bg-white/20' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                    }`}
                  >
                    {statsLoading ? 0 : stats.statusBreakdown?.error || 0}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            {ordersLoading ? (
              <div style={{ minHeight: '600px' }}>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[1300px]">
                    <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
                      <tr>
                        {Array.from({ length: 10 }).map((_, idx) => (
                          <th key={idx} className="text-left p-3 text-gray-900 dark:text-gray-100">
                            <div className="h-4 w-20 gradient-shimmer rounded" />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 10 }).map((_, rowIdx) => (
                        <tr key={rowIdx} className="border-t dark:border-gray-700">
                          <td className="p-3">
                            <div className="h-6 w-16 gradient-shimmer rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-24 gradient-shimmer rounded mb-1" />
                            <div className="h-3 w-32 gradient-shimmer rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-32 gradient-shimmer rounded mb-1" />
                            <div className="h-3 w-24 gradient-shimmer rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-16 gradient-shimmer rounded mb-1" />
                            <div className="h-3 w-20 gradient-shimmer rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-24 gradient-shimmer rounded" />
                          </td>
                          <td className="p-3 text-right">
                            <div className="h-4 w-12 gradient-shimmer rounded mb-1" />
                            <div className="h-3 w-16 gradient-shimmer rounded" />
                          </td>
                          <td className="p-3 text-right">
                            <div className="h-4 w-16 gradient-shimmer rounded mb-1" />
                            <div className="h-3 w-12 gradient-shimmer rounded" />
                          </td>
                          <td className="p-3 text-center">
                            <div className="h-6 w-20 gradient-shimmer rounded-full mx-auto" />
                          </td>
                          <td className="p-3 text-center">
                            <div className="h-4 w-12 gradient-shimmer rounded mb-1" />
                            <div className="h-1.5 w-24 gradient-shimmer rounded-full mx-auto mb-1" />
                            <div className="h-3 w-16 gradient-shimmer rounded mx-auto" />
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="h-8 w-8 gradient-shimmer rounded" />
                              <div className="h-8 w-8 gradient-shimmer rounded" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="lg:hidden">
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div key={idx} className="card border-l-4 border-blue-500 dark:border-blue-400 mb-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-16 gradient-shimmer rounded" />
                            <div className="h-6 w-20 gradient-shimmer rounded-full" />
                          </div>
                          <div className="h-8 w-8 gradient-shimmer rounded" />
                        </div>
                        <div className="mb-4 pb-4 border-b dark:border-gray-700">
                          <div className="h-3 w-12 gradient-shimmer rounded mb-2" />
                          <div className="h-4 w-24 gradient-shimmer rounded mb-1" />
                          <div className="h-3 w-32 gradient-shimmer rounded" />
                        </div>
                        <div className="mb-4">
                          <div className="h-4 w-32 gradient-shimmer rounded mb-1" />
                          <div className="h-3 w-24 gradient-shimmer rounded mb-2" />
                          <div className="h-3 w-16 gradient-shimmer rounded mb-1" />
                          <div className="h-3 w-20 gradient-shimmer rounded mb-2" />
                          <div className="h-4 w-24 gradient-shimmer rounded" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="h-3 w-16 gradient-shimmer rounded mb-2" />
                            <div className="h-4 w-16 gradient-shimmer rounded mb-1" />
                            <div className="h-3 w-12 gradient-shimmer rounded" />
                          </div>
                          <div>
                            <div className="h-3 w-20 gradient-shimmer rounded mb-2" />
                            <div className="h-4 w-20 gradient-shimmer rounded mb-1" />
                            <div className="h-3 w-12 gradient-shimmer rounded" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="h-3 w-16 gradient-shimmer rounded mb-2" />
                            <div className="h-4 w-12 gradient-shimmer rounded" />
                            <div className="h-3 w-16 gradient-shimmer rounded mt-1" />
                          </div>
                          <div>
                            <div className="h-3 w-20 gradient-shimmer rounded mb-2" />
                            <div className="h-4 w-16 gradient-shimmer rounded" />
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="h-3 w-16 gradient-shimmer rounded mb-2" />
                          <div className="h-2 w-full gradient-shimmer rounded-full mb-1" />
                          <div className="h-3 w-20 gradient-shimmer rounded" />
                        </div>
                        <div className="flex justify-center">
                          <div className="h-10 w-32 gradient-shimmer rounded-lg" />
                        </div>
                        <div className="mt-4 pt-4 border-t dark:border-gray-700">
                          <div className="h-3 w-24 gradient-shimmer rounded mb-1" />
                          <div className="h-3 w-20 gradient-shimmer rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t">
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    <div className="h-5 w-48 gradient-shimmer rounded" />
                  </div>
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <div className="h-9 w-20 gradient-shimmer rounded" />
                    <div className="h-5 w-24 gradient-shimmer rounded" />
                    <div className="h-9 w-16 gradient-shimmer rounded" />
                  </div>
                </div>
              </div>
            ) : orders?.length === 0 ? (
              <div className="text-center py-12">
                <FaRedo
                  className="h-16 w-16 mx-auto mb-4"
                  style={{ color: 'var(--text-muted)' }}
                />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  No eligible orders found
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No orders are currently eligible for refill or no orders match your filters.
                </p>
              </div>
            ) : (
              <RefillTable
                orders={orders}
                ordersLoading={ordersLoading}
                pagination={pagination}
                processing={processing}
                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                onViewRefillRequestDetails={handleViewRefillRequestDetails}
                onResendRefillToProvider={handleResendRefillToProvider}
                onOpenRefillDialog={handleOpenRefillDialog}
                onUpdateRefillStatus={handleUpdateRefillStatus}
                formatDate={formatDate}
                formatTime={formatTime}
              />
                              )}
                            </div>
                              </div>
                                          </div>
      <CreateRefillOrderModal
        isOpen={refillDialogOpen}
        refillInfo={refillInfo}
        processing={processing}
        onClose={() => {
          setRefillDialogOpen(false);
          setSelectedOrder(null);
          setRefillInfo(null);
                    }}
        onCreateRefill={handleCreateRefill}
      />
      <RefillRequestDetailsModal
        isOpen={viewDialog.open}
        order={viewDialog.order}
        onClose={() => setViewDialog({ open: false, order: null })}
        formatDate={formatDate}
        formatTime={formatTime}
      />
    </div>
  );
};

export default RefillOrdersPage;