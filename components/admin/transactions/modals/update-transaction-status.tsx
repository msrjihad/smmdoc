'use client';

import React, { useEffect, useState } from 'react';

interface UpdateTransactionStatusModalProps {
  isOpen: boolean;
  transactionId: number;
  currentStatus: string;
  onClose: () => void;
  onUpdate: (transactionId: number, newStatus: string) => void;
}

const UpdateTransactionStatusModal: React.FC<UpdateTransactionStatusModalProps> = ({
  isOpen,
  transactionId,
  currentStatus,
  onClose,
  onUpdate,
}) => {
  const [newStatus, setNewStatus] = useState(currentStatus);

  useEffect(() => {
    if (isOpen) {
      setNewStatus(currentStatus);
    }
  }, [isOpen, currentStatus]);

  const handleUpdate = () => {
    onUpdate(transactionId, newStatus);
    onClose();
  };

  if (!isOpen) return null;

  const isSuccess = 
    currentStatus === 'Success' || 
    currentStatus === 'success' ||
    currentStatus === 'completed' || 
    currentStatus === 'Completed' ||
    currentStatus === 'approved' ||
    currentStatus === 'Approved';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Update Transaction Status
        </h3>
        <div className="mb-4">
          <label className="form-label mb-2 dark:text-gray-300">
            Select New Status
          </label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
          >
            {isSuccess ? (
              <option value="Cancelled">Cancelled</option>
            ) : (
              <>
                <option value="Pending">Pending</option>
                <option value="Success">Success</option>
                <option value="Cancelled">Cancelled</option>
              </>
            )}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="btn btn-primary"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateTransactionStatusModal;

