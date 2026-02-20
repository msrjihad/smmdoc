'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaCheckCircle, FaDollarSign, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import useCurrency from '@/hooks/use-currency';

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

interface AddDeductBalanceModalProps {
  isOpen: boolean;
  userId: number;
  currentUser: User | null;
  onClose: () => void;
  isLoading: boolean;
  onBalanceUpdate: () => void;
}

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'pending';
  onClose: () => void;
}) => {
  const getDarkClasses = () => {
    switch (type) {
      case 'success':
        return 'dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
      case 'error':
        return 'dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'info':
        return 'dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
      case 'pending':
        return 'dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      default:
        return '';
    }
  };

  return (
    <div className={`toast toast-${type} toast-enter ${getDarkClasses()}`}>
      {type === 'success' && <FaCheckCircle className="toast-icon" />}
      {type === 'pending' && <FaExclamationCircle className="toast-icon" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="toast-close dark:hover:bg-white/10">
        <FaTimes className="toast-close-icon" />
      </button>
    </div>
  );
};

const AddDeductBalanceModal: React.FC<AddDeductBalanceModalProps> = ({
  isOpen,
  userId,
  currentUser,
  onClose,
  isLoading,
  onBalanceUpdate,
}) => {
  const { currency, currentCurrencyData } = useCurrency();

  const [balanceForm, setBalanceForm] = useState({
    amount: '',
    action: 'add',
    notes: '',
    username: '',
  });
  const [balanceSubmitting, setBalanceSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBalanceForm({
        amount: '',
        action: 'add',
        notes: '',
        username: currentUser?.username || '',
      });
    }
  }, [isOpen, currentUser]);

  const showModalToast = (message: string, type: 'success' | 'error' | 'info' | 'pending' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleBalanceSubmit = async () => {
    if (!balanceForm.amount || !currentUser) {
      showModalToast('Please fill in all required fields', 'error');
      return;
    }

    if (parseFloat(balanceForm.amount) <= 0) {
      showModalToast('Amount must be greater than 0', 'error');
      return;
    }

    try {
      setBalanceSubmitting(true);
      const response = await fetch('/api/admin/users/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: currentUser.username,
          amount: parseFloat(balanceForm.amount),
          action: balanceForm.action,
          notes: balanceForm.notes,
          adminCurrency: currency,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const toastType = balanceForm.action === 'deduct' ? 'pending' : 'success';
        showModalToast(
          result.message || `Successfully ${
            balanceForm.action === 'add' ? 'added' : 'deducted'
          } balance ${balanceForm.action === 'add' ? 'to' : 'from'} ${currentUser.username}`,
          toastType
        );
        setTimeout(() => {
          onClose();
          onBalanceUpdate();
        }, 500);
      } else {
        showModalToast(result.error || 'Failed to update user balance', 'error');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      showModalToast('Failed to update user balance', 'error');
    } finally {
      setBalanceSubmitting(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toastPortal = mounted && toast && createPortal(
    <div className="toast-container" style={{ zIndex: 9999 }}>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)}
      />
    </div>,
    document.body
  );

  if (!isOpen || !currentUser) {
    return toastPortal || null;
  }

  return (
    <>
      {toastPortal}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] mx-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add/Deduct User Balance</h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Action <span className="text-red-500 dark:text-red-400">*</span></label>
              <select
                value={balanceForm.action || 'add'}
                onChange={(e) =>
                  setBalanceForm((prev) => ({
                    ...prev,
                    action: e.target.value,
                  }))
                }
                className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="add">Add Balance</option>
                <option value="deduct">Deduct Balance</option>
              </select>
            </div>

            <div>
              <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Amount ({currency}) <span className="text-red-500 dark:text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                  {balanceForm.action === 'deduct' ? '-' : ''}{currentCurrencyData?.symbol || '$'}
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={balanceForm.amount || ''}
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
              <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Notes</label>
              <input
                type="text"
                placeholder="Add notes (optional)"
                value={balanceForm.notes || ''}
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
              onClick={handleBalanceSubmit}
              disabled={!balanceForm.amount || balanceSubmitting}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {balanceSubmitting ? (
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
    </>
  );
};

export default AddDeductBalanceModal;

