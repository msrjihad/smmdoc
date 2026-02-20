'use client';

import React, { useState, useEffect } from 'react';
import { FaTimesCircle } from 'react-icons/fa';
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

interface CancelWithdrawalsModalProps {
  isOpen: boolean;
  withdrawal: Withdrawal | null;
  cancelReason: string;
  onCancelReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: (withdrawalId: number, cancelReason: string) => void;
  isLoading: boolean;
}

const CancelWithdrawalsModal: React.FC<CancelWithdrawalsModalProps> = ({
  isOpen,
  withdrawal,
  cancelReason,
  onCancelReasonChange,
  onClose,
  onConfirm,
  isLoading,
}) => {
  if (!isOpen || !withdrawal) return null;

  const handleConfirm = () => {
    onConfirm(withdrawal.id, cancelReason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4">
        <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">
          Cancel Withdrawal
        </h3>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            Are you sure you want to cancel this withdrawal?
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-4">
            This action cannot be undone. The amount will be returned to the affiliate's available balance.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2 border border-gray-200 dark:border-gray-700">
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
              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                <PriceDisplay
                  amount={withdrawal.amount}
                  originalCurrency="USD"
                />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Method:
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {withdrawal.payment_method || '-'}
              </span>
            </div>
          </div>

          <div className="form-group mt-4">
            <label className="form-label">
              Reason for Cancellation <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => onCancelReasonChange(e.target.value)}
              placeholder="Enter reason for cancelling this withdrawal..."
              rows={3}
              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-vertical"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse md:flex-row gap-3 justify-center md:justify-end">
          <button
            onClick={onClose}
            className="btn btn-primary w-full md:w-auto"
          >
            Keep Withdrawal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="btn flex items-center gap-2 w-full md:w-auto justify-center bg-red-500 text-white border border-red-500 hover:bg-red-600 hover:border-red-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>Canceling...</>
            ) : (
              <>
                <FaTimesCircle className="h-4 w-4" />
                Cancel Withdrawal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelWithdrawalsModal;

