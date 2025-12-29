'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    FaCheckCircle,
    FaClock,
    FaCreditCard,
    FaDollarSign,
    FaEdit,
    FaEllipsisH,
    FaExclamationCircle,
    FaEye,
    FaMoneyBillWave,
    FaSearch,
    FaSync,
    FaTimes,
    FaTimesCircle,
} from 'react-icons/fa';

import { PriceDisplay } from '@/components/price-display';
import { useCurrency } from '@/contexts/currency-context';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';

const formatID = (id: any) => id;
const formatNumber = (num: number) => num.toLocaleString();
const formatPrice = (price: number, decimals = 2) => price.toFixed(decimals);

const WithdrawalsTableSkeleton = () => {
  const rows = Array.from({ length: 10 });

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1200px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              {Array.from({ length: 8 }).map((_, idx) => (
                <th key={idx} className="text-left p-3">
                  <div className="h-4 rounded w-3/4 gradient-shimmer" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((_, rowIdx) => (
              <tr key={rowIdx} className="border-t dark:border-gray-700">
                <td className="p-3">
                  <div className="h-6 w-16 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-24 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-5 w-32 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-20 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-24 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-3 w-24 gradient-shimmer rounded mb-1" />
                  <div className="h-3 w-20 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-5 w-20 gradient-shimmer rounded-full" />
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <div className="h-8 w-8 gradient-shimmer rounded" />
                    <div className="h-8 w-8 gradient-shimmer rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="h-5 w-48 gradient-shimmer rounded" />
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <div className="h-9 w-20 gradient-shimmer rounded" />
          <div className="h-5 w-24 gradient-shimmer rounded" />
          <div className="h-9 w-16 gradient-shimmer rounded" />
        </div>
      </div>
    </>
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

interface Withdrawal {
  id: number;
  affiliate: {
    id: number;
    user: {
      id: number;
      email: string;
      name: string;
      username?: string;
    };
  };
  withdrawalId: string;
  amount: number;
  status: 'Success' | 'Pending' | 'Cancelled';
  method: string;
  payment_method?: string;
  createdAt: string;
  processedAt?: string;
  notes?: string;
  transactionIdEdited?: boolean;
}

interface WithdrawalStats {
  totalWithdrawals: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
  cancelledWithdrawals: number;
  totalVolume: number;
  todayWithdrawals: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const AdminWithdrawalsPage = () => {
  const { appName } = useAppNameWithFallback();

  useEffect(() => {
    setPageTitle('Affiliate Withdrawals', appName);
  }, [appName]);

  const { currency } = useCurrency();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<WithdrawalStats>({
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    completedWithdrawals: 0,
    cancelledWithdrawals: 0,
    totalVolume: 0,
    todayWithdrawals: 0,
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const [viewDetailsDialog, setViewDetailsDialog] = useState<{
    open: boolean;
    withdrawal: Withdrawal | null;
  }>({
    open: false,
    withdrawal: null,
  });

  const [approveConfirmDialog, setApproveConfirmDialog] = useState<{
    open: boolean;
    withdrawalId: number;
    withdrawal: Withdrawal | null;
    transactionId: string;
  }>({
    open: false,
    withdrawalId: 0,
    withdrawal: null,
    transactionId: '',
  });

  const [isApproving, setIsApproving] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [editTransactionIdDialog, setEditTransactionIdDialog] = useState<{
    open: boolean;
    withdrawalId: number;
    withdrawal: Withdrawal | null;
    transactionId: string;
  }>({
    open: false,
    withdrawalId: 0,
    withdrawal: null,
    transactionId: '',
  });
  const [isUpdatingTransactionId, setIsUpdatingTransactionId] = useState(false);

  const [cancelConfirmDialog, setCancelConfirmDialog] = useState<{
    open: boolean;
    withdrawalId: number;
    withdrawal: Withdrawal | null;
    cancelReason: string;
  }>({
    open: false,
    withdrawalId: 0,
    withdrawal: null,
    cancelReason: '',
  });

  const fetchWithdrawals = useCallback(async () => {
    try {
      setWithdrawalsLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/affiliates/withdrawals?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch withdrawals: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setWithdrawals(result.data || []);

        if (result.pagination) {
          setPagination({
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
            hasNext: result.pagination.hasNext,
            hasPrev: result.pagination.hasPrev,
          });
        }

        if (result.stats) {
          setStats({
            totalWithdrawals: result.stats.totalWithdrawals,
            pendingWithdrawals: result.stats.pendingWithdrawals,
            completedWithdrawals: result.stats.completedWithdrawals,
            cancelledWithdrawals: result.stats.cancelledWithdrawals,
            totalVolume: result.stats.totalVolume,
            todayWithdrawals: result.stats.todayWithdrawals,
          });
        }
      } else {
        throw new Error(result.error || 'Failed to fetch withdrawals');
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch withdrawals';
      showToast(`Error: ${errorMessage}`, 'error');
      setWithdrawals([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWithdrawalsLoading(true);
      fetchWithdrawals();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchWithdrawals]);

  useEffect(() => {
    setWithdrawalsLoading(true);
    fetchWithdrawals();
  }, [pagination.page, pagination.limit, statusFilter, fetchWithdrawals]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
            <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-300">Success</span>
          </div>
        );
      case 'Pending':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-fit">
            <FaClock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Pending</span>
          </div>
        );
      case 'Cancelled':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full w-fit">
            <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
            <span className="text-xs font-medium text-red-700 dark:text-red-300">Cancelled</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full w-fit">
            <FaClock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{status}</span>
          </div>
        );
    }
  };

  const handleRefresh = () => {
    setWithdrawalsLoading(true);
    fetchWithdrawals();
    showToast('Withdrawals refreshed successfully!', 'success');
  };

  const handleApprove = (withdrawalId: number) => {
    const withdrawal = withdrawals.find((w) => w.id === withdrawalId);
    const existingTransactionId = withdrawal?.withdrawalId && withdrawal.withdrawalId !== '-' 
      ? withdrawal.withdrawalId 
      : '';
    setApproveConfirmDialog({
      open: true,
      withdrawalId,
      withdrawal: withdrawal || null,
      transactionId: existingTransactionId,
    });
  };

  const confirmApprove = async (withdrawalId: number, transactionId: string) => {
    if (!transactionId || !transactionId.trim()) {
      showToast('Transaction ID is required', 'error');
      return;
    }

    setIsApproving(true);
    try {
      const response = await fetch(`/api/admin/affiliates/withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transactionId.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', result);
        const errorMsg = result.details 
          ? `${result.error || 'Failed to approve withdrawal'}: ${result.details}`
          : result.error || result.message || `Failed to approve withdrawal (${response.status})`;
        showToast(errorMsg, 'error');
        return;
      }

      if (result.success) {
        showToast('Withdrawal approved successfully!', 'success');
        fetchWithdrawals();
      } else {
        console.error('API returned success:false:', result);
        const errorMsg = result.details 
          ? `${result.error || 'Failed to approve withdrawal'}: ${result.details}`
          : result.error || result.message || 'Failed to approve withdrawal';
        showToast(errorMsg, 'error');
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast(`Error approving withdrawal: ${errorMessage}`, 'error');
    } finally {
      setIsApproving(false);
      setApproveConfirmDialog({
        open: false,
        withdrawalId: 0,
        withdrawal: null,
        transactionId: '',
      });
    }
  };

  const handleEditTransactionId = (withdrawal: Withdrawal) => {
    setEditTransactionIdDialog({
      open: true,
      withdrawalId: withdrawal.id,
      withdrawal: withdrawal,
      transactionId: withdrawal.withdrawalId && withdrawal.withdrawalId !== '-' 
        ? withdrawal.withdrawalId 
        : '',
    });
  };

  const confirmUpdateTransactionId = async (withdrawalId: number, transactionId: string) => {
    if (!transactionId || !transactionId.trim()) {
      showToast('Transaction ID is required', 'error');
      return;
    }

    setIsUpdatingTransactionId(true);
    try {
      const response = await fetch(`/api/admin/affiliates/withdrawals/${withdrawalId}/update-transaction-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transactionId.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', result);
        const errorMsg = result.details 
          ? `${result.error || 'Failed to update transaction ID'}: ${result.details}`
          : result.error || result.message || `Failed to update transaction ID (${response.status})`;
        showToast(errorMsg, 'error');
        return;
      }

      if (result.success) {
        showToast('Transaction ID updated successfully!', 'success');
        fetchWithdrawals();
      } else {
        console.error('API returned success:false:', result);
        const errorMsg = result.details 
          ? `${result.error || 'Failed to update transaction ID'}: ${result.details}`
          : result.error || result.message || 'Failed to update transaction ID';
        showToast(errorMsg, 'error');
      }
    } catch (error) {
      console.error('Error updating transaction ID:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast(`Error updating transaction ID: ${errorMessage}`, 'error');
    } finally {
      setIsUpdatingTransactionId(false);
      setEditTransactionIdDialog({
        open: false,
        withdrawalId: 0,
        withdrawal: null,
        transactionId: '',
      });
    }
  };

  const handleCancel = (withdrawalId: number) => {
    const withdrawal = withdrawals.find((w) => w.id === withdrawalId);
    setCancelConfirmDialog({
      open: true,
      withdrawalId,
      withdrawal: withdrawal || null,
      cancelReason: '',
    });
  };

  const confirmCancel = async (withdrawalId: number, cancelReason: string) => {
    setIsCanceling(true);
    try {
      const response = await fetch(`/api/admin/affiliates/withdrawals/${withdrawalId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelReason: cancelReason.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setWithdrawals((prevWithdrawals) =>
          prevWithdrawals.map((withdrawal) =>
            withdrawal.id === withdrawalId
              ? {
                  ...withdrawal,
                  status: 'Cancelled' as const,
                }
              : withdrawal
          )
        );

        showToast('Withdrawal cancelled successfully!', 'success');
        fetchWithdrawals();
      } else {
        showToast(result.error || 'Failed to cancel withdrawal', 'error');
      }
    } catch (error) {
      console.error('Error cancelling withdrawal:', error);
      showToast('Error cancelling withdrawal', 'error');
    } finally {
      setIsCanceling(false);
      setCancelConfirmDialog({
        open: false,
        withdrawalId: 0,
        withdrawal: null,
        cancelReason: '',
      });
    }
  };

  const openViewDetailsDialog = (withdrawal: Withdrawal) => {
    setViewDetailsDialog({ open: true, withdrawal });
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
            <div className="flex flex-col md:flex-row items-left gap-2">
              <div className="flex items-center gap-2 justify-start">
                <select
                  value={pagination.limit}
                  onChange={(e) =>
                    setPagination((prev) => ({
                      ...prev,
                      limit:
                        e.target.value === 'all'
                          ? 999999
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
                  disabled={withdrawalsLoading || statsLoading}
                  className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
                >
                  <FaSync
                    className={
                      withdrawalsLoading || statsLoading ? 'animate-spin' : ''
                    }
                  />
                  Refresh
                </button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-auto">
                  <FaSearch
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by ID, Transaction ID, or User..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  />
                </div>
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
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {stats.totalWithdrawals}
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
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}
                  >
                    {stats.pendingWithdrawals}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('success')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'success'
                      ? 'bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Success
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'success'
                        ? 'bg-white/20'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}
                  >
                    {stats.completedWithdrawals}
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
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {stats.cancelledWithdrawals}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            {withdrawalsLoading ? (
              <div className="min-h-[600px]">
                <WithdrawalsTableSkeleton />
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-12">
                <FaMoneyBillWave className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300">
                  No withdrawals found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No withdrawals match your current filters or no withdrawals exist yet.
                </p>
              </div>
            ) : (
              <React.Fragment>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[1200px]">
                    <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          ID
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          User
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          Transaction ID
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          Amount
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          Method
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          Date
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          Status
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((withdrawal) => (
                        <tr
                          key={withdrawal.id}
                          className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
                        >
                          <td className="p-3">
                            <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                              {withdrawal.id
                                ? formatID(withdrawal.id.toString().slice(-8))
                                : 'null'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {withdrawal.affiliate.user?.username ||
                                withdrawal.affiliate.user?.email?.split('@')[0] ||
                                withdrawal.affiliate.user?.name ||
                                'null'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {withdrawal.withdrawalId || '-'}
                            </div>
                          </td>
                          <td className="p-3">
                            <PriceDisplay
                              amount={withdrawal.amount}
                              originalCurrency="USD"
                              className="font-semibold text-sm"
                            />
                          </td>
                          <td className="p-3">
                            {withdrawal.payment_method ? (
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {withdrawal.payment_method}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div>
                              <div className="text-xs text-gray-900 dark:text-gray-100">
                                {withdrawal.createdAt
                                  ? new Date(withdrawal.createdAt).toLocaleDateString()
                                  : 'null'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {withdrawal.createdAt
                                  ? new Date(withdrawal.createdAt).toLocaleTimeString()
                                  : 'null'}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            {getStatusBadge(withdrawal.status)}
                          </td>
                          <td className="p-3">
                            {withdrawal.status === 'Pending' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleApprove(withdrawal.id)}
                                  className="btn btn-primary flex items-center gap-1 px-3 py-1.5 text-xs bg-green-500 text-white border border-green-500 hover:bg-green-600"
                                  title="Approve"
                                >
                                  <FaCheckCircle className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleCancel(withdrawal.id)}
                                  className="btn btn-secondary flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500 text-white border border-red-500 hover:bg-red-600"
                                  title="Cancel"
                                >
                                  <FaTimesCircle className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <div className="relative">
                                  <button
                                    className="btn btn-secondary p-2"
                                    title="More Actions"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const dropdown = e.currentTarget
                                        .nextElementSibling as HTMLElement;
                                      dropdown.classList.toggle('hidden');
                                    }}
                                  >
                                    <FaEllipsisH className="h-3 w-3" />
                                  </button>

                                  <div className="hidden absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                                    <div className="py-1">
                                      {withdrawal.status === 'Success' && 
                                       !withdrawal.transactionIdEdited && (
                                        <button
                                          onClick={() => {
                                            handleEditTransactionId(withdrawal);
                                            const dropdown =
                                              document.querySelector(
                                                '.absolute.right-0'
                                              ) as HTMLElement;
                                            dropdown?.classList.add('hidden');
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                                        >
                                          <FaEdit className="h-3 w-3" />
                                          Edit Transaction ID
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          openViewDetailsDialog(withdrawal);
                                          const dropdown =
                                            document.querySelector(
                                              '.absolute.right-0'
                                            ) as HTMLElement;
                                          dropdown?.classList.add('hidden');
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                                      >
                                        <FaEye className="h-3 w-3" />
                                        View Details
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {withdrawalsLoading ? (
                      <div className="flex items-center gap-2">
                        <span>Loading pagination...</span>
                      </div>
                    ) : (
                      pagination.limit > 10000
                        ? `Showing all ${formatNumber(pagination.total)} withdrawals`
                        : `Showing ${formatNumber(
                            (pagination.page - 1) * pagination.limit + 1
                          )} to ${formatNumber(
                            Math.min(
                              pagination.page * pagination.limit,
                              pagination.total
                            )
                          )} of ${formatNumber(pagination.total)} withdrawals`
                    )}
                  </div>
                  {pagination.limit <= 10000 && (
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: Math.max(1, prev.page - 1),
                          }))
                        }
                        disabled={!pagination.hasPrev || withdrawalsLoading}
                        className="btn btn-secondary"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {withdrawalsLoading ? (
                          <div className="h-4 w-24 gradient-shimmer rounded" />
                        ) : (
                          `Page ${formatNumber(
                            pagination.page
                          )} of ${formatNumber(pagination.totalPages)}`
                        )}
                      </span>
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: Math.min(prev.totalPages, prev.page + 1),
                          }))
                        }
                        disabled={!pagination.hasNext || withdrawalsLoading}
                        className="btn btn-secondary"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

                {viewDetailsDialog.open && viewDetailsDialog.withdrawal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] max-w-[90vw] mx-4 max-h-[80vh] overflow-y-auto">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        Withdrawal Details
                      </h3>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Transaction ID
                            </label>
                            <div className="font-mono text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                              {viewDetailsDialog.withdrawal.withdrawalId || '-'}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Internal ID
                            </label>
                            <div className="font-mono text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                              {formatID(viewDetailsDialog.withdrawal.id)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              User
                            </label>
                            <div className="text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                              {viewDetailsDialog.withdrawal.affiliate.user?.username ||
                                viewDetailsDialog.withdrawal.affiliate.user?.email ||
                                'N/A'}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Method
                            </label>
                            <div className="text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                              {viewDetailsDialog.withdrawal.payment_method || 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Amount
                            </label>
                            <div className="text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded font-semibold text-gray-900 dark:text-gray-100">
                              <PriceDisplay
                                amount={viewDetailsDialog.withdrawal.amount}
                                originalCurrency="USD"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Status
                            </label>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(viewDetailsDialog.withdrawal.status)}
                            </div>
                          </div>
                        </div>

                        {viewDetailsDialog.withdrawal.notes && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Notes
                            </label>
                            <div className="text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                              {viewDetailsDialog.withdrawal.notes}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Created
                            </label>
                            <div className="text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                              {new Date(
                                viewDetailsDialog.withdrawal.createdAt
                              ).toLocaleString()}
                            </div>
                          </div>
                          {viewDetailsDialog.withdrawal.processedAt && (
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Processed
                              </label>
                              <div className="text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                                {new Date(
                                  viewDetailsDialog.withdrawal.processedAt
                                ).toLocaleString()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end mt-6">
                        <button
                          onClick={() =>
                            setViewDetailsDialog({
                              open: false,
                              withdrawal: null,
                            })
                          }
                          className="btn btn-secondary"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {approveConfirmDialog.open &&
                  approveConfirmDialog.withdrawal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-400">
                          Approve Withdrawal
                        </h3>

                        <div className="mb-6">
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Are you sure you want to approve this withdrawal?
                          </p>

                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                User:
                              </span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {approveConfirmDialog.withdrawal.affiliate.user
                                  ?.username ||
                                  approveConfirmDialog.withdrawal.affiliate.user
                                    ?.email ||
                                  'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                Amount:
                              </span>
                              <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                                <PriceDisplay
                                  amount={approveConfirmDialog.withdrawal.amount}
                                  originalCurrency="USD"
                                />
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                Method:
                              </span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {approveConfirmDialog.withdrawal.payment_method || '-'}
                              </span>
                            </div>
                          </div>

                          <div className="form-group mt-4">
                            <label className="form-label">
                              Transaction ID <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={approveConfirmDialog.transactionId}
                              onChange={(e) =>
                                setApproveConfirmDialog({
                                  ...approveConfirmDialog,
                                  transactionId: e.target.value,
                                })
                              }
                              placeholder="Enter transaction ID"
                              required
                              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col-reverse md:flex-row gap-3 justify-center md:justify-end">
                          <button
                            onClick={() => {
                              setApproveConfirmDialog({
                                open: false,
                                withdrawalId: 0,
                                withdrawal: null,
                                transactionId: '',
                              });
                            }}
                            className="btn btn-secondary w-full md:w-auto"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() =>
                              confirmApprove(
                                approveConfirmDialog.withdrawalId,
                                approveConfirmDialog.transactionId
                              )
                            }
                            disabled={isApproving}
                            className="btn btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
                          >
                            {isApproving ? (
                              <>
                                Processing...
                              </>
                            ) : (
                              <>
                                <FaCheckCircle className="h-4 w-4" />
                                Approve Withdrawal
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                {cancelConfirmDialog.open &&
                  cancelConfirmDialog.withdrawal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">
                          Cancel Withdrawal
                        </h3>

                        <div className="mb-6">
                          <p className="text-gray-700 dark:text-gray-300 mb-2">
                            Are you sure you want to cancel this withdrawal?
                          </p>
                          <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-4">
                            This action cannot be undone. The amount will be returned to the affiliate's available balance.
                          </p>

                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                User:
                              </span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {cancelConfirmDialog.withdrawal.affiliate.user
                                  ?.username ||
                                  cancelConfirmDialog.withdrawal.affiliate.user?.email ||
                                  'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                Amount:
                              </span>
                              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                <PriceDisplay
                                  amount={cancelConfirmDialog.withdrawal.amount}
                                  originalCurrency="USD"
                                />
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                Method:
                              </span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {cancelConfirmDialog.withdrawal.payment_method || '-'}
                              </span>
                            </div>
                          </div>

                          <div className="form-group mt-4">
                            <label className="form-label">
                              Reason for Cancellation <span className="text-gray-400">(Optional)</span>
                            </label>
                            <textarea
                              value={cancelConfirmDialog.cancelReason}
                              onChange={(e) =>
                                setCancelConfirmDialog({
                                  ...cancelConfirmDialog,
                                  cancelReason: e.target.value,
                                })
                              }
                              placeholder="Enter reason for cancelling this withdrawal..."
                              rows={3}
                              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-vertical"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col-reverse md:flex-row gap-3 justify-center md:justify-end">
                          <button
                            onClick={() =>
                              setCancelConfirmDialog({
                                open: false,
                                withdrawalId: 0,
                                withdrawal: null,
                                cancelReason: '',
                              })
                            }
                            className="btn btn-primary w-full md:w-auto"
                          >
                            Keep Withdrawal
                          </button>
                          <button
                            onClick={() =>
                              confirmCancel(
                                cancelConfirmDialog.withdrawalId,
                                cancelConfirmDialog.cancelReason
                              )
                            }
                            disabled={isCanceling}
                            className="btn flex items-center gap-2 w-full md:w-auto justify-center bg-red-500 text-white border border-red-500 hover:bg-red-600 hover:border-red-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isCanceling ? (
                              <>
                                Canceling...
                              </>
                            ) : (
                              <>
                                <FaTimesCircle className="h-4 w-4" />
                                Cancel Withdrawal
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                {editTransactionIdDialog.open &&
                  editTransactionIdDialog.withdrawal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-400">
                          Edit Transaction ID
                        </h3>

                        <div className="mb-6">
                          <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                            You can edit this transaction ID only once. After saving, it cannot be changed again.
                          </p>

                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2 mb-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                User:
                              </span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {editTransactionIdDialog.withdrawal.affiliate.user
                                  ?.username ||
                                  editTransactionIdDialog.withdrawal.affiliate.user
                                    ?.email ||
                                  'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                Amount:
                              </span>
                              <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                                <PriceDisplay
                                  amount={editTransactionIdDialog.withdrawal.amount}
                                  originalCurrency="USD"
                                />
                              </span>
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Transaction ID <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={editTransactionIdDialog.transactionId}
                              onChange={(e) =>
                                setEditTransactionIdDialog({
                                  ...editTransactionIdDialog,
                                  transactionId: e.target.value,
                                })
                              }
                              placeholder="Enter transaction ID"
                              required
                              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col-reverse md:flex-row gap-3 justify-center md:justify-end">
                          <button
                            onClick={() => {
                              setEditTransactionIdDialog({
                                open: false,
                                withdrawalId: 0,
                                withdrawal: null,
                                transactionId: '',
                              });
                            }}
                            className="btn btn-secondary w-full md:w-auto"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() =>
                              confirmUpdateTransactionId(
                                editTransactionIdDialog.withdrawalId,
                                editTransactionIdDialog.transactionId
                              )
                            }
                            disabled={isUpdatingTransactionId}
                            className="btn btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
                          >
                            {isUpdatingTransactionId ? (
                              <>
                                Updating...
                              </>
                            ) : (
                              <>
                                <FaCheckCircle className="h-4 w-4" />
                                Update Transaction ID
                              </>
                            )}
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

export default AdminWithdrawalsPage;