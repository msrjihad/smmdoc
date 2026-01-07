'use client';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useUserSettings } from '@/hooks/use-user-settings';
import useCurrency from '@/hooks/use-currency';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FaExchangeAlt, FaSpinner, FaCheckCircle, FaTimes, FaTimesCircle } from 'react-icons/fa';

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'pending';
  onClose: () => void;
}) => (
  <div className={`toast toast-${type} toast-enter`}>
    {type === 'success' && <FaCheckCircle className="toast-icon" />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="toast-close">
      <FaTimes className="toast-close-icon" />
    </button>
  </div>
);

export default function TransferFund() {
  const { appName } = useAppNameWithFallback();
  const currentUser = useCurrentUser();
  const router = useRouter();

  const className = '';
  const { settings: userSettings, loading: settingsLoading } = useUserSettings();
  const { currencySettings, availableCurrencies } = useCurrency();
  
  const defaultCurrency = currencySettings?.defaultCurrency || 'USD';
  const defaultCurrencyData = availableCurrencies.find(c => c.code === defaultCurrency);
  const currencySymbol = defaultCurrencyData?.symbol || '$';
  const currencyName = defaultCurrencyData?.name || 'US Dollar';
  
  const [username, setUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const [isValidatingUser, setIsValidatingUser] = useState(false);
  const [userValidationError, setUserValidationError] = useState('');
  const [isUserValid, setIsUserValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selfTransferError, setSelfTransferError] = useState('');

  useEffect(() => {
    setPageTitle('Transfer Funds', appName);
  }, [appName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const validateUsername = useCallback(async (usernameValue: string) => {
    if (!usernameValue.trim()) {
      setUserValidationError('');
      setIsUserValid(false);
      setSelfTransferError('');
      return;
    }

    if (usernameValue.length < 3) {
      setIsUserValid(false);
      setUserValidationError('');
      setSelfTransferError('');
      return;
    }

    if (currentUser) {
      const currentUsername = currentUser.username?.toLowerCase() || '';
      const currentEmail = currentUser.email?.toLowerCase() || '';
      const inputValue = usernameValue.toLowerCase().trim();

      if (inputValue === currentUsername || inputValue === currentEmail) {
        setIsUserValid(false);
        setUserValidationError('');
        setSelfTransferError('You cannot transfer fund yourself!');
        setIsValidatingUser(false);
        return;
      }
    }

    setIsValidatingUser(true);
    setUserValidationError('');
    setSelfTransferError('');

    try {
      const response = await fetch(
        `/api/user/validate-username?username=${encodeURIComponent(
          usernameValue
        )}`
      );
      const result = await response.json();

      if (result.success) {
        if (currentUser) {
          const currentUsername = currentUser.username?.toLowerCase() || '';
          const currentEmail = currentUser.email?.toLowerCase() || '';
          const validatedUsername = result.user?.username?.toLowerCase() || '';
          const validatedEmail = result.user?.email?.toLowerCase() || '';

          if (validatedUsername === currentUsername || validatedEmail === currentEmail || 
              validatedUsername === currentEmail || validatedEmail === currentUsername) {
            setIsUserValid(false);
            setUserValidationError('');
            setSelfTransferError('You cannot transfer fund yourself!');
            return;
          }
        }
        setIsUserValid(true);
        setUserValidationError('');
        setSelfTransferError('');
      } else {
        setIsUserValid(false);
        setUserValidationError(result.error || 'User not found');
        setSelfTransferError('');
      }
    } catch (error) {
      setIsUserValid(false);
      setUserValidationError('Error validating username');
      setSelfTransferError('');
      console.error('Username validation error:', error);
    } finally {
      setIsValidatingUser(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateUsername(username);
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [username, validateUsername]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setSelfTransferError('');

    if (value !== username) {
      setIsUserValid(false);
      setUserValidationError('');
    }

    if (currentUser && value.trim()) {
      const currentUsername = currentUser.username?.toLowerCase() || '';
      const currentEmail = currentUser.email?.toLowerCase() || '';
      const inputValue = value.toLowerCase().trim();

      if (inputValue === currentUsername || inputValue === currentEmail) {
        setSelfTransferError('You cannot transfer fund yourself!');
        setIsUserValid(false);
        setUserValidationError('');
        return;
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !amount) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (!isUserValid) {
      showToast('Please enter a valid username', 'error');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    const minAmount = 0.1;
    if (transferAmount < minAmount) {
      showToast(
        `Minimum transfer amount is ${minAmount} ${defaultCurrency}`,
        'error'
      );
      return;
    }

    startTransition(async () => {
      try {
        showToast('Processing transfer...', 'pending');

        const calculatedFee = (transferAmount * feePercentage) / 100;

        const response = await fetch('/api/user/transfer-funds', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            amount: transferAmount,
            currency: defaultCurrency,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Transfer failed');
        }

        showToast(
          `Successfully transferred ${transferAmount} ${defaultCurrency} to ${username} (Fee: ${calculatedFee.toFixed(
            2
          )} ${defaultCurrency})`,
          'success'
        );
        setUsername('');
        setAmount('');
        
        setTimeout(() => {
          router.push('/transactions');
        }, 1500);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Transfer failed. Please try again.';
        showToast(errorMessage, 'error');
      }
    });
  };

  const currentAmount = parseFloat(amount) || 0;

  const feePercentage = userSettings?.transferFundsPercentage || 3;
  const fee = (currentAmount * feePercentage) / 100;
  const totalAmount = currentAmount + fee;

  if (isLoading) {
    return (
      <div className={`page-container ${className}`}>
        <div className="page-content">
          <div className="max-w-2xl mx-auto">
            <div className="card card-padding">
              <div className="card-header mb-6">
                <div className="card-icon">
                  <FaExchangeAlt />
                </div>
                <div className="h-6 w-40 gradient-shimmer rounded" />
              </div>
              <div className="h-4 w-64 gradient-shimmer rounded mb-6" />
              <div className="space-y-6">
                <div className="form-group">
                  <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                  <div className="h-10 w-full gradient-shimmer rounded-lg" />
                </div>
                <div
                  className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:!bg-gray-800 dark:from-gray-800 dark:to-gray-800"
                  style={{
                    padding: '20px',
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between mb-4">
                    <div className="h-5 w-32 gradient-shimmer rounded" />
                  </div>
                  <div className="space-y-4">
                    <div className="form-group">
                      <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                      <div className="h-10 w-full gradient-shimmer rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="h-14 w-full gradient-shimmer rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-container ${className}`}>
      <div className="toast-container">
        {toastMessage && (
          <Toast
            message={toastMessage.message}
            type={toastMessage.type}
            onClose={() => setToastMessage(null)}
          />
        )}
      </div>

      <div className="page-content">
        <div className="max-w-2xl mx-auto">
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaExchangeAlt />
              </div>
              <h3 className="card-title">Transfer Funds</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              You can transfer funds to your friends with {userSettings?.transferFundsPercentage || 3}% fees only.
            </p>

            <form onSubmit={handleTransfer} className="space-y-6">
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    className={`form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 ${
                      userValidationError || selfTransferError
                        ? 'border-red-500 dark:border-red-400'
                        : isUserValid
                        ? 'border-green-500 dark:border-green-400'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter friend's username"
                    disabled={isPending}
                  />
                  {isValidatingUser && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
                          <div className="absolute inset-0.5 rounded-full bg-white dark:bg-gray-700"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  {isUserValid && !isValidatingUser && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <FaCheckCircle className="text-green-500 dark:text-green-400 w-4 h-4" />
                    </div>
                  )}
                  {userValidationError && !isValidatingUser && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <FaTimesCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                    </div>
                  )}
                </div>
                {username.length > 0 && username.length < 3 && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
                    Username must be at least 3 characters
                  </p>
                )}

                {selfTransferError && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200 font-medium">
                    {selfTransferError}
                  </p>
                )}

                {userValidationError && !selfTransferError && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
                    {userValidationError}
                  </p>
                )}

                {isUserValid && !isValidatingUser && (
                  <p className="text-green-500 dark:text-green-400 text-sm mt-1 transition-colors duration-200">
                    Username is valid.
                  </p>
                )}

                {isValidatingUser && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 transition-colors duration-200">
                    Validating username...
                  </p>
                )}
              </div>
              <div
                className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:!bg-gray-800 dark:from-gray-800 dark:to-gray-800"
                style={{
                  padding: '20px',
                }}
              >
                <div className="flex flex-wrap items-center justify-between mb-4">
                  <h3 className="card-title dark:text-gray-100">Amount Details</h3>
                </div>

                <div className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Amount ({defaultCurrency})</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={handleAmountChange}
                        className="form-field w-full pl-10 pr-4 py-3 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0.00"
                        disabled={isPending}
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 font-semibold">
                        {currencySymbol}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {currentAmount > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800/90 rounded-lg p-6 border border-blue-200 dark:border-gray-700">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Transfer Amount:
                      </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {currencySymbol}{currentAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Processing Fee ({feePercentage}%):
                      </span>
                      <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                        {currencySymbol}{fee.toFixed(2)}
                      </span>
                    </div>
                    <hr className="border-gray-300 dark:border-gray-600" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Total Deduction:
                      </span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {currencySymbol}{totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={
                  isPending ||
                  !username ||
                  currentAmount <= 0 ||
                  !isUserValid ||
                  isValidatingUser ||
                  !!selfTransferError
                }
                className="btn btn-primary w-full"
              >
                {isPending ? (
                  'Processing...'
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaExchangeAlt />
                    Transfer Now
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
