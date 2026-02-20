import React, { useState, useEffect } from 'react';

interface UpdateOrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | number;
  currentStatus: string;
  isSelfService?: boolean;
  onSuccess?: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

const UpdateOrderStatusModal: React.FC<UpdateOrderStatusModalProps> = ({
  isOpen,
  onClose,
  orderId,
  currentStatus,
  isSelfService = false,
  onSuccess,
  showToast,
}) => {
  const [newStatus, setNewStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const normalizedStatus = currentStatus?.toLowerCase().trim();
      if (isSelfService && (normalizedStatus === 'in_progress' || normalizedStatus === 'inprogress')) {
        setNewStatus('completed');
      } else if (normalizedStatus === 'pending' || normalizedStatus === 'inprogress' || normalizedStatus === 'processing') {
        setNewStatus('completed');
      } else {
        setNewStatus(currentStatus);
      }
    }
  }, [isOpen, currentStatus, isSelfService]);

  if (!isOpen) return null;

  const normalizedStatus = currentStatus?.toLowerCase().trim();
  
  let availableStatuses: string[] = [];
  let showAllOptions = false;
  
  if (isSelfService && (normalizedStatus === 'in_progress' || normalizedStatus === 'inprogress')) {
    availableStatuses = ['cancelled', 'completed'];
    showAllOptions = false;
  } else if (normalizedStatus === 'partial') {
    availableStatuses = ['cancelled', 'completed'];
    showAllOptions = false;
  } else {
    const canCancel = ['pending', 'completed', 'processing', 'partial', 'fail', 'cancelled'].includes(normalizedStatus);
    const canComplete = ['pending', 'inprogress', 'in_progress', 'processing'].includes(normalizedStatus);
    const canInProgress = ['pending', 'processing'].includes(normalizedStatus);
    
    if (canCancel) {
      availableStatuses.push('cancelled');
    }
    if (canComplete) {
      availableStatuses.push('completed');
    }
    if (canInProgress) {
      availableStatuses.push('in_progress');
    }
    
    showAllOptions = availableStatuses.length === 0;
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setIsLoading(true);
      console.log('Updating order status:', { orderId, newStatus, orderIdType: typeof orderId });
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const result = await response.json();
      console.log('Response data:', result);

      if (result.success) {
        showToast?.(`Order status updated to ${newStatus}`, 'success');
        onSuccess?.();
        handleClose();
      } else {
        console.error('Update failed:', result);
        showToast?.(result.error || 'Failed to update order status', 'error');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast?.('Error updating order status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = () => {
    if (!newStatus.trim()) {
      showToast?.('Please select a valid status', 'error');
      return;
    }
    handleStatusUpdate(orderId.toString(), newStatus);
  };

  const handleClose = () => {
    onClose();
    setNewStatus('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Update Order Status
        </h3>
        <div className="mb-4">
          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
            Select New Status
          </label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
          >
            {showAllOptions ? (
              <>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancel & Refund</option>
              </>
            ) : (
              <>
                {availableStatuses.includes('cancelled') && (
                  <option value="cancelled">Cancel & Refund</option>
                )}
                {availableStatuses.includes('completed') && (
                  <option value="completed">Completed</option>
                )}
                {availableStatuses.includes('in_progress') && (
                  <option value="in_progress">In Progress</option>
                )}
              </>
            )}
          </select>
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

export default UpdateOrderStatusModal;