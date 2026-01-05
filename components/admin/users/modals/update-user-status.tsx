'use client';

import React from 'react';

interface UpdateUserStatusModalProps {
  isOpen: boolean;
  currentStatus: string;
  newStatus: string;
  onStatusChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  suspensionDuration?: string;
  onSuspensionDurationChange?: (value: string) => void;
}

const UpdateUserStatusModal: React.FC<UpdateUserStatusModalProps> = ({
  isOpen,
  currentStatus,
  newStatus,
  onStatusChange,
  onClose,
  onConfirm,
  isLoading,
  suspensionDuration,
  onSuspensionDurationChange,
}) => {
  if (!isOpen) return null;

  const suspensionOptions = [
    { value: '24 hours', label: '24 hours' },
    { value: '48 hours', label: '48 hours' },
    { value: '72 hours', label: '72 hours' },
    { value: '7 days', label: '7 days' },
    { value: '30 days', label: '30 days' },
    { value: '3 months', label: '3 months' },
    { value: '6 months', label: '6 months' },
    { value: '1 year', label: '1 year' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Update User Status</h3>
        <div className="mb-4">
          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Select New Status</label>
          <select
            value={newStatus || ''}
            onChange={(e) => onStatusChange(e.target.value)}
            className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
            disabled={isLoading}
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        {(newStatus === 'suspended' || (currentStatus === 'suspended' && newStatus === currentStatus)) && (
          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
              Suspension Duration
              {currentStatus === 'suspended' && newStatus === currentStatus && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Current Duration)</span>
              )}
            </label>
            <select
              value={suspensionDuration || ''}
              onChange={(e) => onSuspensionDurationChange?.(e.target.value)}
              className={`form-field w-full pl-4 pr-10 py-3 border rounded-lg focus:outline-none shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none ${
                currentStatus === 'suspended' && newStatus === currentStatus
                  ? 'bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent cursor-pointer'
              }`}
              disabled={isLoading || (currentStatus === 'suspended' && newStatus === currentStatus)}
            >
              <option value="">
                {currentStatus === 'suspended' && newStatus === currentStatus
                  ? (suspensionDuration ? suspensionOptions.find(opt => opt.value === suspensionDuration)?.label || 'Unknown Duration' : 'No Duration Set')
                  : 'Select duration...'
                }
              </option>
              {!(currentStatus === 'suspended' && newStatus === currentStatus) && suspensionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary"
            disabled={isLoading || (newStatus === 'suspended' && !suspensionDuration)}
          >
            {isLoading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateUserStatusModal;

