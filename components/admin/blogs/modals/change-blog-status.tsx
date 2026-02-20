'use client';

import React, { useEffect, useState } from 'react';

interface ChangeBlogStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: string) => void;
  currentStatus: string;
}

const ChangeBlogStatusModal: React.FC<ChangeBlogStatusModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
}) => {
  const [newStatus, setNewStatus] = useState(currentStatus);

  useEffect(() => {
    if (isOpen) {
      setNewStatus(currentStatus);
    }
  }, [isOpen, currentStatus]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (newStatus !== currentStatus) {
      onConfirm(newStatus);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Change Blog Status
        </h3>
        <div className="mb-4">
          <label className="form-label mb-2 dark:text-gray-300">New Status</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
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
            onClick={handleConfirm}
            className="btn btn-primary"
            disabled={newStatus === currentStatus}
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeBlogStatusModal;

