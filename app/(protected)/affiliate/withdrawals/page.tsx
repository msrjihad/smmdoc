'use client';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { useEffect, useState, useRef } from 'react';
import {
    FaCheckCircle,
    FaClock,
    FaExclamationTriangle,
    FaReceipt,
    FaSearch,
    FaTimes,
    FaSync,
} from 'react-icons/fa';
import { WithdrawalsList } from '../../../../components/affiliate/withdrawals-list';

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
    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm border ${
      type === 'success'
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
      {type === 'error' && <FaExclamationTriangle className="w-4 h-4" />}
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

type Withdrawal = {
  id: number;
  invoice_id: number;
  amount: number;
  status: 'Success' | 'Pending' | 'Cancelled';
  method: string;
  payment_method?: string;
  transaction_id?: string;
  createdAt: string;
  processedAt?: string;
  notes?: string;
  cancelReason?: string | null;
};

export default function WithdrawalsPage() {
  const { appName } = useAppNameWithFallback();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
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
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelReasonModal, setCancelReasonModal] = useState<{
    open: boolean;
    reason: string;
  }>({
    open: false,
    reason: '',
  });

  const handleViewCancelReason = (reason: string) => {
    setCancelReasonModal({
      open: true,
      reason: reason,
    });
  };

  useEffect(() => {
    setPageTitle('Withdrawals', appName);
  }, [appName]);

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

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWithdrawals = async () => {
    try {
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }

      if (debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim());
      }

      const response = await fetch(`/api/user/affiliate/withdrawals?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch withdrawals');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch withdrawals');
      }

      const withdrawalsToShow = data.transactions || [];

      setWithdrawals(withdrawalsToShow);
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load withdrawals');
      setWithdrawals([]);
    }
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    const loadWithdrawals = async () => {
      if (isInitialMount.current) {
        setLoading(true);
        isInitialMount.current = false;
      } else {
        setTableLoading(true);
      }
      await fetchWithdrawals();
      setLoading(false);
      setTableLoading(false);
    };

    loadWithdrawals();
  }, [activeTab, page, limit, debouncedSearchTerm]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWithdrawals();
    setRefreshing(false);
    showToast('Withdrawals refreshed successfully!', 'success');
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

  const filteredWithdrawals = withdrawals;

  const successWithdrawals = withdrawals.filter(
    (wd) => wd.status === 'Success'
  );
  const pendingWithdrawals = withdrawals.filter(
    (wd) => wd.status === 'Pending'
  );
  const cancelledWithdrawals = withdrawals.filter(
    (wd) => wd.status === 'Cancelled'
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
          {loading ? (
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
                          <option value="10">No withdrawals found</option>
                        )}
                      </select>
                    </div>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing || loading}
                      className="btn btn-primary flex items-center gap-2 px-3 py-2.5 h-12"
                    >
                      <FaSync className={refreshing ? 'animate-spin' : ''} />
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white ${
                      activeTab === 'all'
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg'
                        : 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400'
                    }`}
                  >
                    <FaReceipt className="w-4 h-4" />
                    All ({pagination.total})
                  </button>

                  <button
                    onClick={() => handleTabChange('success')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white ${
                      activeTab === 'success'
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg'
                        : 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400'
                    }`}
                  >
                    <FaCheckCircle className="w-4 h-4" />
                    Success ({successWithdrawals.length})
                  </button>

                  <button
                    onClick={() => handleTabChange('pending')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white ${
                      activeTab === 'pending'
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg'
                        : 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400'
                    }`}
                  >
                    <FaClock className="w-4 h-4" />
                    Pending ({pendingWithdrawals.length})
                  </button>

                  <button
                    onClick={() => handleTabChange('cancelled')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white ${
                      activeTab === 'cancelled'
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg'
                        : 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400'
                    }`}
                  >
                    <FaTimes className="w-4 h-4" />
                    Cancelled ({cancelledWithdrawals.length})
                  </button>
                </div>
              </div>
              {searchLoading ? (
                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                          {Array.from({ length: 6 }).map((_, idx) => (
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
                  {tableLoading ? (
                    <div className="card">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                              {Array.from({ length: 6 }).map((_, idx) => (
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
                    <WithdrawalsList
                      withdrawals={filteredWithdrawals}
                      page={page}
                      limit={limit}
                      onViewCancelReason={handleViewCancelReason}
                    />
                  )}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Page <span className="font-medium">{pagination.page}</span> of{' '}
                        <span className="font-medium">{pagination.totalPages}</span>
                        {' '}({pagination.total || 0} withdrawals total)
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePrevious}
                          disabled={page === 1 || loading}
                          className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Previous
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={page >= pagination.totalPages || loading}
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

      {cancelReasonModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4 relative">
            <button
              onClick={() =>
                setCancelReasonModal({
                  open: false,
                  reason: '',
                })
              }
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 pr-8">
              Cancellation Reason
            </h3>

            <div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {cancelReasonModal.reason || 'No reason provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

