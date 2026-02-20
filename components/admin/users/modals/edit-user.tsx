'use client';

import React from 'react';
import { FaSync } from 'react-icons/fa';

interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  balance: number;
  total_spent: number;
  totalOrders: number;
  servicesDiscount: number;
  status: 'active' | 'suspended' | 'banned';
  currency: string;
  dollarRate?: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  emailVerified: string | null;
  role: 'user' | 'admin' | 'moderator';
  suspendedUntil?: string;
}

interface EditUserFormData {
  username: string;
  name: string;
  email: string;
  balance: string;
  emailVerified: boolean | null;
  password: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  currentUser: User | null;
  formData: EditUserFormData;
  onFormDataChange: (
    field: keyof EditUserFormData,
    value: string | number | boolean
  ) => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  onGeneratePassword: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  currentUser,
  formData,
  onFormDataChange,
  onClose,
  onConfirm,
  isLoading,
  onGeneratePassword,
}) => {
  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Edit User</h3>

        <div className="space-y-4">
          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Username</label>
            <input
              type="text"
              value={formData.username || ''}
              onChange={(e) => onFormDataChange('username', e.target.value)}
              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              placeholder="Enter username"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Full Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => onFormDataChange('name', e.target.value)}
              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              placeholder="Enter full name"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">User Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => onFormDataChange('email', e.target.value)}
              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              placeholder="Enter email address"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Balance Amount (in USD)</label>
            <input
              type="number"
              step="0.01"
              value={formData.balance || ''}
              onChange={(e) => onFormDataChange('balance', e.target.value)}
              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="Enter balance amount"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label
              className={`flex items-center gap-3 ${
                currentUser.emailVerified ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={Boolean(formData.emailVerified)}
                onChange={(e) =>
                  onFormDataChange('emailVerified', e.target.checked)
                }
                className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                  currentUser.emailVerified
                    ? 'opacity-75 cursor-not-allowed'
                    : ''
                }`}
                disabled={isLoading || Boolean(currentUser.emailVerified)}
                readOnly={Boolean(currentUser.emailVerified)}
              />
              <span className="form-label text-gray-700 dark:text-gray-300">
                Email Confirmed
                {currentUser.emailVerified && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">
                    (Already Verified)
                  </span>
                )}
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
              {currentUser.emailVerified
                ? 'This user has already verified their email address'
                : "Check this if the user's email is verified"}
            </p>
          </div>
          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative">
              <input
                type="text"
                value={formData.password || ''}
                onChange={(e) => onFormDataChange('password', e.target.value)}
                className="form-field w-full px-4 py-3 pr-12 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                placeholder="Leave blank to keep current password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={onGeneratePassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                title="Generate random password"
                disabled={isLoading}
              >
                <FaSync className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
              Leave blank to keep current password, or click the refresh icon to
              generate a new one
            </p>
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

export default EditUserModal;

