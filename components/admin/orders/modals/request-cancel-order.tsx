'use client';

import React, { useState } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { formatID } from '@/lib/utils';

interface RequestCancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderPrice: number;
  onConfirm: (orderId: number) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const RequestCancelOrderModal: React.FC<RequestCancelOrderModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderPrice,
  onConfirm,
  showToast
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm(orderId);
      onClose();
    } catch (error) {
      console.error('Error requesting cancel order:', error);
      showToast('Error requesting order cancellation', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-gray-100">
            Request Cancel Order #{formatID(orderId)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isLoading}
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 rounded">
            <FaExclamationTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-2">Important Notice:</p>
              <p>
                If the provider cancels this order, the user's balance for this order (${orderPrice.toFixed(2)}) will be automatically refunded to their account balance.
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to request cancellation of this order from the provider?
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Requesting...' : 'Request Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestCancelOrderModal;

