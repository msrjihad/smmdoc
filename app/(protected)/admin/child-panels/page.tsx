'use client';

import React, { useEffect, useState } from 'react';
import {
    FaCheckCircle,
    FaClock,
    FaCog,
    FaEllipsisH,
    FaEye,
    FaGlobe,
    FaSearch,
    FaServer,
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
              {Array.from({ length: 7 }).map((_, idx) => (
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
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
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
}) => (
  <div className={`toast toast-${type} toast-enter`}>
    {type === 'success' && <FaCheckCircle className="toast-icon" />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="toast-close">
      <FaTimes className="toast-close-icon" />
    </button>
  </div>
);

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
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');

  useEffect(() => {
    setPageTitle('Child Panels', appName);
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
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
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
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    panel: ChildPanel | null;
  }>({
    open: false,
    panel: null,
  });

  const [selectedBulkAction, setSelectedBulkAction] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  const [settingsDialog, setSettingsDialog] = useState<{
    open: boolean;
    panel: ChildPanel | null;
  }>({
    open: false,
    panel: null,
  });
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [settingsData, setSettingsData] = useState({
    panelName: '',
    theme: '',
    customBranding: false,
    language: 'en',
    apiRateLimit: 1000,
    sslEnabled: true,
    customLogo: '',
    maxUsers: 1000,
    featuresEnabled: {
      bulkOrders: true,
      apiAccess: true,
      customDomain: true,
      analytics: true,
      userManagement: true,
      ticketSystem: true,
      massOrders: true,
      drip_feed: true,
    },
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
      showToast('Error fetching statistics. Please refresh the page.', 'error');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChildPanels();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchChildPanels();
  }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    setStatsLoading(true);

    const loadData = async () => {
      await fetchStats();
      setStatsLoading(false);
    };

    loadData();
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
        totalPanels: pagination.total,
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
        return <FaCheckCircle className="h-3 w-3 text-green-500" />;
      case 'inactive':
        return <FaClock className="h-3 w-3 text-gray-500" />;
      case 'suspended':
        return <FaTimesCircle className="h-3 w-3 text-red-500" />;
      case 'pending':
        return <FaClock className="h-3 w-3 text-yellow-500" />;
      case 'expired':
        return <FaTimesCircle className="h-3 w-3 text-orange-500" />;
      default:
        return <FaClock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800';
      case 'inactive':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
      case 'suspended':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800';
      case 'expired':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
    }
  };

  const handleSelectAll = () => {
    const selectablePanels = childPanels.filter(
      (panel) => panel.status !== 'suspended'
    );

    const selectableIds = selectablePanels.map((panel) => 
      panel.id.toString()
    );

    if (
      selectedPanels.length === selectableIds.length &&
      selectableIds.length > 0
    ) {
      setSelectedPanels([]);
    } else {
      setSelectedPanels(selectableIds);
    }
  };

  const handleSelectPanel = (panelId: string) => {
    setSelectedPanels((prev) =>
      prev.includes(panelId)
        ? prev.filter((id) => id !== panelId)
        : [...prev, panelId]
    );
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

  const openStatusDialog = (panelId: number, currentStatus: string) => {
    setStatusDialog({ open: true, panelId, currentStatus });
    setNewStatus(currentStatus);
    setStatusReason('');
  };

  const openSettingsDialog = (panel: ChildPanel) => {
    setSettingsDialog({ open: true, panel });
    setActiveSettingsTab('general');

    setSettingsData({
      panelName: panel.panelName,
      theme: panel.theme,
      customBranding: panel.customBranding,
      language: 'en',
      apiRateLimit: 1000,
      sslEnabled: true,
      customLogo: '',
      maxUsers: 1000,
      featuresEnabled: {
        bulkOrders: true,
        apiAccess: true,
        customDomain: true,
        analytics: true,
        userManagement: true,
        ticketSystem: true,
        massOrders: true,
        drip_feed: true,
      },
    });
  };

  const handleSaveSettings = async () => {
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
            <div className="w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder={`Search ${
                    statusFilter === 'all' ? 'all' : statusFilter
                  } panels...`}
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
                    {stats.totalPanels}
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
                    {stats.activePanels}
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
                    {stats.inactivePanels}
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
                    {stats.suspendedPanels}
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
                    {stats.pendingPanels}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('expired')}
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
            {selectedPanels.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4 pt-4">
                <span
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {selectedPanels.length} selected
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
                  <option value="suspend">Suspend Selected</option>
                </select>

                {selectedBulkAction && (
                  <div className="w-full flex justify-center md:w-auto md:block">
                    <button
                      onClick={() => {
                        if (selectedBulkAction === 'activate') {
                          console.log('Bulk activate selected:', selectedPanels);
                          showToast(
                            `Activating ${selectedPanels.length} selected panels...`,
                            'info'
                          );
                        } else if (selectedBulkAction === 'deactivate') {
                          console.log('Bulk deactivate selected:', selectedPanels);
                          showToast(
                            `Deactivating ${selectedPanels.length} selected panels...`,
                            'info'
                          );
                        } else if (selectedBulkAction === 'suspend') {
                          console.log('Bulk suspend selected:', selectedPanels);
                          showToast(
                            `Suspending ${selectedPanels.length} selected panels...`,
                            'info'
                          );
                        }

                        setSelectedBulkAction('');
                        setSelectedPanels([]);
                      }}
                      className="btn btn-primary w-full px-3 py-2.5"
                    >
                      Apply Action
                    </button>
                  </div>
                )}
              </div>
            )}

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
              <React.Fragment>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[1000px] border border-gray-200 dark:border-gray-700">
                    <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b border-gray-200 dark:border-gray-700 z-10">
                      <tr>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          <input
                            type="checkbox"
                            checked={
                              selectedPanels.length === childPanels.length &&
                              childPanels.length > 0
                            }
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                          />
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          ID
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          User
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Domain
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Created
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
                      {childPanels.map((panel, index) => (
                        <tr
                          key={panel.id}
                          className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
                        >
                          <td className="p-3">
                            {panel.status !== 'suspended' && (
                              <input
                                type="checkbox"
                                checked={selectedPanels.includes(
                                  panel.id.toString()
                                )}
                                onChange={() =>
                                  handleSelectPanel(panel.id.toString())
                                }
                                className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                              />
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded">
                              {(pagination.page - 1) * pagination.limit + index + 1}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <div
                                className="font-medium text-sm text-gray-900 dark:text-gray-100"
                              >
                                {panel.user?.username || 'Unknown'}
                              </div>
                              <div
                                className="text-xs text-gray-500 dark:text-gray-400"
                              >
                                {panel.user?.email || 'No email'}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <a
                              href={`https://${panel.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                            >
                              {panel.domain}
                            </a>
                          </td>
                          <td className="p-3">
                            <div>
                              <div className="text-xs text-gray-700 dark:text-gray-300">
                                {panel.createdAt
                                  ? new Date(panel.createdAt).toLocaleDateString()
                                  : 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {panel.createdAt
                                  ? formatTime(panel.createdAt)
                                  : ''}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div 
                              className={`flex items-center gap-1 px-2 py-1 rounded-full w-fit text-xs font-medium ${getStatusColor(panel.status)}`}
                            >
                              {getStatusIcon(panel.status)}
                              <span className="capitalize">
                                {panel.status}
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
                                    panel: panel,
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
                                      dropdownOpen === panel.id 
                                        ? null 
                                        : panel.id
                                    );
                                  }}
                                >
                                  <FaEllipsisH className="h-3 w-3" />
                                </button>

                                {dropdownOpen === panel.id && (
                                  <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                                      onClick={() => {
                                        setDropdownOpen(null);
                                        openStatusDialog(panel.id, panel.status);
                                      }}
                                    >
                                      <FaUserCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                      Change Status
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                                      onClick={() => {
                                        setDropdownOpen(null);
                                        openSettingsDialog(panel);
                                      }}
                                    >
                                      <FaCog className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                      Panel Settings
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                                      onClick={() => {
                                        setDropdownOpen(null);
                                        window.open(`https://${panel.domain}`, '_blank');
                                      }}
                                    >
                                      <FaGlobe className="h-3 w-3 text-green-600 dark:text-green-400" />
                                      Visit Panel
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
                <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t border-gray-200 dark:border-gray-700">
                  <div
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    {panelsLoading ? (
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
                      )} of ${formatNumber(pagination.total)} panels`
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
                      disabled={!pagination.hasPrev || panelsLoading}
                      className="btn btn-secondary"
                    >
                      Previous
                    </button>
                    <span
                      className="text-sm text-gray-600 dark:text-gray-400"
                    >
                      {panelsLoading ? (
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
                      disabled={!pagination.hasNext || panelsLoading}
                      className="btn btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                </div>
                {statusDialog.open && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        Change Panel Status
                      </h3>
                      <div className="mb-4">
                        <label className="form-label mb-2 text-gray-700 dark:text-gray-300">New Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
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
                              panelId: 0, 
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
                              statusDialog.panelId,
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
                {settingsDialog.open && settingsDialog.panel && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Panel Settings - {settingsDialog.panel.panelName}
                        </h3>
                        <button
                          onClick={() =>
                            setSettingsDialog({ open: false, panel: null })
                          }
                          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <FaTimes className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                        <nav className="-mb-px flex flex-wrap space-x-0 sm:space-x-8 gap-2">
                          <button
                            onClick={() => setActiveSettingsTab('general')}
                            className={`py-2 px-4 sm:px-1 border-b-2 font-medium text-sm flex-1 text-center ${
                              activeSettingsTab === 'general'
                                ? 'border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            General
                          </button>
                          <button
                            onClick={() => setActiveSettingsTab('appearance')}
                            className={`py-2 px-4 sm:px-1 border-b-2 font-medium text-sm flex-1 text-center ${
                              activeSettingsTab === 'appearance'
                                ? 'border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            Appearance
                          </button>
                          <button
                            onClick={() => setActiveSettingsTab('api')}
                            className={`py-2 px-4 sm:px-1 border-b-2 font-medium text-sm flex-1 text-center ${
                              activeSettingsTab === 'api'
                                ? 'border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            API & Limits
                          </button>
                          <button
                            onClick={() => setActiveSettingsTab('features')}
                            className={`py-2 px-4 sm:px-1 border-b-2 font-medium text-sm flex-1 text-center ${
                              activeSettingsTab === 'features'
                                ? 'border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            Features
                          </button>
                        </nav>
                      </div>
                      <div className="mb-6">
                        {activeSettingsTab === 'general' && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <FormLabel
                                  className="text-sm font-medium"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  Panel Name
                                </FormLabel>
                                <input
                                  type="text"
                                  value={settingsData.panelName}
                                  onChange={(e) =>
                                    setSettingsData(prev => ({
                                      ...prev,
                                      panelName: e.target.value
                                    }))
                                  }
                                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                                  placeholder="Enter panel name"
                                />
                              </div>
                              <div>
                                <FormLabel
                                  className="text-sm font-medium"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  Language
                                </FormLabel>
                                <select
                                  value={settingsData.language}
                                  onChange={(e) =>
                                    setSettingsData(prev => ({
                                      ...prev,
                                      language: e.target.value
                                    }))
                                  }
                                  className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                                >
                                  <option value="en">English</option>
                                  <option value="es">Spanish</option>
                                  <option value="fr">French</option>
                                  <option value="de">German</option>
                                  <option value="ar">Arabic</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <FormLabel
                                className="text-sm font-medium"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                Maximum Users
                              </FormLabel>
                              <input
                                type="number"
                                value={settingsData.maxUsers}
                                onChange={(e) =>
                                  setSettingsData(prev => ({
                                    ...prev,
                                    maxUsers: parseInt(e.target.value) || 0
                                  }))
                                }
                                className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="Maximum number of users"
                                min="1"
                                max="10000"
                              />
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Maximum number of users that can register on this panel
                              </div>
                            </div>
                          </div>
                        )}

                        {activeSettingsTab === 'appearance' && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <FormLabel
                                  className="text-sm font-medium"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  Theme
                                </FormLabel>
                                <select
                                  value={settingsData.theme}
                                  onChange={(e) =>
                                    setSettingsData(prev => ({
                                      ...prev,
                                      theme: e.target.value
                                    }))
                                  }
                                  className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                                >
                                  <option value="Dark Blue">Dark Blue</option>
                                  <option value="Green">Green</option>
                                  <option value="Purple">Purple</option>
                                  <option value="Blue">Blue</option>
                                  <option value="Pink">Pink</option>
                                  <option value="Red">Red</option>
                                  <option value="Orange">Orange</option>
                                  <option value="Teal">Teal</option>
                                </select>
                              </div>
                              <div>
                                <FormLabel
                                  className="text-sm font-medium"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  Custom Logo
                                </FormLabel>
                                <input
                                  type="text"
                                  value={settingsData.customLogo}
                                  onChange={(e) =>
                                    setSettingsData(prev => ({
                                      ...prev,
                                      customLogo: e.target.value
                                    }))
                                  }
                                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                                  placeholder="Logo URL (optional)"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="flex items-center gap-2 mb-4">
                                <input
                                  type="checkbox"
                                  checked={settingsData.customBranding}
                                  onChange={(e) =>
                                    setSettingsData(prev => ({
                                      ...prev,
                                      customBranding: e.target.checked
                                    }))
                                  }
                                  className="rounded border-gray-300"
                                />
                                <span className="font-medium">Enable Custom Branding</span>
                              </label>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Allow this panel to use custom branding, logos, and remove "Powered by" links
                              </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Theme Preview</h4>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-8 h-8 rounded border-2 border-white dark:border-gray-700 shadow-sm"
                                  style={{
                                    backgroundColor: 
                                      settingsData.theme === 'Dark Blue' ? '#1e40af' :
                                      settingsData.theme === 'Green' ? '#059669' :
                                      settingsData.theme === 'Purple' ? '#7c3aed' :
                                      settingsData.theme === 'Blue' ? '#2563eb' :
                                      settingsData.theme === 'Pink' ? '#db2777' :
                                      settingsData.theme === 'Red' ? '#dc2626' :
                                      settingsData.theme === 'Orange' ? '#ea580c' :
                                      settingsData.theme === 'Teal' ? '#0d9488' : '#6b7280'
                                  }}
                                ></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Primary Color: {settingsData.theme}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeSettingsTab === 'api' && (
                          <div className="space-y-6">
                            <div>
                              <label className="form-label mb-2">API Rate Limit (per hour)</label>
                              <input
                                type="number"
                                value={settingsData.apiRateLimit}
                                onChange={(e) =>
                                  setSettingsData(prev => ({
                                    ...prev,
                                    apiRateLimit: parseInt(e.target.value) || 0
                                  }))
                                }
                                className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="API calls per hour"
                                min="100"
                                max="10000"
                              />
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Maximum API calls this panel can make per hour
                              </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3">Current API Usage</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Today</div>
                                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                    {formatNumber(settingsDialog.panel.apiCallsToday)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                                  <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                                    {formatNumber(settingsDialog.panel.apiCallsTotal)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">API Information</h4>
                              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                                <div>API Key: <span className="font-mono text-xs">{settingsDialog.panel.apiKey}</span></div>
                                <div className="text-xs">Keep this API key secure and do not share it publicly</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeSettingsTab === 'features' && (
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">Panel Features</h4>
                              <div className="mb-4">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={Object.values(settingsData.featuresEnabled).every(v => v)}
                                    onChange={(e) => {
                                      const allEnabled = e.target.checked;
                                      setSettingsData(prev => ({
                                        ...prev,
                                        featuresEnabled: {
                                          bulkOrders: allEnabled,
                                          apiAccess: allEnabled,
                                          customDomain: allEnabled,
                                          analytics: allEnabled,
                                          userManagement: allEnabled,
                                          ticketSystem: allEnabled,
                                          massOrders: allEnabled,
                                          drip_feed: allEnabled,
                                        }
                                      }))
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                  <span className="font-medium text-sm">Select All Features</span>
                                </label>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={settingsData.featuresEnabled.bulkOrders}
                                      onChange={(e) =>
                                        setSettingsData(prev => ({
                                          ...prev,
                                          featuresEnabled: {
                                            ...prev.featuresEnabled,
                                            bulkOrders: e.target.checked
                                          }
                                        }))
                                      }
                                      className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">Bulk Orders</span>
                                  </label>

                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={settingsData.featuresEnabled.userManagement || false}
                                      onChange={(e) =>
                                        setSettingsData(prev => ({
                                          ...prev,
                                          featuresEnabled: {
                                            ...prev.featuresEnabled,
                                            userManagement: e.target.checked
                                          }
                                        }))
                                      }
                                      className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">User Management</span>
                                  </label>

                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={settingsData.featuresEnabled.analytics}
                                      onChange={(e) =>
                                        setSettingsData(prev => ({
                                          ...prev,
                                          featuresEnabled: {
                                            ...prev.featuresEnabled,
                                            analytics: e.target.checked
                                          }
                                        }))
                                      }
                                      className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">Analytics Dashboard</span>
                                  </label>

                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={settingsData.featuresEnabled.massOrders || false}
                                      onChange={(e) =>
                                        setSettingsData(prev => ({
                                          ...prev,
                                          featuresEnabled: {
                                            ...prev.featuresEnabled,
                                            massOrders: e.target.checked
                                          }
                                        }))
                                      }
                                      className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">Mass Orders</span>
                                  </label>
                                </div>
                                <div className="space-y-3">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={settingsData.featuresEnabled.apiAccess}
                                      onChange={(e) =>
                                        setSettingsData(prev => ({
                                          ...prev,
                                          featuresEnabled: {
                                            ...prev.featuresEnabled,
                                            apiAccess: e.target.checked
                                          }
                                        }))
                                      }
                                      className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">API Access</span>
                                  </label>

                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={settingsData.featuresEnabled.customDomain}
                                      onChange={(e) =>
                                        setSettingsData(prev => ({
                                          ...prev,
                                          featuresEnabled: {
                                            ...prev.featuresEnabled,
                                            customDomain: e.target.checked
                                          }
                                        }))
                                      }
                                      className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">Custom Domain</span>
                                  </label>

                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={settingsData.featuresEnabled.ticketSystem || false}
                                      onChange={(e) =>
                                        setSettingsData(prev => ({
                                          ...prev,
                                          featuresEnabled: {
                                            ...prev.featuresEnabled,
                                            ticketSystem: e.target.checked
                                          }
                                        }))
                                      }
                                      className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">Ticket System</span>
                                  </label>

                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={settingsData.featuresEnabled.drip_feed || false}
                                      onChange={(e) =>
                                        setSettingsData(prev => ({
                                          ...prev,
                                          featuresEnabled: {
                                            ...prev.featuresEnabled,
                                            drip_feed: e.target.checked
                                          }
                                        }))
                                      }
                                      className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">Drip Feed</span>
                                  </label>
                                </div>
                              </div>
                              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                {Object.values(settingsData.featuresEnabled).every(v => !v) ? (
                                  <span className="text-amber-600 dark:text-amber-400">No features selected. Panel will have limited functionality.</span>
                                ) : (
                                  <span className="text-green-600 dark:text-green-400">
                                    {Object.values(settingsData.featuresEnabled).filter(v => v).length} features enabled.
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                              <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Current Plan</h4>
                              <div className="text-sm text-green-700 dark:text-green-300">
                                <div className="text-xs">
                                  Expires: {settingsDialog.panel.expiryDate 
                                    ? new Date(settingsDialog.panel.expiryDate).toLocaleDateString()
                                    : 'Never'
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setSettingsDialog({ open: false, panel: null })}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveSettings}
                          className="btn btn-primary"
                        >
                          Save Settings
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {viewDialog.open && viewDialog.panel && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Child Panel Details
                        </h3>
                        <button
                          onClick={() =>
                            setViewDialog({ open: false, panel: null })
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
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Panel ID
                              </label>
                              <div className="font-mono text-sm bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded w-fit mt-1">
                                {formatID(viewDialog.panel.id.toString())}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Panel Name
                              </label>
                              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {viewDialog.panel.panelName}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Domain
                              </label>
                              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                <a 
                                  href={`https://${viewDialog.panel.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                >
                                  {viewDialog.panel.domain}
                                </a>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Owner
                              </label>
                              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {viewDialog.panel.user?.username} ({viewDialog.panel.user?.email})
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Status
                              </label>
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full w-fit text-xs font-medium mt-1 ${getStatusColor(viewDialog.panel.status)}`}>
                                {getStatusIcon(viewDialog.panel.status)}
                                <span className="capitalize">
                                  {viewDialog.panel.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
                            Performance Metrics
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Total Orders
                              </label>
                              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                {formatNumber(viewDialog.panel.totalOrders)}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Total Revenue
                              </label>
                              <div className="text-lg font-semibold text-green-600 dark:text-green-400 mt-1">
                                ${formatPrice(viewDialog.panel.totalRevenue, 2)}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                API Calls Today
                              </label>
                              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-1">
                                {formatNumber(viewDialog.panel.apiCallsToday)}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Total API Calls
                              </label>
                              <div className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-1">
                                {formatNumber(viewDialog.panel.apiCallsTotal)}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Plan
                              </label>
                              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                {viewDialog.panel.plan}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-6">
                        <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
                          Technical Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                              API Key
                            </div>
                            <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
                              {viewDialog.panel.apiKey}
                            </div>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                              Theme
                            </div>
                            <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                              {viewDialog.panel.theme}
                            </div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                              Custom Branding
                            </div>
                            <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                              {viewDialog.panel.customBranding ? 'Enabled' : 'Disabled'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-6">
                        <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
                          Important Dates
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Created
                            </label>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                              {new Date(viewDialog.panel.createdAt).toLocaleDateString()} at {formatTime(viewDialog.panel.createdAt)}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Last Activity
                            </label>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                              {new Date(viewDialog.panel.lastActivity).toLocaleDateString()} at {formatTime(viewDialog.panel.lastActivity)}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Expires
                            </label>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                              {viewDialog.panel.expiryDate 
                                ? `${new Date(viewDialog.panel.expiryDate).toLocaleDateString()} at ${formatTime(viewDialog.panel.expiryDate)}`
                                : 'Never'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            window.open(`https://${viewDialog.panel!.domain}`, '_blank');
                          }}
                          className="btn btn-secondary flex items-center gap-2"
                        >
                          <FaGlobe />
                          Visit Panel
                        </button>
                        <button
                          onClick={() => {
                            setViewDialog({ open: false, panel: null });
                            openStatusDialog(viewDialog.panel!.id, viewDialog.panel!.status);
                          }}
                          className="btn btn-primary flex items-center gap-2"
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

export default ChildPanelsPage;