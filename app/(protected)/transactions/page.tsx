'use client';

import { useCurrency } from '@/contexts/currency-context';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import moment from 'moment';
import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaReceipt,
  FaSearch,
  FaSync,
  FaTimes,
} from 'react-icons/fa';
import { TransactionsList } from '../../../components/transactions/transactions-list';

const ButtonLoader = () => <div className="loading-spinner"></div>;

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'pending' | 'warning';
  onClose: () => void;
}) => {
  const warningStyle = type === 'warning'
    ? { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24' }
    : {};

  return (
    <div
      className={`toast toast-${type} toast-enter`}
      style={warningStyle}
    >
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="toast-close">
        <FaTimes className="toast-close-icon" />
      </button>
    </div>
  );
};

type Transaction = {
  id: number;
  invoice_id: number;
  amount: number;
  status: 'Success' | 'Processing' | 'Cancelled' | 'Failed';
  method: string;
  payment_method?: string;
  transaction_id?: string | null;
  createdAt: string;
  reference_id?: string;
  sender_number?: string;
  phone?: string;
  currency?: string;
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function StatusBadge({ status }: { status: Transaction['status'] }) {
  switch (status) {
    case 'Success':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
          Success
        </span>
      );
    case 'Processing':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">
          Processing
        </span>
      );
    case 'Cancelled':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
          Cancelled
        </span>
      );
    case 'Failed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
          {status}
        </span>
      );
  }
}

