'use client';

import React, { useCallback, useEffect, useState } from 'react';
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

  useEffect(() => {
    setPageTitle('API Sync Logs', appName);
  }, [appName]);

  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
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

  const fetchSyncLogs = useCallback(async () => {
    try {
      setLogsLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
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

  const getPaginatedData = () => {
    return syncLogs;
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectAll = () => {
    const currentPageData = getPaginatedData();
    if (selectedLogs.length === currentPageData.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(currentPageData.map((log) => log.id));
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
                value={pagination.limit}
                onChange={(e) => {
                  setPagination((prev) => ({
                    ...prev,
                    limit:
                      e.target.value === 'all'
                        ? 1000
                        : parseInt(e.target.value),
                    page: 1,
                  }));
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
            ) : getPaginatedData().length === 0 ? (
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
              <React.Fragment>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[1000px]">
                    <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
                      <tr>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          <input
                            type="checkbox"
                            checked={
                              selectedLogs.length ===
                                getPaginatedData().length &&
                              getPaginatedData().length > 0
                            }
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 dark:border-gray-600 w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                          />
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Sl. No
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          API Provider
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Service Name
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Changes
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          When
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                    {getPaginatedData().map((log, index) => (
                      <tr
                        key={log.id}
                        className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
                      >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedLogs.includes(log.id)}
                              onChange={() => handleSelectLog(log.id)}
                              className="rounded border-gray-300 dark:border-gray-600 w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div
                              className="font-medium text-sm text-gray-900 dark:text-gray-100"
                            >
                              {(pagination.page - 1) * pagination.limit + index + 1}
                            </div>
                          </td>
                          <td className="p-3">
                            <div
                              className="font-medium text-sm text-gray-900 dark:text-gray-100"
                            >
                              {log.apiProvider}
                            </div>
                          </td>
                          <td className="p-3">
                            <div
                              className="font-medium text-sm text-gray-900 dark:text-gray-100"
                            >
                              {log.serviceName}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="max-w-xs">
                              <div className="flex items-center gap-2 mb-1">
                                {getChangeTypeBadge(log.changeType)}
                              </div>
                              <div
                                className="text-sm truncate text-gray-900 dark:text-gray-100"
                                title={log.changes}
                              >
                                {log.changes}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(log.when).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(log.when).toLocaleTimeString()}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                setLogToDelete(log.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors duration-200"
                              title="Delete Log"
                            >
                              <FaTrash className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="lg:hidden">
                  <div className="space-y-4" style={{ padding: '24px 0 0 0' }}>
                    {getPaginatedData().map((log, index) => (
                      <div
                        key={log.id}
                        className="card card-padding border-l-4 border-blue-500 dark:border-blue-400 mb-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedLogs.includes(log.id)}
                              onChange={() => handleSelectLog(log.id)}
                              className="rounded border-gray-300 dark:border-gray-600 w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                            />
                            <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                              {(pagination.page - 1) * pagination.limit + index + 1}
                            </div>
                            {getChangeTypeBadge(log.changeType)}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setLogToDelete(log.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors duration-200"
                              title="Delete Log"
                            >
                              <FaTrash className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div
                              className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
                            >
                              API Provider
                            </div>
                            <div
                              className="font-medium text-sm text-gray-900 dark:text-gray-100"
                            >
                              {log.apiProvider}
                            </div>
                          </div>
                          <div>
                            <div
                              className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
                            >
                              Service Name
                            </div>
                            <div
                              className="font-medium text-sm text-gray-900 dark:text-gray-100"
                            >
                              {log.serviceName}
                            </div>
                          </div>
                        </div>
                        <div className="mb-4">
                          <div
                            className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
                          >
                            Changes
                          </div>
                          <div
                            className="text-sm text-gray-900 dark:text-gray-100"
                          >
                            {log.changes}
                          </div>
                        </div>
                        <div>
                          <div
                            className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
                          >
                            When
                          </div>
                          <div
                            className="text-xs text-gray-600 dark:text-gray-400"
                          >
                            Date: {new Date(log.when).toLocaleDateString()}
                          </div>
                          <div
                            className="text-xs text-gray-600 dark:text-gray-400"
                          >
                            Time: {new Date(log.when).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
                  <div
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    {logsLoading ? (
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
                      )} of ${formatNumber(pagination.total)} sync logs`
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
                      disabled={!pagination.hasPrev || logsLoading}
                      className="btn btn-secondary"
                    >
                      Previous
                    </button>
                    <span
                      className="text-sm text-gray-600 dark:text-gray-400"
                    >
                      {logsLoading ? (
                        <GradientSpinner size="w-4 h-4" />
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
                      disabled={!pagination.hasNext || logsLoading}
                      className="btn btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </React.Fragment>
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
        {bulkDeleteDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Delete Selected Sync Logs
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete {selectedLogs.length} selected
                sync log{selectedLogs.length !== 1 ? 's' : ''}? This action
                cannot be undone.
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
                  Delete {selectedLogs.length} Log
                  {selectedLogs.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncLogsPage;
