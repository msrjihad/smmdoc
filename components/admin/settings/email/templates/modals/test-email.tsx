'use client';

import React from 'react';
import { FaEnvelope } from 'react-icons/fa';

interface TestEmailModalProps {
  isOpen: boolean;
  templateName: string;
  templateKey: string;
  defaultEmail?: string;
  onClose: () => void;
  onSend: (email: string) => Promise<void>;
  isLoading: boolean;
}

const TestEmailModal: React.FC<TestEmailModalProps> = ({
  isOpen,
  templateName,
  templateKey,
  defaultEmail = '',
  onClose,
  onSend,
  isLoading,
}) => {
  const [email, setEmail] = React.useState(defaultEmail);

  React.useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
    }
  }, [isOpen, defaultEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await onSend(email.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Send Test Email
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
              Email Template
            </label>
            <select
              value={templateKey}
              disabled
              className="form-field w-full pl-4 pr-10 py-3 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg focus:outline-none shadow-sm text-gray-700 dark:text-gray-300 transition-all duration-200 appearance-none cursor-not-allowed"
            >
              <option value={templateKey}>{templateName}</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter recipient email address"
              required
              disabled={isLoading}
              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2"
              disabled={isLoading}
            >
              {!isLoading && <FaEnvelope className="w-4 h-4" />}
              {isLoading ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestEmailModal;
