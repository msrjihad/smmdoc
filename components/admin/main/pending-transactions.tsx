'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import axiosInstance from '@/lib/axios-instance';
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
} from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';

const ApproveTransactionModal = dynamic(
  () => import('@/components/admin/transactions/modals/approve-transaction'),
  { ssr: false }
);

const CancelTransactionModal = dynamic(
  () => import('@/components/admin/transactions/modals/cancel-transaction'),
  { ssr: false }
);

interface PendingTransaction {
  id: number;
  invoice_id: number;
  userId: number;
  username?: string;
  amount: number;
  transaction_id?: string;
  status: string;
  admin_status: string;
  method?: string;
  payment_method?: string;
  currency?: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    name?: string;
    email?: string;
    username?: string;
  };
}

interface PendingTransactionsProps {
  pendingTransactions: PendingTransaction[];
  onTransactionUpdate: (transactionId: number) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'pending') => void;
  formatTransactionCurrency: (amount: number, currency: string) => string;
  displayMethod: (transaction: PendingTransaction) => string;
}

const formatID = (id: any) => id;

const PendingTransactions = React.memo(function PendingTransactions({
  pendingTransactions,
  onTransactionUpdate,
  showToast,
  formatTransactionCurrency,
  displayMethod,
}: PendingTransactionsProps) {
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    transaction: PendingTransaction | null;
    transactionId: number;
  }>({
    open: false,
    transaction: null,
    transactionId: 0,
  });

  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    transaction: PendingTransaction | null;
    transactionId: number;
  }>({
    open: false,
    transaction: null,
    transactionId: 0,
  });

  const [approveTransactionId, setApproveTransactionId] = useState('');
  const [defaultTransactionId, setDefaultTransactionId] = useState('');

  const handleApproveClick = useCallback((transaction: PendingTransaction) => {
    let defaultId = transaction.transaction_id?.toString() || '';
    
    if (!defaultId) {
      const timestamp = new Date().getTime();
      defaultId = `DEP-${transaction.id}-${timestamp.toString().slice(-6)}`;
    }

    setDefaultTransactionId(defaultId);
    setApproveTransactionId(defaultId);
    setApproveDialog({
      open: true,
      transaction,
      transactionId: transaction.id,
    });
  }, []);

  const handleCancelClick = useCallback((transaction: PendingTransaction) => {
    setCancelDialog({
      open: true,
      transaction,
      transactionId: transaction.id,
    });
  }, []);

  const confirmApprove = useCallback(async (transactionId: number, modifiedTransactionId: string) => {
    try {
      const response = await fetch(
        `/api/admin/funds/${transactionId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            modifiedTransactionId: modifiedTransactionId.trim(),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        onTransactionUpdate(transactionId);
        showToast('Transaction approved successfully!', 'success');
        setApproveDialog({
          open: false,
          transaction: null,
          transactionId: 0,
        });
        setApproveTransactionId('');
      } else {
        showToast(result.error || 'Failed to approve transaction', 'error');
      }
    } catch (error) {
      console.error('Error approving transaction:', error);
      showToast('Error approving transaction', 'error');
    }
  }, [onTransactionUpdate, showToast]);

  const confirmCancel = useCallback(async (transactionId: number) => {
    try {
      const response = await fetch(`/api/admin/funds/${transactionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        onTransactionUpdate(transactionId);
        showToast('Transaction cancelled successfully!', 'success');
        setCancelDialog({
          open: false,
          transaction: null,
          transactionId: 0,
        });
      } else {
        showToast(result.error || 'Failed to cancel transaction', 'error');
      }
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      showToast('Error cancelling transaction', 'error');
    }
  }, [onTransactionUpdate, showToast]);

  if (pendingTransactions.length === 0) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success':
      case 'completed':
      case 'approved':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
            <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-300">Success</span>
          </div>
        );
      case 'Pending':
      case 'pending':
      case 'Processing':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-fit">
            <FaClock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Pending</span>
          </div>
        );
      case 'Cancelled':
      case 'cancelled':
      case 'rejected':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full w-fit">
            <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
            <span className="text-xs font-medium text-red-700 dark:text-red-300">Cancel</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-fit">
            <FaClock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Pending</span>
          </div>
        );
    }
  };

  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm min-w-[1200px]">
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
                Transaction ID
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Amount
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Phone
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Payment Method
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Date
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
            {pendingTransactions.map((transaction) => (
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
                  <div
                    className="font-medium text-sm text-gray-900 dark:text-gray-100"
                  >
                    {transaction.user?.username ||
                      transaction.user?.email?.split('@')[0] ||
                      transaction.user?.name ||
                      transaction.username ||
                      'null'}
                  </div>
                </td>
                <td className="p-3">
                  {transaction.transaction_id ? (
                    <div className="text-xs px-2 py-1 rounded">
                      {transaction.transaction_id}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Not assigned
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <PriceDisplay
                    amount={transaction.amount}
                    originalCurrency={transaction.currency === 'USD' || transaction.currency === 'USDT' ? 'USD' : 'BDT'}
                    className="font-semibold text-sm"
                  />
                </td>
                <td className="p-3">
                  <span
                    className="text-sm text-gray-900 dark:text-gray-100"
                  >
                    {'N/A'}
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
                        ? new Date(
                            transaction.createdAt
                          ).toLocaleDateString()
                        : 'null'}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {transaction.createdAt
                        ? new Date(
                            transaction.createdAt
                          ).toLocaleTimeString()
                        : 'null'}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  {getStatusBadge(
                    transaction.admin_status || transaction.status
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveClick(transaction)}
                      className="btn btn-primary flex items-center gap-1 px-3 py-1.5 text-xs bg-green-500 text-white border border-green-500 hover:bg-green-600"
                      title="Approve"
                    >
                      <FaCheckCircle className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleCancelClick(transaction)}
                      className="btn btn-secondary flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500 text-white border border-red-500 hover:bg-red-600"
                      title="Cancel"
                    >
                      <FaTimesCircle className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden">
        <div className="space-y-4" style={{ padding: '24px 0 0 0' }}>
          {pendingTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="card card-padding border-l-4 border-yellow-500 dark:border-yellow-400 mb-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    {transaction.id
                      ? formatID(transaction.id.toString().slice(-8))
                      : 'null'}
                  </div>
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {transaction.user?.username ||
                      transaction.user?.email?.split('@')[0] ||
                      transaction.user?.name ||
                      transaction.username ||
                      'null'}
                  </div>
                </div>
                {getStatusBadge(
                  transaction.admin_status || transaction.status
                )}
              </div>

              <div className="mb-4 pb-4 border-b dark:border-gray-700">
                <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                  Transaction ID
                </div>
                <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {transaction.transaction_id || 'Not assigned'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                    Amount
                  </div>
                  <div className="font-semibold text-sm">
                    <PriceDisplay
                      amount={transaction.amount}
                      originalCurrency={transaction.currency === 'USD' || transaction.currency === 'USDT' ? 'USD' : 'BDT'}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                    Phone
                  </div>
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {'N/A'}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                  Payment Method
                </div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {displayMethod(transaction)}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Date:{' '}
                  {transaction.createdAt
                    ? new Date(transaction.createdAt).toLocaleDateString()
                    : 'null'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Time:{' '}
                  {transaction.createdAt
                    ? new Date(transaction.createdAt).toLocaleTimeString()
                    : 'null'}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveClick(transaction)}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <FaCheckCircle className="h-3 w-3" />
                  Approve
                </button>
                <button
                  onClick={() => handleCancelClick(transaction)}
                  className="btn btn-secondary flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white border-red-500"
                >
                  <FaTimesCircle className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ApproveTransactionModal
        open={approveDialog.open}
        transaction={approveDialog.transaction as any}
        transactionId={approveDialog.transactionId}
        approveTransactionId={approveTransactionId}
        defaultTransactionId={defaultTransactionId}
        onClose={() => {
          setApproveDialog({
            open: false,
            transaction: null,
            transactionId: 0,
          });
          setApproveTransactionId('');
        }}
        onApprove={confirmApprove}
        formatTransactionCurrency={formatTransactionCurrency}
        displayMethod={displayMethod as any}
      />
      <CancelTransactionModal
        open={cancelDialog.open}
        transaction={cancelDialog.transaction as any}
        transactionId={cancelDialog.transactionId}
        onClose={() => {
          setCancelDialog({
            open: false,
            transaction: null,
            transactionId: 0,
          });
        }}
        onCancel={confirmCancel}
        formatTransactionCurrency={formatTransactionCurrency}
        displayMethod={displayMethod as any}
      />
    </>
  );
});

export default PendingTransactions;