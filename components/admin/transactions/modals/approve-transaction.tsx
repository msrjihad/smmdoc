'use client';

import React, { useState, useEffect } from 'react';
import { FaCheckCircle } from 'react-icons/fa';

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
  amount: number | string;
  currency: string;
  phone?: string;
  method?: string;
  gateway?: string;
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

interface ApproveTransactionModalProps {
  open: boolean;
  transaction: Transaction | null;
  transactionId: number;
  approveTransactionId: string;
  defaultTransactionId: string;
  onClose: () => void;
  onApprove: (transactionId: number, modifiedTransactionId: string) => Promise<void>;
  formatTransactionCurrency: (amount: number, currency: string) => string;
  displayMethod: (transaction: any) => string;
}

const ApproveTransactionModal: React.FC<ApproveTransactionModalProps> = ({
  open,
  transaction,
  transactionId,
  approveTransactionId,
  defaultTransactionId,
  onClose,
  onApprove,
  formatTransactionCurrency,
  displayMethod,
}) => {
  const [localTransactionId, setLocalTransactionId] = useState(approveTransactionId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && defaultTransactionId) {
      setLocalTransactionId(defaultTransactionId);
    }
  }, [open, defaultTransactionId]);

  if (!open || !transaction) {
    return null;
  }

  const handleApprove = async () => {
    if (!localTransactionId.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onApprove(transactionId, localTransactionId.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4">
        <h3 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-400">
          Approve Transaction
        </h3>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to approve this transaction? This will add funds to the user's account.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2 mb-4">
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
              <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                {formatTransactionCurrency(
                  (() => {
                    const amount = transaction.amount;
                    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (typeof amount === 'number' ? amount : 0);
                    return isNaN(numAmount) ? 0 : numAmount;
                  })(),
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
          </div>
          <div className="mb-4">
            <label className="form-label mb-2 dark:text-gray-300">
              Modify Transaction ID *
            </label>
            <input
              type="text"
              placeholder="Current transaction ID (editable)"
              value={localTransactionId}
              onChange={(e) => setLocalTransactionId(e.target.value)}
              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current transaction ID is shown above. You can edit it if needed. This ID will be assigned to the approved transaction.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse md:flex-row gap-3 justify-center md:justify-end">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-secondary w-full md:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={!localTransactionId.trim() || isSubmitting}
            className="btn btn-primary flex items-center gap-2 w-full md:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCheckCircle className="h-4 w-4" />
            {isSubmitting ? 'Approving...' : 'Approve Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveTransactionModal;

