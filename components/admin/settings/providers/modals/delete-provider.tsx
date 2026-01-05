'use client';

import React, { useState } from 'react';
import { FaExclamationTriangle, FaTimes, FaTrash } from 'react-icons/fa';

interface Provider {
  id: number;
  name: string;
  status: 'active' | 'inactive' | 'trash';
  [key: string]: any;
}

interface DeleteProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider | null;
  onConfirm: (providerId: number, deleteType: 'trash' | 'permanent') => void;
  isLoading: boolean;
}

const DeleteProviderModal: React.FC<DeleteProviderModalProps> = ({
  isOpen,
  onClose,
  provider,
  onConfirm,
  isLoading,
}) => {
  const [selectedDeleteOption, setSelectedDeleteOption] = useState<'trash' | 'permanent'>('trash');

  if (!isOpen || !provider) return null;

  const handleConfirm = () => {
    const deleteType = provider.status === 'trash' ? 'permanent' : selectedDeleteOption;
    onConfirm(provider.id, deleteType);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {provider.status === 'trash' 
                ? `Permanently Delete "${provider.name}" Provider`
                : `Delete "${provider.name}" Provider`
              }
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Close"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <FaExclamationTriangle className="h-6 w-6 text-red-500 dark:text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    This provider may have associated services
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    Choose how to handle the provider and its services.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {provider.status === 'trash' 
                    ? 'This provider is currently in trash. This action will permanently delete it.'
                    : 'What would you like to do with this provider?'
                  }
                </p>

                {provider.status === 'trash' ? (
                  <div className="p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="font-medium text-red-800 dark:text-red-200">
                      Permanently Delete
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-300">
                      This will permanently remove the provider and all imported services. This action cannot be undone.
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <input
                        type="radio"
                        name="deleteOption"
                        value="trash"
                        checked={selectedDeleteOption === 'trash'}
                        onChange={(e) => setSelectedDeleteOption(e.target.value as 'trash' | 'permanent')}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                          Move to Trash
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          All imported services will be permanently deleted
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <input
                        type="radio"
                        name="deleteOption"
                        value="permanent"
                        checked={selectedDeleteOption === 'permanent'}
                        onChange={(e) => setSelectedDeleteOption(e.target.value as 'trash' | 'permanent')}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                          Permanently Delete
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Permanently remove the provider and all imported services
                        </div>
                      </div>
                    </label>
                  </>
                )}
              </div>
               <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                 <p className="text-sm text-red-800 dark:text-red-200">
                   <strong>Warning:</strong> The action will be scheduled until the completion of any orders/refill/cancel request operation.
                 </p>
               </div>
               <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                 <p className="text-sm text-blue-800 dark:text-blue-200">
                   <strong>Note:</strong> After being scheduled, users are not able to see the associated services of the scheduled deletion or trash of the provider.
                 </p>
               </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="btn btn-secondary px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`btn ${
                    isLoading 
                      ? 'bg-red-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white flex items-center gap-2 px-6 py-2`}
                >
                  <FaTrash className="h-4 w-4" />
                  {isLoading 
                    ? (() => {
                        const deleteType = provider.status === 'trash' 
                          ? 'permanent' 
                          : selectedDeleteOption;
                        return deleteType === 'trash' ? 'Updating...' : 'Deleting...';
                      })()
                    : (() => {
                        if (provider.status === 'trash') {
                          return 'Permanently Delete';
                        } else {
                          return selectedDeleteOption === 'trash' ? 'Move to Trash' : 'Permanently Delete';
                        }
                      })()
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteProviderModal;

