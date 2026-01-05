'use client';

import React, { useEffect, useState } from 'react';
import { FaDollarSign } from 'react-icons/fa';
import { useCurrency } from '@/contexts/currency-context';

interface AddDeductUserBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    username: string;
    amount: string;
    action: 'add' | 'deduct';
    notes: string;
  }) => Promise<void>;
  isLoading: boolean;
}

const AddDeductUserBalanceModal: React.FC<AddDeductUserBalanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const { currency, currentCurrencyData } = useCurrency();

  const [balanceForm, setBalanceForm] = useState({
    username: '',
    amount: '',
    action: 'add' as 'add' | 'deduct',
    notes: '',
  });

  const [usernameSearching, setUsernameSearching] = useState(false);
  const [userFound, setUserFound] = useState<{
    id: number;
    username: string;
    name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setBalanceForm({
        username: '',
        amount: '',
        action: 'add',
        notes: '',
      });
      setUserFound(null);
      setUsernameSearching(false);
    }
  }, [isOpen]);

  const searchUsername = async (username: string) => {
    if (!username.trim()) {
      setUserFound(null);
      return;
    }

    try {
      setUsernameSearching(true);
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(username)}`);
      const result = await response.json();

      if (result.users && result.users.length > 0) {
        const exactMatch = result.users.find((user: any) =>
          user.username?.toLowerCase() === username.toLowerCase()
        );
        const foundUser = exactMatch || result.users[0];
        setUserFound(foundUser);
      } else {
        setUserFound(null);
      }
    } catch (error) {
      console.error('Error searching username:', error);
      setUserFound(null);
    } finally {
      setUsernameSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (balanceForm.username.trim()) {
        searchUsername(balanceForm.username.trim());
      } else {
        setUserFound(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [balanceForm.username]);

  const handleSubmit = async () => {
    if (!balanceForm.username || !balanceForm.amount || !userFound) {
      return;
    }

    if (parseFloat(balanceForm.amount) <= 0) {
      return;
    }

    await onSubmit(balanceForm);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Add/Deduct User Balance
        </h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="form-label mb-2 dark:text-gray-300">
              Username <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter username"
                value={balanceForm.username}
                onChange={(e) => {
                  setBalanceForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }));
                  if (!e.target.value.trim()) {
                    setUserFound(null);
                  }
                }}
                className="form-field w-full px-4 py-3 pr-10 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              />
              {usernameSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]"></div>
                </div>
              )}
            </div>
            {userFound && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                  <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                    User found: {userFound.username}
                  </span>
                </div>
              </div>
            )}
            {balanceForm.username && !usernameSearching && !userFound && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                  <span className="text-sm text-red-700 dark:text-red-300">
                    User not found
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="form-label mb-2 dark:text-gray-300">
              Action <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              value={balanceForm.action}
              onChange={(e) =>
                setBalanceForm((prev) => ({
                  ...prev,
                  action: e.target.value as 'add' | 'deduct',
                }))
              }
              className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="add">Add Balance</option>
              <option value="deduct">Deduct Balance</option>
            </select>
          </div>

          <div>
            <label className="form-label mb-2 dark:text-gray-300">
              Amount ({currency}) <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                {balanceForm.action === 'deduct' ? '-' : ''}{currentCurrencyData?.symbol || '$'}
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={balanceForm.amount}
                onChange={(e) =>
                  setBalanceForm((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                className="form-field w-full pl-8 pr-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="form-label mb-2 dark:text-gray-300">Notes</label>
            <input
              type="text"
              placeholder="Add notes (optional)"
              value={balanceForm.notes}
              onChange={(e) =>
                setBalanceForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!balanceForm.username || !balanceForm.amount || !userFound || isLoading}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                {balanceForm.action === 'add' ? 'Adding...' : 'Deducting...'}
              </>
            ) : (
              <>
                <FaDollarSign className="h-4 w-4" />
                {balanceForm.action === 'add'
                  ? 'Add Balance'
                  : 'Deduct Balance'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDeductUserBalanceModal;

