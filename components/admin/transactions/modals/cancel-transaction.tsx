'use client';

import React, { useState } from 'react';
import { FaTimesCircle } from 'react-icons/fa';

interface Transaction {
  id: number;
  user?: {
    id?: number;
    email?: string;
    name?: string;
    username?: string;
  };
  transactionId?: number | string;
  transaction_id?: string;
  amount: number;
  bdt_amount?: number;
  currency: string;
  phone?: string;
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

interface CancelTransactionModalProps {
  open: boolean;
  transaction: Transaction | null;
  transactionId: number;
  onClose: () => void;
  onCancel: (transactionId: number) => Promise<void>;
  formatTransactionCurrency: (amount: number, currency: string) => string;
  displayMethod: (transaction: any) => string;
}

const CancelTransactionModal: React.FC<CancelTransactionModalProps> = ({
  open,
  transaction,
  transactionId,
  onClose,
  onCancel,
  formatTransactionCurrency,
  displayMethod,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !transaction) {
    return null;
  }

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      await onCancel(transactionId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4">
        <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">
          Cancel Transaction
        </h3>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            Are you sure you want to cancel this transaction?
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-4">
            This action cannot be undone and will notify the user.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-300">
                Transaction ID:
              </span>
              <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                {transaction.transactionId || transaction.transaction_id || 'Not assigned'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-300">
                User:
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {transaction.user?.username ||
                  transaction.user?.email ||
                  'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-300">
                Amount:
              </span>
              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {formatTransactionCurrency(
                  transaction.bdt_amount || transaction.amount,
                  transaction.currency
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-300">
                Payment Method:
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {displayMethod(transaction)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-300">
                Phone:
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {transaction.phone || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse md:flex-row gap-3 justify-center md:justify-end">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-secondary w-full md:w-auto"
          >
            Keep Transaction
          </button>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="btn btn-primary flex items-center gap-2 w-full md:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTimesCircle className="h-4 w-4" />
            {isSubmitting ? 'Cancelling...' : 'Cancel Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelTransactionModal;

