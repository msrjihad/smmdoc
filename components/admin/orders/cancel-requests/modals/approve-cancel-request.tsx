'use client';

import React, { useState, useEffect } from 'react';

interface ApproveCancelRequestModalProps {
  isOpen: boolean;
  requestId: string | number;
  refundAmount: number;
  isLoading: boolean;
  onClose: () => void;
  onApprove: (requestId: string | number, refundAmount: number, adminNotes: string) => void;
}

const ApproveCancelRequestModal: React.FC<ApproveCancelRequestModalProps> = ({
  isOpen,
  requestId,
  refundAmount,
  isLoading,
  onClose,
  onApprove,
}) => {
  const [newRefundAmount, setNewRefundAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewRefundAmount(refundAmount.toString());
      setAdminNotes('');
    }
  }, [isOpen, refundAmount]);

  const handleClose = () => {
    setNewRefundAmount('');
    setAdminNotes('');
    onClose();
  };

  const handleApprove = () => {
    onApprove(requestId, parseFloat(newRefundAmount) || 0, adminNotes);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Approve Cancel Request
        </h3>
        <div className="mb-4">
          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Refund Amount</label>
          <input
            type="number"
            value={newRefundAmount}
            onChange={(e) => setNewRefundAmount(e.target.value)}
            className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Enter refund amount"
            step="0.01"
            readOnly
          />
        </div>
        <div className="mb-4">
          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
            Admin Notes (Optional)
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="form-field w-full min-h-[120px] resize-y px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            placeholder="Add any notes about the approval..."
            rows={3}
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            className="btn btn-primary"
            disabled={isLoading || !newRefundAmount || parseFloat(newRefundAmount) <= 0}
          >
            {isLoading ? 'Processing...' : 'Approve & Process Refund'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveCancelRequestModal;

