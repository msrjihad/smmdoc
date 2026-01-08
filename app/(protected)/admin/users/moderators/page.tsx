'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    FaCheckCircle,
    FaClock,
    FaSearch,
    FaSync,
    FaTimes,
    FaUserShield,
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import ModeratorsTable from '@/components/admin/users/moderators/moderators-table';
import EditModeratorModal from '@/components/admin/users/moderators/modals/edit-moderator';

const ChangeRoleModal = dynamic(
  () => import('@/components/admin/users/role-modal'),
  { ssr: false }
);

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }: { size?: string; className?: string }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white"></div>
    </div>
  </div>
);

const ModeratorsTableSkeleton = () => {
  const rows = Array.from({ length: 10 });

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1400px]">
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
                  <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                  <div className="h-3 w-20 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-5 w-20 gradient-shimmer rounded-full" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-20 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-3 w-24 gradient-shimmer rounded mb-1" />
                  <div className="h-3 w-20 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-3 w-24 gradient-shimmer rounded mb-1" />
                  <div className="h-3 w-20 gradient-shimmer rounded" />
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

interface Moderator {
  id: number;
  username: string;
  email: string;
  name?: string;
  balance: number;
  spent: number;
  totalOrders: number;
  servicesDiscount: number;
  specialPricing: boolean;
  status: 'active' | 'inactive';
  currency: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
  role: 'admin' | 'moderator' | 'super_admin';
  permissions: string[];
  password?: string;
}

interface ModeratorStats {
  totalModerators: number;
  activeModerators: number;
  inactiveModerators: number;
  totalBalance: number;
  totalSpent: number;
  todayRegistrations: number;
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

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  title: string;
  message: string;
}

interface UpdateStatusModalProps {
  isOpen: boolean;
  currentStatus: string;
  newStatus: string;
  onStatusChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  title: string;
}



const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};


