'use client';

import React, { useState, useEffect } from 'react';

interface ChangeAffiliateStatusModalProps {
  isOpen: boolean;
  affiliateId: number;
  currentStatus: string;
  onClose: () => void;
  onConfirm: (affiliateId: number, status: string, reason: string) => void;
}

const ChangeAffiliateStatusModal: React.FC<ChangeAffiliateStatusModalProps> = ({
  isOpen,
  affiliateId,
  currentStatus,
  onClose,
  onConfirm,
}) => {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [statusReason, setStatusReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewStatus(currentStatus);
      setStatusReason('');
    }
  }, [isOpen, currentStatus]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(affiliateId, newStatus, statusReason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Change Affiliate Status
        </h3>
        <div className="mb-4">
          <label className="form-label mb-2">New Status</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="form-label mb-2">
            Reason for Change
          </label>
          <textarea
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            className="form-field w-full min-h-[120px] resize-y px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            placeholder="Explain the reason for status change..."
            rows={4}
            required
          />
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
            disabled={!statusReason.trim() || newStatus === currentStatus}
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeAffiliateStatusModal;

