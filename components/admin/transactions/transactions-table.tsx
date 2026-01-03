'use client';

import React from 'react';
import {
  FaCheckCircle,
  FaClock,
  FaEllipsisH,
  FaExclamationCircle,
  FaEye,
  FaSync,
  FaTimesCircle,
} from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';

interface Transaction {
  id: number;
  user?: {
    id?: number;
    email?: string;
    name?: string;
    username?: string;
  };
  transactionId?: number | string;
  amount: number;
  bdt_amount?: number;
  currency: string;
  phone?: string;
  sender_number?: string;
  method?: string;
  payment_method?: string;
  paymentGateway?: string;
  paymentMethod?: string;
  status?: 'pending' | 'completed' | 'cancelled' | 'Processing' | 'Success' | 'Cancelled' | string;
  admin_status?: 'Pending' | 'pending' | 'Success' | 'Cancelled' | string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  processedAt?: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  formatID: (id: any) => any;
  displayMethod: (transaction: any) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  handleApprove: (transactionId: string) => void;
  handleCancel: (transactionId: string) => void;
  openViewDetailsDialog: (transaction: any) => void;
  openUpdateStatusDialog: (transactionId: number, currentStatus: string) => void;
  formatTime: (dateString: string | Date) => string;
  formatDate?: (dateString: string | Date) => string;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  formatID,
  displayMethod,
  getStatusBadge,
  handleApprove,
  handleCancel,
  openViewDetailsDialog,
  openUpdateStatusDialog,
  formatTime,
  formatDate,
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
              User
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Transaction ID
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Amount
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Phone
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Payment Method
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Date
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Status
            </th>
            <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr
              key={transaction.id}
              className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
            >
              <td className="p-3">
                <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                  {transaction.id
                    ? formatID(transaction.id.toString().slice(-8))
                    : 'null'}
                </div>
              </td>
              <td className="p-3">
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {transaction.user?.username ||
                    transaction.user?.email?.split('@')[0] ||
                    transaction.user?.name ||
                    'null'}
                </div>
              </td>
              <td className="p-3">
                {transaction.transactionId ? (
                  <div
                    className={`text-xs px-2 py-1 rounded ${
                      transaction.transactionId === 'Deducted by Admin'
                        ? 'font-mono bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : transaction.transactionId === 'Added by Admin'
                        ? 'font-mono bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : ''
                    }`}
                  >
                    {transaction.transactionId === 'Added by Admin' ||
                    transaction.transactionId === 'Deducted by Admin'
                      ? transaction.notes || transaction.transactionId
                      : transaction.transactionId}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Not assigned
                  </span>
                )}
              </td>
              <td className="p-3">
                <PriceDisplay
                  amount={transaction.bdt_amount || transaction.amount}
                  originalCurrency={transaction.currency === 'USD' || transaction.currency === 'USDT' ? 'USD' : (transaction.currency === 'BDT' ? 'BDT' : 'USD')}
                  className="font-semibold text-sm"
                />
              </td>
              <td className="p-3">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {transaction.phone || transaction.sender_number || 'N/A'}
                </span>
              </td>
              <td className="p-3">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {displayMethod(transaction)}
                </div>
              </td>
              <td className="p-3">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {transaction.createdAt
                      ? (formatDate ? formatDate(transaction.createdAt) : new Date(transaction.createdAt).toLocaleDateString())
                      : 'null'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {transaction.createdAt
                      ? formatTime(transaction.createdAt)
                      : 'null'}
                  </div>
                </div>
              </td>
              <td className="p-3">
                {getStatusBadge(
                  transaction.admin_status || transaction.status || 'pending'
                )}
              </td>
              <td className="p-3">
                {(transaction.admin_status === 'Pending' || transaction.admin_status === 'pending') ||
                (transaction.status === 'pending' || transaction.status === 'Processing') ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(transaction.id.toString())}
                      className="btn btn-primary flex items-center gap-1 px-3 py-1.5 text-xs bg-green-500 text-white border border-green-500 hover:bg-green-600"
                      title="Approve"
                    >
                      <FaCheckCircle className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleCancel(transaction.id.toString())}
                      className="btn btn-secondary flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500 text-white border border-red-500 hover:bg-red-600"
                      title="Cancel"
                    >
                      <FaTimesCircle className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="relative">
                      <button
                        className="btn btn-secondary p-2"
                        title="More Actions"
                        onClick={(e) => {
                          e.stopPropagation();
                          const dropdown = e.currentTarget
                            .nextElementSibling as HTMLElement;
                          dropdown.classList.toggle('hidden');
                        }}
                      >
                        <FaEllipsisH className="h-3 w-3" />
                      </button>

                      <div className="hidden absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              openViewDetailsDialog(transaction);
                              const dropdown =
                                document.querySelector(
                                  '.absolute.right-0'
                                ) as HTMLElement;
                              dropdown?.classList.add('hidden');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                          >
                            <FaEye className="h-3 w-3" />
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              openUpdateStatusDialog(
                                transaction.id,
                                transaction.status || 'pending'
                              );
                              const dropdown =
                                document.querySelector(
                                  '.absolute.right-0'
                                ) as HTMLElement;
                              dropdown?.classList.add('hidden');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                          >
                            <FaSync className="h-3 w-3" />
                            Update Status
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;

