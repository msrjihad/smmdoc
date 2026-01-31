'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import ActivateAffiliateContent from '@/app/(protected)/affiliate/activate/page';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { formatID, formatNumber, formatPrice } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/utils/logger';
import { RequestWithdrawalModal } from '@/components/dashboard/affiliate/request-withdrawal';
import {
  FaChartLine,
  FaCheckCircle,
  FaCoins,
  FaCopy,
  FaCreditCard,
  FaDollarSign,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaLink,
  FaMousePointer,
  FaPercent,
  FaSearch,
  FaShareAlt,
  FaSync,
  FaTimes,
  FaUser,
  FaUsers
} from 'react-icons/fa';

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

export default function AffiliateProgram() {
  const { appName } = useAppNameWithFallback();
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    setPageTitle('Affiliate Program', appName);
  }, [appName]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/affiliate/stats');
        if (res.ok) {
          const json = await res.json();
          const status = (json?.data?.status || '') as string;
          setIsActive(status === 'active');
        }
      } catch { }
    })();
  }, []);

  if (!isActive) return <ActivateAffiliateContent />;
  return (
    <div className="min-h-screen bg-[var(--page-bg)] dark:bg-[var(--page-bg)] transition-colors duration-200">
      <div className="space-y-6">
        <AffiliateStatsCards />
        <AffiliateEarningsSection />
      </div>
    </div>
  );
}

interface AffiliateStats {
  visits: number;
  registrations: number;
  referrals: number;
  conversionRate: string;
  totalEarnings: string;
  availableEarnings: string;
  commissionRate: string;
  minimumPayout: string;
}

interface AffiliateEarning {
  id: number;
  signupDate: string;
  service: string;
  category: string | null;
  amount: number;
  commission: number;
  status: 'completed' | 'pending' | 'cancelled';
  user: {
    id: number;
    email: string;
    name: string;
    username?: string;
  };
  currency: string;
}

