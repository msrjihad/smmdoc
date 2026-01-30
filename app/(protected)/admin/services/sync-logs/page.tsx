'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
    FaBox,
    FaCheckCircle,
    FaSearch,
    FaSync,
    FaTimes,
    FaTrash,
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { formatNumber } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import DeleteSelectedSyncLogsModal from '@/components/admin/services/sync-logs/modals/delete-selected-sync-logs';

const LogsTable = dynamic(
  () => import('@/components/admin/services/sync-logs/logs-table'),
  { ssr: false }
);

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white"></div>
    </div>
  </div>
);

const SyncLogsTableSkeleton = () => {
  const rows = Array.from({ length: 10 });
  
  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
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
              <tr key={rowIdx} className="border-t dark:border-gray-700">
                <td className="p-3">
                  <div className="h-4 w-4 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-8 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-32 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-40 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-5 w-20 gradient-shimmer rounded-full mb-1" />
                  <div className="h-4 w-48 gradient-shimmer rounded" />
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
      <div className="lg:hidden">
        <div className="space-y-4" style={{ padding: '24px 0 0 0' }}>
          {rows.map((_, idx) => (
            <div key={idx} className="card card-padding border-l-4 border-blue-500 dark:border-blue-400 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 gradient-shimmer rounded" />
                  <div className="h-6 w-16 gradient-shimmer rounded" />
                  <div className="h-5 w-20 gradient-shimmer rounded-full" />
                </div>
                <div className="h-8 w-8 gradient-shimmer rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="h-3 w-24 gradient-shimmer rounded mb-2" />
                  <div className="h-4 w-32 gradient-shimmer rounded" />
                </div>
                <div>
                  <div className="h-3 w-24 gradient-shimmer rounded mb-2" />
                  <div className="h-4 w-40 gradient-shimmer rounded" />
                </div>
              </div>
              <div className="mb-4">
                <div className="h-3 w-20 gradient-shimmer rounded mb-2" />
                <div className="h-4 w-full gradient-shimmer rounded" />
              </div>
              <div>
                <div className="h-3 w-16 gradient-shimmer rounded mb-2" />
                <div className="h-3 w-24 gradient-shimmer rounded mb-1" />
                <div className="h-3 w-20 gradient-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 border-t dark:border-gray-700">
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

interface SyncLog {
  id: number;
  apiProvider: string;
  serviceName: string;
  changes: string;
  changeType: 'added' | 'updated' | 'deleted' | 'error';
  when: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const SyncLogsPage = () => {
  const { appName } = useAppNameWithFallback();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');

  useEffect(() => {
    setPageTitle('API Sync Logs', appName);
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

  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
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
  const [selectedLogs, setSelectedLogs] = useState<(string | number)[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | number | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [logsLoading, setLogsLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            Added
          </span>
        );
      case 'updated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            Updated
          </span>
        );
      case 'deleted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
            Deleted
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
            Unknown
          </span>
        );
    }
  };

  const fetchSyncLogs = useCallback(async (overrides?: { page?: number; limit?: number }) => {
    try {
      setLogsLoading(true);
      const page = overrides?.page ?? pagination.page;
      const limit = overrides?.limit ?? pagination.limit;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
        params.append('searchBy', searchBy);
      }

      const response = await fetch(`/api/admin/services/sync-logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sync logs');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setSyncLogs(result.data.logs || []);
        if (result.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: result.data.pagination.page ?? prev.page,
            limit: result.data.pagination.limit ?? prev.limit,
            total: result.data.pagination.total,
            totalPages: result.data.pagination.totalPages,
            hasNext: result.data.pagination.hasNext,
            hasPrev: result.data.pagination.hasPrev,
          }));
        }
      } else {
        throw new Error(result.error || 'Failed to fetch sync logs');
      }
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      showToast('Failed to fetch sync logs', 'error');
    } finally {
      setLogsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, searchBy]);

  useEffect(() => {
    fetchSyncLogs();
  }, [fetchSyncLogs]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectAll = () => {
    if (selectedLogs.length === syncLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(syncLogs.map((log) => log.id));
    }
  };

  const handleSelectLog = (logId: string | number) => {
    setSelectedLogs((prev) =>
      prev.includes(logId)
        ? prev.filter((id) => id !== logId)
        : [...prev, logId]
    );
  };

  const handleRefresh = () => {
    fetchSyncLogs();
    showToast('Sync logs refreshed successfully!', 'success');
  };

  const handleDeleteLog = async (logId: string | number) => {
    setDeleteLoading(true);
    try {
      const response = await fetch('/api/admin/services/sync-logs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: [logId] }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Sync log deleted successfully', 'success');
        setDeleteDialogOpen(false);
        setLogToDelete(null);
        fetchSyncLogs();
      } else {
        throw new Error(result.error || 'Failed to delete sync log');
      }
    } catch (error) {
      console.error('Error deleting sync log:', error);
      showToast('Error deleting sync log', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch('/api/admin/services/sync-logs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedLogs }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          `${selectedLogs.length} sync logs deleted successfully`,
          'success'
        );
        setSelectedLogs([]);
        setBulkDeleteDialogOpen(false);
        fetchSyncLogs();
      } else {
        throw new Error(result.error || 'Failed to delete sync logs');
      }
    } catch (error) {
      console.error('Error deleting sync logs:', error);
      showToast('Error deleting sync logs', 'error');
    } finally {
      setDeleteLoading(false);
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
                  setPagination((prev) => ({
                    ...prev,
                    limit: newLimit,
                    page: 1,
                  }));
                  fetchSyncLogs({ page: 1, limit: newLimit });
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
            <div className="flex flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
                />
                <input
                  type="text"
                  placeholder={`Search ${
                    searchBy === 'all'
                      ? 'sync logs'
                      : searchBy === 'api_provider'
                      ? 'API providers'
                      : 'service names'
                  }...`}
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

          <div style={{ padding: '0 24px' }} className="min-h-[600px]">
            {logsLoading ? (
              <SyncLogsTableSkeleton />
            ) : syncLogs.length === 0 ? (
              <div className="text-center py-12">
                <FaBox
                  className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
                />
                <h3
                  className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300"
                >
                  No sync logs found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No sync logs match your search criteria or no sync logs exist
                  yet.
                </p>
              </div>
            ) : (
              <LogsTable
                logs={syncLogs}
                pagination={pagination}
                selectedLogs={selectedLogs}
                logsLoading={logsLoading}
                formatDate={formatDate}
                formatTime={formatTime}
                getChangeTypeBadge={getChangeTypeBadge}
                onSelectAll={handleSelectAll}
                onSelectLog={handleSelectLog}
                onDeleteLog={(logId) => {
                  setLogToDelete(logId);
                  setDeleteDialogOpen(true);
                }}
                onPageChange={(page) => {
                  setPagination((prev) => ({
                    ...prev,
                    page,
                  }));
                }}
              />
            )}
          </div>
        </div>
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Delete Sync Log</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this sync log? This action
                cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setLogToDelete(null);
                  }}
                  disabled={deleteLoading}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => logToDelete && handleDeleteLog(logToDelete)}
                  disabled={deleteLoading}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 shadow-sm text-white ${
                    deleteLoading 
                      ? 'bg-red-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {deleteLoading ? (
                    <>
                      <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        <DeleteSelectedSyncLogsModal
          isOpen={bulkDeleteDialogOpen}
          selectedCount={selectedLogs.length}
          isLoading={deleteLoading}
          onClose={() => setBulkDeleteDialogOpen(false)}
          onConfirm={() => {
            handleBulkDelete();
          }}
        />
      </div>
    </div>
  );
};

export default SyncLogsPage;