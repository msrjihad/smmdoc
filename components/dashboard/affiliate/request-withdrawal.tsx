'use client';

import { FaDollarSign, FaTimes } from 'react-icons/fa';

interface WithdrawalMethod {
  id: string | number;
  method: string;
}

interface RequestWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawalForm: {
    amount: string;
    selectedWithdrawalMethod: string;
    paymentDetails: string;
  };
  setWithdrawalForm: (form: {
    amount: string;
    selectedWithdrawalMethod: string;
    paymentDetails: string;
  }) => void;
  withdrawalProcessing: boolean;
  availableBalance: number;
  availableBalanceDisplay: string;
  minWithdrawalValue: number;
  savedWithdrawalMethods: WithdrawalMethod[];
  getWithdrawalMethodDisplayName: (method: string) => string;
  getWithdrawalMethodOptionLabel: (method: WithdrawalMethod) => string;
  isWithdrawalFormValid: () => boolean;
  onWithdrawalRequest: () => void;
}

export function RequestWithdrawalModal({
  isOpen,
  onClose,
  withdrawalForm,
  setWithdrawalForm,
  withdrawalProcessing,
  availableBalance,
  availableBalanceDisplay,
  minWithdrawalValue,
  savedWithdrawalMethods,
  getWithdrawalMethodDisplayName,
  getWithdrawalMethodOptionLabel,
  isWithdrawalFormValid,
  onWithdrawalRequest,
}: RequestWithdrawalModalProps) {
  if (!isOpen) return null;

  const withdrawalAmount = parseFloat(withdrawalForm.amount) || 0;
  const remainingBalance = availableBalance - withdrawalAmount;
  const exceedsBalance = withdrawalAmount > availableBalance;
  const isNegative = remainingBalance < 0;
  const hasError = exceedsBalance || isNegative;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl">
        <div className="max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request Withdrawal</h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${hasError ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
              <div className={`text-sm font-medium mb-1 ${hasError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {hasError ? 'Available Balance (After Withdrawal)' : 'Available Balance'}
              </div>
              <div className={`text-2xl font-bold ${hasError ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                ${remainingBalance.toFixed(2)}
              </div>
              {!hasError && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Original balance: {availableBalanceDisplay || '$0.00'} • Minimum withdrawal: ${minWithdrawalValue.toFixed(2)}
                </div>
              )}
              {hasError && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                  Insufficient balance! Withdrawal amount exceeds available balance.
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Withdrawal Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={withdrawalForm.amount}
                  onChange={(e) =>
                    setWithdrawalForm({
                      ...withdrawalForm,
                      amount: e.target.value,
                    })
                  }
                  className="form-field w-full pl-8 px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              {hasError && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                  Available balance: ${availableBalance.toFixed(2)} • You're trying to withdraw: ${withdrawalAmount.toFixed(2)}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Withdrawal Method
              </label>
              <select
                value={withdrawalForm.selectedWithdrawalMethod}
                onChange={(e) =>
                  setWithdrawalForm({
                    ...withdrawalForm,
                    selectedWithdrawalMethod: e.target.value,
                  })
                }
                className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="" disabled>Select withdrawal method</option>
                {savedWithdrawalMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {getWithdrawalMethodOptionLabel(m)}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Choose from your configured withdrawal methods
              </div>
              {withdrawalForm.selectedWithdrawalMethod && (
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  Selected: {(() => {
                    const sel = savedWithdrawalMethods.find(wm => String(wm.id) === String(withdrawalForm.selectedWithdrawalMethod));
                    if (!sel) return '';
                    const base = getWithdrawalMethodDisplayName(sel.method);
                    return base;
                  })()}
                </div>
              )}
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="text-blue-500 dark:text-blue-400 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Processing Information</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    • Withdrawals are processed within 1-3 business days<br />
                    • Minimum withdrawal amount is ${minWithdrawalValue.toFixed(2)}<br />
                    • Processing fees may apply depending on withdrawal method
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={onClose}
              className="btn btn-secondary"
              disabled={withdrawalProcessing}
            >
              Cancel
            </button>
            <button
              onClick={onWithdrawalRequest}
              disabled={withdrawalProcessing || !isWithdrawalFormValid()}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {withdrawalProcessing ? (
                <>
                  Submitting...
                </>
              ) : (
                <>
                  <FaDollarSign className="h-4 w-4" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

