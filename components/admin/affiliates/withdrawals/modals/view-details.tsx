'use client';

import React from 'react';
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

interface ViewDetailsModalProps {
  isOpen: boolean;
  withdrawal: Withdrawal | null;
  formatID: (id: any) => string;
  formatDateTime: (dateString: string | Date) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  onClose: () => void;
}

const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({
  isOpen,
  withdrawal,
  formatID,
  formatDateTime,
  getStatusBadge,
  onClose,
}) => {
  if (!isOpen || !withdrawal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Withdrawal Details
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Transaction ID
              </label>
              <div className="font-mono text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                {withdrawal.withdrawalId || '-'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Internal ID
              </label>
              <div className="font-mono text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                {formatID(withdrawal.id)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                User
              </label>
              <div className="text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                {withdrawal.affiliate.user?.username ||
                  withdrawal.affiliate.user?.email ||
                  'N/A'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Method
              </label>
              <div className="text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                {withdrawal.payment_method || 'N/A'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount
              </label>
              <div className="text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded font-semibold text-gray-900 dark:text-gray-100">
                <PriceDisplay
                  amount={withdrawal.amount}
                  originalCurrency="USD"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(withdrawal.status)}
              </div>
            </div>
          </div>

          {withdrawal.notes && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </label>
              <div className="text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                {withdrawal.notes}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Created
              </label>
              <div className="text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                {formatDateTime(withdrawal.createdAt)}
              </div>
            </div>
            {withdrawal.processedAt && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Processed
                </label>
                <div className="text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-gray-900 dark:text-gray-100">
                  {formatDateTime(withdrawal.processedAt)}
                </div>
              </div>
            )}
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

export default ViewDetailsModal;