const ModeratorsPage = () => {
  const { appName } = useAppNameWithFallback();
  const searchParams = useSearchParams();
  const router = useRouter();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');

  useEffect(() => {
    setPageTitle('All Moderators', appName);
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
      month: '2-digit',
      day: '2-digit',
      timeZone: userTimezone,
    });
  };



  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [stats, setStats] = useState<ModeratorStats>({
    totalModerators: 0,
    activeModerators: 0,
    inactiveModerators: 0,
    totalBalance: 0,
    totalSpent: 0,
    todayRegistrations: 0,
    statusBreakdown: {},
  });

  const statusFilter = searchParams.get('status') || 'all';
  const searchTerm = searchParams.get('search') || '';

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moderatorToDelete, setModeratorToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [statsLoading, setStatsLoading] = useState(true);
  const [moderatorsLoading, setModeratorsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [updateStatusDialog, setUpdateStatusDialog] = useState<{
    open: boolean;
    moderatorId: number;
    currentStatus: string;
  }>({
    open: false,
    moderatorId: 0,
    currentStatus: '',
  });
  const [newStatus, setNewStatus] = useState('');
  const [changeRoleDialog, setChangeRoleDialog] = useState<{
    open: boolean;
    moderatorId: number;
    currentRole: string;
  }>({
    open: false,
    moderatorId: 0,
    currentRole: '',
  });
  const [newRole, setNewRole] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);

  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    moderator: Moderator | null;
  }>({
    open: false,
    moderator: null,
  });
  const [editFormData, setEditFormData] = useState<Partial<Moderator>>({});

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const filterOptions = useMemo(() => [
    { key: 'all', label: 'All', count: stats.totalModerators },
    { key: 'active', label: 'Active', count: stats.activeModerators },
    { key: 'inactive', label: 'Inactive', count: stats.inactiveModerators },
  ], [stats]);

  const fetchModerators = useCallback(async () => {
    try {
      setModeratorsLoading(true);

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        role: 'moderator',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      });

      const response = await fetch(`/api/admin/users?${queryParams}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result.success) {

        const moderatorData = (result.data || []).filter((user: Moderator) =>
          user.role === 'moderator'
        );
        setModerators(moderatorData);
        setPagination(prev => ({
          ...prev,
          ...result.pagination,
        }));
      } else {
        throw new Error(result.error || 'Failed to fetch moderators');
      }

    } catch (error) {
      console.error('Error fetching moderators:', error);
      showToast(error instanceof Error ? error.message : 'Error fetching moderators', 'error');
      setModerators([]);
    } finally {
      setModeratorsLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, debouncedSearchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);

      const response = await fetch('/api/admin/users/stats?period=all&role=moderator');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result.success) {
        const data = result.data;
        const statusBreakdown: Record<string, number> = {};

        if (data.statusBreakdown && Array.isArray(data.statusBreakdown)) {
          data.statusBreakdown.forEach((item: any) => {
            statusBreakdown[item.status] = item.count || 0;
          });
        }

        setStats({
          totalModerators: data.overview?.totalUsers || 0,
          activeModerators: statusBreakdown.active || 0,
          inactiveModerators: statusBreakdown.inactive || 0,
          totalBalance: data.overview?.totalBalance || 0,
          totalSpent: data.overview?.totalSpent || 0,
          todayRegistrations: data.dailyTrends?.[0]?.registrations || 0,
          statusBreakdown,
        });
      } else {
        throw new Error(result.error || 'Failed to fetch stats');
      }

    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Error loading statistics', 'error');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModerators();
  }, [fetchModerators]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const getStatusIcon = (status: string) => {
    const icons = {
      active: <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />,
      inactive: <FaClock className="h-3 w-3 text-gray-500 dark:text-gray-400" />,
    };
    return icons[status as keyof typeof icons] || icons.inactive;
  };


  const formatCurrency = useCallback((amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const handleEditModerator = useCallback((moderatorId: number) => {
    const moderator = moderators.find(m => m.id === moderatorId);
    if (moderator) {
      setEditDialog({ open: true, moderator });
      setEditFormData({
        username: moderator.username,
        email: moderator.email,
        name: moderator.name,
        status: moderator.status,
        password: '',
      });
    }
  }, [moderators]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchModerators(), fetchStats()]);
    showToast('Data refreshed successfully!', 'success');
  }, [fetchModerators, fetchStats, showToast]);

  const handleApiAction = useCallback(async (
    url: string,
    method: string,
    body?: any,
    successMessage?: string
  ) => {
    try {
      setActionLoading(url);

      const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result.success) {
        if (successMessage) showToast(successMessage, 'success');
        await fetchModerators();
        await fetchStats();
        return true;
      } else {
        throw new Error(result.error || 'Operation failed');
      }

    } catch (error) {
      console.error('API action error:', error);
      showToast(error instanceof Error ? error.message : 'Operation failed', 'error');
      return false;
    } finally {
      setActionLoading(null);
    }
  }, [fetchModerators, fetchStats, showToast]);

  const handleDeleteModerator = useCallback(async (moderatorId: number) => {
    const success = await handleApiAction(
      `/api/admin/users/${moderatorId}`,
      'DELETE',
      undefined,
      'Moderator deleted successfully'
    );

    if (success) {
      setDeleteDialogOpen(false);
      setModeratorToDelete(null);
    }
  }, [handleApiAction]);

  const handleStatusUpdate = useCallback(async (moderatorId: number, newStatus: string) => {
    return handleApiAction(
      `/api/admin/users/${moderatorId}/status`,
      'PATCH',
      { status: newStatus },
      `Moderator status updated to ${newStatus}`
    );
  }, [handleApiAction]);

  const handleChangeRole = useCallback(async (moderatorId: number, role: string, permissions?: string[]) => {
    const payload: any = { role };
    if (role === 'moderator' && permissions) {
      payload.permissions = permissions;
    }
    const success = await handleApiAction(
      `/api/admin/users/${moderatorId}/role`,
      'PATCH',
      payload,
      `Moderator role updated to ${role}`
    );

    if (success) {
      setChangeRoleDialog({ open: false, moderatorId: 0, currentRole: '' });
      setNewRole('');
      setNewRolePermissions([]);
    }
    return success;
  }, [handleApiAction]);

  const handleEditSave = useCallback(async (moderatorData: Partial<Moderator>) => {
    if (!editDialog.moderator) return;

    const success = await handleApiAction(
      `/api/admin/users/${editDialog.moderator.id}`,
      'PATCH',
      moderatorData,
      'Moderator updated successfully'
    );

    if (success) {
      setEditDialog({ open: false, moderator: null });
      setEditFormData({});
    }
  }, [editDialog.moderator, handleApiAction]);

  const openUpdateStatusDialog = useCallback((moderatorId: number, currentStatus: string) => {
    setUpdateStatusDialog({ open: true, moderatorId, currentStatus });
    setNewStatus(currentStatus);
  }, []);

  const openChangeRoleDialog = useCallback((moderatorId: number, currentRole: string) => {
    const moderator = moderators.find(m => m.id === moderatorId);
    setChangeRoleDialog({ open: true, moderatorId, currentRole });
    setNewRole(currentRole);
    if (moderator && moderator.permissions && Array.isArray(moderator.permissions)) {
      setNewRolePermissions(moderator.permissions);
    } else {
      setNewRolePermissions([]);
    }
  }, [moderators]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

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
                disabled={moderatorsLoading}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
              >
                <FaSync
                  className={moderatorsLoading ? 'animate-spin' : ''}
                />
                Refresh
              </button>
            </div>
            <div className="flex flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
                />
                <input
                  type="text"
                  placeholder={`Search ${
                    statusFilter === 'all' ? 'all' : statusFilter
                  } moderators...`}
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full md:w-80 pl-10 pr-4 py-2.5 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
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
                        : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}
                  >
                    {stats.totalModerators.toLocaleString()}
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
                    {stats.activeModerators.toLocaleString()}
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
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {stats.inactiveModerators.toLocaleString()}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            {moderatorsLoading ? (
              <div className="min-h-[600px]">
                <ModeratorsTableSkeleton />
              </div>
            ) : moderators.length === 0 ? (
              <div className="text-center py-12">
                <FaUserShield
                  className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
                />
                <h3
                  className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300"
                >
                  No moderators found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {debouncedSearchTerm && statusFilter !== 'all' 
                    ? `No ${statusFilter} moderators match your search "${debouncedSearchTerm}".`
                    : debouncedSearchTerm 
                    ? `No moderators match your search "${debouncedSearchTerm}".`
                    : statusFilter !== 'all' 
                    ? `No ${statusFilter} moderators found.`
                    : 'No moderators exist yet.'}
                </p>
              </div>
            ) : (
              <ModeratorsTable
                moderators={moderators}
                formatDate={formatDate}
                formatTime={formatTime}
                onEdit={handleEditModerator}
                onChangeRole={openChangeRoleDialog}
                onDelete={(moderatorId) => {
                  setModeratorToDelete(moderatorId);
                  setDeleteDialogOpen(true);
                }}
                actionLoading={actionLoading}
                pagination={pagination}
                onPageChange={handlePageChange}
                moderatorsLoading={moderatorsLoading}
              />
            )}
          </div>
        </div>
        <DeleteConfirmationModal
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setModeratorToDelete(null);
          }}
          onConfirm={() => moderatorToDelete && handleDeleteModerator(moderatorToDelete)}
          isLoading={actionLoading === `/api/admin/users/${moderatorToDelete}`}
          title="Delete Moderator"
          message="Are you sure you want to delete this moderator? This action cannot be undone and will permanently remove all moderator data and access."
        />

        <UpdateStatusModal
          isOpen={updateStatusDialog.open}
          currentStatus={updateStatusDialog.currentStatus}
          newStatus={newStatus}
          onStatusChange={setNewStatus}
          onClose={() => {
            setUpdateStatusDialog({ open: false, moderatorId: 0, currentStatus: '' });
            setNewStatus('');
          }}
          onConfirm={() => {
            handleStatusUpdate(updateStatusDialog.moderatorId, newStatus).then((success) => {
              if (success) {
                setUpdateStatusDialog({ open: false, moderatorId: 0, currentStatus: '' });
                setNewStatus('');
              }
            });
          }}
          isLoading={actionLoading === `/api/admin/users/${updateStatusDialog.moderatorId}/status`}
          title="Update Moderator Status"
        />

        <ChangeRoleModal
          isOpen={changeRoleDialog.open}
          currentRole={changeRoleDialog.currentRole}
          newRole={newRole}
          onRoleChange={setNewRole}
          onClose={() => {
            setChangeRoleDialog({ open: false, moderatorId: 0, currentRole: '' });
            setNewRole('');
            setNewRolePermissions([]);
          }}
          onConfirm={() => {
            handleChangeRole(changeRoleDialog.moderatorId, newRole, newRolePermissions).then((success) => {
              if (success) {
                setChangeRoleDialog({ open: false, moderatorId: 0, currentRole: '' });
                setNewRole('');
                setNewRolePermissions([]);
              }
            });
          }}
          isLoading={actionLoading === `/api/admin/users/${changeRoleDialog.moderatorId}/role`}
          permissions={newRolePermissions}
          onPermissionsChange={setNewRolePermissions}
        />

        <EditModeratorModal
          isOpen={editDialog.open}
          moderator={editDialog.moderator}
          onClose={() => {
            setEditDialog({ open: false, moderator: null });
            setEditFormData({
              username: '',
              email: '',
              name: '',
              status: 'active',
              password: '',
            });
          }}
          onSave={handleEditSave}
          isLoading={actionLoading === `/api/admin/users/${editDialog.moderator?.id}`}
        />
      </div>
    </div>
  );
};


const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Delete Moderator?</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Are you sure you want to delete this moderator? This action cannot be undone and will permanently remove all moderator data.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </div>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({ isOpen, currentStatus, newStatus, onStatusChange, onClose, onConfirm, isLoading, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="mb-4">
          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Select New Status</label>
          <select
            value={newStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
            disabled={isLoading}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};



export default ModeratorsPage;