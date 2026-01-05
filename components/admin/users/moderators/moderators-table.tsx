'use client';

import React from 'react';
import {
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';
import MoreActionMenu from './more-action-menu';

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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (newPage: number) => void;
  isLoading: boolean;
}

interface ModeratorsTableProps {
  moderators: Moderator[];
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  onEdit: (moderatorId: number) => void;
  onChangeRole: (moderatorId: number, currentRole: string) => void;
  onDelete: (moderatorId: number) => void;
  actionLoading: string | null;
  pagination: PaginationInfo;
  onPageChange: (newPage: number) => void;
  moderatorsLoading: boolean;
}

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }: { size?: string; className?: string }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white"></div>
    </div>
  </div>
);

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

const ModeratorsTable: React.FC<ModeratorsTableProps> = ({
  moderators,
  formatDate,
  formatTime,
  onEdit,
  onChangeRole,
  onDelete,
  actionLoading,
  pagination,
  onPageChange,
  moderatorsLoading,
}) => {
  return (
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
                      <PriceDisplay
                        amount={moderator.balance || 0}
                        originalCurrency="USD"
                        className="font-semibold text-sm text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {moderator.createdAt ? formatDate(moderator.createdAt) : 'null'}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {moderator.createdAt ? formatTime(moderator.createdAt) : 'null'}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    {moderator.lastLoginAt ? (
                      <>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(moderator.lastLoginAt)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {formatTime(moderator.lastLoginAt)}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400">Never</div>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <MoreActionMenu
                    moderator={moderator}
                    onEdit={onEdit}
                    onChangeRole={onChangeRole}
                    onDelete={onDelete}
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
        onPageChange={onPageChange}
        isLoading={moderatorsLoading}
      />
    </>
  );
};

export default ModeratorsTable;

