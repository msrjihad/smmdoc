'use client';

import React from 'react';
import {
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';

interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  balance: number;
  total_spent: number;
  totalOrders: number;
  servicesDiscount: number;
  specialPricing: boolean;
  status: 'active' | 'suspended' | 'banned';
  currency: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
  role: 'user' | 'admin' | 'moderator';
}

interface LatestUsersProps {
  latestUsers: User[];
  formatCurrency: (amount: number, currency: string) => string;
}

const LatestUsers = React.memo(function LatestUsers({
  latestUsers,
  formatCurrency,
}: LatestUsersProps) {
  if (latestUsers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
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
                Username
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Email
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Balance
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Registered Date
              </th>
            </tr>
          </thead>
          <tbody>
            {latestUsers.map((user) => (
              <tr
                key={user.id}
                className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
              >
                <td className="p-3">
                  <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    {user.id || 'N/A'}
                  </div>
                </td>
                <td className="p-3">
                  <div
                    className="font-medium text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {user.username || 'null'}
                  </div>
                </td>
                <td className="p-3">
                  <div
                    className="text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
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
                  <div className="text-left">
                    <div
                      className="font-semibold text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {formatCurrency(
                        user.balance || 0,
                        user.currency || 'USD'
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <div
                      className="text-xs"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {user.createdAt
                        ? new Date(
                            user.createdAt
                          ).toLocaleDateString()
                        : 'null'}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {user.createdAt
                        ? new Date(
                            user.createdAt
                          ).toLocaleTimeString()
                        : 'null'}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden">
        <div className="space-y-4">
          {latestUsers.map((user) => (
            <div
              key={user.id}
              className="card card-padding border-l-4 border-blue-500 dark:border-blue-400 mb-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    {user.id || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Username
                  </div>
                  <div
                    className="font-medium text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {user.username || 'null'}
                  </div>
                </div>

                <div>
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Email
                  </div>
                  <div
                    className="text-sm mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {user.email || 'null'}
                  </div>
                  <div className="flex items-center gap-1">
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
                </div>

                <div>
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Balance
                  </div>
                  <div
                    className="font-semibold text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {formatCurrency(
                      user.balance || 0,
                      user.currency || 'USD'
                    )}
                  </div>
                </div>

                <div>
                  <div
                    className="text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Registered:{' '}
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'null'}
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Time:{' '}
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleTimeString()
                      : 'null'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});

export default LatestUsers;