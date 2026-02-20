'use client';

import React, { useState, useEffect } from 'react';

interface DeclineCancelRequestModalProps {
  isOpen: boolean;
  requestId: number;
  isLoading: boolean;
  onClose: () => void;
  onDecline: (requestId: number, reason: string) => void;
}

const DeclineCancelRequestModal: React.FC<DeclineCancelRequestModalProps> = ({
  isOpen,
  requestId,
  isLoading,
  onClose,
  onDecline,
}) => {
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDeclineReason('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setDeclineReason('');
    onClose();
  };

  const handleDecline = () => {
    onDecline(requestId, declineReason);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Decline Cancel Request
        </h3>
        <div className="mb-4">
          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
            Reason for Decline
          </label>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            className="form-field w-full min-h-[120px] resize-y px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            placeholder="Explain why this cancel request is being declined..."
            rows={4}
            required
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
            onClick={handleDecline}
            className="btn btn-primary"
            disabled={!declineReason.trim() || isLoading}
          >
            {isLoading ? 'Processing...' : 'Decline Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeclineCancelRequestModal;

