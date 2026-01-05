'use client';

import React, { useEffect, useState } from 'react';
import {
    FaCheckCircle,
    FaClock,
    FaShareAlt,
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
import AffiliatesTable from '@/components/admin/affiliates/affiliates-table';
import AffiliateDetailsModal from '@/components/admin/affiliates/modals/affiliate-details';
import ChangeAffiliateStatusModal from '@/components/admin/affiliates/modals/change-affiliate-status';

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

  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    affiliate: AffiliateReferral | null;
  }>({
    open: false,
    affiliate: null,
  });


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
            {affiliatesLoading ? (
              <div className="min-h-[600px]">
                <AffiliatesTableSkeleton />
              </div>
            ) : affiliates.length === 0 ? (
              <div className="text-center py-12">
                <FaShareAlt className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300">
                  No affiliates found.
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No affiliates match your current filters or no affiliates
                  exist yet.
                </p>
              </div>
            ) : (
              <AffiliatesTable
                affiliates={affiliates}
                pagination={pagination}
                affiliatesLoading={affiliatesLoading}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                onViewDetails={(affiliate) => setViewDialog({ open: true, affiliate })}
                onChangeStatus={openStatusDialog}
                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
              />
            )}
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
      <ChangeAffiliateStatusModal
        isOpen={statusDialog.open}
        affiliateId={statusDialog.affiliateId}
        currentStatus={statusDialog.currentStatus}
        onClose={() => {
          setStatusDialog({ open: false, affiliateId: 0, currentStatus: '' });
        }}
        onConfirm={(affiliateId, status, reason) => {
          handleStatusChange(affiliateId, status, reason);
        }}
      />
      <AffiliateDetailsModal
        isOpen={viewDialog.open}
        affiliate={viewDialog.affiliate}
        formatTime={formatTime}
        getStatusIcon={getStatusIcon}
        getStatusColor={getStatusColor}
        onClose={() => setViewDialog({ open: false, affiliate: null })}
        onProcessPayout={openPayoutDialog}
        onChangeStatus={openStatusDialog}
      />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateReferralsPage;