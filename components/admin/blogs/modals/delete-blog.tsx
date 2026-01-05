'use client';

import React from 'react';

interface DeleteBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  blogTitle: string;
  isLoading: boolean;
}

const DeleteBlogModal: React.FC<DeleteBlogModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  blogTitle,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">
          Delete Blog
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Are you sure you want to delete "{blogTitle}"? This action cannot be undone.
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
            className={`btn text-white ${
              isLoading 
                ? 'bg-red-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isLoading ? 'Deleting...' : 'Delete Blog'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteBlogModal;

