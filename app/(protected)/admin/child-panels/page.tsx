'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    FaCheckCircle,
    FaClock,
    FaSearch,
    FaServer,
    FaSync,
    FaTimes,
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { formatID, formatNumber, formatPrice } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import ChildPanelsTable from '@/components/admin/child-panels/child-panels-table';
import ChildPanelDetailsModal from '@/components/admin/child-panels/modals/child-panel-details';
import ChangePanelStatusModal from '@/components/admin/child-panels/modals/change-panel-status';
import PanelSettingsModal from '@/components/admin/child-panels/modals/panel-settings';

const FormField = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-2">{children}</div>
);

const FormItem = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <div className={`space-y-2 ${className}`}>{children}</div>
);

const FormLabel = ({ 
  className = "", 
  style, 
  children 
}: { 
  className?: string; 
  style?: React.CSSProperties; 
  children: React.ReactNode 
}) => (
  <label className={`block text-sm font-medium ${className}`} style={style}>
    {children}
  </label>
);

const FormControl = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

const FormMessage = ({ 
  className = "", 
  children 
}: { 
  className?: string; 
  children?: React.ReactNode 
}) => (
  children ? <div className={`text-xs text-red-500 mt-1 ${className}`}>{children}</div> : null
);

const ChildPanelsTableSkeleton = () => {
  const rows = Array.from({ length: 10 });

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              {Array.from({ length: 6 }).map((_, idx) => (
                <th key={idx} className="text-left p-3">
                  <div className="h-4 rounded w-3/4 gradient-shimmer" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((_, rowIdx) => (
              <tr key={rowIdx} className="border-t border-gray-200 dark:border-gray-700">
                <td className="p-3">
                  <div className="h-6 w-16 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                  <div className="h-3 w-32 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-40 gradient-shimmer rounded" />
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
    </>
  );
};

interface ChildPanel {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    name: string;
    joinedAt: string;
  };
  domain: string;
  subdomain?: string;
  panelName: string;
  apiKey: string;
  totalOrders: number;
  totalRevenue: number;
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'expired';
  createdAt: string;
  lastActivity: string;
  expiryDate?: string;
  theme: string;
  customBranding: boolean;
  apiCallsToday: number;
  apiCallsTotal: number;
  plan: string;
}

interface ChildPanelStats {
  totalPanels: number;
  activePanels: number;
  inactivePanels: number;
  suspendedPanels: number;
  pendingPanels: number;
  expiredPanels: number;
  totalRevenue: number;
  totalOrders: number;
  totalApiCalls: number;
  todayApiCalls: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const ChildPanelsPage = () => {
  const { appName } = useAppNameWithFallback();
  const searchParams = useSearchParams();
  const router = useRouter();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');

  useEffect(() => {
    setPageTitle('Child Panels', appName);
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

    if (isNaN(date.getTime())) {
      return 'null';
    }

    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: timeFormat === '12',
      timeZone: userTimezone,
    };

    return date.toLocaleTimeString('en-US', options);
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

    if (isNaN(date.getTime())) {
      return 'null';
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: userTimezone,
    };

    return date.toLocaleDateString('en-US', options);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'pending' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info' | 'pending'; onClose: () => void }) => (
    <div className={`toast toast-${type} toast-enter`}>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="toast-close">
        <FaTimes className="toast-close-icon" />
      </button>
    </div>
  );

  const [childPanels, setChildPanels] = useState<ChildPanel[]>([]);
  const [stats, setStats] = useState<ChildPanelStats>({
    totalPanels: 0,
    activePanels: 0,
    inactivePanels: 0,
    suspendedPanels: 0,
    pendingPanels: 0,
    expiredPanels: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalApiCalls: 0,
    todayApiCalls: 0,
  });
  const statusFilter = searchParams.get('status') || 'all';
  const searchTerm = searchParams.get('search') || '';

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 8,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

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

  const [statsLoading, setStatsLoading] = useState(true);
  const [panelsLoading, setPanelsLoading] = useState(true);

  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    panelId: number;
    currentStatus: string;
  }>({
    open: false,
    panelId: 0,
    currentStatus: '',
  });

  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    panel: ChildPanel | null;
  }>({
    open: false,
    panel: null,
  });

  const [settingsDialog, setSettingsDialog] = useState<{
    open: boolean;
    panel: ChildPanel | null;
  }>({
    open: false,
    panel: null,
  });

  const fetchChildPanels = async () => {
    try {
      setPanelsLoading(true);

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/child-panels?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setChildPanels(result.data || []);
        setPagination(prev => ({
          ...prev,
          ...result.pagination,
        }));
      } else {
        throw new Error(result.error || result.details || 'Failed to fetch child panels');
      }
    } catch (error) {
      console.error('Error fetching child panels:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast(`Error fetching child panels: ${errorMessage}`, 'error');
      setChildPanels([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    } finally {
      setPanelsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/child-panels/stats');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.stats) {
        setStats(result.stats);
      } else {
        throw new Error(result.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalPanels: 0,
        activePanels: 0,
        inactivePanels: 0,
        suspendedPanels: 0,
        pendingPanels: 0,
        expiredPanels: 0,
        totalRevenue: 0,
        totalOrders: 0,
        totalApiCalls: 0,
        todayApiCalls: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildPanels();
    fetchStats();
  }, [pagination.page, pagination.limit, statusFilter, searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
            <span className="text-xs font-medium text-green-700 dark:text-green-300 capitalize">
              {status}
            </span>
          </div>
        );
      case 'inactive':
        return (
          <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full w-fit">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
              {status}
            </span>
          </div>
        );
      case 'suspended':
        return (
          <div className="px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full w-fit">
            <span className="text-xs font-medium text-red-700 dark:text-red-300 capitalize">
              {status}
            </span>
          </div>
        );
      case 'pending':
        return (
          <div className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-fit">
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300 capitalize">
              {status}
            </span>
          </div>
        );
      case 'expired':
        return (
          <div className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full w-fit">
            <span className="text-xs font-medium text-orange-700 dark:text-orange-300 capitalize">
              {status}
            </span>
          </div>
        );
      default:
        return (
          <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full w-fit">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
              {status}
            </span>
          </div>
        );
    }
  };

  const handleRefresh = async () => {
    setPanelsLoading(true);
    setStatsLoading(true);

    try {
      await Promise.all([
        fetchChildPanels(),
        fetchStats(),
      ]);
      showToast('Child panels data refreshed successfully!', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('Error refreshing data. Please try again.', 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleStatusChange = async (
    panelId: number,
    status: string,
    reason: string
  ) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      showToast('Panel status updated successfully', 'success');
      await Promise.all([
        fetchChildPanels(),
        fetchStats(),
      ]);
      setStatusDialog({ open: false, panelId: 0, currentStatus: '' });
    } catch (error) {
      console.error('Error updating status:', error);
      showToast(
        error instanceof Error ? error.message : 'Error updating status',
        'error'
      );
    }
  };

  const openStatusDialog = (panelId: number, currentStatus: string) => {
    setStatusDialog({ open: true, panelId, currentStatus });
  };

  const openSettingsDialog = (panel: ChildPanel) => {
    setSettingsDialog({ open: true, panel });
  };

  const handleSaveSettings = async (settings: any) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      showToast('Panel settings updated successfully', 'success');
      await Promise.all([
        fetchChildPanels(),
        fetchStats(),
      ]);
      setSettingsDialog({ open: false, panel: null });
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast(
        error instanceof Error ? error.message : 'Error updating settings',
        'error'
      );
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
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
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
                disabled={panelsLoading || statsLoading}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
              >
                <FaSync
                  className={
                    panelsLoading || statsLoading ? 'animate-spin' : ''
                  }
                />
                Refresh
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search panels..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm"
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
                    {stats.totalPanels}
                  </span>
                </button>
                <button
                  onClick={() => updateQueryParams({ status: 'active' })}
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
                    {stats.activePanels}
                  </span>
                </button>
                <button
                  onClick={() => updateQueryParams({ status: 'inactive' })}
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
                    {stats.inactivePanels}
                  </span>
                </button>
                <button
                  onClick={() => updateQueryParams({ status: 'suspended' })}
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
                    {stats.suspendedPanels}
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
                    {stats.pendingPanels}
                  </span>
                </button>
                <button
                  onClick={() => updateQueryParams({ status: 'expired' })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'expired'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Expired
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'expired'
                        ? 'bg-white/20'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {stats.expiredPanels}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            {panelsLoading ? (
              <div className="min-h-[600px]">
                <ChildPanelsTableSkeleton />
              </div>
            ) : childPanels.length === 0 ? (
              <div className="text-center py-12">
                <FaServer
                  className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
                />
                <h3
                  className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300"
                >
                  No child panels found.
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No child panels match your current filters or no panels
                  exist yet.
                </p>
              </div>
            ) : (
              <ChildPanelsTable
                panels={childPanels}
                pagination={pagination}
                isLoading={panelsLoading}
                formatDate={formatDate}
                formatTime={formatTime}
                getStatusBadge={getStatusBadge}
                onViewDetails={(panel) => setViewDialog({ open: true, panel })}
                onChangeStatus={openStatusDialog}
                onOpenSettings={openSettingsDialog}
                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
              />
            )}
          </div>
        </div>
      </div>

      <ChangePanelStatusModal
        isOpen={statusDialog.open}
        panelId={statusDialog.panelId}
        currentStatus={statusDialog.currentStatus}
        onClose={() => setStatusDialog({ open: false, panelId: 0, currentStatus: '' })}
        onConfirm={handleStatusChange}
      />

      <PanelSettingsModal
        isOpen={settingsDialog.open}
        panel={settingsDialog.panel}
        formatDate={formatDate}
        onClose={() => setSettingsDialog({ open: false, panel: null })}
        onSave={handleSaveSettings}
      />

      <ChildPanelDetailsModal
        isOpen={viewDialog.open}
        panel={viewDialog.panel}
        formatDate={formatDate}
        formatTime={formatTime}
        getStatusBadge={getStatusBadge}
        onClose={() => setViewDialog({ open: false, panel: null })}
        onVisitPanel={(domain) => window.open(`https://${domain}`, '_blank')}
        onChangeStatus={openStatusDialog}
      />
    </div>
  );
};

export default ChildPanelsPage;