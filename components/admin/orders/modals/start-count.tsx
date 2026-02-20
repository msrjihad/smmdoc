import React, { useState, useEffect } from 'react';

interface StartCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | number;
  currentCount: number;
  onSuccess?: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

const StartCountModal: React.FC<StartCountModalProps> = ({
  isOpen,
  onClose,
  orderId,
  currentCount,
  onSuccess,
  showToast,
}) => {
  const [newStartCount, setNewStartCount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewStartCount(currentCount.toString());
    }
  }, [isOpen, currentCount]);

  if (!isOpen) return null;

  const handleEditStartCount = async (orderId: string, startCount: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}/start-count`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startCount: startCount }),
      });

      const result = await response.json();

      if (result.success) {
        showToast?.('Start count updated successfully', 'success');
        onSuccess?.();
        handleClose();
      } else {
        showToast?.(result.error || 'Failed to update start count', 'error');
      }
    } catch (error) {
      console.error('Error updating start count:', error);
      showToast?.('Error updating start count', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = () => {
    if (!newStartCount.trim()) {
      showToast?.('Please enter a valid start count', 'error');
      return;
    }
    handleEditStartCount(orderId.toString(), parseInt(newStartCount) || 0);
  };

  const handleClose = () => {
    onClose();
    setNewStartCount('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Edit Start Count
        </h3>
        <div className="mb-4">
          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
            New Start Count
          </label>
          <input
            type="number"
            value={newStartCount}
            onChange={(e) => setNewStartCount(e.target.value)}
            className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Enter new start count"
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

export default StartCountModal;