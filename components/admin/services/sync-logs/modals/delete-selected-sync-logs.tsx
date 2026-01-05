'use client';

import React from 'react';

interface DeleteSelectedSyncLogsModalProps {
  isOpen: boolean;
  selectedCount: number;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteSelectedSyncLogsModal: React.FC<DeleteSelectedSyncLogsModalProps> = ({
  isOpen,
  selectedCount,
  isLoading,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Delete Selected Sync Logs
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Are you sure you want to delete {selectedCount} selected
          sync log{selectedCount !== 1 ? 's' : ''}? This action
          cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 shadow-sm text-white ${
              isLoading 
                ? 'bg-red-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isLoading ? (
              <>
                <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Deleting...
              </>
            ) : (
              `Delete ${selectedCount} Log${selectedCount !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSelectedSyncLogsModal;