export default function TransactionsPage() {
  const { appName } = useAppNameWithFallback();
  const searchParams = useSearchParams();
  const router = useRouter();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');

  const { currency, rate } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending' | 'warning';
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasShownPaymentToast, setHasShownPaymentToast] = useState(false);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' | 'warning' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    setPageTitle('Transactions', appName);
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

  useEffect(() => {
    if (typeof window === 'undefined' || hasShownPaymentToast) return;

    const invoiceId = searchParams.get('invoice_id');
    const paymentStatus = searchParams.get('payment');

    if (invoiceId) {
      setHasShownPaymentToast(true);

      setTimeout(async () => {
        try {
          const verifyUrl = `/api/payment/verify-payment?invoice_id=${invoiceId}&from_redirect=true`;

          try {
            const verifyResponse = await fetch(verifyUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (!verifyResponse.ok) {
              console.warn(`Verify-payment API returned ${verifyResponse.status}. Showing invoice info only.`);
              showToast(
                `Payment submitted! Invoice ID: ${invoiceId}. Please check your transaction list.`,
                'info'
              );
              fetchTransactions(true);
              return;
            }

            const verifyData = await verifyResponse.json();

            const paymentStatusFromApi = verifyData.payment?.status;
            const topLevelStatus = verifyData.status;
            const actualStatus = paymentStatusFromApi || topLevelStatus;

            const paymentData = verifyData.payment || {};
            const gatewayInvoiceId = paymentData.invoice_id || invoiceId;
            const apiTransactionId = paymentData.transaction_id;
            const apiPaymentMethod = paymentData.payment_method;
            const paymentAmount = paymentData.amount || paymentData.usdAmount;
            const paymentPhone = paymentData.phone_number || paymentData.sender_number;
            const paymentDate = paymentData.transactionDate || paymentData.createdAt;
            const paymentFee = paymentData.gatewayFee;
            const paymentName = paymentData.name;
            const paymentEmail = paymentData.email;

            console.log('Payment verification response (GET method) - All data fetched using invoice_id URL parameter:', {
              invoice_id_from_url: invoiceId,
              gateway_invoice_id: gatewayInvoiceId,
              paymentStatus: paymentStatusFromApi,
              topLevelStatus,
              actualStatus,
              transaction_id: apiTransactionId,
              payment_method: apiPaymentMethod,
              amount: paymentAmount,
              phone_number: paymentPhone,
              date: paymentDate,
              fee: paymentFee,
              name: paymentName,
              email: paymentEmail,
              fullPaymentData: paymentData,
              fullResponse: verifyData,
              note: 'All payment data (transaction_id, payment_method, etc.) fetched from Verify Payment API using invoice_id URL parameter'
            });

            if (apiTransactionId) {
              sessionStorage.setItem('payment_transaction_id', apiTransactionId);
            }
            if (apiPaymentMethod) {
              sessionStorage.setItem('payment_method', apiPaymentMethod);
            }

            if (actualStatus === 'Success' || actualStatus === 'COMPLETED' || topLevelStatus === 'COMPLETED') {
              const successMessage = `Payment completed successfully! Invoice ID: ${gatewayInvoiceId}`;
              showToast(successMessage, 'success');
            } else if (actualStatus === 'Processing' || actualStatus === 'PENDING' || topLevelStatus === 'PENDING') {
              const pendingMessage = `Payment submitted! Invoice ID: ${gatewayInvoiceId}. Please check your transaction list.`;
              showToast(pendingMessage, 'info');
            } else if (actualStatus === 'Failed' || actualStatus === 'FAILED' || topLevelStatus === 'FAILED') {
              showToast(
                `Payment status: ${actualStatus}. Invoice ID: ${gatewayInvoiceId}`,
                'warning'
              );
            } else {
              showToast(
                `Payment submitted! Invoice ID: ${gatewayInvoiceId}. Please check your transaction list.`,
                'info'
              );
            }

            fetchTransactions(true);
          } catch (fetchError) {
            console.error('Error calling verify-payment API (GET method):', fetchError);
            showToast(
              `Payment submitted! Invoice ID: ${invoiceId}. Please check your transaction list.`,
              'info'
            );
            fetchTransactions(true);
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          showToast(
            invoiceId
              ? `Payment submitted! Invoice ID: ${invoiceId}`
              : 'Payment submitted!',
            'info'
          );
          fetchTransactions(true);
        }
      }, 1000);

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.history) {
          const url = new URL(window.location.href);
          url.searchParams.delete('payment');
          url.searchParams.delete('invoice_id');
          url.searchParams.delete('transaction_id');
          const newUrl = url.pathname + (url.search ? url.search : '');
          window.history.replaceState({}, '', newUrl);
        }
      }, 500);
    } else if (paymentStatus) {
      setHasShownPaymentToast(true);
      if (paymentStatus === 'success') {
        showToast('Payment completed successfully!', 'success');
      } else if (paymentStatus === 'pending') {
        showToast('Payment is pending verification.', 'pending');
      } else if (paymentStatus === 'cancelled') {
        showToast('Payment was cancelled.', 'info');
      } else if (paymentStatus === 'failed') {
        showToast('Payment failed.', 'error');
      }

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.history) {
          const url = new URL(window.location.href);
          url.searchParams.delete('payment');
          const newUrl = url.pathname + (url.search ? url.search : '');
          window.history.replaceState({}, '', newUrl);
        }
      }, 500);
    }
  }, [searchParams, hasShownPaymentToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setSearchLoading(false);
    }, 500);

    if (searchTerm !== debouncedSearchTerm) {
      setSearchLoading(true);
    }

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    const hasSearchTerm = searchTerm.trim() !== '';
    setIsSearching(hasSearchTerm);
  }, [searchTerm]);

  const fetchTransactions = async (isRefresh = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setTableLoading(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }

      const response = await fetch(`/api/user/transactions?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      console.log('API Response:', data);
      console.log('Transactions from API:', data.transactions);

      if (data.transactions && Array.isArray(data.transactions)) {
        data.transactions.forEach((tx: any, index: number) => {
          console.log(`Transaction ${index}:`, {
            invoice_id: tx.invoice_id,
            status: tx.status,
            statusType: typeof tx.status,
            fullTransaction: tx
          });
        });
      }

      const transactionsToShow = data.transactions || [];
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });

      const urlParams = new URLSearchParams(window.location.search);
      const invoiceId = urlParams.get('invoice_id');
      const amount = urlParams.get('amount');
      const transactionId = urlParams.get('transaction_id');
      const status = urlParams.get('status');
      const phone = urlParams.get('phone');

      if (invoiceId && amount && transactionId) {
        const existingTransaction = transactionsToShow.find(
          (tx: Transaction) =>
            tx.invoice_id === Number(invoiceId) || tx.transaction_id === transactionId
        );

        if (!existingTransaction) {
          const newTransaction = {
            id: `url-${Date.now()}`,
            invoice_id: invoiceId,
            amount: parseFloat(amount),
            status:
              status === 'success'
                ? ('Success' as const)
                : ('Processing' as const),
            method: 'UddoktaPay',
            payment_method:
              status === 'success' ? 'Payment Gateway' : 'Manual Payment',
            transaction_id: transactionId || null,
            createdAt: new Date().toISOString(),
            sender_number: phone || 'N/A',
            phone: phone || 'N/A',
          };

          transactionsToShow.unshift(newTransaction);

          if (status === 'success') {
            showToast(
              `Successful transaction ${invoiceId} loaded`,
              'success'
            );
          } else {
            showToast(`Pending transaction ${invoiceId} loaded`, 'info');
          }
        }
      }

      setTransactions(transactionsToShow);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');

      const fallbackTransactions: Transaction[] = [];

      const urlParams = new URLSearchParams(window.location.search);
      const invoiceId = urlParams.get('invoice_id');
      const amount = urlParams.get('amount');
      const transactionId = urlParams.get('transaction_id');
      const status = urlParams.get('status');
      const phone = urlParams.get('phone');

      if (invoiceId && amount && transactionId) {
        const newTransaction = {
          id: Date.now(),
          invoice_id: Number(invoiceId),
          amount: parseFloat(amount),
          status:
            status === 'success'
              ? ('Success' as const)
              : ('Processing' as const),
          method: 'UddoktaPay',
          payment_method:
            status === 'success' ? 'Payment Gateway' : 'Manual Payment',
          transaction_id: transactionId || null,
          createdAt: new Date().toISOString(),
          sender_number: phone || 'N/A',
          phone: phone || 'N/A',
        };
        fallbackTransactions.push(newTransaction);
      }

      setTransactions(fallbackTransactions);
      showToast('Failed to load transactions. Please check your connection and try again', 'error');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      } else {
        setTableLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTransactions(isInitialLoad ? false : true);
  }, [activeTab, page, limit]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedInvoiceId = sessionStorage.getItem('payment_invoice_id');
    if (storedInvoiceId && isInitialLoad) {
      setTimeout(() => {
        fetchTransactions(false);
      }, 500);
    }
  }, [isInitialLoad]);

  const handleViewDetails = (invoiceId: string) => {
    showToast(`Viewing details for ${invoiceId}`, 'info');
  };

  const handlePrevious = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNext = () => {
    if (page < pagination.totalPages) {
      setPage(page + 1);
    }
  };

  const handleLimitChange = (newLimit: string) => {
    setLimit(newLimit === 'all' ? 999999 : parseInt(newLimit));
    setPage(1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTransactions(true);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.transaction_id && String(tx.transaction_id).toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const successTransactions = transactions.filter(
    (tx) => tx.status === 'Success'
  );
  const pendingTransactions = transactions.filter(
    (tx) => tx.status === 'Processing'
  );
  const failedTransactions = transactions.filter(
    (tx) => tx.status === 'Failed' || tx.status === 'Cancelled'
  );

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
        <div className="card card-padding">
          {loading && isInitialLoad ? (
            <>
              <div className="mb-6">
                <div className="relative">
                  <div className="h-10 w-full gradient-shimmer rounded-lg" />
                </div>
              </div>
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                    <div className="h-10 w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div>
                    <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                    <div className="h-10 w-full gradient-shimmer rounded-lg" />
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-9 w-28 gradient-shimmer rounded-full" />
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                        {Array.from({ length: 7 }).map((_, idx) => (
                          <th key={idx} className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                            <div className="h-4 w-24 gradient-shimmer rounded" />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 10 }).map((_, idx) => (
                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-3 px-4">
                            <div className="h-4 w-8 gradient-shimmer rounded" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-4 w-32 gradient-shimmer rounded" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-4 w-20 gradient-shimmer rounded" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-4 w-24 gradient-shimmer rounded" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-4 w-20 gradient-shimmer rounded" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-4 w-32 gradient-shimmer rounded" />
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
            </>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 p-4 rounded-lg">
              <p className="flex items-center">
                <FaExclamationTriangle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </p>
            </div>
          ) : (
            <>
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
                            <option value="all">Show All</option>
                          </>
                        )}
                        {pagination.total === 0 && (
                          <option value="10">No transactions found</option>
                        )}
                      </select>
                    </div>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing || tableLoading}
                      className="btn btn-primary flex items-center gap-2 px-3 py-2.5 h-12"
                    >
                      <FaSync className={refreshing || tableLoading ? 'animate-spin' : ''} />
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
                          placeholder="Search by ID or Transaction ID..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                          }}
                          className="form-field w-full pl-10 pr-10 py-3 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm h-12"
                          autoComplete="off"
                        />
                        {searchLoading && (
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
                  <button
                    onClick={() => handleTabChange('all')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white ${activeTab === 'all'
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg'
                        : 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400'
                      }`}
                  >
                    <FaReceipt className="w-4 h-4" />
                    All ({pagination.total})
                  </button>

                  <button
                    onClick={() => handleTabChange('success')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white ${activeTab === 'success'
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg'
                        : 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400'
                      }`}
                  >
                    <FaCheckCircle className="w-4 h-4" />
                    Success ({successTransactions.length})
                  </button>

                  <button
                    onClick={() => handleTabChange('pending')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white ${activeTab === 'pending'
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg'
                        : 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400'
                      }`}
                  >
                    <FaClock className="w-4 h-4" />
                    Pending ({pendingTransactions.length})
                  </button>

                  <button
                    onClick={() => handleTabChange('failed')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white ${activeTab === 'failed'
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg'
                        : 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400'
                      }`}
                  >
                    <FaExclamationTriangle className="w-4 h-4" />
                    Failed ({failedTransactions.length})
                  </button>
                </div>
              </div>
              {searchLoading || tableLoading ? (
                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                          {Array.from({ length: 7 }).map((_, idx) => (
                            <th key={idx} className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                              <div className="h-4 w-24 gradient-shimmer rounded" />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 10 }).map((_, idx) => (
                          <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-3 px-4">
                              <div className="h-4 w-8 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-4 w-32 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-4 w-20 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-4 w-24 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-4 w-20 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-4 w-32 gradient-shimmer rounded" />
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
              ) : (
                <>
                  <TransactionsList
                    transactions={filteredTransactions}
                    page={page}
                    limit={limit}
                    formatTime={formatTime}
                  />
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Page <span className="font-medium">{pagination.page}</span> of{' '}
                        <span className="font-medium">{pagination.totalPages}</span>
                        {' '}({pagination.total || 0} transactions total)
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePrevious}
                          disabled={page === 1 || tableLoading}
                          className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Previous
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={page >= pagination.totalPages || tableLoading}
                          className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
