'use client';

import React from 'react';
import { FaTrash } from 'react-icons/fa';
import { formatNumber } from '@/lib/utils';

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

interface LogsTableProps {
  logs: SyncLog[];
  pagination: PaginationInfo;
  selectedLogs: (string | number)[];
  logsLoading: boolean;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  getChangeTypeBadge: (changeType: string) => React.ReactNode;
  onSelectAll: () => void;
  onSelectLog: (logId: string | number) => void;
  onDeleteLog: (logId: string | number) => void;
  onPageChange: (page: number) => void;
}

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white"></div>
    </div>
  </div>
);

const LogsTable: React.FC<LogsTableProps> = ({
  logs,
  pagination,
  selectedLogs,
  logsLoading,
  formatDate,
  formatTime,
  getChangeTypeBadge,
  onSelectAll,
  onSelectLog,
  onDeleteLog,
  onPageChange,
}) => {
  const getPaginatedData = () => {
    return logs;
  };

  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                <input
                  type="checkbox"
                  checked={
                    selectedLogs.length === getPaginatedData().length &&
                    getPaginatedData().length > 0
                  }
                  onChange={onSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600 w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                />
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Sl. No
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                API Provider
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Service Name
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Changes
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                When
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
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
                    onChange={() => onSelectLog(log.id)}
                    className="rounded border-gray-300 dark:border-gray-600 w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                  />
                </td>
                <td className="p-3">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {log.apiProvider}
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
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
                      {formatDate(log.when)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatTime(log.when)}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => onDeleteLog(log.id)}
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
                    onChange={() => onSelectLog(log.id)}
                    className="rounded border-gray-300 dark:border-gray-600 w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                  />
                  <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </div>
                  {getChangeTypeBadge(log.changeType)}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors duration-200"
                    title="Delete Log"
                  >
                    <FaTrash className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                    API Provider
                  </div>
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {log.apiProvider}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                    Service Name
                  </div>
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {log.serviceName}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                  Changes
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {log.changes}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                  When
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Date: {formatDate(log.when)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Time: {formatTime(log.when)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
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
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPrev || logsLoading}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {logsLoading ? (
              <GradientSpinner size="w-4 h-4" />
            ) : (
              `Page ${formatNumber(
                pagination.page
              )} of ${formatNumber(pagination.totalPages)}`
            )}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={!pagination.hasNext || logsLoading}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default LogsTable;

