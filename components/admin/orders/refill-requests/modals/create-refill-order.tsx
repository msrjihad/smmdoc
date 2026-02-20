'use client';

import React, { useState, useEffect } from 'react';
import {
  FaTimes,
  FaSync,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { formatNumber } from '@/lib/utils';

interface RefillInfo {
  eligible: boolean;
  reason?: string;
  order: {
    id: number;
    status: string;
    totalQuantity: number;
    remainingQuantity: number;
    deliveredQuantity: number;
    startCount: number;
  };
  service: {
    id: number;
    name: string;
    rate: number;
    status: string;
    minOrder: number;
    maxOrder: number;
  };
  user: {
    balance: number;
    currency: string;
  };
  refillOptions: {
    full: {
      quantity: number;
      costUsd: number;
      costBdt: number;
      cost: number;
      affordable: boolean;
    };
    remaining: {
      quantity: number;
      costUsd: number;
      costBdt: number;
      cost: number;
      affordable: boolean;
    };
  };
}

interface CreateRefillOrderModalProps {
  isOpen: boolean;
  refillInfo: RefillInfo | null;
  processing: boolean;
  onClose: () => void;
  onCreateRefill: (startCount: number, quantity: number) => Promise<void>;
}

const CreateRefillOrderModal: React.FC<CreateRefillOrderModalProps> = ({
  isOpen,
  refillInfo,
  processing,
  onClose,
  onCreateRefill,
}) => {
  const [refillForm, setRefillForm] = useState({
    quantity: '',
    startCount: '',
  });

  useEffect(() => {
    if (!isOpen) {
      setRefillForm({ quantity: '', startCount: '' });
    }
  }, [isOpen]);

  const handleStartCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartCount = e.target.value;
    if (!refillInfo) return;

    const calculatedQuantity = newStartCount && !isNaN(parseInt(newStartCount))
      ? (refillInfo.order.startCount + refillInfo.order.totalQuantity) - parseInt(newStartCount)
      : '';

    setRefillForm({
      startCount: newStartCount,
      quantity: calculatedQuantity.toString(),
    });
  };

  const handleSubmit = async () => {
    if (!refillInfo) return;

    if (!refillForm.startCount || 
        parseInt(refillForm.startCount) < refillInfo.order.startCount || 
        parseInt(refillForm.startCount) > refillInfo.order.startCount + refillInfo.order.totalQuantity) {
      return;
    }

    const calculatedQuantity = (refillInfo.order.startCount + refillInfo.order.totalQuantity) - parseInt(refillForm.startCount);
    if (!calculatedQuantity || calculatedQuantity <= 0) {
      return;
    }

    await onCreateRefill(parseInt(refillForm.startCount), calculatedQuantity);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Refill Order</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {refillInfo && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Start Count
              </div>
              <input
                type="number"
                placeholder="Enter start count..."
                value={refillForm.startCount}
                onChange={handleStartCountChange}
                className={`form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  refillForm.startCount && (
                    parseInt(refillForm.startCount) < refillInfo.order.startCount || 
                    parseInt(refillForm.startCount) > refillInfo.order.startCount + refillInfo.order.totalQuantity
                  )
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                min={refillInfo.order.startCount}
                max={refillInfo.order.startCount + refillInfo.order.totalQuantity}
                required
              />
              {refillForm.startCount && (
                parseInt(refillForm.startCount) < refillInfo.order.startCount || 
                parseInt(refillForm.startCount) > refillInfo.order.startCount + refillInfo.order.totalQuantity
              ) && (
                <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <FaExclamationTriangle className="h-3 w-3" />
                  Start count must be between {formatNumber(refillInfo.order.startCount)} and {formatNumber(refillInfo.order.startCount + refillInfo.order.totalQuantity)}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Refill Quantity
              </div>
              <input
                type="number"
                placeholder="Auto-calculated..."
                value={refillForm.quantity}
                readOnly
                className="form-field w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-not-allowed"
                required
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing || !refillInfo?.eligible || !refillForm.startCount || 
              (!!refillForm.startCount && (
                parseInt(refillForm.startCount) < refillInfo.order.startCount || 
                parseInt(refillForm.startCount) > refillInfo.order.startCount + refillInfo.order.totalQuantity
              ))
            }
            className="btn btn-primary flex items-center gap-2"
          >
            {processing ? (
              <>
                <FaSync className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FaSync className="h-4 w-4" />
                Create Refill
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRefillOrderModal;

