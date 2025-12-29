'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
    FaCheckCircle,
    FaClock,
    FaCrown,
    FaEdit,
    FaEllipsisH,
    FaSearch,
    FaSync,
    FaTimes,
    FaTimesCircle,
    FaTrash,
    FaUserCheck,
    FaUserShield,
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';

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

interface ModeratorActionsProps {
  moderator: Moderator;
  onEdit: (moderatorId: number) => void;
  onChangeRole: (moderatorId: number, currentRole: string) => void;
  onDelete: (moderatorId: number) => void;
  isLoading: boolean;
}

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (newPage: number) => void;
  isLoading: boolean;
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


interface EditModeratorModalProps {
  isOpen: boolean;
  moderator: Moderator | null;
  onClose: () => void;
  onSave: (moderatorData: Partial<Moderator>) => void;
  isLoading: boolean;
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

const useClickOutside = (ref: React.RefObject<HTMLElement | null>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || !event.target || !(event.target instanceof Node)) {
        return;
      }
      if (ref.current.contains(event.target)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const ModeratorsPage = () => {
  const { appName } = useAppNameWithFallback();

  useEffect(() => {
    setPageTitle('All Moderators', appName);
  }, [appName]);



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

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const getRoleIcon = (role: string) => {
    const icons = {
      super_admin: <FaCrown className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />,
      admin: null,
      moderator: <FaUserShield className="h-3 w-3 text-purple-500 dark:text-purple-400" />,
    };
    return icons[role as keyof typeof icons] || null;
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
                  value={searchTerm || ''}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                        : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}
                  >
                    {stats.totalModerators.toLocaleString()}
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
                    {stats.activeModerators.toLocaleString()}
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
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[1400px]">
                    <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">ID</th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Username</th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Email</th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Role</th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Balance</th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Registered Date</th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Last Login</th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moderators.map((moderator) => (
                        <tr key={moderator.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200">
                          <td className="p-3">
                            <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                              {moderator.id?.toString().slice(-8) || 'null'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {moderator.username || 'null'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {moderator.email || 'null'}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {moderator.emailVerified ? (
                                <>
                                  <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
                                  <span className="text-xs text-green-600 dark:text-green-400">Verified</span>
                                </>
                              ) : (
                                <>
                                  <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
                                  <span className="text-xs text-red-600 dark:text-red-400">Unverified</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                moderator.role === 'super_admin' 
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                  : moderator.role === 'admin'
                                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              }`}>
                                {moderator.role === 'super_admin' ? 'SUPER ADMIN' : moderator.role === 'admin' ? 'Admin' : 'Moderator'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-left">
                              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                {formatCurrency(moderator.balance || 0)}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {moderator.createdAt ? new Date(moderator.createdAt).toLocaleDateString() : 'null'}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {moderator.createdAt ? new Date(moderator.createdAt).toLocaleTimeString() : 'null'}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              {moderator.lastLoginAt ? (
                                <>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {new Date(moderator.lastLoginAt).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {new Date(moderator.lastLoginAt).toLocaleTimeString()}
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs text-gray-500 dark:text-gray-400">Never</div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <ModeratorActions
                              moderator={moderator}
                              onEdit={handleEditModerator}
                              onChangeRole={openChangeRoleDialog}
                              onDelete={(moderatorId) => {
                                setModeratorToDelete(moderatorId);
                                setDeleteDialogOpen(true);
                              }}
                              isLoading={actionLoading === moderator.id.toString()}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  isLoading={moderatorsLoading}
                />
              </>
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

const ModeratorActions: React.FC<ModeratorActionsProps> = ({ moderator, onEdit, onChangeRole, onDelete, isLoading }) => {
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onEdit(moderator.id)}
        className="btn btn-secondary p-2"
        title="Edit Moderator"
        disabled={isLoading}
      >
        <FaEdit className="h-3 w-3" />
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          className="btn btn-secondary p-2"
          title="More Actions"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
        >
          <FaEllipsisH className="h-3 w-3" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={() => {
                  onChangeRole(moderator.id, moderator.role);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
              >
                <FaUserCheck className="h-3 w-3" />
                Change Role
              </button>
              <hr className="my-1 dark:border-gray-700" />
              <button
                onClick={() => {
                  onDelete(moderator.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
              >
                <FaTrash className="h-3 w-3" />
                Delete Moderator
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange, isLoading }) => (
  <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
    <div className="text-sm text-gray-600 dark:text-gray-400">
      {isLoading ? (
        <div className="flex items-center gap-2">
          <span>Loading pagination...</span>
        </div>
      ) : (
        `Showing ${((pagination.page - 1) * pagination.limit + 1).toLocaleString()} to ${Math.min(
          pagination.page * pagination.limit,
          pagination.total
        ).toLocaleString()} of ${pagination.total.toLocaleString()} moderators`
      )}
    </div>
    <div className="flex items-center gap-2 mt-4 md:mt-0">
      <button
        onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
        disabled={!pagination.hasPrev || isLoading}
        className="btn btn-secondary disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {isLoading ? (
          <GradientSpinner size="w-4 h-4" />
        ) : (
          `Page ${pagination.page.toLocaleString()} of ${pagination.totalPages.toLocaleString()}`
        )}
      </span>
      <button
        onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
        disabled={!pagination.hasNext || isLoading}
        className="btn btn-secondary disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
);

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


const EditModeratorModal: React.FC<EditModeratorModalProps> = ({ isOpen, moderator, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState<Partial<Moderator>>({});

  React.useEffect(() => {
    if (moderator) {
      setFormData({
        username: moderator.username,
        email: moderator.email,
        name: moderator.name || '',
        status: moderator.status,
        password: '',
      });
    }
  }, [moderator]);

  const handleInputChange = (field: keyof Moderator, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({ ...prev, password: password }));
  };

  if (!isOpen || !moderator) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Edit Moderator</h3>

        <div className="space-y-4">
          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Username</label>
            <input
              type="text"
              value={formData.username || ''}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              placeholder="Enter username"
              disabled={isLoading}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              placeholder="Enter email address"
              disabled={isLoading}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Full Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              placeholder="Enter full name"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative">
              <input
                type="text"
                value={formData.password || ''}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="form-field w-full px-4 py-3 pr-12 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                placeholder="Leave blank to keep current password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={generatePassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                title="Generate random password"
                disabled={isLoading}
              >
                <FaSync className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave blank to keep current password, or click the refresh icon to generate a new one
            </p>
          </div>
          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Status</label>
            <select
              value={formData.status || 'active'}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
              disabled={isLoading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-6">
          <button 
            onClick={onClose} 
            className="btn btn-secondary" 
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(formData)} 
            className="btn btn-primary" 
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeratorsPage;