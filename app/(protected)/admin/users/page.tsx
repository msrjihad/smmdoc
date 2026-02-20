'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import {
    FaBan,
    FaCheckCircle,
    FaCoins,
    FaDollarSign,
    FaEdit,
    FaEllipsisH,
    FaExclamationCircle,
    FaSearch,
    FaSignInAlt,
    FaSync,
    FaTimes,
    FaTimesCircle,
    FaTrash,
    FaUserCheck,
    FaUsers,
} from 'react-icons/fa';

import useCurrency from '@/hooks/use-currency';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { invalidateUserSessions } from '@/lib/session-invalidation';
import { convertCurrency, formatCurrencyAmount } from '@/lib/currency-utils';
import { PriceDisplay } from '@/components/price-display';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import MoreActionMenu from '@/components/admin/users/more-action-menu';
import UsersTable from '@/components/admin/users/users-table';
import AddDeductBalanceModal from '@/components/admin/users/modals/add-deduct-user-balance';
import EditServicesDiscountModal from '@/components/admin/users/modals/edit-services-discount';
import EditUserModal from '@/components/admin/users/modals/edit-user';
import UpdateUserStatusModal from '@/components/admin/users/modals/update-user-status';

const ChangeRoleModal = dynamic(
  () => import('@/components/admin/users/role-modal'),
  { ssr: false }
);

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white"></div>
    </div>
  </div>
);

const UsersTableSkeleton = () => {
  const rows = Array.from({ length: 10 });
  
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1200px]">
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
                  <div className="h-6 w-16 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-24 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                  <div className="h-3 w-16 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-6 w-20 gradient-shimmer rounded-full" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-20 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-20 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-12 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-12 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-12 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-24 gradient-shimmer rounded mb-1" />
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
      {type === 'pending' && <FaExclamationCircle className="toast-icon" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="toast-close dark:hover:bg-white/10">
        <FaTimes className="toast-close-icon" />
      </button>
    </div>
  );
};

interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  balance: number;
  total_spent: number;
  totalOrders: number;
  servicesDiscount: number;
  status: 'active' | 'suspended' | 'banned';
  currency: string;
  dollarRate?: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  emailVerified: string | null;
  role: 'user' | 'admin' | 'moderator';
  suspendedUntil?: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  pendingUsers: number;
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

interface UserCardProps {
  user: User;
  isSelected: boolean;
  onSelect: (userId: number) => void;
  onView: (userId: number) => void;
  onEditBalance: (userId: number) => void;
  onEditDiscount: (userId: number, currentDiscount: number) => void;
  onChangeRole: (userId: number, currentRole: string) => void;
  onSetNewApiKey: (userId: number) => Promise<boolean>;
  onUpdateStatus: (userId: number, currentStatus: string) => void;
  onDelete: (userId: number) => void;
  formatCurrency: (amount: number, currency: string) => string;
  formatTime: (dateString: string | Date) => string;
  formatDate?: (dateString: string | Date) => string;
  isLoading: boolean;
  isModerator?: boolean;
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
}

interface AddDeductBalanceModalProps {
  isOpen: boolean;
  userId: number;
  currentUser: User | null;
  onClose: () => void;
  isLoading: boolean;
  onBalanceUpdate: () => void;
}

interface UpdateStatusModalProps {
  isOpen: boolean;
  currentStatus: string;
  newStatus: string;
  onStatusChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  suspensionDuration?: string;
  onSuspensionDurationChange?: (value: string) => void;
}

