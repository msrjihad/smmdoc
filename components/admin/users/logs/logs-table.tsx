'use client';

import React from 'react';
import {
  FaExternalLinkAlt,
  FaTrash,
} from 'react-icons/fa';

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

interface LogsTableProps {
  activityLogs: UserActivityLog[];
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  selectedLogs: string[];
  pagination: PaginationInfo;
  logsLoading: boolean;
  onSelectAll: () => void;
  onSelectLog: (logId: string) => void;
  onDeleteLog: (logId: string) => void;
  onPageChange: (newPage: number) => void;
}

const getPaginatedData = (activityLogs: UserActivityLog[]) => {
  return activityLogs;
};

const getIpTrackerUrl = (ipAddress: string) => {
  return `https://www.ip-tracker.org/locator/ip-lookup.php?ip=${ipAddress}`;
};

const LogsTable: React.FC<LogsTableProps> = ({
  activityLogs,
  formatDate,
  formatTime,
  selectedLogs,
  pagination,
  logsLoading,
  onSelectAll,
  onSelectLog,
  onDeleteLog,
  onPageChange,
}) => {
  const paginatedData = getPaginatedData(activityLogs);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                <input
                  type="checkbox"
                  checked={
                    selectedLogs.length === paginatedData.length &&
                    paginatedData.length > 0
                  }
                  onChange={onSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                />
              </th>

              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                User
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Details
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                IP Address
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                History
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((log) => (
              <tr
                key={log.id}
                className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedLogs.includes(log.id)}
                    onChange={() => onSelectLog(log.id)}
                    className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                  />
                </td>

                <td className="p-3">
                  <div
                    className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded"
                  >
                    {log.username}
                  </div>
                </td>
                <td className="p-3">
                  <div className="max-w-xs">
                    <div
                      className="text-sm text-gray-900 dark:text-gray-100"
                      title={log.details}
                    >
                      {log.details.length > 50 ? `${log.details.substring(0, 50)}...` : log.details}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <a
                    href={getIpTrackerUrl(log.ipAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-sm font-mono"
                    title="Click to track IP address"
                  >
                    {log.ipAddress}
                    <FaExternalLinkAlt className="h-3 w-3" />
                  </a>
                </td>
                <td className="p-3">
                  <div>
                    <div
                      className="text-xs text-gray-600 dark:text-gray-400"
                    >
                      {formatDate(log.history)}
                    </div>
                    <div
                      className="text-xs text-gray-600 dark:text-gray-400"
                    >
                      {formatTime(log.history)}
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
      <div className="hidden">
        <div className="space-y-4" style={{ padding: '24px 0 0 0' }}>
          {paginatedData.map((log) => (
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
                    className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                  />

                  <div className="font-medium text-sm font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    {log.username}
                  </div>
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
              <div className="mb-4">
                <div
                  className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
                >
                  Details
                </div>
                <div
                  className="text-sm text-gray-900 dark:text-gray-100"
                >
                  {log.details}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div
                    className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
                  >
                    IP Address
                  </div>
                  <a
                    href={getIpTrackerUrl(log.ipAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-sm font-mono"
                    title="Click to track IP address"
                  >
                    {log.ipAddress}
                    <FaExternalLinkAlt className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <div
                    className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400"
                  >
                    History
                  </div>
                  <div
                    className="text-xs text-gray-600 dark:text-gray-400"
                  >
                    {formatDate(log.history)}
                  </div>
                  <div
                    className="text-xs text-gray-600 dark:text-gray-400"
                  >
                    {formatTime(log.history)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700"
      >
        <div
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {logsLoading ? (
            <div className="flex items-center gap-2">
              <span>Loading pagination...</span>
            </div>
          ) : (
            `Showing ${(pagination.page - 1) * pagination.limit + 1} to ${Math.min(
              pagination.page * pagination.limit,
              pagination.total
            )} of ${pagination.total} activity logs`
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
          <span
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {logsLoading ? (
              <div className="h-4 w-24 gradient-shimmer rounded" />
            ) : (
              `Page ${pagination.page} of ${pagination.totalPages}`
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

