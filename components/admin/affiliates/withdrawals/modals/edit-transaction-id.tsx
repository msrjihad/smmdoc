'use client';

import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';

interface Withdrawal {
  id: number;
  affiliate: {
    id: number;
    user: {
      id: number;
      email: string;
      name: string;
      username?: string;
    };
  };
  withdrawalId: string;
  amount: number;
  status: 'Success' | 'Pending' | 'Cancelled';
  method: string;
  payment_method?: string;
  createdAt: string;
  processedAt?: string;
  notes?: string;
  transactionIdEdited?: boolean;
}

interface EditTransactionIdModalProps {
  isOpen: boolean;
  withdrawal: Withdrawal | null;
  transactionId: string;
  onTransactionIdChange: (transactionId: string) => void;
  onClose: () => void;
  onConfirm: (withdrawalId: number, transactionId: string) => void;
  isLoading: boolean;
}

const EditTransactionIdModal: React.FC<EditTransactionIdModalProps> = ({
  isOpen,
  withdrawal,
  transactionId,
  onTransactionIdChange,
  onClose,
  onConfirm,
  isLoading,
}) => {
  if (!isOpen || !withdrawal) return null;

  const handleConfirm = () => {
    if (!transactionId || !transactionId.trim()) {
      return;
    }
    onConfirm(withdrawal.id, transactionId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4">
        <h3 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-400">
          Edit Transaction ID
        </h3>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
            You can edit this transaction ID only once. After saving, it cannot be changed again.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2 mb-4 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-400">
                User:
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {withdrawal.affiliate.user?.username ||
                  withdrawal.affiliate.user?.email ||
                  'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Amount:
              </span>
              <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                <PriceDisplay
                  amount={withdrawal.amount}
                  originalCurrency="USD"
                />
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Transaction ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => onTransactionIdChange(e.target.value)}
              placeholder="Enter transaction ID"
              required
              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse md:flex-row gap-3 justify-center md:justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary w-full md:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !transactionId.trim()}
            className="btn btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
          >
            {isLoading ? (
              <>Updating...</>
            ) : (
              <>
                <FaCheckCircle className="h-4 w-4" />
                Update Transaction ID
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTransactionIdModal;