interface EditDiscountModalProps {
  isOpen: boolean;
  currentDiscount: number;
  newDiscount: string;
  onDiscountChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

interface EditUserModalProps {
  isOpen: boolean;
  currentUser: User | null;
  formData: EditUserFormData;
  onFormDataChange: (
    field: keyof EditUserFormData,
    value: string | number | boolean
  ) => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  onGeneratePassword: () => void;
}

interface EditUserFormData {
  username: string;
  name: string;
  email: string;
  balance: string;
  emailVerified: boolean | null;
  password: string;
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

const UsersListPage = () => {
  const { appName } = useAppNameWithFallback();
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');

  useEffect(() => {
    setPageTitle('All Users', appName);
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

  const isModerator = session?.user?.role === 'moderator';

  const { currency, currentCurrencyData, formatCurrency: formatCurrencyFromContext, availableCurrencies, currencySettings, convertAmount } = useCurrency();

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    bannedUsers: 0,
    pendingUsers: 0,
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
  const [selectedUsers, setSelectedUsers] = useState<(string | number)[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [addDeductBalanceDialog, setAddDeductBalanceDialog] = useState<{
    open: boolean;
    userId: number;
    currentUser: User | null;
  }>({
    open: false,
    userId: 0,
    currentUser: null,
  });

  const [balanceForm, setBalanceForm] = useState({
    amount: '',
    action: 'add',
    notes: '',
  });
  const [balanceSubmitting, setBalanceSubmitting] = useState(false);
  const [updateStatusDialog, setUpdateStatusDialog] = useState<{
    open: boolean;
    userId: number;
    currentStatus: string;
  }>({
    open: false,
    userId: 0,
    currentStatus: '',
  });
  const [newStatus, setNewStatus] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState('');
  const [editDiscountDialog, setEditDiscountDialog] = useState<{
    open: boolean;
    userId: number;
    currentDiscount: number;
  }>({
    open: false,
    userId: 0,
    currentDiscount: 0,
  });
  const [newDiscount, setNewDiscount] = useState('');
  const [changeRoleDialog, setChangeRoleDialog] = useState<{
    open: boolean;
    userId: number;
    currentRole: string;
  }>({
    open: false,
    userId: 0,
    currentRole: '',
  });
  const [newRole, setNewRole] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);

  const [editUserDialog, setEditUserDialog] = useState<{
    open: boolean;
    userId: number;
    currentUser: User | null;
  }>({
    open: false,
    userId: 0,
    currentUser: null,
  });

  const [editUserFormData, setEditUserFormData] = useState<EditUserFormData>({
    username: '',
    name: '',
    email: '',
    balance: '',
    emailVerified: null,
    password: '',
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const filterOptions = useMemo(
    () => [
      { key: 'all', label: 'All', count: stats.totalUsers },
      { key: 'active', label: 'Active', count: stats.activeUsers },
      { key: 'pending', label: 'Pending', count: stats.pendingUsers },
      { key: 'suspended', label: 'Suspended', count: stats.suspendedUsers },
      { key: 'banned', label: 'Banned', count: stats.bannedUsers },
    ],
    [stats]
  );

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        role: 'user',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      });

      const response = await fetch(`/api/admin/users?${queryParams}`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result.success) {

        let filteredUsers = (result.data || []).filter(
          (user: User) => user.role === 'user'
        );

        if (statusFilter === 'pending') {
          filteredUsers = filteredUsers.filter((user: User) => !user.emailVerified);
        } else if (statusFilter === 'active') {

          filteredUsers = filteredUsers.filter((user: User) => user.emailVerified && user.status === 'active');
        }

        setUsers(filteredUsers);
        setPagination((prev) => ({
          ...prev,
          ...result.pagination,
        }));
      } else {
        throw new Error(result.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast(
        error instanceof Error ? error.message : 'Error fetching users',
        'error'
      );
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, debouncedSearchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);

      const response = await fetch('/api/admin/users/stats?period=all');
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

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
          totalUsers: data.overview?.totalUsers || 0,
          activeUsers: statusBreakdown.active || 0,
          suspendedUsers: statusBreakdown.suspended || 0,
          bannedUsers: statusBreakdown.banned || 0,
          pendingUsers: statusBreakdown.pending || 0,
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
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const showToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' | 'pending' = 'success'
    ) => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    []
  );

  const getStatusIcon = (status: string) => {
    const icons = {
      active: <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />,
      suspended: <FaExclamationCircle className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />,
      banned: <FaBan className="h-3 w-3 text-red-500 dark:text-red-400" />,
    };
    return icons[status as keyof typeof icons] || icons.active;
  };

  const formatCurrency = useCallback((amount: number, userCurrency?: string) => {
    if (userCurrency && availableCurrencies && currencySettings) {
      const userCurrencyData = availableCurrencies.find(c => c.code === userCurrency);
      if (userCurrencyData) {
        const convertedAmount = convertCurrency(amount, 'USD', userCurrency, availableCurrencies);
        return formatCurrencyAmount(convertedAmount, userCurrency, availableCurrencies, currencySettings);
      }
    }
    if (availableCurrencies && currencySettings) {
      const convertedAmount = convertCurrency(amount, 'USD', currency, availableCurrencies);
      return formatCurrencyAmount(convertedAmount, currency, availableCurrencies, currencySettings);
    }
    return `$${amount.toFixed(2)}`;
  }, [currency, availableCurrencies, currencySettings]);

  const handleSelectAll = useCallback(() => {
    setSelectedUsers((prev) =>
      prev.length === users.length ? [] : users.map((user) => user.id)
    );
  }, [users]);

  const handleSelectUser = useCallback((userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId.toString())
        ? prev.filter((id) => id !== userId.toString())
        : [...prev, userId.toString()]
    );
  }, []);

