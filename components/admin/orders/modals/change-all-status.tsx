import React from 'react';

interface ChangeAllStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrdersCount: number;
  bulkStatus: string;
  setBulkStatus: (status: string) => void;
  onUpdate: (status: string) => void;
}

const ChangeAllStatusModal: React.FC<ChangeAllStatusModalProps> = ({
  isOpen,
  onClose,
  selectedOrdersCount,
  bulkStatus,
  setBulkStatus,
  onUpdate,
}) => {
  if (!isOpen) return null;

  const handleUpdate = () => {
    onUpdate(bulkStatus);
  };

  const handleClose = () => {
    onClose();
    setBulkStatus('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Change All Orders Status
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          This will change the status of {selectedOrdersCount}{' '}
          selected order{selectedOrdersCount !== 1 ? 's' : ''}.
        </p>
        <div className="mb-4">
          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
            Select New Status
          </label>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="">Select status...</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancel & Refund</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={!bulkStatus}
            className="btn btn-primary"
          >
            Update All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeAllStatusModal;