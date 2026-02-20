'use client';

import React from 'react';

interface EditServicesDiscountModalProps {
  isOpen: boolean;
  currentDiscount: number;
  newDiscount: string;
  onDiscountChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const EditServicesDiscountModal: React.FC<EditServicesDiscountModalProps> = ({
  isOpen,
  currentDiscount,
  newDiscount,
  onDiscountChange,
  onClose,
  onConfirm,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Edit Services Discount</h3>
        <div className="mb-4">
          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Discount Percentage</label>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={newDiscount || ''}
            onChange={(e) => onDiscountChange(e.target.value)}
            className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Enter discount percentage (0-100)"
            disabled={isLoading}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter a value between 0 and 100 (percentage)
          </div>
        </div>
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
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditServicesDiscountModal;

