import React, { useState, useEffect } from 'react';

interface MarkPartialModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | number;
  onSuccess?: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

const MarkPartialModal: React.FC<MarkPartialModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSuccess,
  showToast,
}) => {
  const [notGoingAmount, setNotGoingAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNotGoingAmount('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkPartial = async (orderId: string, notGoingAmount: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}/partial`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'partial',
          notGoingAmount: notGoingAmount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast?.('Order marked as partial', 'success');
        onSuccess?.();
        handleClose();
      } else {
        showToast?.(result.error || 'Failed to mark order as partial', 'error');
      }
    } catch (error) {
      console.error('Error marking order as partial:', error);
      showToast?.('Error marking order as partial', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = () => {
    if (!notGoingAmount.trim()) {
      showToast?.('Please enter a valid amount', 'error');
      return;
    }
    handleMarkPartial(orderId.toString(), notGoingAmount);
  };

  const handleClose = () => {
    onClose();
    setNotGoingAmount('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Mark as Partial
        </h3>
        <div className="mb-4">
          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
            Not going amount
          </label>
          <input
            type="number"
            value={notGoingAmount}
            onChange={(e) => setNotGoingAmount(e.target.value)}
            className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Enter not going amount"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkPartialModal;