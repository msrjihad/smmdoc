'use client';

import React from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';
import MoreActionMenu from '@/components/admin/users/more-action-menu';

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

interface UsersTableProps {
  users: User[];
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  onViewUser: (userId: number) => void;
  onEditUser: (userId: number) => void;
  onEditBalance: (userId: number) => void;
  onEditDiscount: (userId: number, currentDiscount: number) => void;
  onChangeRole: (userId: number, currentRole: string) => void;
  onSetNewApiKey: (userId: number) => Promise<boolean>;
  onUpdateStatus: (userId: number, currentStatus: string) => void;
  onDelete: (userId: number) => void;
  actionLoading: string | null;
  isModerator?: boolean;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  formatDate,
  formatTime,
  onViewUser,
  onEditUser,
  onEditBalance,
  onEditDiscount,
  onChangeRole,
  onSetNewApiKey,
  onUpdateStatus,
  onDelete,
  actionLoading,
  isModerator = false,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[1200px]">
        <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
          <tr>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              ID
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Username
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Email
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Status
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Balance
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Spent
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Orders
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Services Discount
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Registered Date
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className={`border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200 ${
                !user.emailVerified ? 'border-l-4 border-l-yellow-400 dark:border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-900/20' : ''
              }`}
            >
              <td className="p-3">
                <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                  {user.id || 'N/A'}
                </div>
              </td>
              <td className="p-3">
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {user.username || 'null'}
                </div>
              </td>
              <td className="p-3">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {user.email || 'null'}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {user.emailVerified ? (
                    <>
                      <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Verified
                      </span>
                    </>
                  ) : (
                    <>
                      <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
                      <span className="text-xs text-red-600 dark:text-red-400">
                        Unverified
                      </span>
                    </>
                  )}
                </div>
              </td>
              <td className="p-3">
                <div className="flex items-center justify-start">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                      !user.emailVerified
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : user.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : user.status === 'suspended'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : user.status === 'banned'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}
                  >
                    {!user.emailVerified ? 'pending' : (user.status || 'active')}
                  </span>
                </div>
              </td>
              <td className="p-3">
                <div className="text-left">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    <PriceDisplay
                      amount={user.balance || 0}
                      originalCurrency="USD"
                      className="font-semibold text-sm text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </td>
              <td className="p-3">
                <div className="text-left">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    <PriceDisplay
                      amount={user.total_spent || 0}
                      originalCurrency="USD"
                      className="font-semibold text-sm text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </td>
              <td className="p-3">
                <div className="text-center">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {(user.totalOrders || 0).toLocaleString()}
                  </div>
                </div>
              </td>
              <td className="p-3">
                <div className="text-center">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {user.servicesDiscount || 0}%
                  </div>
                </div>
              </td>
              <td className="p-3">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {user.createdAt
                      ? formatDate(user.createdAt)
                      : 'null'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {user.createdAt
                      ? formatTime(user.createdAt)
                      : 'null'}
                  </div>
                </div>
              </td>
              <td className="p-3">
                <MoreActionMenu
                  user={user}
                  onView={onViewUser}
                  onEditUser={onEditUser}
                  onEditBalance={onEditBalance}
                  onEditDiscount={onEditDiscount}
                  onChangeRole={onChangeRole}
                  onSetNewApiKey={onSetNewApiKey}
                  onUpdateStatus={onUpdateStatus}
                  onDelete={onDelete}
                  isLoading={actionLoading === user.id.toString()}
                  isModerator={isModerator}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;

