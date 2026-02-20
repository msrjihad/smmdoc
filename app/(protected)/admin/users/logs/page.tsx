'use client';

import React, { useEffect, useState } from 'react';
import {
  FaBox,
  FaCheckCircle,
  FaSearch,
  FaSync,
  FaTimes,
  FaTrash
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import LogsTable from '@/components/admin/users/logs/logs-table';
import DeleteActivityLogModal from '@/components/admin/users/logs/modals/delete-activity-log';

const ActivityLogsTableSkeleton = () => {
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
              <tr key={rowIdx} className="border-t dark:border-gray-700">
                <td className="p-3">
                  <div className="h-4 w-4 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-6 w-24 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-64 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-32 gradient-shimmer rounded" />
                    <div className="h-3 w-3 gradient-shimmer rounded" />
                  </div>
                </td>
                <td className="p-3">
                  <div className="h-3 w-24 gradient-shimmer rounded mb-1" />
                  <div className="h-3 w-20 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-8 w-8 gradient-shimmer rounded" />
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

interface UserActivityLog {
  id: string;
  username: string;
  details: string;
  ipAddress: string;
  history: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const UserActivityLogsPage = () => {
  const { appName } = useAppNameWithFallback();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');

  useEffect(() => {
    setPageTitle('User Activity Logs', appName);
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
      month: 'short',
      day: 'numeric',
      timeZone: userTimezone,
    });
  };

  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('all');
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [logsLoading, setLogsLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchActivityLogs = async (page = 1, search = '', searchBy = 'all', limitOverride?: number) => {
    try {
      setLogsLoading(true);
      const limit = limitOverride ?? pagination.limit;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        searchBy,
        role: 'user'
      });

      const response = await fetch(`/api/admin/activity-logs?${params}`);
      const result = await response.json();

      if (result.success) {
        setActivityLogs(result.data || []);
        setPagination(result.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        });
      } else {
        console.error('Failed to fetch activity logs:', result.error);
        showToast('Failed to fetch activity logs', 'error');
        setActivityLogs([]);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      showToast('Error fetching activity logs', 'error');
      setActivityLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs(pagination.page, searchTerm, searchBy);
  }, [pagination.page, searchTerm, searchBy]);

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchActivityLogs(newPage, searchTerm, searchBy);
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectAll = () => {
    if (selectedLogs.length === activityLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(activityLogs.map((log) => log.id));
    }
  };

  const handleSelectLog = (logId: string) => {
    setSelectedLogs((prev) =>
      prev.includes(logId)
        ? prev.filter((id) => id !== logId)
        : [...prev, logId]
    );
  };

  const handleRefresh = () => {
    fetchActivityLogs(pagination.page, searchTerm, searchBy);
    showToast('User activity logs refreshed successfully!', 'success');
  };

  const handleDeleteLog = async (logId: string) => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/activity-logs/${logId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {

        setActivityLogs(prev => prev.filter(log => log.id !== logId));
        showToast('Activity log deleted successfully', 'success');
        setDeleteDialogOpen(false);
        setLogToDelete(null);

        fetchActivityLogs(pagination.page, searchTerm, searchBy);
      } else {
        showToast(result.error || 'Failed to delete activity log', 'error');
      }
    } catch (error) {
      console.error('Error deleting activity log:', error);
      showToast('Error deleting activity log', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const response = await fetch('/api/admin/activity-logs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedLogs }),
      });

      const result = await response.json();

      if (result.success) {

        setActivityLogs(prev => prev.filter(log => !selectedLogs.includes(log.id)));
        showToast(`${selectedLogs.length} activity logs deleted successfully`, 'success');
        setSelectedLogs([]);
        setBulkDeleteDialogOpen(false);

        fetchActivityLogs(pagination.page, searchTerm, searchBy);
      } else {
        showToast(result.error || 'Failed to delete activity logs', 'error');
      }
    } catch (error) {
      console.error('Error deleting activity logs:', error);
      showToast('Error deleting activity logs', 'error');
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <select
                value={pagination.limit >= 1000 ? 'all' : pagination.limit.toString()}
                onChange={(e) => {
                  const newLimit = e.target.value === 'all' ? 1000 : parseInt(e.target.value);
                  setPagination(prev => ({
                    ...prev,
                    limit: newLimit,
                    page: 1
                  }));
                  fetchActivityLogs(1, searchTerm, searchBy, newLimit);
                }}
                className="pl-4 pr-8 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="all">All</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={logsLoading}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
              >
                <FaSync className={logsLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search activity logs..."
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
            {selectedLogs.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <span
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  {selectedLogs.length} selected
                </span>
                <button 
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <FaTrash />
                  Delete Selected
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: '0 24px' }}>
            {logsLoading ? (
              <div className="min-h-[600px]">
                <ActivityLogsTableSkeleton />
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-12">
                <FaBox
                  className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
                />
                <h3
                  className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300"
                >
                  No activity logs found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No activity logs match your search criteria or no activity logs exist yet.
                </p>
              </div>
            ) : (
              <LogsTable
                activityLogs={activityLogs}
                formatDate={formatDate}
                formatTime={formatTime}
                selectedLogs={selectedLogs}
                pagination={pagination}
                logsLoading={logsLoading}
                onSelectAll={handleSelectAll}
                onSelectLog={handleSelectLog}
                onDeleteLog={(logId) => {
                  setLogToDelete(logId);
                  setDeleteDialogOpen(true);
                }}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
        <DeleteActivityLogModal
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setLogToDelete(null);
          }}
          onConfirm={() => logToDelete && handleDeleteLog(logToDelete)}
          isLoading={deleteLoading}
        />
        {bulkDeleteDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Delete Selected Activity Logs
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete {selectedLogs.length} selected activity log{selectedLogs.length !== 1 ? 's' : ''}? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setBulkDeleteDialogOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleBulkDelete();
                    setBulkDeleteDialogOpen(false);
                  }}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm"
                >
                  Delete {selectedLogs.length} Log{selectedLogs.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivityLogsPage;