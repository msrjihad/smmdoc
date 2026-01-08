'use client';

import React from 'react';
import { FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';

interface Transaction {
  id: number;
  user: {
    id: number;
    email: string;
    name: string;
    username?: string;
  };
  transactionId: number | string;
  amount: number | string;
  currency: string;
  phone?: string;
  method?: string;
  gateway?: string;
  payment_method?: string;
  paymentGateway?: string;
  paymentMethod?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'Processing' | 'Success' | 'Cancelled';
  admin_status: 'Pending' | 'pending' | 'Success' | 'Cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

interface TransactionDetailsModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  formatID: (id: any) => any;
  displayMethod: (transaction: Transaction) => string;
  formatDateTime: (dateString: string | Date) => string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Pending':
    case 'pending':
    case 'Processing':
      return <FaClock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />;
    case 'Success':
    case 'completed':
    case 'approved':
      return <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />;
    case 'Cancelled':
    case 'cancelled':
    case 'rejected':
      return <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />;
    default:
      return <FaClock className="h-3 w-3 text-gray-500 dark:text-gray-400" />;
  }
};

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  isOpen,
  transaction,
  onClose,
  formatID,
  displayMethod,
  formatDateTime,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] max-w-[90vw] mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Transaction Details
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Transaction ID
              </label>
              <div className="font-mono text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-900 dark:text-gray-100">
                {transaction.transactionId || 'Not assigned'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Internal ID
              </label>
              <div className="font-mono text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-900 dark:text-gray-100">
                {formatID(transaction.id)}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              User
            </label>
            <div className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-900 dark:text-gray-100">
              {transaction.user?.username ||
                transaction.user?.email ||
                'N/A'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount
              </label>
              <div className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded font-semibold text-gray-900 dark:text-gray-100">
                <PriceDisplay
                  amount={(() => {
                    const amount = transaction.amount;
                    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (typeof amount === 'number' ? amount : 0);
                    return isNaN(numAmount) ? 0 : numAmount;
                  })()}
                  originalCurrency={transaction.currency === 'USD' || transaction.currency === 'USDT' ? 'USD' : (transaction.currency === 'BDT' ? 'BDT' : 'USD')}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment Method
              </label>
              <div className="text-xs font-medium p-2 text-gray-700 dark:text-gray-300">
                {displayMethod(transaction)}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(
                transaction.admin_status || transaction.status || 'pending'
              )}
              <span className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                {transaction.admin_status || transaction.status}
              </span>
            </div>
          </div>

          {transaction.notes && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </label>
              <div className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-900 dark:text-gray-100">
                {transaction.notes}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Created
              </label>
              <div className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-900 dark:text-gray-100">
                {formatDateTime(transaction.createdAt)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Updated
              </label>
              <div className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-900 dark:text-gray-100">
                {formatDateTime(transaction.updatedAt || transaction.createdAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;

