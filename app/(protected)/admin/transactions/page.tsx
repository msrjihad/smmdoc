'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    FaCheckCircle,
    FaClock,
    FaCreditCard,
    FaExclamationCircle,
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
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';

const ApproveTransactionModal = dynamic(
  () => import('@/components/admin/transactions/modals/approve-transaction'),
  { ssr: false }
);

const CancelTransactionModal = dynamic(
  () => import('@/components/admin/transactions/modals/cancel-transaction'),
  { ssr: false }
);

const AddDeductUserBalanceModal = dynamic(
  () => import('@/components/admin/transactions/modals/add-deduct-user-balance'),
  { ssr: false }
);

const TransactionDetailsModal = dynamic(
  () => import('@/components/admin/transactions/modals/transaction-details'),
  { ssr: false }
);

const UpdateTransactionStatusModal = dynamic(
  () => import('@/components/admin/transactions/modals/update-transaction-status'),
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
  method: string;
  payment_method?: string;
  paymentGateway?: string;
  paymentMethod?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'Processing' | 'Success' | 'Cancelled';
  admin_status: 'Pending' | 'pending' | 'Success' | 'Cancelled';
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');

  useEffect(() => {
    setPageTitle('All Transactions', appName);
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

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: userTimezone,
    });
  };

  const formatDateTime = (dateString: string | Date): string => {
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

    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: userTimezone,
    });

    if (timeFormat === '12') {
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: userTimezone,
      });
      return `${dateStr} ${timeStr}`;
    } else {
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: userTimezone,
      });
      return `${dateStr} ${timeStr}`;
    }
  };

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
    },
  });

  const statusFilter = searchParams.get('status') || 'all';
  const searchTerm = searchParams.get('search') || '';

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 9,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const [searchType, setSearchType] = useState('id');
  const [typeFilter, setTypeFilter] = useState('all');

  const updateQueryParams = useCallback((updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams();
    
    const newStatus = 'status' in updates 
      ? (updates.status === 'all' || updates.status === null ? null : updates.status)
      : (statusFilter !== 'all' ? statusFilter : null);
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
  }, [statusFilter, searchTerm, router]);

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

  const handleBalanceSubmit = async (formData: {
    username: string;
    amount: string;
    action: 'add' | 'deduct';
    notes: string;
  }) => {
    if (!formData.username || !formData.amount) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/users/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          amount: parseFloat(formData.amount),
          action: formData.action,
          notes: formData.notes,
          adminCurrency: currency,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          result.message || `Successfully ${
            formData.action === 'add' ? 'added' : 'deducted'
          } balance ${formData.action === 'add' ? 'to' : 'from'} ${formData.username}`,
          'success'
        );
        setAddDeductBalanceDialog({ open: false });
        fetchTransactions();
      } else {
        showToast(result.error || 'Failed to update user balance', 'error');
      }
    } catch (error) {
      console.error('Error updating user balance:', error);
      showToast('Error updating user balance', 'error');
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
                  admin_status: newStatus as 'pending' | 'Success' | 'Cancelled',
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
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
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
                  onClick={() => updateQueryParams({ status: null })}
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
                  onClick={() => updateQueryParams({ status: 'pending' })}
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
                  onClick={() => updateQueryParams({ status: 'Success' })}
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
                  onClick={() => updateQueryParams({ status: 'Cancelled' })}
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
                  formatTime={formatTime}
                  formatDate={formatDate}
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
                <TransactionDetailsModal
                  isOpen={viewDetailsDialog.open}
                  transaction={viewDetailsDialog.transaction}
                  onClose={() =>
                    setViewDetailsDialog({
                      open: false,
                      transaction: null,
                    })
                  }
                  formatID={formatID}
                  displayMethod={displayMethod}
                  formatDateTime={formatDateTime}
                />
                <UpdateTransactionStatusModal
                  isOpen={updateStatusDialog.open}
                  transactionId={updateStatusDialog.transactionId}
                  currentStatus={updateStatusDialog.currentStatus}
                  onClose={() => {
                    setUpdateStatusDialog({
                      open: false,
                      transactionId: 0,
                      currentStatus: '',
                    });
                  }}
                  onUpdate={handleStatusUpdate}
                />
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
                <AddDeductUserBalanceModal
                  isOpen={addDeductBalanceDialog.open}
                  onClose={() => {
                    setAddDeductBalanceDialog({ open: false });
                    setBalanceSubmitting(false);
                  }}
                  onSubmit={async (formData) => {
                    setBalanceSubmitting(true);
                    await handleBalanceSubmit(formData);
                    setBalanceSubmitting(false);
                  }}
                  isLoading={balanceSubmitting}
                />
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAllTransactionsPage;