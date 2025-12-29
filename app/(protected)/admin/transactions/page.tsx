'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
    FaCheckCircle,
    FaClock,
    FaCreditCard,
    FaDollarSign,
    FaEllipsisH,
    FaExclamationCircle,
    FaEye,
    FaPlus,
    FaSearch,
    FaSync,
    FaTimes,
    FaTimesCircle,
} from 'react-icons/fa';

import { PriceDisplay } from '@/components/price-display';
import { useCurrency } from '@/contexts/currency-context';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';

const ApproveTransactionModal = dynamic(
  () => import('@/components/admin/transactions/modals/approve-transaction'),
  { ssr: false }
);

const CancelTransactionModal = dynamic(
  () => import('@/components/admin/transactions/modals/cancel-transaction'),
  { ssr: false }
);

const TransactionsTable = dynamic(
  () => import('../../../../components/admin/transactions/transactions-table'),
  { ssr: false }
);
const formatID = (id: any) => id;
const formatNumber = (num: number) => num.toLocaleString();
const formatPrice = (price: number, decimals = 2) => price.toFixed(decimals);

const TransactionsTableSkeleton = () => {
  const rows = Array.from({ length: 10 });

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1200px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              {Array.from({ length: 10 }).map((_, idx) => (
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
                  <div className="h-4 w-16 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-5 w-20 gradient-shimmer rounded-full" />
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

interface Transaction {
  id: number;
  user: {
    id: number;
    email: string;
    name: string;
    username?: string;
  };
  transactionId: number | string;
  amount: number;
  bdt_amount?: number;
  currency: string;
  phone: string;
  sender_number?: string;
  method: string;
  payment_method?: string;
  paymentGateway?: string;
  paymentMethod?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'Processing' | 'Success' | 'Cancelled';
  admin_status: 'Pending' | 'pending' | 'Success' | 'Cancelled' | 'Suspicious';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

interface TransactionStats {
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  totalVolume: number;
  todayTransactions: number;
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

const AdminAllTransactionsPage = () => {
  const { appName } = useAppNameWithFallback();

  useEffect(() => {
    setPageTitle('All Transactions', appName);
  }, [appName]);

  const { currency, currentCurrencyData, availableCurrencies } = useCurrency();

  const formatTransactionCurrency = useCallback((amount: number, currency: string) => {

    const currencyInfo = availableCurrencies?.find(c => c.code === currency);

    if (currencyInfo) {
      return `${currencyInfo.symbol}${formatPrice(amount, 2)}`;
    }

    switch (currency) {
      case 'USD':
      case 'USDT':
        return `$${formatPrice(amount, 2)}`;
      case 'BDT':
        return `৳${formatPrice(amount, 2)}`;
      case 'XCD':
        return `$${formatPrice(amount, 2)}`;
      default:
        return `${currency} ${formatPrice(amount, 2)}`;
    }
  }, [availableCurrencies]);


  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    totalVolume: 0,
    todayTransactions: 0,
    statusBreakdown: {
      pending: 0,
      completed: 0,
      cancelled: 0,
      Success: 0,
      Pending: 0,
      Cancelled: 0,
      Suspicious: 0,
    },
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 9,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('id');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [statsLoading, setStatsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const [viewDetailsDialog, setViewDetailsDialog] = useState<{
    open: boolean;
    transaction: Transaction | null;
  }>({
    open: false,
    transaction: null,
  });

  const [updateStatusDialog, setUpdateStatusDialog] = useState<{
    open: boolean;
    transactionId: number;
    currentStatus: string;
  }>({
    open: false,
    transactionId: 0,
    currentStatus: '',
  });
  const [newStatus, setNewStatus] = useState('');

  const [approveConfirmDialog, setApproveConfirmDialog] = useState<{
    open: boolean;
    transactionId: number;
    transaction: Transaction | null;
  }>({
    open: false,
    transactionId: 0,
    transaction: null,
  });

  const [approveTransactionId, setApproveTransactionId] = useState('');
  const [defaultTransactionId, setDefaultTransactionId] = useState('');

  const [cancelConfirmDialog, setCancelConfirmDialog] = useState<{
    open: boolean;
    transactionId: number;
    transaction: Transaction | null;
  }>({
    open: false,
    transactionId: 0,
    transaction: null,
  });

  const [addDeductBalanceDialog, setAddDeductBalanceDialog] = useState<{
    open: boolean;
  }>({
    open: false,
  });

  const [balanceForm, setBalanceForm] = useState({
    username: '',
    amount: '',
    action: 'add',
    notes: '',
  });

  const [usernameSearching, setUsernameSearching] = useState(false);
  const [userFound, setUserFound] = useState<{
    id: number;
    username: string;
    name: string;
    email: string;
  } | null>(null);
  const [balanceSubmitting, setBalanceSubmitting] = useState(false);


  const fetchTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);

      const params = new URLSearchParams({
        admin: 'true',
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
        params.append('searchType', searchType);
      }

      const response = await fetch(`/api/transactions?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (result.success) {

        setTransactions(result.data || []);

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
            totalTransactions: result.stats.totalTransactions,
            pendingTransactions: result.stats.pendingTransactions,
            completedTransactions: result.stats.completedTransactions,
            totalVolume: result.stats.totalVolume,
            todayTransactions: result.stats.todayTransactions,
            statusBreakdown: {
              pending: result.stats.pendingTransactions,
              completed: result.stats.completedTransactions,
              cancelled: result.stats.cancelledTransactions || 0,
              Success: result.stats.completedTransactions,
              Pending: result.stats.pendingTransactions,
              Cancelled: result.stats.cancelledTransactions || 0,
              Suspicious: result.stats.suspiciousTransactions || 0,
            },
          });
        }
      } else if (Array.isArray(result)) {

        console.log('Using legacy array response');
        setTransactions(result);
        setPagination({
          page: 1,
          limit: result.length,
          total: result.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        });
      } else {
        throw new Error(result.error || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
      showToast(`Database Error: ${errorMessage}`, 'error');

      setTransactions([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    } finally {
      setTransactionsLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, searchTerm, searchType]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);

      const response = await fetch('/api/transactions/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction stats');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setStats({
          totalTransactions: result.data.totalTransactions,
          pendingTransactions: result.data.pendingTransactions,
          completedTransactions: result.data.completedTransactions,
          totalVolume: result.data.totalVolume,
          todayTransactions: result.data.todayTransactions,
          statusBreakdown: {
            pending: result.data.pendingTransactions,
            completed: result.data.completedTransactions,
            cancelled: result.data.cancelledTransactions || 0,
            Success: result.data.completedTransactions,
            Pending: result.data.pendingTransactions,
            Cancelled: result.data.cancelledTransactions || 0,
            Suspicious: result.data.suspiciousTransactions || 0,
          },
        });
      } else {
        throw new Error(result.error || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Failed to fetch transaction stats', 'error');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTransactionsLoading(true);
      fetchTransactions();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchTransactions]);

  useEffect(() => {
    setTransactionsLoading(true);
    fetchTransactions();
  }, [pagination.page, pagination.limit, statusFilter, fetchTransactions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (pagination.total > 0) {
      setStats((prev) => ({
        ...prev,
        totalTransactions: pagination.total,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
      case 'pending':
      case 'Processing':
        return <FaClock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />;
      case 'Success':
      case 'completed':
      case 'approved':
        return <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />;
      case 'Cancelled':
      case 'cancelled':
      case 'rejected':
        return <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />;
      case 'Suspicious':
        return <FaExclamationCircle className="h-3 w-3 text-purple-500 dark:text-purple-400" />;
      default:
        return <FaClock className="h-3 w-3 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success':
      case 'completed':
      case 'approved':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
            <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-300">Success</span>
          </div>
        );
      case 'Pending':
      case 'pending':
      case 'Processing':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-fit">
            <FaClock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Pending</span>
          </div>
        );
      case 'Cancelled':
      case 'cancelled':
      case 'rejected':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full w-fit">
            <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
            <span className="text-xs font-medium text-red-700 dark:text-red-300">Cancel</span>
          </div>
        );
      case 'Suspicious':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full w-fit">
            <FaExclamationCircle className="h-3 w-3 text-purple-500 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
              Suspicious
            </span>
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

  const displayMethod = (transaction: Transaction) => {
    const gateway = transaction.method || (transaction as any).paymentGateway || '';
    const methodName = transaction.payment_method || (transaction as any).paymentMethod || '';
    
    if (!gateway && !methodName) {
      return 'Unknown';
    }
    
    if (gateway && methodName) {
      return `${gateway} - ${methodName}`;
    }
    
    if (gateway && !methodName) {
      return `${gateway} - Unknown`;
    }
    
    return gateway || methodName;
  };

  const handleRefresh = () => {
    setTransactionsLoading(true);
    fetchTransactions();
    fetchStats();
    showToast('Transactions refreshed successfully!', 'success');
  };

  const handleAddDeductBalance = () => {
    setAddDeductBalanceDialog({ open: true });
  };

  const searchUsername = async (username: string) => {
    if (!username.trim()) {
      setUserFound(null);
      return;
    }

    try {
      setUsernameSearching(true);
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(username)}`);
      const result = await response.json();

      console.log('Search result for:', username, result);

      if (result.users && result.users.length > 0) {

        const exactMatch = result.users.find((user: any) =>
          user.username?.toLowerCase() === username.toLowerCase()
        );
        const foundUser = exactMatch || result.users[0];
        console.log('Found user:', foundUser);
        setUserFound(foundUser);
      } else {
        console.log('No users found for:', username);
        setUserFound(null);
      }
    } catch (error) {
      console.error('Error searching username:', error);
      setUserFound(null);
    } finally {
      setUsernameSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (balanceForm.username.trim()) {
        searchUsername(balanceForm.username.trim());
      } else {
        setUserFound(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [balanceForm.username]);

  const handleBalanceSubmit = async () => {
    if (!balanceForm.username || !balanceForm.amount || !userFound) {
      showToast('Please fill in all required fields and ensure user is found', 'error');
      return;
    }

    if (parseFloat(balanceForm.amount) <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }

    try {
      setBalanceSubmitting(true);
      const response = await fetch('/api/admin/users/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: balanceForm.username,
          amount: parseFloat(balanceForm.amount),
          action: balanceForm.action,
          notes: balanceForm.notes,
          adminCurrency: currency,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          result.message || `Successfully ${
            balanceForm.action === 'add' ? 'added' : 'deducted'
          } balance ${balanceForm.action === 'add' ? 'to' : 'from'} ${balanceForm.username}`,
          'success'
        );
        setAddDeductBalanceDialog({ open: false });
        setBalanceForm({ username: '', amount: '', action: 'add', notes: '' });
        setUserFound(null);

        fetchTransactions();
      } else {
        showToast(result.error || 'Failed to update user balance', 'error');
      }
    } catch (error) {
      console.error('Error updating user balance:', error);
      showToast('Error updating user balance', 'error');
    } finally {
      setBalanceSubmitting(false);
    }
  };

  const handleApprove = (transactionId: string) => {
    const numericId = parseInt(transactionId);
    const transaction = transactions.find((t) => t.id === numericId);

    let defaultId = transaction?.transactionId?.toString() || '';

    if (!defaultId) {
      const timestamp = new Date().getTime();
      defaultId = `DEP-${transaction?.id || ''}-${timestamp.toString().slice(-6)}`;
    }

    setDefaultTransactionId(defaultId);
    setApproveTransactionId(defaultId);

    setApproveConfirmDialog({
      open: true,
      transactionId: numericId,
      transaction: transaction || null,
    });
  };

  const confirmApprove = async (transactionId: number, modifiedTransactionId: string) => {
    try {
      const response = await fetch(
        `/api/admin/funds/${transactionId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            modifiedTransactionId: modifiedTransactionId.trim(),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setTransactions((prevTransactions) =>
          prevTransactions.map((transaction) =>
            transaction.id === transactionId
              ? {
                  ...transaction,
                  admin_status: 'Success' as const,
                  status: 'completed' as const,
                  transactionId: modifiedTransactionId.trim() || transaction.transactionId,
                }
              : transaction
          )
        );

        showToast('Transaction approved successfully!', 'success');
        fetchStats();
        setApproveConfirmDialog({
          open: false,
          transactionId: 0,
          transaction: null,
        });
        setApproveTransactionId('');
      } else {
        showToast(result.error || 'Failed to approve transaction', 'error');
      }
    } catch (error) {
      console.error('Error approving transaction:', error);
      showToast('Error approving transaction', 'error');
    }
  };

  const handleCancel = (transactionId: string) => {
    const transaction = transactions.find((t) => t.id.toString() === transactionId);
    setCancelConfirmDialog({
      open: true,
      transactionId: parseInt(transactionId),
      transaction: transaction || null,
    });
  };

  const confirmCancel = async (transactionId: number) => {
    try {
      const response = await fetch(`/api/admin/funds/${transactionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setTransactions((prevTransactions) =>
          prevTransactions.map((transaction) =>
            transaction.id === transactionId
              ? {
                  ...transaction,
                  admin_status: 'Cancelled',
                  status: 'cancelled',
                }
              : transaction
          )
        );

        showToast('Transaction cancelled successfully!', 'success');
        fetchStats();
        setCancelConfirmDialog({
          open: false,
          transactionId: 0,
          transaction: null,
        });
      } else {
        showToast(result.error || 'Failed to cancel transaction', 'error');
      }
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      showToast('Error cancelling transaction', 'error');
    }
  };

  const handleStatusUpdate = async (
    transactionId: number,
    newStatus: string
  ) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(`Transaction status updated to ${newStatus}`, 'success');

        setTransactions(prevTransactions =>
          prevTransactions.map(transaction =>
            transaction.id === transactionId
              ? {
                  ...transaction,
                  admin_status: newStatus as 'pending' | 'Success' | 'Cancelled' | 'Suspicious',
                  status: newStatus === 'Success' ? 'completed' as const :
                         newStatus === 'Cancelled' ? 'cancelled' as const :
                         newStatus === 'Pending' ? 'pending' as const : 'pending' as const,
                  updatedAt: new Date().toISOString()
                }
              : transaction
          )
        );

        fetchStats();
      } else {
        showToast(
          result.error || 'Failed to update transaction status',
          'error'
        );
      }
    } catch (error) {
      console.error('Error updating transaction status:', error);
      showToast('Error updating transaction status', 'error');
    }
  };

  const openViewDetailsDialog = (transaction: Transaction) => {
    setViewDetailsDialog({ open: true, transaction });
  };

  const openUpdateStatusDialog = (
    transactionId: number,
    currentStatus: string
  ) => {
    setUpdateStatusDialog({ open: true, transactionId, currentStatus });
    setNewStatus(currentStatus);
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
              <div className="flex items-center gap-2 justify-start"> {} 
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
                  disabled={transactionsLoading || statsLoading}
                  className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
                >
                  <FaSync
                    className={
                      transactionsLoading || statsLoading ? 'animate-spin' : ''
                    }
                  />
                  Refresh
                </button>
              </div>
              <div className="w-full md:w-auto">
                <button
                  onClick={handleAddDeductBalance}
                  className="btn btn-primary flex items-center gap-2 px-3 py-2.5 w-full justify-center"
                >
                  <FaPlus />
                  Add/Deduct User Balance
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
                    placeholder={`Search ${statusFilter === 'all' ? 'all' : statusFilter} transactions...`}
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
                    {stats.totalTransactions}
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
                    {stats.pendingTransactions}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('Success')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'Success'
                      ? 'bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Success
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'Success'
                        ? 'bg-white/20'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}
                  >
                    {stats.completedTransactions}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('Cancelled')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'Cancelled'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Cancelled
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'Cancelled'
                        ? 'bg-white/20'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {stats.statusBreakdown?.cancelled || 0}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('Suspicious')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'Suspicious'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Suspicious
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'Suspicious'
                        ? 'bg-white/20'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {stats.statusBreakdown?.Suspicious || 0}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            {transactionsLoading ? (
              <div className="min-h-[600px]">
                <TransactionsTableSkeleton />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <FaCreditCard
                  className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
                />
                <h3
                  className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300"
                >
                  No transactions found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No transactions match your current filters or no transactions
                  exist yet.
                </p>
              </div>
            ) : (
              <React.Fragment>
                <TransactionsTable
                  transactions={transactions}
                  formatID={formatID}
                  displayMethod={displayMethod}
                  getStatusBadge={getStatusBadge}
                  handleApprove={handleApprove}
                  handleCancel={handleCancel}
                  openViewDetailsDialog={openViewDetailsDialog}
                  openUpdateStatusDialog={openUpdateStatusDialog}
                />

                <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
                  <div
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    {transactionsLoading ? (
                      <div className="flex items-center gap-2">
                        <span>Loading pagination...</span>
                      </div>
                    ) : (
                      pagination.limit > 10000
                        ? `Showing all ${formatNumber(pagination.total)} transactions`
                        : `Showing ${formatNumber(
                            (pagination.page - 1) * pagination.limit + 1
                          )} to ${formatNumber(
                            Math.min(
                              pagination.page * pagination.limit,
                              pagination.total
                            )
                          )} of ${formatNumber(pagination.total)} transactions`
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
                        disabled={!pagination.hasPrev || transactionsLoading}
                        className="btn btn-secondary"
                      >
                        Previous
                      </button>
                      <span
                        className="text-sm text-gray-600 dark:text-gray-400"
                      >
                        {transactionsLoading ? (
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
                        disabled={!pagination.hasNext || transactionsLoading}
                        className="btn btn-secondary"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
                {viewDetailsDialog.open && viewDetailsDialog.transaction && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] max-w-[90vw] mx-4 max-h-[80vh] overflow-y-auto">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        Transaction Details
                      </h3>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Transaction ID
                            </label>
                            <div className="font-mono text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-900 dark:text-gray-100">
                              {viewDetailsDialog.transaction.transactionId ||
                                'Not assigned'}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Internal ID
                            </label>
                            <div className="font-mono text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-900 dark:text-gray-100">
                              {formatID(viewDetailsDialog.transaction.id)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              User
                            </label>
                            <div className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-900 dark:text-gray-100">
                              {viewDetailsDialog.transaction.user?.username ||
                                viewDetailsDialog.transaction.user?.email ||
                                'N/A'}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Phone
                            </label>
                            <div className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-900 dark:text-gray-100">
                              {viewDetailsDialog.transaction.phone || 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Amount
                            </label>
                            <div className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded font-semibold text-gray-900 dark:text-gray-100">
                              <PriceDisplay
                                amount={viewDetailsDialog.transaction.bdt_amount || viewDetailsDialog.transaction.amount}
                                originalCurrency={viewDetailsDialog.transaction.currency === 'USD' || viewDetailsDialog.transaction.currency === 'USDT' ? 'USD' : 'BDT'}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Payment Method
                            </label>
                            <div className="text-xs font-medium p-2 text-gray-700 dark:text-gray-300">
                              {displayMethod(viewDetailsDialog.transaction)}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Status
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(
                              viewDetailsDialog.transaction.admin_status ||
                                viewDetailsDialog.transaction.status
                            )}
                            <span className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                              {viewDetailsDialog.transaction.admin_status ||
                                viewDetailsDialog.transaction.status}
                            </span>
                          </div>
                        </div>

                        {viewDetailsDialog.transaction.notes && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Notes
                            </label>
                            <div className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-900 dark:text-gray-100">
                              {viewDetailsDialog.transaction.notes}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Created
                            </label>
                            <div className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-900 dark:text-gray-100">
                              {new Date(
                                viewDetailsDialog.transaction.createdAt
                              ).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Updated
                            </label>
                            <div className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-900 dark:text-gray-100">
                              {new Date(
                                viewDetailsDialog.transaction.updatedAt
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-6">
                        <button
                          onClick={() =>
                            setViewDetailsDialog({
                              open: false,
                              transaction: null,
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
                {updateStatusDialog.open && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        Update Transaction Status
                      </h3>
                      <div className="mb-4">
                        <label className="form-label mb-2 dark:text-gray-300">
                          Select New Status
                        </label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Success">Success</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Suspicious">Suspicious</option>
                        </select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setUpdateStatusDialog({
                              open: false,
                              transactionId: 0,
                              currentStatus: '',
                            });
                            setNewStatus('');
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            handleStatusUpdate(
                              updateStatusDialog.transactionId,
                              newStatus
                            );
                            setUpdateStatusDialog({
                              open: false,
                              transactionId: 0,
                              currentStatus: '',
                            });
                            setNewStatus('');
                          }}
                          className="btn btn-primary"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <ApproveTransactionModal
                  open={approveConfirmDialog.open}
                  transaction={approveConfirmDialog.transaction}
                  transactionId={approveConfirmDialog.transactionId}
                  approveTransactionId={approveTransactionId}
                  defaultTransactionId={defaultTransactionId}
                  onClose={() => {
                    setApproveConfirmDialog({
                      open: false,
                      transactionId: 0,
                      transaction: null,
                    });
                    setApproveTransactionId('');
                  }}
                  onApprove={confirmApprove}
                  formatTransactionCurrency={formatTransactionCurrency}
                  displayMethod={displayMethod}
                />
                <CancelTransactionModal
                  open={cancelConfirmDialog.open}
                  transaction={cancelConfirmDialog.transaction}
                  transactionId={cancelConfirmDialog.transactionId}
                  onClose={() => {
                    setCancelConfirmDialog({
                      open: false,
                      transactionId: 0,
                      transaction: null,
                    });
                  }}
                  onCancel={confirmCancel}
                  formatTransactionCurrency={formatTransactionCurrency}
                  displayMethod={displayMethod}
                />
                {addDeductBalanceDialog.open && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        Add/Deduct User Balance
                      </h3>

                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="form-label mb-2 dark:text-gray-300">Username <span className="text-red-500 dark:text-red-400">*</span></label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Enter username"
                              value={balanceForm.username}
                              onChange={(e) => {
                                setBalanceForm((prev) => ({
                                  ...prev,
                                  username: e.target.value,
                                }));
                                if (!e.target.value.trim()) {
                                  setUserFound(null);
                                } else {

                                  setTimeout(() => {
                                    if (e.target.value === balanceForm.username) {
                                      searchUsername(e.target.value);
                                    }
                                  }, 500);
                                }
                              }}
                              className="form-field w-full px-4 py-3 pr-10 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                            />
                            {usernameSearching && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]"></div>
                              </div>
                            )}
                          </div>
                          {userFound && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                                <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                                  User found: {userFound.username}
                                </span>
                              </div>
                            </div>
                          )}
                          {balanceForm.username && !usernameSearching && !userFound && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                                <span className="text-sm text-red-700 dark:text-red-300">
                                  User not found
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="form-label mb-2 dark:text-gray-300">Action <span className="text-red-500 dark:text-red-400">*</span></label>
                          <select
                            value={balanceForm.action}
                            onChange={(e) =>
                              setBalanceForm((prev) => ({
                                ...prev,
                                action: e.target.value,
                              }))
                            }
                            className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                          >
                            <option value="add">Add Balance</option>
                            <option value="deduct">Deduct Balance</option>
                          </select>
                        </div>

                        <div>
                          <label className="form-label mb-2 dark:text-gray-300">Amount ({currency}) <span className="text-red-500 dark:text-red-400">*</span></label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                              {balanceForm.action === 'deduct' ? '-' : ''}{currentCurrencyData?.symbol || '$'}
                            </span>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={balanceForm.amount}
                              onChange={(e) =>
                                setBalanceForm((prev) => ({
                                  ...prev,
                                  amount: e.target.value,
                                }))
                              }
                              className="form-field w-full pl-8 pr-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="form-label mb-2 dark:text-gray-300">Notes</label>
                          <input
                            type="text"
                            placeholder="Add notes (optional)"
                            value={balanceForm.notes}
                            onChange={(e) =>
                              setBalanceForm((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => {
                            setAddDeductBalanceDialog({ open: false });
                            setBalanceForm({
                              username: '',
                              amount: '',
                              action: 'add',
                              notes: '',
                            });
                            setUserFound(null);
                            setUsernameSearching(false);
                            setBalanceSubmitting(false);
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleBalanceSubmit}
                          disabled={!balanceForm.username || !balanceForm.amount || !userFound || balanceSubmitting}
                          className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {balanceSubmitting ? (
                            <>
                              {balanceForm.action === 'add' ? 'Adding...' : 'Deducting...'}
                            </>
                          ) : (
                            <>
                              <FaDollarSign className="h-4 w-4" />
                              {balanceForm.action === 'add'
                                ? 'Add Balance'
                                : 'Deduct Balance'}
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

export default AdminAllTransactionsPage;