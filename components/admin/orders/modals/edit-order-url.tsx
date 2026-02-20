import React, { useState, useEffect } from 'react';

interface EditOrderUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | number;
  currentLink: string;
  onSuccess?: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

const EditOrderUrlModal: React.FC<EditOrderUrlModalProps> = ({
  isOpen,
  onClose,
  orderId,
  currentLink,
  onSuccess,
  showToast,
}) => {
  const [newLink, setNewLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewLink(currentLink || '');
    }
  }, [isOpen, currentLink]);

  if (!isOpen) return null;

  const handleUpdateLink = async (orderId: string, link: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}/link`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link: link }),
      });

      const result = await response.json();

      if (result.success) {
        showToast?.('Order link updated successfully', 'success');
        onSuccess?.();
        handleClose();
      } else {
        showToast?.(result.error || 'Failed to update order link', 'error');
      }
    } catch (error) {
      console.error('Error updating order link:', error);
      showToast?.('Error updating order link', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = () => {
    if (!newLink.trim()) {
      showToast?.('Please enter a valid order link', 'error');
      return;
    }
    handleUpdateLink(orderId.toString(), newLink.trim());
  };

  const handleClose = () => {
    onClose();
    setNewLink('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Edit Order URL
        </h3>
        <div className="mb-4">
          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
            Order Link
          </label>
          <input
            type="text"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            placeholder="Enter order link"
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

export default EditOrderUrlModal;

