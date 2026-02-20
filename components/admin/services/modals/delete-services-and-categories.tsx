'use client';
import React from 'react';
import { FaExclamationTriangle, FaTimes, FaTrash } from 'react-icons/fa';

interface DeleteServicesAndCategoriesModalProps {
  onClose: () => void;
  onConfirm: () => void;
  selectedServiceCount: number;
  selectedCategoryCount: number;
  isOpen?: boolean;
  isClosing?: boolean;
}

export const DeleteServicesAndCategoriesModal: React.FC<DeleteServicesAndCategoriesModalProps> = ({
  onClose,
  onConfirm,
  selectedServiceCount,
  selectedCategoryCount,
  isOpen,
  isClosing,
}) => {
  const modalContent = (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between p-6">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Confirm Deletion
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Close"
        >
          <FaTimes className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 pb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <FaExclamationTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">
                Delete {selectedServiceCount} Service{selectedServiceCount !== 1 ? 's' : ''} and {selectedCategoryCount} Categor{selectedCategoryCount !== 1 ? 'ies' : 'y'}?
              </p>
              <p className="text-sm text-red-600 mt-1">
                This action cannot be undone. All selected services and categories will be
                permanently removed.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="btn btn-secondary px-6 py-2">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-6 py-2"
            >
              <FaTrash className="h-4 w-4" />
              Delete All
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isOpen !== undefined) {
    return (
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
          isClosing
            ? 'modal-backdrop-exit'
            : 'modal-backdrop-enter'
        }`}
        onClick={onClose}
      >
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto mx-4 ${
            isClosing
              ? 'modal-content-exit'
              : 'modal-content-enter'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {modalContent}
        </div>
      </div>
    );
  }

  return modalContent;
};