  const handleViewUser = useCallback(async (userId: number) => {
    try {
      setActionLoading(userId.toString());

      const response = await fetch('/api/admin/switch-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message || 'Successfully switched to user', 'success');

        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          await updateSession();
          
          console.log('Session updated after switch');
        } catch (error) {
          console.error('Error updating session:', error);
        }

        setTimeout(() => {
          const dashboardUrl = new URL('/dashboard', window.location.origin).href;
          window.location.href = dashboardUrl;
        }, 500);
      } else {
        showToast(result.error || 'Failed to switch user', 'error');
      }
    } catch (error) {
      console.error('Switch user error:', error);
      showToast('Failed to switch user', 'error');
    } finally {
      setActionLoading('');
    }
  }, [showToast]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchUsers(), fetchStats()]);
    showToast('Data refreshed successfully!', 'success');
  }, [fetchUsers, fetchStats, showToast]);

  const handleApiAction = useCallback(
    async (
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

        const result = await response.json();

        if (response.ok && result.success) {
          if (successMessage) showToast(successMessage, 'success');
          await fetchUsers();
          await fetchStats();
          return true;
        } else {

          const errorMessage = result.error || 'Operation failed';
          showToast(errorMessage, 'error');
          return false;
        }
      } catch (error) {
        console.error('API action error:', error);
        showToast(
          error instanceof Error ? error.message : 'Operation failed',
          'error'
        );
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [fetchUsers, fetchStats, showToast]
  );

  const handleDeleteUser = useCallback(
    async (userId: number) => {
      const success = await handleApiAction(
        `/api/admin/users/${userId}`,
        'DELETE',
        undefined,
        'User deleted successfully'
      );

      if (success) {

        await invalidateUserSessions(userId);
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      }
    },
    [handleApiAction]
  );

  const handleStatusUpdate = useCallback(
    async (userId: number, newStatus: string, duration?: string) => {
      const requestBody: any = { status: newStatus };

      if (newStatus === 'suspended' && duration) {
        requestBody.suspensionDuration = duration;
      }

      const success = await handleApiAction(
        `/api/admin/users/${userId}/status`,
        'PUT',
        requestBody,
        `User status updated to ${newStatus}`
      );

      if (success && (newStatus === 'suspended' || newStatus === 'banned')) {
        await invalidateUserSessions(userId);
      }

      return success;
    },
    [handleApiAction]
  );

  const handleBalanceSubmit = useCallback(async () => {
    if (!balanceForm.amount || !addDeductBalanceDialog.currentUser) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (parseFloat(balanceForm.amount) <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }

    try {
      setBalanceSubmitting(true);
      const response = await fetch('/api/admin/users/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: addDeductBalanceDialog.currentUser.username,
          amount: parseFloat(balanceForm.amount),
          action: balanceForm.action,
          notes: balanceForm.notes,
          adminCurrency: currency,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          result.message || `Successfully ${
            balanceForm.action === 'add' ? 'added' : 'deducted'
          } balance ${balanceForm.action === 'add' ? 'to' : 'from'} ${addDeductBalanceDialog.currentUser.username}`,
          'success'
        );
        setAddDeductBalanceDialog({ open: false, userId: 0, currentUser: null });
        setBalanceForm({ amount: '', action: 'add', notes: '' });

        fetchUsers();
      } else {
        showToast(result.error || 'Failed to update user balance', 'error');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      showToast('Failed to update user balance', 'error');
    } finally {
      setBalanceSubmitting(false);
    }
  }, [balanceForm, addDeductBalanceDialog.currentUser, fetchUsers]);

  const handleEditDiscount = useCallback(
    async (userId: number, discount: number) => {
      const success = await handleApiAction(
        `/api/admin/users/${userId}/discount`,
        'PUT',
        { discount },
        'Services discount updated successfully'
      );

      if (success) {
        setEditDiscountDialog({ open: false, userId: 0, currentDiscount: 0 });
        setNewDiscount('');
      }
    },
    [handleApiAction]
  );

  const handleChangeRole = useCallback(
    async (userId: number, role: string, permissions?: string[]) => {
      const payload: any = { role };
      if (role === 'moderator' && permissions) {
        payload.permissions = permissions;
      }
      const success = await handleApiAction(
        `/api/admin/users/${userId}/role`,
        'PUT',
        payload,
        `User role updated to ${role}`
      );

      if (success) {
        setChangeRoleDialog({ open: false, userId: 0, currentRole: '' });
        setNewRole('');
        setNewRolePermissions([]);
      }
      return success;
    },
    [handleApiAction]
  );

  const handleSetNewApiKey = useCallback(
    async (userId: number) => {
      return handleApiAction(
        `/api/admin/users/${userId}/api-key`,
        'POST',
        {},
        'New API key generated successfully'
      );
    },
    [handleApiAction]
  );

  const openEditUserDialog = useCallback(
    (userId: number, currentUser: User) => {
      setEditUserDialog({ open: true, userId, currentUser });
      setEditUserFormData({
        username: currentUser.username || '',
        name: currentUser.name || '',
        email: currentUser.email || '',
        balance: (currentUser.balance || 0).toString(),
        emailVerified: !!currentUser.emailVerified,
        password: '',
      });
    },
    []
  );

  const handleEditUserFormDataChange = useCallback(
    (field: keyof EditUserFormData, value: string | number | boolean) => {
      setEditUserFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleGeneratePassword = useCallback(() => {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setEditUserFormData((prev) => ({
      ...prev,
      password: password,
    }));
  }, []);

  const handleEditUserSubmit = useCallback(async () => {
    const userData = {
      username: editUserFormData.username,
      name: editUserFormData.name,
      email: editUserFormData.email,
      balance: parseFloat(editUserFormData.balance) || 0,
      emailVerified: editUserFormData.emailVerified,

      status: editUserFormData.emailVerified ? 'active' : 'pending',
      ...(editUserFormData.password && { password: editUserFormData.password }),
    };

    const success = await handleApiAction(
      `/api/admin/users/${editUserDialog.userId}`,
      'PUT',
      userData,
      'User updated successfully'
    );

    if (success) {
      setEditUserDialog({ open: false, userId: 0, currentUser: null });
      setEditUserFormData({
        username: '',
        name: '',
        email: '',
        balance: '',
        emailVerified: false,
        password: '',
      });
    }
  }, [editUserDialog.userId, editUserFormData, handleApiAction]);

  const handleEditUser = useCallback(
    (userId: number) => {
      const user = users.find((u) => u.id === userId);
      if (user) {
        openEditUserDialog(userId, user);
      }
    },
    [users, openEditUserDialog]
  );

  const openAddDeductBalanceDialog = useCallback(
    (userId: number) => {
      const user = users.find((u) => u.id === userId);
      if (user) {
        setAddDeductBalanceDialog({ open: true, userId, currentUser: user });
        setBalanceForm({ amount: '', action: 'add', notes: '' });
      }
    },
    [users]
  );

  const calculateSuspensionDuration = (suspendedUntil: string): string => {
    const suspendedDate = new Date(suspendedUntil);
    const now = new Date();
    const diffMs = suspendedDate.getTime() - now.getTime();

    if (diffMs <= 0) return '';

    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30));

    if (diffHours <= 24) return '24 hours';
    if (diffHours <= 48) return '48 hours';
    if (diffHours <= 72) return '72 hours';
    if (diffDays <= 7) return '7 days';
    if (diffDays <= 30) return '30 days';
    if (diffMonths <= 3) return '3 months';
    if (diffMonths <= 6) return '6 months';
    return '1 year';
  };

  const openUpdateStatusDialog = useCallback(
    (userId: number, currentStatus: string) => {
      const user = users.find((u) => u.id === userId);
      setUpdateStatusDialog({ open: true, userId, currentStatus });
      setNewStatus(currentStatus);

      if (currentStatus === 'suspended' && user?.suspendedUntil) {
        const currentDuration = calculateSuspensionDuration(user.suspendedUntil);
        setSuspensionDuration(currentDuration);
      } else {
        setSuspensionDuration('');
      }
    },
    [users]
  );

  const openEditDiscountDialog = useCallback(
    (userId: number, currentDiscount: number) => {
      setEditDiscountDialog({ open: true, userId, currentDiscount });
      setNewDiscount(currentDiscount.toString());
    },
    []
  );

  const openChangeRoleDialog = useCallback(async (userId: number, currentRole: string) => {
    setChangeRoleDialog({ open: true, userId, currentRole });
    setNewRole(currentRole);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const result = await response.json();
      if (result.success && result.data && result.data.permissions) {
        setNewRolePermissions(Array.isArray(result.data.permissions) ? result.data.permissions : []);
      } else {
        setNewRolePermissions([]);
      }
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      setNewRolePermissions([]);
    }
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="card card-padding">
            <div className="card-content">
              <div className="card-icon">
                <FaUsers />
              </div>
              <div>
                <h3 className="card-title">Total Users</h3>
                {statsLoading ? (
                  <div className="h-8 w-16 gradient-shimmer rounded" />
                ) : (
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card card-padding">
            <div className="card-content">
              <div className="card-icon">
                <FaUserCheck />
              </div>
              <div>
                <h3 className="card-title">Active Users</h3>
                {statsLoading ? (
                  <div className="h-8 w-16 gradient-shimmer rounded" />
                ) : (
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.activeUsers.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card card-padding">
            <div className="card-content">
              <div className="card-icon">
                <FaExclamationCircle />
              </div>
              <div>
                <h3 className="card-title">Suspended Users</h3>
                {statsLoading ? (
                  <div className="h-8 w-16 gradient-shimmer rounded" />
                ) : (
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.suspendedUsers.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card card-padding">
            <div className="card-content">
              <div className="card-icon">
                <FaBan />
              </div>
              <div>
                <h3 className="card-title">Banned Users</h3>
                {statsLoading ? (
                  <div className="h-8 w-16 gradient-shimmer rounded" />
                ) : (
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.bannedUsers.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <select
                value={pagination.limit}
                onChange={(e) =>
                  setPagination((prev) => ({
                    ...prev,
                    limit: parseInt(e.target.value),
                    page: 1,
                  }))
                }
                className="pl-4 pr-8 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={pagination.total || 1000}>All</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={usersLoading || statsLoading}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
              >
                <FaSync
                  className={usersLoading || statsLoading ? 'animate-spin' : ''}
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
                  } users...`}
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
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {stats.totalUsers.toLocaleString()}
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
                    {stats.activeUsers.toLocaleString()}
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
                    {stats.pendingUsers.toLocaleString()}
                  </span>
                </button>
                <button
                  onClick={() => updateQueryParams({ status: 'suspended' })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'suspended'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Suspended
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'suspended'
                        ? 'bg-white/20'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {stats.suspendedUsers.toLocaleString()}
                  </span>
                </button>
                <button
                  onClick={() => updateQueryParams({ status: 'banned' })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'banned'
                      ? 'bg-gradient-to-r from-red-600 to-red-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Banned
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'banned'
                        ? 'bg-white/20'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {stats.bannedUsers.toLocaleString()}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            {usersLoading ? (
              <UsersTableSkeleton />
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <FaUsers
                  className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
                />
                <h3
                  className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300"
                >
                  No users found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {debouncedSearchTerm && statusFilter !== 'all'
                    ? `No ${statusFilter} users match your search "${debouncedSearchTerm}".`
                    : debouncedSearchTerm
                    ? `No users match your search "${debouncedSearchTerm}".`
                    : statusFilter !== 'all'
                    ? `No ${statusFilter} users found.`
                    : 'No users exist yet.'}
                </p>
              </div>
            ) : (
              <>
                <UsersTable
                  users={users}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  onViewUser={handleViewUser}
                  onEditUser={handleEditUser}
                  onEditBalance={openAddDeductBalanceDialog}
                  onEditDiscount={openEditDiscountDialog}
                  onChangeRole={openChangeRoleDialog}
                  onSetNewApiKey={handleSetNewApiKey}
                  onUpdateStatus={openUpdateStatusDialog}
                  onDelete={(userId) => {
                    setUserToDelete(userId);
                    setDeleteDialogOpen(true);
                  }}
                  actionLoading={actionLoading}
                  isModerator={isModerator}
                />
                <div className="hidden">
                  <div className="space-y-4" style={{ padding: '24px 0 0 0' }}>
                    {users.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        isSelected={selectedUsers.includes(user.id.toString())}
                        onSelect={handleSelectUser}
                        onView={handleViewUser}
                        onEditBalance={openAddDeductBalanceDialog}
                        onEditDiscount={openEditDiscountDialog}
                        onChangeRole={openChangeRoleDialog}
                        onSetNewApiKey={handleSetNewApiKey}
                        onUpdateStatus={openUpdateStatusDialog}
                        onDelete={(userId) => {
                          setUserToDelete(userId);
                          setDeleteDialogOpen(true);
                        }}
                        formatCurrency={formatCurrency}
                        formatTime={formatTime}
                        formatDate={formatDate}
                        isLoading={actionLoading === user.id.toString()}
                      />
                    ))}
                  </div>
                </div>
                <Pagination
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  isLoading={usersLoading}
                />
              </>
            )}
          </div>
        </div>
        <DeleteConfirmationModal
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
          }}
          onConfirm={() => userToDelete && handleDeleteUser(userToDelete)}
          isLoading={actionLoading === `/api/admin/users/${userToDelete}`}
        />

        <AddDeductBalanceModal
          isOpen={addDeductBalanceDialog.open}
          userId={addDeductBalanceDialog.userId}
          currentUser={addDeductBalanceDialog.currentUser}
          onClose={() => {
            setAddDeductBalanceDialog({
              open: false,
              userId: 0,
              currentUser: null,
            });
          }}
          isLoading={false}
          onBalanceUpdate={() => {
            fetchUsers();
            fetchStats();
          }}
        />

        <UpdateUserStatusModal
          isOpen={updateStatusDialog.open}
          currentStatus={updateStatusDialog.currentStatus}
          newStatus={newStatus}
          onStatusChange={setNewStatus}
          suspensionDuration={suspensionDuration}
          onSuspensionDurationChange={setSuspensionDuration}
          onClose={() => {
            setUpdateStatusDialog({
              open: false,
              userId: 0,
              currentStatus: '',
            });
            setNewStatus('');
            setSuspensionDuration('');
          }}
          onConfirm={() => {
            handleStatusUpdate(
              updateStatusDialog.userId, 
              newStatus, 
              newStatus === 'suspended' ? suspensionDuration : undefined
            ).then(
              (success) => {
                if (success) {
                  setUpdateStatusDialog({
                    open: false,
                    userId: 0,
                    currentStatus: '',
                  });
                  setNewStatus('');
                  setSuspensionDuration('');
                }
              }
            );
          }}
          isLoading={
            actionLoading ===
            `/api/admin/users/${updateStatusDialog.userId}/status`
          }
        />

        <EditServicesDiscountModal
          isOpen={editDiscountDialog.open}
          currentDiscount={editDiscountDialog.currentDiscount}
          newDiscount={newDiscount}
          onDiscountChange={setNewDiscount}
          onClose={() => {
            setEditDiscountDialog({
              open: false,
              userId: 0,
              currentDiscount: 0,
            });
            setNewDiscount('');
          }}
          onConfirm={() =>
            handleEditDiscount(
              editDiscountDialog.userId,
              parseInt(newDiscount) || 0
            )
          }
          isLoading={
            actionLoading ===
            `/api/admin/users/${editDiscountDialog.userId}/discount`
          }
        />

        {!isModerator && (
          <ChangeRoleModal
            isOpen={changeRoleDialog.open}
            currentRole={changeRoleDialog.currentRole}
            newRole={newRole}
            onRoleChange={setNewRole}
            onClose={() => {
              setChangeRoleDialog({ open: false, userId: 0, currentRole: '' });
              setNewRole('');
              setNewRolePermissions([]);
            }}
            onConfirm={() => {
              handleChangeRole(changeRoleDialog.userId, newRole, newRolePermissions).then(
                (success) => {
                  if (success) {
                    setChangeRoleDialog({
                      open: false,
                      userId: 0,
                      currentRole: '',
                    });
                    setNewRole('');
                    setNewRolePermissions([]);
                  }
                }
              );
            }}
            permissions={newRolePermissions}
            onPermissionsChange={setNewRolePermissions}
            isLoading={
              actionLoading === `/api/admin/users/${changeRoleDialog.userId}/role`
            }
          />
        )}
        <EditUserModal
          isOpen={editUserDialog.open}
          currentUser={editUserDialog.currentUser}
          formData={editUserFormData}
          onFormDataChange={handleEditUserFormDataChange}
          onClose={() => {
            setEditUserDialog({ open: false, userId: 0, currentUser: null });
            setEditUserFormData({
              username: '',
              name: '',
              email: '',
              balance: '',
              emailVerified: false,
              password: '',
            });
          }}
          onConfirm={handleEditUserSubmit}
          onGeneratePassword={handleGeneratePassword}
          isLoading={
            actionLoading === `/api/admin/users/${editUserDialog.userId}`
          }
        />
      </div>
    </div>
  );
};

const UserCard: React.FC<UserCardProps> = ({
  user,
  isSelected,
  onSelect,
  onView,
  onEditBalance,
  onEditDiscount,
  onChangeRole,
  onSetNewApiKey,
  onUpdateStatus,
  onDelete,
  formatCurrency,
  formatTime,
  formatDate,
  isLoading,
  isModerator = false,
}) => (
  <div className="card card-padding border-l-4 border-blue-500 dark:border-blue-400 mb-4">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
          {user.id || 'N/A'}
        </div>
      </div>
      <MoreActionMenu
        user={user}
        onView={onView}
        onEditUser={(userId: number) => {
          const foundUser = [user].find((u) => u.id === userId);
          if (foundUser) {
            onView(userId);
          }
        }}
        onEditBalance={onEditBalance}
        onEditDiscount={onEditDiscount}
        onChangeRole={onChangeRole}
        onSetNewApiKey={onSetNewApiKey}
        onUpdateStatus={onUpdateStatus}
        onDelete={onDelete}
        isLoading={isLoading}
        isModerator={isModerator}
      />
    </div>

    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div
            className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
          >
            Username
          </div>
          <div
            className="font-medium text-sm text-gray-900 dark:text-gray-100"
          >
            {user.username || 'null'}
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
          >
            Status
          </div>
          <div className="flex items-center justify-end">
            {user.emailVerified ? (
              <>
                <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
                <span className="text-xs text-green-600 dark:text-green-400 ml-1">Active</span>
              </>
            ) : (
              <>
                <FaTimesCircle className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />
                <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-1">Pending</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div
            className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
          >
            Role
          </div>
          <div
            className="font-medium text-sm capitalize text-gray-900 dark:text-gray-100"
          >
            {user.role || 'user'}
          </div>
        </div>
      </div>

      <div>
        <div
          className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
        >
          Email
        </div>
        <div className="text-sm mb-1 text-gray-900 dark:text-gray-100">
          {user.email || 'null'}
        </div>
        <div className="flex items-center gap-1">
          {user.emailVerified ? (
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div
            className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
          >
            Balance
          </div>
          <div
            className="font-semibold text-sm text-gray-900 dark:text-gray-100"
          >
            <PriceDisplay
              amount={user.balance || 0}
              originalCurrency="USD"
              className="font-semibold text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        <div>
          <div
            className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
          >
            Total Spent
          </div>
          <div
            className="font-semibold text-sm text-gray-900 dark:text-gray-100"
          >
            <PriceDisplay
              amount={(user as any).total_spent || 0}
              originalCurrency="USD"
              className="font-semibold text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div
            className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
          >
            Total Orders
          </div>
          <div
            className="font-semibold text-sm text-gray-900 dark:text-gray-100"
          >
            {(user.totalOrders || 0).toLocaleString()}
          </div>
        </div>
        <div>
          <div
            className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
          >
            Services Discount
          </div>
          <div
            className="font-semibold text-sm text-gray-900 dark:text-gray-100"
          >
            {user.servicesDiscount || 0}%
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm text-gray-900 dark:text-gray-100">
          Registered:{' '}
          {user.createdAt
            ? (formatDate ? formatDate(user.createdAt) : new Date(user.createdAt).toLocaleDateString())
            : 'null'}
        </div>
        <div className="text-sm text-gray-900 dark:text-gray-100">
          Time:{' '}
          {user.createdAt
            ? formatTime(user.createdAt)
            : 'null'}
        </div>
        {user.lastLoginAt && (
          <div
            className="text-sm mt-1 text-gray-900 dark:text-gray-100"
          >
            Last login: {formatDate ? formatDate(user.lastLoginAt) : new Date(user.lastLoginAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  </div>
);

const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  isLoading,
}) => (
  <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
    <div className="text-sm text-gray-600 dark:text-gray-400">
      {isLoading ? (
        <div className="flex items-center gap-2">
          <span>Loading pagination...</span>
        </div>
      ) : (
        `Showing ${(
          (pagination.page - 1) * pagination.limit +
          1
        ).toLocaleString()} to ${Math.min(
          pagination.page * pagination.limit,
          pagination.total
        ).toLocaleString()} of ${pagination.total.toLocaleString()} users`
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
          `Page ${pagination.page} of ${pagination.totalPages}`
        )}
      </span>
      <button
        onClick={() =>
          onPageChange(Math.min(pagination.totalPages, pagination.page + 1))
        }
        disabled={!pagination.hasNext || isLoading}
        className="btn btn-secondary disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
);

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Delete User</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Are you sure you want to delete this user? This action cannot be
          undone and will permanently remove all user data.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
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

export default UsersListPage;