interface EarningsPaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function AffiliateStatsCards() {
  const user = useCurrentUser();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfoLoading, setUserInfoLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const [cachedReferralCode, setCachedReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<AffiliateStats>({
    visits: 0,
    registrations: 0,
    referrals: 0,
    conversionRate: '0.00%',
    totalEarnings: '$0.00',
    availableEarnings: '$0.00',
    commissionRate: '0%',
    minimumPayout: '$0.00',
  });

  const referralLink = (() => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin;
    const code = (stats as any)?.referralCode || cachedReferralCode;
    return code ? `${base}/api/ref/${code}` : '';
  })();

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('affiliateReferralCode');
      if (stored) setCachedReferralCode(stored);
    }
    const fetchStats = async () => {
      try {
        setLoading(true);
        setStatsLoading(true);
        const response = await fetch('/api/user/affiliate/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch affiliate stats');
        }

        const data = await response.json();
        if (data.success && data.data) {
          setStats(data.data);
          if (typeof window !== 'undefined' && data.data.referralCode) {
            window.localStorage.setItem('affiliateReferralCode', data.data.referralCode);
            setCachedReferralCode(data.data.referralCode);
          }
        }
      } catch (error) {
        logger.error('Error fetching affiliate stats', error);
        showToast('Error loading affiliate stats', 'error');
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    };

    setUserInfoLoading(false);
    
    let isFetching = false;
    const fetchStatsOnce = async () => {
      if (isFetching) return;
      isFetching = true;
      await fetchStats();
      isFetching = false;
    };
    
    fetchStatsOnce();

    const handleStatsRefresh = () => {
      fetchStats();
    };

    window.addEventListener('affiliateStatsRefresh', handleStatsRefresh);

    return () => {
      window.removeEventListener('affiliateStatsRefresh', handleStatsRefresh);
    };
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(referralLink)
      .then(() => {
        setCopied(true);
        showToast('Referral link copied!', 'success');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        showToast('Failed to copy', 'error');
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card card-padding">
          <div className="card-content">
            <div className="card-icon">
              <FaUser />
            </div>
            <div>
              <h3 className="card-title">Username</h3>
              {userInfoLoading ? (
                <div className="h-4 w-24 gradient-shimmer rounded" />
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {user?.username || user?.email?.split('@')[0] || 'User'}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="card card-padding">
          <div className="card-content">
            <div className="card-icon">
              <FaLink />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="card-title">Referral Link</h3>
              {userInfoLoading ? (
                <div className="h-4 w-40 gradient-shimmer rounded" />
              ) : (
                <div className="flex items-center">
                  <p
                    className="text-sm truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {referralLink
                      ? referralLink.replace(/^https?:\/\//, '')
                      : 'Login to generate'}
                  </p>
                  {referralLink && (
                    <button
                      onClick={copyToClipboard}
                      className="ml-2 text-[var(--primary)] hover:text-[var(--secondary)] dark:text-[var(--secondary)] dark:hover:text-[var(--primary)] transition-colors duration-200"
                      title={copied ? 'Copied!' : 'Copy link'}
                    >
                      <FaCopy className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="card card-padding">
          <div className="card-content">
            <div className="card-icon">
              <FaPercent />
            </div>
            <div>
              <h3 className="card-title">Commission Rate</h3>
              {userInfoLoading ? (
                <div className="h-4 w-16 gradient-shimmer rounded" />
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {stats.commissionRate}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="card card-padding">
          <div className="card-content">
            <div className="card-icon">
              <FaCoins />
            </div>
            <div>
              <h3 className="card-title">Minimum Payout</h3>
              {userInfoLoading ? (
                <div className="h-4 w-24 gradient-shimmer rounded" />
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {stats.minimumPayout}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <label className="text-sm font-medium text-white/80 whitespace-nowrap">
            Your Unique Referral Link
          </label>
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm w-full md:flex-1">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-white dark:bg-gray-800 px-4 py-3 text-gray-800 dark:text-gray-200 font-medium text-sm outline-none border-none"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-3 text-[var(--primary)] hover:text-[var(--secondary)] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 border-none"
              title={copied ? 'Copied!' : 'Copy link'}
            >
              <FaCopy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="card card-padding">
        <div className="card-header mb-4">
          <div className="card-icon">
            <FaShareAlt />
          </div>
          <h3 className="card-title">Affiliate Statistics Overview</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-600 dark:text-blue-400 font-semibold">
                  Total Visits
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {statsLoading ? (
                    <div className="h-8 w-16 gradient-shimmer rounded" />
                  ) : (
                    formatNumber(stats.visits || 0)
                  )}
                </div>
              </div>
              <FaMousePointer className="text-blue-500 w-5 h-5" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-600 dark:text-green-400 font-semibold">
                  Registrations
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {statsLoading ? (
                    <div className="h-8 w-16 gradient-shimmer rounded" />
                  ) : (
                    formatNumber(stats.registrations || 0)
                  )}
                </div>
              </div>
              <FaUsers className="text-green-500 w-5 h-5" />
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-600 dark:text-purple-400 font-semibold">
                  Referrals
                </div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {statsLoading ? (
                    <div className="h-8 w-16 gradient-shimmer rounded" />
                  ) : (
                    formatNumber(stats.referrals || 0)
                  )}
                </div>
              </div>
              <FaUsers className="text-purple-500 w-5 h-5" />
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-orange-600 dark:text-orange-400 font-semibold">
                  Conversion Rate
                </div>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {statsLoading ? (
                    <div className="h-8 w-20 gradient-shimmer rounded" />
                  ) : (
                    stats.conversionRate
                  )}
                </div>
              </div>
              <FaChartLine className="text-orange-500 w-5 h-5" />
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  Available Earnings
                </div>
                <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  {statsLoading ? (
                    <div className="h-8 w-24 gradient-shimmer rounded" />
                  ) : (
                    stats.availableEarnings
                  )}
                </div>
              </div>
              <FaCoins className="text-indigo-500 w-5 h-5" />
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Total Earnings
                </div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {statsLoading ? (
                    <div className="h-8 w-24 gradient-shimmer rounded" />
                  ) : (
                    stats.totalEarnings
                  )}
                </div>
              </div>
              <FaDollarSign className="text-emerald-500 w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AffiliateEarningsSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState<EarningsPaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    selectedWithdrawalMethod: '',
    paymentDetails: '',
  });
  const [withdrawalProcessing, setWithdrawalProcessing] = useState(false);

  const [savedWithdrawalMethods, setSavedWithdrawalMethods] = useState<any[]>([])
  const getWithdrawalMethodDisplayName = (method: string): string => {
    const names: Record<string, string> = {
      bkash: 'bKash',
      nagad: 'Nagad',
      rocket: 'Rocket',
      upay: 'Upay',
      bank: 'Bank Transfer',
    }
    const key = (method || '').toLowerCase()
    return names[key] || method
  }
  const getWithdrawalMethodOptionLabel = (m: any): string => {
    const base = getWithdrawalMethodDisplayName(m.method)
    return base
  }

  const getWithdrawalMethodStyle = (method: string) => {
    switch (method.toLowerCase()) {
      case 'bkash':
        return { bg: 'bg-gradient-to-r from-pink-500 to-red-500', icon: 'bK' };
      case 'nagad':
        return { bg: 'bg-gradient-to-r from-orange-500 to-red-500', icon: 'Na' };
      case 'rocket':
        return { bg: 'bg-gradient-to-r from-purple-500 to-blue-500', icon: 'Ro' };
      case 'upay':
        return { bg: 'bg-gradient-to-r from-blue-500 to-green-500', icon: 'Up' };
      default:
        return { bg: 'bg-gradient-to-r from-gray-500 to-gray-600', icon: method.charAt(0) };
    }
  };

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [minWithdrawalValue, setMinWithdrawalValue] = useState<number>(100)
  const [availableBalanceDisplay, setAvailableBalanceDisplay] = useState<string>('')
  const [availableBalance, setAvailableBalance] = useState<number>(0)

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEarnings = async () => {
    try {
      setEarningsLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(pagination.page))
      params.set('limit', String(pagination.limit))
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/user/affiliate/earnings?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch earnings')
      const json = await res.json()
      setEarnings(json.data || [])
      setPagination(prev => ({
        ...prev,
        total: json.pagination?.total || 0,
        totalPages: json.pagination?.totalPages || 0,
        hasNext: json.pagination?.hasNext || false,
        hasPrev: json.pagination?.hasPrev || false,
      }))
    } catch (error) {
      showToast('Error fetching earnings data', 'error')
    } finally {
      setEarningsLoading(false)
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 500)
    if (searchTerm.trim()) {
      setIsSearchLoading(true)
    } else {
      setIsSearchLoading(false)
    }
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchEarnings()
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    fetchEarnings()
      ; (async () => {
        try {
          const res = await fetch('/api/user/affiliate/stats')
          if (res.ok) {
            const json = await res.json()
            const minPayoutText: string = json?.data?.minimumPayout || '$10.00'
            const value = parseFloat(String(minPayoutText).replace(/[^0-9.]/g, ''))
            setMinWithdrawalValue(isNaN(value) ? 10 : value)
            setAvailableBalanceDisplay(json?.data?.availableEarnings || '')
            const availableEarningsText = json?.data?.availableEarnings || '$0.00'
            const availableBalanceValue = parseFloat(String(availableEarningsText).replace(/[^0-9.]/g, ''))
            setAvailableBalance(isNaN(availableBalanceValue) ? 0 : availableBalanceValue)
          }
          const pmRes = await fetch('/api/user/affiliate/payment-methods')
          if (pmRes.ok) {
            const pmJson = await pmRes.json()
            if (pmJson.success) {
              const list = pmJson.data || []
              setSavedWithdrawalMethods(list)
              if (!withdrawalForm.selectedWithdrawalMethod && list.length > 0) {
                setWithdrawalForm(prev => ({ ...prev, selectedWithdrawalMethod: list[0].id }))
              }
            }
          }
        } catch { }
      })()
  }, []);

  useEffect(() => {
    if (withdrawalModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [withdrawalModalOpen]);

  useEffect(() => {
    const urlStatus = searchParams?.get('status')
    const newStatus = urlStatus ? urlStatus.replace('_', '-') : 'all'
    if (newStatus !== statusFilter) {
      setStatusFilter(newStatus)
    }
  }, [searchParams, statusFilter])

  const handleStatusChange = (key: string) => {
    setStatusFilter(key)
    setPagination(prev => ({ ...prev, page: 1 }))
    const current = searchParams?.toString() || ''
    const params = new URLSearchParams(current)
    if (key === 'all') {
      params.delete('status')
    } else {
      params.set('status', key)
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '/affiliate'
    router.push(newUrl)
  }

  const getStatusCount = (key: string) => {
    if (key === 'all') return earnings.length
    return earnings.filter(e => e.status === key).length
  }

  const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  const safeFormatId = (id: any) => {
    return formatID(String(id || 'null'));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="h-3 w-3 text-green-500" />;
      case 'pending':
        return <FaExclamationTriangle className="h-3 w-3 text-orange-500" />;
      case 'cancelled':
        return <FaTimes className="h-3 w-3 text-red-500" />;
      default:
        return <FaExclamationTriangle className="h-3 w-3 text-gray-500" />;
    }
  };

  const handleRefresh = async () => {
    await fetchEarnings();
    showToast('Affiliate earnings refreshed successfully!', 'success');
  };

  const isWithdrawalFormValid = () => {
    if (!withdrawalForm.amount || !withdrawalForm.amount.trim()) {
      return false;
    }

    const amount = parseFloat(withdrawalForm.amount);
    if (isNaN(amount) || amount <= 0) {
      return false;
    }

    if (amount < minWithdrawalValue) {
      return false;
    }

    if (amount > availableBalance) {
      return false;
    }

    if (!withdrawalForm.selectedWithdrawalMethod) {
      return false;
    }

    const selectedMethod = savedWithdrawalMethods.find(wm => String(wm.id) === String(withdrawalForm.selectedWithdrawalMethod));
    if (!selectedMethod) {
      return false;
    }

    return true;
  };

  const handleWithdrawalRequest = async () => {
    if (!withdrawalForm.amount || parseFloat(withdrawalForm.amount) <= 0) {
      showToast('Please enter a valid withdrawal amount', 'error');
      return;
    }

    if (!withdrawalForm.selectedWithdrawalMethod) {
      showToast('Please select a withdrawal method', 'error');
      return;
    }

    const amount = parseFloat(withdrawalForm.amount);
    const minWithdrawal = minWithdrawalValue;

    if (amount < minWithdrawal) {
      showToast(`Minimum withdrawal amount is ${minWithdrawal}`, 'error');
      return;
    }

    try {
      setWithdrawalProcessing(true);

      const response = await fetch('/api/user/affiliate/withdrawal-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          withdrawalMethodId: withdrawalForm.selectedWithdrawalMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to submit withdrawal request');
      }

      showToast(data.message || 'Withdrawal request submitted successfully!', 'success');
      setWithdrawalModalOpen(false);
      setWithdrawalForm({
        amount: '',
        selectedWithdrawalMethod: '',
        paymentDetails: '',
      });

      await fetchEarnings();
      try {
        const res = await fetch('/api/user/affiliate/stats')
        if (res.ok) {
          const json = await res.json()
          setAvailableBalanceDisplay(json?.data?.availableEarnings || '')
          const availableEarningsText = json?.data?.availableEarnings || '$0.00'
          const availableBalanceValue = parseFloat(String(availableEarningsText).replace(/[^0-9.]/g, ''))
          setAvailableBalance(isNaN(availableBalanceValue) ? 0 : availableBalanceValue)

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('affiliateStatsRefresh'))
          }
        }
      } catch (e) {
        console.error('Error refreshing stats:', e)
      }

      setTimeout(() => {
        router.push('/affiliate/withdrawals')
      }, 500)
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      showToast(
        error instanceof Error ? error.message : 'Error submitting withdrawal request',
        'error'
      );
    } finally {
      setWithdrawalProcessing(false);
    }
  };

  const statusCounts = {
    all: earnings.length,
    pending: earnings.filter(e => e.status === 'pending').length,
    completed: earnings.filter(e => e.status === 'completed').length,
    cancelled: earnings.filter(e => e.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-2">
            <div className="w-full md:w-auto flex items-center gap-2">
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
                className="w-[20%] md:w-auto pl-4 pr-8 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="all">All</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={earningsLoading}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
              >
                <FaSync className={earningsLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-2">
              <button
                onClick={() => setWithdrawalModalOpen(true)}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5 w-full md:w-auto mb-2 md:mb-0"
              >
                <FaMoneyBillWave className="w-4 h-4" />
                Request Withdrawal
              </button>

              <button
                onClick={() => router.push('/affiliate/withdrawal-methods')}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5 w-full md:w-auto"
              >
                <FaCreditCard className="w-4 h-4" />
                Withdrawal Methods
              </button>
            </div>
          </div>
          <div className="w-full md:w-auto flex items-center gap-3">
            <div className="relative w-full md:w-auto">
              <FaSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder={`Search ${statusFilter === 'all' ? 'all' : statusFilter
                  } earnings...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 pl-10 pr-4 py-2.5 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              />
              {isSearchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 gradient-shimmer rounded-full" />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header p-4 pt-4 pb-0 md:p-6 md:pt-6 md:pb-0">
          <div className="mb-4">
            <div className="block space-y-2">
              <div className="flex flex-wrap gap-3">
                {statusFilters.map((f) => {
                  const isActive = statusFilter === f.key
                  const count = getStatusCount(f.key)
                  return (
                    <button
                      key={f.key}
                      onClick={() => handleStatusChange(f.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white ${isActive
                          ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg'
                          : 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400'
                        }`}
                    >
                      {f.label} ({count})
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6">
          {earningsLoading ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)] rounded-t-lg">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 first:rounded-tl-lg">
                      ID
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      User
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 hidden md:table-cell">
                      Registration
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Service
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Amount
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100 hidden md:table-cell">
                      Commission
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100 last:rounded-tr-lg">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, index) => {
                    const isLastRow = index === 9;
                    return (
                      <tr key={index} className={`border-b border-gray-100 dark:border-gray-700 ${isLastRow ? 'last:border-b-0' : ''}`}>
                        <td className={`py-3 px-4 ${isLastRow ? 'first:rounded-bl-lg' : ''}`}>
                          <div className="h-4 w-16 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-20 gradient-shimmer rounded mb-1" />
                          <div className="h-3 w-32 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="h-4 w-24 gradient-shimmer rounded mb-1" />
                          <div className="h-3 w-16 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="h-4 w-32 gradient-shimmer rounded mb-1" />
                          <div className="h-3 w-24 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-20 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="h-4 w-20 gradient-shimmer rounded mb-1" />
                          <div className="h-3 w-12 gradient-shimmer rounded" />
                        </td>
                        <td className={`py-3 px-4 ${isLastRow ? 'last:rounded-br-lg' : ''}`}>
                          <div className="h-6 w-20 gradient-shimmer rounded-full" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : earnings.length === 0 ? (
            <div className="text-center py-12">
              <FaDollarSign
                className="h-16 w-16 mx-auto mb-4"
                style={{ color: 'var(--text-muted)' }}
              />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                No earnings found
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No affiliate earnings match your current filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)] rounded-t-lg">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 first:rounded-tl-lg">
                        ID
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        User
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 hidden md:table-cell">
                        Registration
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Service
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 hidden md:table-cell">
                        Commission
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 last:rounded-tr-lg">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((earning, index) => {
                      const isLastRow = index === earnings.length - 1;
                      return (
                        <tr
                          key={earning.id}
                          className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] ${isLastRow ? 'last:border-b-0' : ''
                            }`}
                        >
                          <td
                            className={`py-3 px-4 ${isLastRow ? 'first:rounded-bl-lg' : ''
                              }`}
                          >
                            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                              {safeFormatId(earning.id)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {earning.user?.username ||
                                earning.user?.email?.split('@')[0] ||
                                earning.user?.name ||
                                'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {new Date(earning.signupDate).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(earning.signupDate).toLocaleTimeString()}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-[200px]">
                            <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                              {earning.service}
                            </div>
                            {earning.category && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate" title={earning.category}>
                                {earning.category.length > 30 ? `${earning.category.substring(0, 30)}...` : earning.category}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              ${formatPrice(earning.amount, 2)}
                            </span>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              ${formatPrice(earning.commission, 2)}
                            </span>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {((earning.commission / earning.amount) * 100).toFixed(1)}%
                            </div>
                          </td>
                          <td
                            className={`py-3 px-4 ${isLastRow ? 'last:rounded-br-lg' : ''
                              }`}
                          >
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${earning.status === 'completed'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                                  : earning.status === 'pending'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                                }`}
                            >
                              {getStatusIcon(earning.status)}
                              <span className="ml-1 capitalize">{earning.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 pb-4 border-t border-gray-200 dark:border-gray-700 gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Page <span className="font-medium">{pagination.page}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                  {' '}({pagination.total || 0} earnings total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page <= 1 || earningsLoading}
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))
                    }
                    disabled={pagination.page >= pagination.totalPages || earningsLoading}
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <RequestWithdrawalModal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
        withdrawalForm={withdrawalForm}
        setWithdrawalForm={setWithdrawalForm}
        withdrawalProcessing={withdrawalProcessing}
        availableBalance={availableBalance}
        availableBalanceDisplay={availableBalanceDisplay}
        minWithdrawalValue={minWithdrawalValue}
        savedWithdrawalMethods={savedWithdrawalMethods}
        getWithdrawalMethodDisplayName={getWithdrawalMethodDisplayName}
        getWithdrawalMethodOptionLabel={getWithdrawalMethodOptionLabel}
        isWithdrawalFormValid={isWithdrawalFormValid}
        onWithdrawalRequest={handleWithdrawalRequest}
      />
    </div>
  );
}