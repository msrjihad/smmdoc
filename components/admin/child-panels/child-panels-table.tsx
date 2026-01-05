'use client';

import React from 'react';
import { FaEye, FaServer } from 'react-icons/fa';
import { formatID, formatNumber } from '@/lib/utils';
import MoreActionMenu from './more-action-menu';

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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ChildPanelsTableProps {
  panels: ChildPanel[];
  pagination: PaginationInfo;
  isLoading: boolean;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  onViewDetails: (panel: ChildPanel) => void;
  onChangeStatus: (panelId: number, currentStatus: string) => void;
  onOpenSettings: (panel: ChildPanel) => void;
  onPageChange: (page: number) => void;
}

const ChildPanelsTable: React.FC<ChildPanelsTableProps> = ({
  panels,
  pagination,
  isLoading,
  formatDate,
  formatTime,
  getStatusBadge,
  onViewDetails,
  onChangeStatus,
  onOpenSettings,
  onPageChange,
}) => {

  if (panels.length === 0) {
    return (
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
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
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
            {panels.map((panel, index) => (
              <tr
                key={panel.id}
                className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
              >
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
                        ? formatDate(panel.createdAt)
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
                  {getStatusBadge(panel.status)}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-secondary p-2"
                      title="View Details"
                      onClick={() => onViewDetails(panel)}
                    >
                      <FaEye className="h-3 w-3" />
                    </button>

                    <MoreActionMenu
                      panel={panel}
                      onChangeStatus={onChangeStatus}
                      onOpenSettings={onOpenSettings}
                    />
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
          {isLoading ? (
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
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPrev || isLoading}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {isLoading ? (
              <div className="h-4 w-24 gradient-shimmer rounded" />
            ) : (
              `Page ${formatNumber(
                pagination.page
              )} of ${formatNumber(pagination.totalPages)}`
            )}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={!pagination.hasNext || isLoading}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default ChildPanelsTable;

