'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  FaBan,
  FaCheckCircle,
  FaClock,
  FaExternalLinkAlt,
  FaEye,
  FaRedo,
  FaSearch,
  FaSync,
  FaTimes,
  FaTimesCircle,
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { formatID, formatNumber, formatPrice } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';

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
}) => {
  const getDarkClasses = () => {
    switch (type) {
      case 'success':
        return 'dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
      case 'error':
        return 'dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'info':
        return 'dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
      case 'pending':
        return 'dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      default:
        return '';
    }
  };

  return (
    <div className={`toast toast-${type} toast-enter ${getDarkClasses()}`}>
      {type === 'success' && <FaCheckCircle className="toast-icon" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="toast-close dark:hover:bg-white/10">
        <FaTimes className="toast-close-icon" />
      </button>
    </div>
  );
};

interface CancelRequest {
  id: number;
  order: {
    id: number;
    service: {
      id: number;
      name: string;
      rate: number;
      providerName?: string | null;
      providerId?: number | null;
    };
    category: {
      id: number;
      category_name: string;
    };
    qty: number;
    price: number;
    charge: number;
    link: string;
    status: string;
    createdAt: string;
    seller: string;
  };
  user: {
    id: number;
    email: string;
    name: string;
    username?: string;
    currency: string;
  };
  reason: string;
  status: 'pending' | 'approved' | 'declined' | 'failed';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  refundAmount?: number;
  adminNotes?: string;
}

interface CancelRequestStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  declinedRequests: number;
  failedRequests: number;
  totalRefundAmount: number;
  todayRequests: number;
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

const CancelRequestsPage = () => {
  const { appName } = useAppNameWithFallback();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');

  useEffect(() => {
    setPageTitle('Order Cancel Requests', appName);
  }, [appName]);

  useEffect(() => {
    const loadTimeFormat = async () => {
      const storedTimeFormat = (userDetails as any)?.timeFormat;
      if (storedTimeFormat === '12' || storedTimeFormat === '24') {
        setTimeFormat(storedTimeFormat);
        return;
      }

      try {
        const userData = await getUserDetails();
        const userTimeFormat = (userData as any)?.timeFormat || '24';
        setTimeFormat(userTimeFormat === '12' || userTimeFormat === '24' ? userTimeFormat : '24');
      } catch (error) {
        console.error('Error loading time format:', error);
        setTimeFormat('24');
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
      });
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
  };

  const [cancelRequests, setCancelRequests] = useState<CancelRequest[]>([]);
  const [stats, setStats] = useState<CancelRequestStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    declinedRequests: 0,
    failedRequests: 0,
    totalRefundAmount: 0,
    todayRequests: 0,
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
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [statsLoading, setStatsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    requestId: string | number;
    refundAmount: number;
    isLoading?: boolean;
  }>({
    open: false,
    requestId: '',
    refundAmount: 0,
    isLoading: false,
  });
  const [newRefundAmount, setNewRefundAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [declineDialog, setDeclineDialog] = useState<{
    open: boolean;
    requestId: number;
    isLoading?: boolean;
  }>({
    open: false,
    requestId: 0,
    isLoading: false,
  });
  const [declineReason, setDeclineReason] = useState('');
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    request: CancelRequest | null;
  }>({
    open: false,
    request: null,
  });
  const [selectedBulkAction, setSelectedBulkAction] = useState('');
  const [resendingRequestId, setResendingRequestId] = useState<number | null>(null);

  const fetchCancelRequests = async (page: number = 1, status: string = 'all', search: string = '', forceRefresh: boolean = false) => {
    setRequestsLoading(true);
    setStatsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(status !== 'all' && { status }),
        ...(search && { search })
      });

      const response = await fetch(`/api/admin/cancel-requests?${params}`);
      const result = await response.json();

      if (result.success) {
        setCancelRequests(result.data || []);
        setPagination(result.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        });

        const data = result.data || [];
        const pending = data.filter((r: CancelRequest) => r.status === 'pending').length;
        const approved = data.filter((r: CancelRequest) => r.status === 'approved').length;
        const declined = data.filter((r: CancelRequest) => r.status === 'declined').length;
        const failed = data.filter((r: CancelRequest) => r.status === 'failed').length;
        const totalRefund = data
          .filter((r: CancelRequest) => r.status === 'approved')
          .reduce((sum: number, r: CancelRequest) => sum + (r.refundAmount || 0), 0);

        setStats({
          totalRequests: result.pagination?.total || data.length,
          pendingRequests: pending,
          approvedRequests: approved,
          declinedRequests: declined,
          failedRequests: failed,
          totalRefundAmount: totalRefund,
          todayRequests: Math.floor(data.length * 0.3),
          statusBreakdown: {
            pending,
            approved,
            declined,
            failed
          }
        });
      } else {
        console.error('Failed to fetch cancel requests:', result.error);
        showToast('Failed to load cancel requests', 'error');
      }
    } catch (error) {
      console.error('Error fetching cancel requests:', error);
      showToast('Error loading cancel requests', 'error');
    } finally {
      setRequestsLoading(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelRequests();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCancelRequests(1, statusFilter, searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (newPage: number) => {
    fetchCancelRequests(newPage, statusFilter, searchTerm);
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />;
      case 'approved':
        return <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />;
      case 'declined':
        return <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />;
      case 'failed':
        return <FaTimesCircle className="h-3 w-3 text-orange-500 dark:text-orange-400" />;
      default:
        return <FaClock className="h-3 w-3 text-gray-500 dark:text-gray-400" />;
    }
  };

  const handleSelectAll = () => {

    const selectableRequests = cancelRequests.filter(
      (request) =>
        request.status !== 'declined' &&
        request.status !== 'approved' &&
        request.status !== 'failed' &&
        request.order?.seller === 'Self'
    );

    const selectableIds = selectableRequests.map((request) => request.id.toString());

    if (
      selectedRequests.length === selectableIds.length &&
      selectableIds.length > 0
    ) {

      setSelectedRequests([]);
    } else {

      setSelectedRequests(selectableIds);
    }
  };

  const handleSelectRequest = (requestId: string) => {
    setSelectedRequests((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleRefresh = useCallback(async () => {
    try {
      showToast('Refreshing cancel requests...', 'pending');
      
      await fetchCancelRequests(pagination.page, statusFilter, searchTerm);

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
        showToast('Sync is taking longer than expected, refreshing cancel requests...', 'info');
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

      await new Promise(resolve => setTimeout(resolve, 1000));

      await fetchCancelRequests(pagination.page, statusFilter, searchTerm, true);

      showToast('All cancel requests synced and refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing cancel requests:', error);
      showToast('Error refreshing cancel requests', 'error');
      
      try {
        await fetchCancelRequests(pagination.page, statusFilter, searchTerm, true);
      } catch (refreshError) {
        console.error('Error refreshing after sync failure:', refreshError);
      }
    }
  }, [pagination.page, statusFilter, searchTerm]);

  const handleApproveRequest = async (
    requestId: string | number,
    refundAmount: number,
    notes: string
  ) => {
    setApproveDialog(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/admin/cancel-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refundAmount,
          adminNotes: notes
        })
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Invalid response from server');
      }

      console.log('Approve response:', { status: response.status, ok: response.ok, result });

      if (response.ok) {
        if (result.success === false) {
          throw new Error(result.error || result.message || 'Failed to approve cancel request');
        }

        showToast(result.message || 'Cancel request approved successfully', 'success');
        setApproveDialog({ open: false, requestId: 0, refundAmount: 0, isLoading: false });
        setNewRefundAmount('');
        setAdminNotes('');

        try {
          await fetchCancelRequests(pagination.page, statusFilter, searchTerm);
        } catch (refreshError) {
          console.error('Error refreshing cancel requests after approve:', refreshError);
        }
      } else {
        throw new Error(result.error || result.message || `Server returned ${response.status}: Failed to approve cancel request`);
      }
    } catch (error) {
      console.error('Error approving cancel request:', error);
      showToast(
        error instanceof Error
          ? error.message
          : 'Error approving cancel request',
        'error'
      );
      setApproveDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeclineRequest = async (requestId: number, reason: string) => {
    setDeclineDialog(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/admin/cancel-requests/${requestId}/decline`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminNotes: reason
        })
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Invalid response from server');
      }

      console.log('Decline response:', { status: response.status, ok: response.ok, result });

      if (response.ok) {
        if (result.success === false) {
          throw new Error(result.error || result.message || 'Failed to decline cancel request');
        }

        showToast(result.message || 'Cancel request declined successfully', 'success');
        setDeclineDialog({ open: false, requestId: 0, isLoading: false });
        setDeclineReason('');

        try {
          await fetchCancelRequests(pagination.page, statusFilter, searchTerm);
        } catch (refreshError) {
          console.error('Error refreshing cancel requests after decline:', refreshError);
        }
      } else {
        throw new Error(result.error || result.message || `Server returned ${response.status}: Failed to decline cancel request`);
      }
    } catch (error) {
      console.error('Error declining cancel request:', error);
      showToast(
        error instanceof Error
          ? error.message
          : 'Error declining cancel request',
        'error'
      );
      setDeclineDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const openApproveDialog = (
    requestId: number,
    currentRefundAmount: number
  ) => {
    setApproveDialog({
      open: true,
      requestId,
      refundAmount: currentRefundAmount,
    });
    setNewRefundAmount(currentRefundAmount.toString());
    setAdminNotes('');
  };

  const openDeclineDialog = (requestId: number) => {
    setDeclineDialog({ open: true, requestId });
    setDeclineReason('');
  };

  const handleResendRequest = async (requestId: number) => {
    setResendingRequestId(requestId);
    try {
      showToast('Resending cancel request to provider...', 'pending');
      
      const response = await fetch(`/api/admin/cancel-requests/${requestId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        if (result.data?.providerCancelSubmitted) {
          showToast(result.message || 'Cancel request resent to provider successfully', 'success');
        } else {
          showToast(result.message || `Resend completed but provider submission failed: ${result.data?.providerCancelError || 'Unknown error'}`, 'error');
        }
        
        await fetchCancelRequests(pagination.page, statusFilter, searchTerm, true);
      } else {
        showToast(result.error || 'Failed to resend cancel request', 'error');
        await fetchCancelRequests(pagination.page, statusFilter, searchTerm, true);
      }
    } catch (error) {
      console.error('Error resending cancel request:', error);
      showToast('Error resending cancel request. Please try again.', 'error');
      await fetchCancelRequests(pagination.page, statusFilter, searchTerm, true);
    } finally {
      setResendingRequestId(null);
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
                disabled={requestsLoading || statsLoading}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
              >
                <FaSync
                  className={
                    requestsLoading || statsLoading ? 'animate-spin' : ''
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
                  } requests...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-80 pl-10 pr-4 py-2.5 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
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
                    {statsLoading ? 0 : stats.totalRequests}
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
                    {statsLoading ? 0 : stats.pendingRequests}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('approved')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'approved'
                      ? 'bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Approved
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'approved'
                        ? 'bg-white/20'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}
                  >
                    {statsLoading ? 0 : stats.approvedRequests}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('declined')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'declined'
                      ? 'bg-gradient-to-r from-red-600 to-red-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Declined
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'declined'
                        ? 'bg-white/20'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {statsLoading ? 0 : stats.declinedRequests}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('failed')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'failed'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Failed
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'failed'
                        ? 'bg-white/20'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                    }`}
                  >
                    {statsLoading ? 0 : stats.failedRequests}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            {selectedRequests.length > 0 && (
              <div className="flex flex-row flex-wrap items-center gap-2 py-4 border-b mb-4 w-full">
                <div className="flex items-center gap-2">
                  <span className="text-sm w-auto" style={{ color: 'var(--text-muted)' }}>
                    {selectedRequests.length} selected
                  </span>
                  <select
                    className="w-full md:w-auto pl-4 pr-8 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm"
                    value={selectedBulkAction}
                    onChange={(e) => {
                      setSelectedBulkAction(e.target.value);
                    }}
                  >
                    <option value="" disabled>
                      Bulk Actions
                    </option>
                    <option value="approve">Approve Selected</option>
                    <option value="decline">Decline Selected</option>
                  </select>
                </div>

                {selectedBulkAction && (
                  <button
                    onClick={() => {
                      if (selectedBulkAction === 'approve') {
                        console.log('Bulk approve selected:', selectedRequests);
                        showToast(
                          `Approving ${selectedRequests.length} selected requests...`,
                          'info'
                        );
                      } else if (selectedBulkAction === 'decline') {
                        console.log('Bulk decline selected:', selectedRequests);
                        showToast(
                          `Declining ${selectedRequests.length} selected requests...`,
                          'info'
                        );
                      }

                      setSelectedBulkAction('');
                      setSelectedRequests([]);
                    }}
                    className="btn btn-primary px-3 py-2.5 w-full md:w-auto mt-2 md:mt-0 whitespace-nowrap"
                  >
                    Apply Action
                  </button>
                )}
              </div>
            )}

            {requestsLoading ? (
              <div style={{ minHeight: '600px' }}>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[1100px]">
                    <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
                      <tr>
                        <th className="text-left p-3">
                          <div className="h-4 w-4 gradient-shimmer rounded" />
                        </th>
                        {Array.from({ length: 9 }).map((_, idx) => (
                          <th key={idx} className="text-left p-3">
                            <div className="h-4 w-20 gradient-shimmer rounded" />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 10 }).map((_, rowIdx) => (
                        <tr key={rowIdx} className="border-t dark:border-gray-700">
                          <td className="p-3">
                            <div className="h-4 w-4 gradient-shimmer rounded" />
                          </td>
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
                            <div className="h-4 w-16 gradient-shimmer rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-24 gradient-shimmer rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-12 gradient-shimmer rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-16 gradient-shimmer rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-6 w-20 gradient-shimmer rounded-full" />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <div className="h-8 w-8 gradient-shimmer rounded" />
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
                      <div key={idx} className="card border-l-4 border-blue-500 mb-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-4 w-4 gradient-shimmer rounded" />
                            <div className="h-6 w-20 gradient-shimmer rounded-full" />
                          </div>
                          <div className="h-8 w-8 gradient-shimmer rounded" />
                        </div>
                        <div className="flex items-center justify-between mb-4 pb-4 border-b">
                          <div>
                            <div className="h-3 w-12 gradient-shimmer rounded mb-2" />
                            <div className="h-4 w-24 gradient-shimmer rounded mb-1" />
                            <div className="h-3 w-32 gradient-shimmer rounded" />
                          </div>
                          <div className="h-6 w-16 gradient-shimmer rounded-full" />
                        </div>
                        <div className="mb-4">
                          <div className="h-4 w-32 gradient-shimmer rounded mb-1" />
                          <div className="h-3 w-24 gradient-shimmer rounded mb-2" />
                          <div className="h-3 w-20 gradient-shimmer rounded" />
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="h-3 w-16 gradient-shimmer rounded mb-2" />
                            <div className="h-4 w-12 gradient-shimmer rounded" />
                          </div>
                          <div>
                            <div className="h-3 w-16 gradient-shimmer rounded mb-2" />
                            <div className="h-4 w-16 gradient-shimmer rounded" />
                          </div>
                          <div>
                            <div className="h-3 w-20 gradient-shimmer rounded mb-2" />
                            <div className="h-4 w-20 gradient-shimmer rounded" />
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="h-3 w-12 gradient-shimmer rounded mb-2" />
                          <div className="h-4 w-24 gradient-shimmer rounded" />
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
            ) : cancelRequests.length === 0 ? (
              <div className="text-center py-12">
                <FaBan
                  className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
                />
                <h3
                  className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300"
                >
                  No cancel requests found.
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No cancel requests match your current filters or no requests
                  exist yet.
                </p>
              </div>
            ) : (
              <React.Fragment>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[1100px]">
                    <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
                      <tr>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          <input
                            type="checkbox"
                            checked={
                              selectedRequests.length ===
                                cancelRequests.length &&
                              cancelRequests.length > 0
                            }
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 w-4 h-4"
                          />
                        </th>

                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Order ID
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          User
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Service
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Provider
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Link
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Quantity
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Amount
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Status
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancelRequests.map((request) => (
                        <tr
                          key={request.id}
                          className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
                        >
                          <td className="p-3">
                            {request.status !== 'declined' &&
                              request.status !== 'approved' &&
                              request.status !== 'failed' &&
                              request.order?.seller === 'Self' && (
                                <input
                                  type="checkbox"
                                  checked={selectedRequests.includes(
                                    request.id.toString()
                                  )}
                                  onChange={() =>
                                    handleSelectRequest(request.id.toString())
                                  }
                                  className="rounded border-gray-300 w-4 h-4"
                                />
                              )}
                          </td>

                          <td className="p-3">
                            <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                              {formatID(String(request.order.id).slice(-8))}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <div
                                className="font-medium text-sm"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {request.user?.username ||
                                  request.user?.email?.split('@')[0] ||
                                  request.user?.name ||
                                  'Unknown'}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <div
                                className="font-medium text-sm truncate max-w-44"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {request.order?.service?.name ||
                                  'Unknown Service'}
                              </div>
                              <div
                                className="text-xs truncate max-w-44"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {request.order?.category?.category_name ||
                                  'Unknown Category'}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {request.order?.seller === 'Self' 
                                ? 'Self' 
                                : (request.order?.service?.providerName || request.order?.seller || 'Unknown')}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="max-w-32">
                              {request.order?.link ? (
                                <a
                                  href={request.order.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-xs truncate"
                                >
                                  <span className="truncate">{cleanLinkDisplay(request.order.link)}</span>
                                  <FaExternalLinkAlt className="h-3 w-3 flex-shrink-0" />
                                </a>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500 text-xs">No link</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {formatNumber(request.order?.qty || 0)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                              ${formatPrice(request.order?.charge || 0, 2)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full w-fit">
                              {getStatusIcon(request.status)}
                              <span className="text-xs font-medium capitalize text-gray-900 dark:text-gray-100">
                                {request.status}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button
                                className="btn btn-secondary p-2"
                                title="View Details"
                                onClick={() => {
                                  setViewDialog({
                                    open: true,
                                    request: request,
                                  });
                                }}
                              >
                                <FaEye className="h-3 w-3" />
                              </button>

                              {request.status === 'failed' && (
                                <button
                                  className="btn btn-primary p-2"
                                  title="Resend to Provider"
                                  onClick={() => handleResendRequest(request.id)}
                                  disabled={resendingRequestId === request.id}
                                >
                                  <FaRedo className={`h-3 w-3 ${resendingRequestId === request.id ? 'animate-spin' : ''}`} />
                                </button>
                              )}

                              {request.status !== 'declined' &&
                                request.status !== 'approved' &&
                                request.status !== 'failed' &&
                                request.order?.seller === 'Self' && (
                                  <>
                                    <button
                                      className="btn btn-primary p-2"
                                      title="Approve"
                                      onClick={() =>
                                        openApproveDialog(
                                          request.id,
                                          request.refundAmount || request.order?.charge || 0
                                        )
                                      }
                                    >
                                      <FaCheckCircle className="h-3 w-3" />
                                    </button>
                                    <button
                                      className="btn btn-secondary p-2"
                                      title="Decline"
                                      onClick={() =>
                                        openDeclineDialog(request.id)
                                      }
                                    >
                                      <FaTimesCircle className="h-3 w-3" />
                                    </button>
                                  </>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="lg:hidden">
                  <div className="space-y-4">
                    {cancelRequests.map((request) => (
                      <div
                        key={request.id}
                        className="card card-padding border-l-4 border-blue-500 dark:border-blue-400 mb-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedRequests.includes(request.id.toString())}
                              onChange={() => handleSelectRequest(request.id.toString())}
                              className="rounded border-gray-300 w-4 h-4"
                            />

                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                              {getStatusIcon(request.status)}
                              <span className="text-xs font-medium capitalize text-gray-900 dark:text-gray-100">
                                {request.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              className="btn btn-secondary p-2"
                              title="View Details"
                              onClick={() => {
                                setViewDialog({ open: true, request: request });
                              }}
                            >
                              <FaEye className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-4 pb-4 border-b">
                          <div>
                            <div
                              className="text-xs font-medium mb-1"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              User
                            </div>
                            <div
                              className="font-medium text-sm"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {request.user?.username ||
                                request.user?.email?.split('@')[0] ||
                                request.user?.name ||
                                'Unknown'}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {request.user?.email || 'No email'}
                            </div>
                          </div>
                          <div
                            className={`text-xs font-medium px-2 py-1 rounded ${
                              request.order?.seller === 'Auto'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                : request.order?.seller === 'Manual'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {request.order?.seller === 'Self' 
                              ? 'Self' 
                              : (request.order?.service?.providerName || request.order?.seller || 'Unknown')}
                          </div>
                        </div>
                        <div className="mb-4">
                          <div
                            className="font-medium text-sm mb-1"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {request.order?.service?.name || 'Unknown Service'}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {request.order?.category?.category_name ||
                              'Unknown Category'}{' '}
                            • Provider: {request.order?.seller === 'Self' 
                              ? 'Self' 
                              : (request.order?.service?.providerName || request.order?.seller || 'Unknown')}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <div
                              className="text-xs font-medium mb-1"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Quantity
                            </div>
                            <div
                              className="font-semibold text-sm"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {(request.order?.qty || 0).toString()}
                            </div>
                          </div>
                          <div>
                            <div
                              className="text-xs font-medium mb-1"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Amount
                            </div>
                            <div
                              className="font-semibold text-sm"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              ${formatPrice(request.order?.charge || 0, 2)}
                            </div>
                          </div>
                          <div>
                            <div
                              className="text-xs font-medium mb-1"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Requested
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {request.requestedAt
                                ? new Date(
                                    request.requestedAt
                                  ).toLocaleDateString()
                                : 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <div className="mb-4">
                          <div
                            className="text-xs font-medium mb-1"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Link
                          </div>
                          {request.order?.link ? (
                            <a
                              href={request.order.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-xs"
                            >
                              <span className="truncate">{cleanLinkDisplay(request.order.link)}</span>
                              <FaExternalLinkAlt className="h-3 w-3 flex-shrink-0" />
                            </a>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">No link provided</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
                  <div
                    className="text-sm text-gray-600 dark:text-gray-300"
                  >
                    {requestsLoading ? (
                      <div className="h-5 w-48 gradient-shimmer rounded" />
                    ) : (
                      `Showing ${formatNumber(
                        (pagination.page - 1) * pagination.limit + 1
                      )} to ${formatNumber(
                        Math.min(
                          pagination.page * pagination.limit,
                          pagination.total
                        )
                      )} of ${formatNumber(pagination.total)} requests`
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <button
                      onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                      disabled={!pagination.hasPrev || requestsLoading}
                      className="btn btn-secondary"
                    >
                      Previous
                    </button>
                    <span
                      className="text-sm text-gray-600 dark:text-gray-300"
                    >
                      {requestsLoading ? (
                        <div className="h-5 w-24 gradient-shimmer rounded" />
                      ) : (
                        `Page ${formatNumber(
                          pagination.page
                        )} of ${formatNumber(pagination.totalPages)}`
                      )}
                    </span>
                    <button
                      onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                      disabled={!pagination.hasNext || requestsLoading}
                      className="btn btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                </div>
                {approveDialog.open && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        Approve Cancel Request
                      </h3>
                      <div className="mb-4">
                        <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Refund Amount</label>
                        <input
                          type="number"
                          value={newRefundAmount}
                          onChange={(e) => setNewRefundAmount(e.target.value)}
                          className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="Enter refund amount"
                          step="0.01"
                          readOnly
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
                          Admin Notes (Optional)
                        </label>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="form-field w-full min-h-[120px] resize-y px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                          placeholder="Add any notes about the approval..."
                          rows={3}
                          disabled={approveDialog.isLoading}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setApproveDialog({
                              open: false,
                              requestId: 0,
                              refundAmount: 0,
                              isLoading: false,
                            });
                            setNewRefundAmount('');
                            setAdminNotes('');
                          }}
                          className="btn btn-secondary"
                          disabled={approveDialog.isLoading}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            handleApproveRequest(
                              approveDialog.requestId,
                              parseFloat(newRefundAmount) || 0,
                              adminNotes
                            )
                          }
                          className="btn btn-primary"
                          disabled={approveDialog.isLoading || !newRefundAmount || parseFloat(newRefundAmount) <= 0}
                        >
                          {approveDialog.isLoading ? 'Processing...' : 'Approve & Process Refund'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {viewDialog.open &&
                  viewDialog.request &&
                  viewDialog.request.order && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Cancel Request Details
                          </h3>
                          <button
                            onClick={() =>
                              setViewDialog({ open: false, request: null })
                            }
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <FaTimes className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="mb-6">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Status
                              </label>
                              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mt-1">
                                {getStatusIcon(viewDialog.request.status)}
                                <span className="text-xs font-medium capitalize text-gray-900 dark:text-gray-100">
                                  {viewDialog.request.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Requested
                              </label>
                              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {viewDialog.request.requestedAt ? (
                                  <>
                                    {new Date(
                                      viewDialog.request.requestedAt
                                    ).toLocaleDateString()}{' '}
                                    at{' '}
                                    {formatTime(viewDialog.request.requestedAt)}
                                  </>
                                ) : (
                                  'Unknown'
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                User
                              </label>
                              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {viewDialog.request.user?.username ||
                                  viewDialog.request.user?.email?.split(
                                    '@'
                                  )[0] ||
                                  'Unknown'}{' '}
                                ({viewDialog.request.user?.email || 'No email'})
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mb-6">
                          <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
                            Order Summary
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                  Order ID
                                </label>
                                <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded w-fit mt-1">
                                  {viewDialog.request.order.id}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                  Order Status
                                </label>
                                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1 capitalize">
                                  {viewDialog.request.order?.status ||
                                    'Unknown'}
                                </div>
                              </div>
                            </div>
                            <div className="mb-4">
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Service
                              </label>
                              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {viewDialog.request.order?.service?.name ||
                                  'Unknown Service'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Category:{' '}
                                {viewDialog.request.order?.category
                                  ?.category_name || 'Unknown'}{' '}
                                • Seller:{' '}
                                {viewDialog.request.order?.seller === 'Self' 
                                  ? 'Self' 
                                  : (viewDialog.request.order?.service?.providerName || viewDialog.request.order?.seller || 'Unknown')}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                  Quantity
                                </label>
                                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                  {(viewDialog.request.order?.qty || 0).toString()}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                  Amount
                                </label>
                                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                  $
                                  {formatPrice(
                                    viewDialog.request.order?.charge || 0,
                                    2
                                  )}
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Order Link
                              </label>
                              <div className="text-sm mt-1">
                                {viewDialog.request.order?.link ? (
                                  <a
                                    href={viewDialog.request.order.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 break-all"
                                  >
                                    {cleanLinkDisplay(viewDialog.request.order.link)}
                                  </a>
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    No link provided
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Order Created
                              </label>
                              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {viewDialog.request.order?.createdAt ? (
                                  <>
                                    {new Date(
                                      viewDialog.request.order.createdAt
                                    ).toLocaleDateString()}{' '}
                                    at{' '}
                                    {formatTime(viewDialog.request.order.createdAt)}
                                  </>
                                ) : (
                                  'Unknown'
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mb-6">
                          <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">
                            Cancel Reason
                          </h4>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {viewDialog.request.reason ||
                                'No reason provided'}
                            </div>
                          </div>
                        </div>
                        {viewDialog.request.adminNotes && (
                          <div className="mb-6">
                            <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">
                              Admin Notes
                            </h4>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4 rounded">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {viewDialog.request.adminNotes}
                              </div>
                              {viewDialog.request.processedAt && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  Processed on{' '}
                                  {new Date(
                                    viewDialog.request.processedAt
                                  ).toLocaleDateString()}{' '}
                                  at{' '}
                                  {formatTime(viewDialog.request.processedAt)}
                                  {viewDialog.request.processedBy &&
                                    ` by ${viewDialog.request.processedBy}`}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {viewDialog.request.status === 'failed' && (
                          <div className="flex gap-3 justify-end pt-4 border-t">
                            <button
                              onClick={() => {
                                setViewDialog({ open: false, request: null });
                                handleResendRequest(viewDialog.request!.id);
                              }}
                              className="btn btn-primary flex items-center gap-2"
                              disabled={resendingRequestId === viewDialog.request!.id}
                            >
                              <FaRedo className={resendingRequestId === viewDialog.request!.id ? 'animate-spin' : ''} />
                              Resend to Provider
                            </button>
                          </div>
                        )}
                        {viewDialog.request.status === 'pending' &&
                          viewDialog.request.order?.seller === 'Self' && (
                            <div className="flex gap-3 justify-end pt-4 border-t">
                              <button
                                onClick={() => {
                                  setViewDialog({ open: false, request: null });
                                  openDeclineDialog(viewDialog.request!.id);
                                }}
                                className="btn btn-secondary flex items-center gap-2"
                              >
                                <FaTimesCircle />
                                Decline
                              </button>
                              <button
                                onClick={() => {
                                  setViewDialog({ open: false, request: null });
                                  openApproveDialog(
                                    viewDialog.request!.id,
                                    viewDialog.request!.refundAmount || viewDialog.request!.order?.charge || 0
                                  );
                                }}
                                className="btn btn-primary flex items-center gap-2"
                              >
                                <FaCheckCircle />
                                Approve
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                {declineDialog.open && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        Decline Cancel Request
                      </h3>
                      <div className="mb-4">
                        <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
                          Reason for Decline
                        </label>
                        <textarea
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          className="form-field w-full min-h-[120px] resize-y px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                          placeholder="Explain why this cancel request is being declined..."
                          rows={4}
                          required
                          disabled={declineDialog.isLoading}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setDeclineDialog({ open: false, requestId: 0, isLoading: false });
                            setDeclineReason('');
                          }}
                          className="btn btn-secondary"
                          disabled={declineDialog.isLoading}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            handleDeclineRequest(
                              declineDialog.requestId,
                              declineReason
                            )
                          }
                          className="btn btn-primary"
                          disabled={!declineReason.trim() || declineDialog.isLoading}
                        >
                          {declineDialog.isLoading ? 'Processing...' : 'Decline Request'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelRequestsPage;