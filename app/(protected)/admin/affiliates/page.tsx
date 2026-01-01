'use client';

import React, { useEffect, useState } from 'react';
import {
    FaCheckCircle,
    FaClock,
    FaEllipsisH,
    FaEye,
    FaMoneyBillWave,
    FaNetworkWired,
    FaSearch,
    FaSync,
    FaTimes,
    FaTimesCircle,
    FaUserCheck
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { formatID, formatNumber, formatPrice } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';

const AffiliatesTableSkeleton = () => {
  const rows = Array.from({ length: 10 });

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1400px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              {Array.from({ length: 11 }).map((_, idx) => (
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
                  <div className="h-4 w-4 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-6 w-16 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                  <div className="h-3 w-32 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-12 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-12 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-16 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-20 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-20 gradient-shimmer rounded" />
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

interface AffiliateReferral {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    name: string;
    joinedAt: string;
  };
  referralCode: string;
  totalVisits: number;
  signUps: number;
  conversionRate: number;
  totalFunds: number;
  totalEarnings: number;
  earnedCommission: number;
  availableEarnings: number;
  requestedCommission: number;
  totalCommission: number;
  totalWithdrawn: number;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  createdAt: string;
  lastActivity: string;
  commissionRate: number;
  paymentMethod: string;
  paymentDetails?: string | null;
  payoutHistory: PayoutRecord[];
}

interface PayoutRecord {
  id: number;
  amount: number;
  requestedAt: string;
  processedAt?: string;
  status: 'pending' | 'approved' | 'declined' | 'paid';
  method: string;
  notes?: string;
}

interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  inactiveAffiliates: number;
  suspendedAffiliates: number;
  totalVisits: number;
  totalSignUps: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  pendingPayouts: number;
  averageConversionRate: number;
  topPerformers: number;
  todaySignUps: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}



const AffiliateReferralsPage = () => {
  const { appName } = useAppNameWithFallback();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');

  useEffect(() => {
    setPageTitle('Affiliate Referrals', appName);
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

  const [affiliates, setAffiliates] = useState<AffiliateReferral[]>([]);
  const [stats, setStats] = useState<AffiliateStats>({
    totalAffiliates: 0,
    activeAffiliates: 0,
    inactiveAffiliates: 0,
    suspendedAffiliates: 0,
    totalVisits: 0,
    totalSignUps: 0,
    totalCommissionEarned: 0,
    totalCommissionPaid: 0,
    pendingPayouts: 0,
    averageConversionRate: 0,
    topPerformers: 0,
    todaySignUps: 0,
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 8,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAffiliates, setSelectedAffiliates] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [statsLoading, setStatsLoading] = useState(true);
  const [affiliatesLoading, setAffiliatesLoading] = useState(true);

  const [payoutDialog, setPayoutDialog] = useState<{
    open: boolean;
    affiliateId: number;
    requestedAmount: number;
    availableAmount: number;
    paymentMethod: string;
  }>({
    open: false,
    affiliateId: 0,
    requestedAmount: 0,
    availableAmount: 0,
    paymentMethod: '',
  });
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    affiliateId: number;
    currentStatus: string;
  }>({
    open: false,
    affiliateId: 0,
    currentStatus: '',
  });
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    affiliate: AffiliateReferral | null;
  }>({
    open: false,
    affiliate: null,
  });

  const [selectedBulkAction, setSelectedBulkAction] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  const calculateStatusCounts = (affiliatesData: AffiliateReferral[]) => {
    const counts = {
      active: 0,
      inactive: 0,
      suspended: 0,
      pending: 0,
    };

    affiliatesData.forEach((affiliate) => {
      if (affiliate.status && counts.hasOwnProperty(affiliate.status)) {
        counts[affiliate.status as keyof typeof counts]++;
      }
    });

    return counts;
  };

  const fetchAllAffiliatesForCounts = async () => {
    try {
      const res = await fetch('/api/admin/affiliates/stats')
      if (!res.ok) return
      const json = await res.json()
      if (json.success && json.data) {
        setStats(prev => ({
          ...prev,
          totalAffiliates: json.data.totalAffiliates,
          activeAffiliates: json.data.activeAffiliates,
          inactiveAffiliates: json.data.inactiveAffiliates,
          suspendedAffiliates: json.data.suspendedAffiliates,
        }))
      }
    } catch {}
  };

  const fetchAffiliates = async () => {
    try {
      setAffiliatesLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(pagination.page))
      params.set('limit', String(pagination.limit))
      if (searchTerm) params.set('search', searchTerm)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/admin/affiliates?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch affiliates')
      const json = await res.json()
      setAffiliates(json.data || [])
      setPagination(prev => ({
        ...prev,
        total: json.pagination?.total || 0,
        totalPages: json.pagination?.totalPages || 0,
        hasNext: json.pagination?.hasNext || false,
        hasPrev: json.pagination?.hasPrev || false,
      }))
    } catch (error) {
      showToast('Error fetching affiliates. Please try again.', 'error')
      setAffiliates([])
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false })
    } finally {
      setAffiliatesLoading(false)
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/affiliates/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const json = await res.json()
      if (json.success && json.data) setStats(json.data)
    } catch (error) {
      setStats({
        totalAffiliates: 0,
        activeAffiliates: 0,
        inactiveAffiliates: 0,
        suspendedAffiliates: 0,
        totalVisits: 0,
        totalSignUps: 0,
        totalCommissionEarned: 0,
        totalCommissionPaid: 0,
        pendingPayouts: 0,
        averageConversionRate: 0,
        topPerformers: 0,
        todaySignUps: 0,
      })
      showToast('Error fetching statistics. Please refresh the page.', 'error')
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAffiliates();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchAffiliates();
  }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    setStatsLoading(true);

    const loadData = async () => {
      await fetchStats()
      await fetchAllAffiliatesForCounts()
      setStatsLoading(false)
    }
    loadData()
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen !== null) {
        const target = event.target as Element;
        if (!target.closest('.relative')) {
          setDropdownOpen(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (pagination.total > 0) {
      setStats((prev) => ({
        ...prev,
        totalAffiliates: pagination.total,
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
      case 'active':
        return <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />;
      case 'inactive':
        return <FaClock className="h-3 w-3 text-gray-500 dark:text-gray-400" />;
      case 'suspended':
        return <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />;
      case 'pending':
        return <FaClock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />;
      default:
        return <FaClock className="h-3 w-3 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      case 'suspended':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const calculateConversionRate = (signUps: number, visits: number) => {
    if (visits === 0) return 0;
    return (signUps / visits) * 100;
  };

  const handleSelectAll = () => {
    const selectableAffiliates = affiliates.filter(
      (affiliate) => affiliate.status !== 'suspended'
    );

    const selectableIds = selectableAffiliates.map((affiliate) => 
      affiliate.id.toString()
    );

    if (
      selectedAffiliates.length === selectableIds.length &&
      selectableIds.length > 0
    ) {
      setSelectedAffiliates([]);
    } else {
      setSelectedAffiliates(selectableIds);
    }
  };

  const handleSelectAffiliate = (affiliateId: string) => {
    setSelectedAffiliates((prev) =>
      prev.includes(affiliateId)
        ? prev.filter((id) => id !== affiliateId)
        : [...prev, affiliateId]
    );
  };

  const handleRefresh = async () => {
    setAffiliatesLoading(true);
    setStatsLoading(true);

    try {
      await Promise.all([
        fetchAffiliates(),
        fetchStats(),
        fetchAllAffiliatesForCounts(),
      ]);
      showToast('Affiliate data refreshed successfully!', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('Error refreshing data. Please try again.', 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleProcessPayout = async (
    affiliateId: number,
    amount: number,
    method: string,
    notes: string
  ) => {
    try {
      const response = await fetch(
        `/api/admin/affiliates/${affiliateId}/payout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            method,
            notes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to process payout');
      }

      showToast('Payout processed successfully', 'success');
      await Promise.all([
        fetchAffiliates(),
        fetchStats(),
        fetchAllAffiliatesForCounts(),
      ]);
      setPayoutDialog({ 
        open: false, 
        affiliateId: 0, 
        requestedAmount: 0, 
        availableAmount: 0,
        paymentMethod: '',
      });
      setPayoutAmount('');
      setPayoutMethod('');
      setPayoutNotes('');
    } catch (error) {
      console.error('Error processing payout:', error);
      showToast(
        error instanceof Error ? error.message : 'Error processing payout',
        'error'
      );
    }
  };

  const handleStatusChange = async (
    affiliateId: number,
    status: string,
    reason: string
  ) => {
    try {
      const response = await fetch(
        `/api/admin/affiliates/${affiliateId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            reason,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update status');
      }

      showToast('Affiliate status updated successfully', 'success');
      await Promise.all([
        fetchAffiliates(),
        fetchStats(),
        fetchAllAffiliatesForCounts(),
      ]);
      setStatusDialog({ open: false, affiliateId: 0, currentStatus: '' });
      setNewStatus('');
      setStatusReason('');
    } catch (error) {
      console.error('Error updating status:', error);
      showToast(
        error instanceof Error ? error.message : 'Error updating status',
        'error'
      );
    }
  };

  const openPayoutDialog = (
    affiliateId: number,
    requestedAmount: number,
    availableAmount: number,
    paymentMethod: string
  ) => {
    setPayoutDialog({
      open: true,
      affiliateId,
      requestedAmount,
      availableAmount,
      paymentMethod,
    });
    setPayoutAmount(requestedAmount.toString());
    setPayoutMethod(paymentMethod);
    setPayoutNotes('');
  };

  const openStatusDialog = (affiliateId: number, currentStatus: string) => {
    setStatusDialog({ open: true, affiliateId, currentStatus });
    setNewStatus(currentStatus);
    setStatusReason('');
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
                disabled={affiliatesLoading || statsLoading}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
              >
                <FaSync
                  className={
                    affiliatesLoading || statsLoading ? 'animate-spin' : ''
                  }
                />
                Refresh
              </button>
            </div>
            <div className="w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
                />
                <input
                  type="text"
                  placeholder={`Search ${
                    statusFilter === 'all' ? 'all' : statusFilter
                  } affiliates...`}
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
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {stats.totalAffiliates}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'active'
                      ? 'bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Active
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'active'
                        ? 'bg-white/20'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}
                  >
                    {stats.activeAffiliates}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'inactive'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Inactive
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'inactive'
                        ? 'bg-white/20'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {stats.inactiveAffiliates}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('suspended')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'suspended'
                      ? 'bg-gradient-to-r from-red-600 to-red-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Suspended
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'suspended'
                        ? 'bg-white/20'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {stats.suspendedAffiliates}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            {selectedAffiliates.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4 pt-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedAffiliates.length} selected
                </span>
                <select
                  className="pl-4 pr-8 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm"
                  value={selectedBulkAction}
                  onChange={(e) => {
                    setSelectedBulkAction(e.target.value);
                  }}
                >
                  <option value="" disabled>
                    Bulk Actions
                  </option>
                  <option value="activate">Activate Selected</option>
                  <option value="deactivate">Deactivate Selected</option>
                  <option value="process_payouts">Process Payouts</option>
                </select>

                {selectedBulkAction && (
                  <div className="w-full flex justify-center md:w-auto md:block">
                    <button
                      onClick={() => {
                        if (selectedBulkAction === 'activate') {
                          console.log('Bulk activate selected:', selectedAffiliates);
                          showToast(
                            `Activating ${selectedAffiliates.length} selected affiliates...`,
                            'info'
                          );
                        } else if (selectedBulkAction === 'deactivate') {
                          console.log('Bulk deactivate selected:', selectedAffiliates);
                          showToast(
                            `Deactivating ${selectedAffiliates.length} selected affiliates...`,
                            'info'
                          );
                        } else if (selectedBulkAction === 'process_payouts') {
                          console.log('Bulk process payouts selected:', selectedAffiliates);
                          showToast(
                            `Processing payouts for ${selectedAffiliates.length} selected affiliates...`,
                            'info'
                          );
                        }

                        setSelectedBulkAction('');
                        setSelectedAffiliates([]);
                      }}
                      className="btn btn-primary w-full px-3 py-2.5"
                    >
                      Apply Action
                    </button>
                  </div>
                )}
              </div>
            )}

            {affiliatesLoading ? (
              <div className="min-h-[600px]">
                <AffiliatesTableSkeleton />
              </div>
            ) : affiliates.length === 0 ? (
              <div className="text-center py-12">
                <FaNetworkWired className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300">
                  No affiliates found.
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No affiliates match your current filters or no affiliates
                  exist yet.
                </p>
              </div>
            ) : (
              <React.Fragment>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[1400px]">
                    <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          <input
                            type="checkbox"
                            checked={
                              selectedAffiliates.length === affiliates.length &&
                              affiliates.length > 0
                            }
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                          />
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          ID
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          User
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          Total Visits
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          Registrations
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          Referrals
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          Conversion Rate
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          Available Funds
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                          Total Earned
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
                      {affiliates.map((affiliate) => (
                        <tr
                          key={affiliate.id}
                          className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
                        >
                          <td className="p-3">
                            {affiliate.status !== 'suspended' && (
                              <input
                                type="checkbox"
                                checked={selectedAffiliates.includes(
                                  affiliate.id.toString()
                                )}
                                onChange={() =>
                                  handleSelectAffiliate(affiliate.id.toString())
                                }
                                className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                              />
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded">
                              {formatID(affiliate.id.toString())}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {affiliate.user?.username || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {affiliate.user?.email || 'No email'}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                              {formatNumber(affiliate.totalVisits)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                              {formatNumber(affiliate.signUps)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                              {formatNumber(affiliate.signUps)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center">
                              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                {affiliate.conversionRate.toFixed(1)}%
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                              ${formatPrice(affiliate.availableEarnings, 2)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-sm text-green-600 dark:text-green-400">
                              ${formatPrice(affiliate.totalEarnings, 2)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div 
                              className={`flex items-center gap-1 px-2 py-1 rounded-full w-fit text-xs font-medium ${getStatusColor(affiliate.status)}`}
                            >
                              {getStatusIcon(affiliate.status)}
                              <span className="capitalize">
                                {affiliate.status}
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
                                    affiliate: affiliate,
                                  });
                                }}
                              >
                                <FaEye className="h-3 w-3" />
                              </button>

                              <div className="relative">
                                <button
                                  className="btn btn-secondary p-2"
                                  title="More Actions"
                                  onClick={() => {
                                    setDropdownOpen(
                                      dropdownOpen === affiliate.id 
                                        ? null 
                                        : affiliate.id
                                    );
                                  }}
                                >
                                  <FaEllipsisH className="h-3 w-3" />
                                </button>

                                {dropdownOpen === affiliate.id && (
                                  <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                                    {affiliate.requestedCommission > 0 && (
                                      <button
                                        className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                                        onClick={() => {
                                          setDropdownOpen(null);
                                          openPayoutDialog(
                                            affiliate.id,
                                            affiliate.requestedCommission,
                                            affiliate.totalCommission,
                                            affiliate.paymentMethod || 'bank_transfer'
                                          );
                                        }}
                                      >
                                        <FaMoneyBillWave className="h-3 w-3 text-green-600 dark:text-green-400" />
                                        Process Payout
                                      </button>
                                    )}
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                                      onClick={() => {
                                        setDropdownOpen(null);
                                        openStatusDialog(affiliate.id, affiliate.status);
                                      }}
                                    >
                                      <FaUserCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                      Change Status
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {affiliatesLoading ? (
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
                      )} of ${formatNumber(pagination.total)} affiliates`
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={!pagination.hasPrev || affiliatesLoading}
                      className="btn btn-secondary"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {affiliatesLoading ? (
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
                      disabled={!pagination.hasNext || affiliatesLoading}
                      className="btn btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                </div>
                {payoutDialog.open && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        Process Payout
                      </h3>
                      <div className="mb-4">
                        <label className="form-label mb-2">Payout Amount (in USD)</label>
                        <input
                          type="number"
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="Enter payout amount"
                          step="0.01"
                          max={payoutDialog.availableAmount}
                        />
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Available: ${formatPrice(payoutDialog.availableAmount, 2)}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="form-label mb-2">Withdrawal Method</label>
                        <input
                          type="text"
                          value={payoutMethod}
                          readOnly
                          className="form-field w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 cursor-not-allowed transition-all duration-200"
                          placeholder="Withdrawal method selected by affiliate"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={payoutNotes}
                          onChange={(e) => setPayoutNotes(e.target.value)}
                          className="form-field w-full min-h-[120px] resize-y px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                          placeholder="Add any notes about the payout..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setPayoutDialog({
                              open: false,
                              affiliateId: 0,
                              requestedAmount: 0,
                              availableAmount: 0,
                              paymentMethod: '',
                            });
                            setPayoutAmount('');
                            setPayoutMethod('');
                            setPayoutNotes('');
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            handleProcessPayout(
                              payoutDialog.affiliateId,
                              parseFloat(payoutAmount) || 0,
                              payoutMethod,
                              payoutNotes
                            )
                          }
                          className="btn btn-primary"
                          disabled={!payoutAmount}
                        >
                          Process Payout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {statusDialog.open && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        Change Affiliate Status
                      </h3>
                      <div className="mb-4">
                        <label className="form-label mb-2">New Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="form-label mb-2">
                          Reason for Change
                        </label>
                        <textarea
                          value={statusReason}
                          onChange={(e) => setStatusReason(e.target.value)}
                          className="form-field w-full min-h-[120px] resize-y px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                          placeholder="Explain the reason for status change..."
                          rows={4}
                          required
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setStatusDialog({ 
                              open: false, 
                              affiliateId: 0, 
                              currentStatus: '' 
                            });
                            setNewStatus('');
                            setStatusReason('');
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(
                              statusDialog.affiliateId,
                              newStatus,
                              statusReason
                            )
                          }
                          className="btn btn-primary"
                          disabled={!statusReason.trim() || newStatus === statusDialog.currentStatus}
                        >
                          Update Status
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {viewDialog.open && viewDialog.affiliate && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Affiliate Details
                        </h3>
                        <button
                          onClick={() =>
                            setViewDialog({ open: false, affiliate: null })
                          }
                          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <FaTimes className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
                            Basic Information
                          </h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Affiliate ID
                                </label>
                                <div className="font-mono text-sm bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded w-fit mt-1">
                                  {formatID(viewDialog.affiliate.id.toString())}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Username
                                </label>
                                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                  {viewDialog.affiliate.user?.username || 'Unknown'}
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Email
                              </label>
                              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {viewDialog.affiliate.user?.email || 'No email'}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Referral Code
                                </label>
                                <div className="font-mono text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded w-fit mt-1">
                                  {viewDialog.affiliate.referralCode || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  Status
                                </label>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full w-fit text-xs font-medium mt-1 ${getStatusColor(viewDialog.affiliate.status)}`}>
                                  {getStatusIcon(viewDialog.affiliate.status)}
                                  <span className="capitalize">
                                    {viewDialog.affiliate.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
                            Performance Metrics
                          </h4>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Total Visits
                              </label>
                              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                {formatNumber(viewDialog.affiliate.totalVisits)}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Registrations
                              </label>
                              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                {formatNumber(viewDialog.affiliate.signUps)}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Referrals
                              </label>
                              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-1">
                                {formatNumber(viewDialog.affiliate.signUps)}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Conversion Rate
                              </label>
                              <div className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-1">
                                {viewDialog.affiliate.conversionRate.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {viewDialog.affiliate.paymentDetails && (() => {
                        try {
                          const withdrawalMethods = JSON.parse(viewDialog.affiliate.paymentDetails);
                          if (Array.isArray(withdrawalMethods) && withdrawalMethods.length > 0) {
                            const getWithdrawalMethodDisplayName = (method: string): string => {
                              const names: Record<string, string> = {
                                bkash: 'bKash',
                                nagad: 'Nagad',
                                rocket: 'Rocket',
                                upay: 'Upay',
                                bank: 'Bank Transfer',
                              };
                              return names[method.toLowerCase()] || method;
                            };

                            return (
                              <div className="mb-6">
                                <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
                                  Withdrawal Methods
                                </h4>
                                <div className="space-y-3">
                                  {withdrawalMethods.map((wm: any, index: number) => (
                                    <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                          {getWithdrawalMethodDisplayName(wm.method || '')}
                                        </span>
                                      </div>
                                      {wm.method === 'bank' ? (
                                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                          {wm.bankName && <div><strong className="dark:text-gray-100">Bank:</strong> {wm.bankName}</div>}
                                          {wm.accountHolderName && <div><strong className="dark:text-gray-100">Account Holder:</strong> {wm.accountHolderName}</div>}
                                          {wm.bankAccountNumber && <div><strong className="dark:text-gray-100">Account Number:</strong> {wm.bankAccountNumber}</div>}
                                          {wm.routingNumber && <div><strong className="dark:text-gray-100">Routing Number:</strong> {wm.routingNumber}</div>}
                                          {wm.swiftCode && <div><strong className="dark:text-gray-100">SWIFT Code:</strong> {wm.swiftCode}</div>}
                                        </div>
                                      ) : (
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                          {wm.mobileNumber && <div><strong className="dark:text-gray-100">Mobile Number:</strong> {wm.mobileNumber}</div>}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        } catch (e) {
                          return null;
                        }
                        return null;
                      })()}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
                          Financial Summary
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                              Total Earnings
                            </div>
                            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                              ${formatPrice(viewDialog.affiliate.totalEarnings || viewDialog.affiliate.totalFunds, 2)}
                            </div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                              Available Earnings
                            </div>
                            <div className="text-xl font-bold text-green-700 dark:text-green-300">
                              ${formatPrice(viewDialog.affiliate.availableEarnings || viewDialog.affiliate.earnedCommission, 2)}
                            </div>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                            <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                              Withdraw Requested
                            </div>
                            <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
                              ${formatPrice(viewDialog.affiliate.requestedCommission, 2)}
                            </div>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                            <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                              Total Withdrawn
                            </div>
                            <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                              ${formatPrice(viewDialog.affiliate.totalWithdrawn || 0, 2)}
                            </div>
                          </div>
                        </div>
                      </div>
                      {viewDialog.affiliate.payoutHistory && 
                       viewDialog.affiliate.payoutHistory.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
                            Payout History
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="space-y-3">
                              {viewDialog.affiliate.payoutHistory.map((payout, index) => (
                                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                  <div>
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                      ${formatPrice(payout.amount, 2)}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {payout.method} • {new Date(payout.requestedAt).toLocaleDateString()} at {formatTime(payout.requestedAt)}
                                    </div>
                                  </div>
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                                    {payout.status}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
                        {viewDialog.affiliate.requestedCommission > 0 && (
                          <button
                            onClick={() => {
                              setViewDialog({ open: false, affiliate: null });
                              openPayoutDialog(
                                viewDialog.affiliate!.id,
                                viewDialog.affiliate!.requestedCommission,
                                viewDialog.affiliate!.totalCommission,
                                viewDialog.affiliate!.paymentMethod
                              );
                            }}
                            className="btn btn-primary flex items-center gap-2"
                          >
                            <FaMoneyBillWave />
                            Process Payout
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setViewDialog({ open: false, affiliate: null });
                            openStatusDialog(viewDialog.affiliate!.id, viewDialog.affiliate!.status);
                          }}
                          className="btn btn-secondary flex items-center gap-2"
                        >
                          <FaUserCheck />
                          Change Status
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

export default AffiliateReferralsPage;