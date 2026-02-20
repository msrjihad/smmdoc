'use client';

import { useCurrency } from '@/contexts/currency-context';
import { formatCurrencyAmount, formatNumberWithSettings } from '@/lib/currency-utils';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useUserSettings } from '@/hooks/useUserSettings';
import axiosInstance from '@/lib/axios-instance';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import {
    addFundDefaultValues,
    addFundSchema,
    AddFundSchema,
} from '@/lib/validators/user/add-fund-validator';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, useTransition, useRef, useCallback, useMemo } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import {
    FaCalculator,
    FaCheckCircle,
    FaCreditCard,
    FaExchangeAlt,
    FaShieldAlt,
    FaTimes,
    FaWallet,
} from 'react-icons/fa';

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'pending';
  onClose: () => void;
}) => (
  <div
    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm border ${
      type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
        : type === 'error'
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        : type === 'info'
        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
    }`}
  >
    <div className="flex items-center space-x-2">
      {type === 'success' && <FaCheckCircle className="w-4 h-4" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded">
        <FaTimes className="w-3 h-3" />
      </button>
    </div>
  </div>
);

export default function AddFundsPage() {
  const user = useCurrentUser();
  const { appName } = useAppNameWithFallback();
  const [isPending, startTransition] = useTransition();
  const { currency: globalCurrency, rate: globalRate, currencySettings, availableCurrencies } = useCurrency();
  const { settings: userSettings } = useUserSettings();
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [amountUSDError, setAmountUSDError] = useState<string | null>(null);
  const [convertedAmountError, setConvertedAmountError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [exchangeRate, setExchangeRate] = useState<number>(120.00);

  useEffect(() => {
    setPageTitle('Add Funds', appName);
  }, [appName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('/api/payment-gateway/exchange-rate');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.exchangeRate) {
            setExchangeRate(data.exchangeRate);
          }
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      }
    };

    fetchExchangeRate();
  }, []);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatNumber = (num: number | string): string => {
    const numValue = typeof num === 'string' ? parseFloat(num) || 0 : num;
    if (currencySettings) {
      return formatNumberWithSettings(numValue, currencySettings);
    }
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatAmount = (amount: number, currencyCode: 'USD' | 'BDT'): string => {
    if (currencySettings && availableCurrencies.length > 0) {
      return formatCurrencyAmount(amount, currencyCode, availableCurrencies, currencySettings);
    }
    return `${currencyCode === 'USD' ? '$' : '৳'}${formatNumber(amount)}`;
  };

  const validateConvertedAmount = (usdAmount: number) => {
    if (!usdAmount || usdAmount === 0) {
      setConvertedAmountError(null);
      return;
    }

    const minAmountUSD = userSettings?.minimumFundsToAddUSD;
    const maxAmountUSD = userSettings?.maximumFundsToAddUSD && userSettings.maximumFundsToAddUSD > 0 
      ? userSettings.maximumFundsToAddUSD 
      : null;

    if (minAmountUSD && usdAmount < minAmountUSD) {
      const currentRate = rate || 120;
      const minAmountBDT = minAmountUSD * currentRate;
      if (activeCurrency === 'USD') {
        setConvertedAmountError(`Minimum amount is ${formatNumber(minAmountBDT)} BDT (${formatNumber(minAmountUSD)} USD)`);
      } else {
        setConvertedAmountError(`Minimum amount is ${formatNumber(minAmountUSD)} USD (≈ ${formatNumber(minAmountBDT)} BDT)`);
      }
    } else if (maxAmountUSD && usdAmount > maxAmountUSD) {
      const currentRate = rate || 120;
      const maxAmountBDT = maxAmountUSD * currentRate;
      if (activeCurrency === 'USD') {
        setConvertedAmountError(`Maximum amount is ${formatNumber(maxAmountBDT)} BDT (${formatNumber(maxAmountUSD)} USD)`);
      } else {
        setConvertedAmountError(`Maximum amount is ${formatNumber(maxAmountUSD)} USD (≈ ${formatNumber(maxAmountBDT)} BDT)`);
      }
    } else {
      setConvertedAmountError(null);
    }
  };

  const [activeCurrency, setActiveCurrency] = useState<'USD' | 'BDT'>(
    globalCurrency === 'USD' ? 'USD' : 'BDT'
  );

  const rate = exchangeRate || globalRate || 120;

  const form = useForm<AddFundSchema>({
    mode: 'all',
    resolver: zodResolver(addFundSchema),
    defaultValues: addFundDefaultValues,
  });

  useEffect(() => {
    if (userSettings?.minimumFundsToAddUSD && activeCurrency === 'USD') {
      const minAmountUSD = userSettings.minimumFundsToAddUSD;
      const currentRate = rate || 120;
      const minAmountBDT = minAmountUSD * currentRate;
      
      const currentUSD = form.getValues('amountUSD');
      if (!currentUSD || parseFloat(currentUSD) === 0) {
        form.setValue('amountUSD', minAmountUSD.toFixed(2), { shouldValidate: true });
        form.setValue('amountBDT', minAmountBDT.toFixed(2), { shouldValidate: true });
        form.setValue('amountBDTConverted', minAmountBDT.toFixed(2), { shouldValidate: true });
        form.setValue('amount', minAmountBDT.toFixed(2), { shouldValidate: true });
        setTotalAmount({
          amount: minAmountBDT,
          currency: 'BDT',
        });
      }
    }
  }, [userSettings?.minimumFundsToAddUSD, activeCurrency, exchangeRate]);

  useEffect(() => {
    const newCurrency = (globalCurrency === 'USD' || globalCurrency === 'BDT') ? globalCurrency : 'BDT';
    setActiveCurrency(newCurrency);
    setAmountUSDError(null);
    setConvertedAmountError(null);

    if (newCurrency === 'USD' && userSettings?.minimumFundsToAddUSD) {
      const minAmountUSD = userSettings.minimumFundsToAddUSD;
      const currentRate = rate || 120;
      const minAmountBDT = minAmountUSD * currentRate;
      form.setValue('amountUSD', minAmountUSD.toFixed(2), { shouldValidate: true });
      form.setValue('amountBDT', minAmountBDT.toFixed(2), { shouldValidate: true });
      form.setValue('amountBDTConverted', minAmountBDT.toFixed(2), { shouldValidate: true });
      form.setValue('amount', minAmountBDT.toFixed(2), { shouldValidate: true });
      setTotalAmount({
        amount: minAmountBDT,
        currency: 'BDT',
      });
    } else {
      form.setValue('amountUSD', '0', { shouldValidate: true });
      form.setValue('amountBDT', '0', { shouldValidate: true });
      form.setValue('amountBDTConverted', '0', { shouldValidate: true });
      setTotalAmount({
        amount: 0,
        currency: newCurrency,
      });
    }
  }, [globalCurrency, userSettings?.minimumFundsToAddUSD, exchangeRate]);

  const amountUSDValue = form.watch('amountUSD');
  const amountBDTValue = form.watch('amountBDT');
  
  useEffect(() => {
    if (activeCurrency === 'USD') {
      const usdValue = parseFloat(amountUSDValue || '0');
      validateConvertedAmount(usdValue);
    } else {
      const currentRate = rate || 120;
      const bdtValue = parseFloat(amountBDTValue || '0');
      const usdValue = bdtValue / currentRate;
      validateConvertedAmount(usdValue);
    }
  }, [amountUSDValue, amountBDTValue, activeCurrency, exchangeRate, userSettings]);

  const toggleCurrency = () => {
    const newCurrency = activeCurrency === 'USD' ? 'BDT' : 'USD';
    setActiveCurrency(newCurrency);
    setAmountUSDError(null);
    setConvertedAmountError(null);

    if (newCurrency === 'USD' && userSettings?.minimumFundsToAddUSD) {
      const minAmountUSD = userSettings.minimumFundsToAddUSD;
      const currentRate = rate || 120;
      const minAmountBDT = minAmountUSD * currentRate;
      form.setValue('amountUSD', minAmountUSD.toFixed(2), { shouldValidate: true });
      form.setValue('amountBDT', minAmountBDT.toFixed(2), { shouldValidate: true });
      form.setValue('amountBDTConverted', minAmountBDT.toFixed(2), { shouldValidate: true });
      form.setValue('amount', minAmountBDT.toFixed(2), { shouldValidate: true });
      setTotalAmount({
        amount: minAmountBDT,
        currency: 'BDT',
      });
    } else {
      form.setValue('amountUSD', '0', { shouldValidate: true });
      form.setValue('amountBDT', '0', { shouldValidate: true });
      form.setValue('amountBDTConverted', '0', { shouldValidate: true });
      form.setValue('amount', '0', { shouldValidate: true });
      setTotalAmount({
        amount: 0,
        currency: 'BDT',
      });
    }
  };

  const [totalAmount, setTotalAmount] = useState<{
    amount: number;
    currency: 'USD' | 'BDT';
  }>({
    amount: 0,
    currency: 'BDT',
  });

  const handleUSDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentRate = rate || 120;
    const inputValue = e.target.value;
    const usdValue = parseFloat(inputValue) || 0;
    const bdtValue = usdValue * currentRate;

    if (!inputValue || inputValue.trim() === '') {
      setAmountUSDError(null);
    } else {
      const minAmountUSD = userSettings?.minimumFundsToAddUSD;
      const maxAmountUSD = userSettings?.maximumFundsToAddUSD && userSettings.maximumFundsToAddUSD > 0 
        ? userSettings.maximumFundsToAddUSD 
        : null;

      if (minAmountUSD && usdValue > 0 && usdValue < minAmountUSD) {
        setAmountUSDError(`Minimum amount is ${formatNumber(minAmountUSD)} USD`);
      } else if (maxAmountUSD && usdValue > maxAmountUSD) {
        setAmountUSDError(`Maximum amount is ${formatNumber(maxAmountUSD)} USD`);
      } else {
        setAmountUSDError(null);
      }
    }

    form.setValue('amountUSD', e.target.value, { shouldValidate: true });
    form.setValue('amountBDT', bdtValue.toFixed(2), { shouldValidate: true });
    form.setValue('amountBDTConverted', bdtValue.toFixed(2), {
      shouldValidate: true,
    });
    form.setValue('amount', bdtValue.toFixed(2), { shouldValidate: true });

    setTotalAmount({
      amount: bdtValue,
      currency: 'BDT',
    });

    validateConvertedAmount(usdValue);
  };

  const handleBDTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentRate = rate || 120;
    const bdtValue = parseFloat(e.target.value) || 0;
    const usdValue = bdtValue / currentRate;

    form.setValue('amountBDT', e.target.value, { shouldValidate: true });
    form.setValue('amountUSD', usdValue.toFixed(2), { shouldValidate: true });
    form.setValue('amount', bdtValue.toFixed(2), { shouldValidate: true });

    setTotalAmount({
      amount: bdtValue,
      currency: 'BDT',
    });

    validateConvertedAmount(usdValue);
  };

  const onSubmit: SubmitHandler<AddFundSchema> = useCallback(async (values) => {
    if (isSubmittingRef.current) {
      console.log('Submission already in progress (ref check), ignoring duplicate request');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    (async () => {
      try {
        const currentRate = exchangeRate || 120;
        const amountInBDT =
          activeCurrency === 'USD'
            ? parseFloat(values.amountUSD || '0') * currentRate
            : parseFloat(values.amountBDT || '0');

        if (!user?.name || !user?.email || amountInBDT <= 0) {
          showToast('Please fill in all required information', 'error');
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        const minAmountUSD = userSettings?.minimumFundsToAddUSD || 10;
        const maxAmountUSD = userSettings?.maximumFundsToAddUSD && userSettings.maximumFundsToAddUSD > 0 ? userSettings.maximumFundsToAddUSD : null;
        const minAmountBDT = minAmountUSD * currentRate;
        const maxAmountBDT = maxAmountUSD && maxAmountUSD > 0 ? maxAmountUSD * currentRate : null;
        const finalAmount = Math.round(amountInBDT);
        
        if (activeCurrency === 'USD') {
          const enteredUSD = parseFloat(values.amountUSD || '0');
          if (enteredUSD < minAmountUSD) {
            showToast(`Minimum amount must be ${minAmountUSD} USD`, 'error');
            isSubmittingRef.current = false;
            setIsSubmitting(false);
            return;
          }
          if (maxAmountUSD && enteredUSD > maxAmountUSD) {
            showToast(`Maximum amount must be ${maxAmountUSD} USD`, 'error');
            isSubmittingRef.current = false;
            setIsSubmitting(false);
            return;
          }
        }
        
        if (finalAmount < minAmountBDT) {
          showToast(`Minimum amount must be ${minAmountUSD} USD (≈ ${Math.round(minAmountBDT)} BDT)`, 'error');
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
        
        if (maxAmountBDT && finalAmount > maxAmountBDT) {
          showToast(`Maximum amount must be ${maxAmountUSD} USD (≈ ${Math.round(maxAmountBDT)} BDT)`, 'error');
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        const amountValue = activeCurrency === 'USD' 
          ? parseFloat(values.amountUSD || '0')
          : parseFloat(values.amountBDT || '0');

        if (isNaN(amountValue) || amountValue <= 0) {
          showToast('Please enter a valid amount', 'error');
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        const formValues = {
          method: 'UddoktaPay',
          amount: amountValue.toString(),
          currency: activeCurrency,
          userId: user?.id,
          full_Name: user?.name || 'John Doe',
          email: user?.email || 'customer@example.com',
          requestId: requestId,
        };

        showToast('Payment processing...', 'pending');

        console.log('Sending payment request:', formValues);

        const res = await axiosInstance.post(
          '/api/payment/create-charge',
          formValues
        );

        if (res.data?.error) {
          console.error('Payment API error:', res.data);
          const errorMessage = res.data.error || 'Payment processing failed. Please try again.';
          showToast(errorMessage, 'error');
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

          if (res.data && res.data.payment_url) {
            if (res.data.invoice_id) {
              const paymentSession = {
                invoice_id: res.data.invoice_id,
                amount: finalAmount.toString(),
                user_id: user?.id,
                timestamp: Date.now(),
              };
              sessionStorage.setItem(
                'payment_invoice_id',
                res.data.invoice_id
              );
              localStorage.setItem(
                'uddoktapay_session',
                JSON.stringify(paymentSession)
              );
            }

          showToast('Redirecting to payment page...', 'success');

          setTimeout(() => {
            window.location.href = res.data.payment_url;
          }, 500);
        } else {
          const errorMessage = res.data?.error || res.data?.message || 'Payment processing failed. Please try again.';
          console.error('Payment response missing payment_url:', res.data);
          showToast(errorMessage, 'error');
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
      } catch (error: any) {
        console.error('Payment error:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          error: error,
        });
        const errorMessage = error?.response?.data?.error || 
                            error?.response?.data?.message || 
                            error?.message || 
                            'Payment processing failed. Please try again.';
        showToast(errorMessage, 'error');
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    })();
  }, [user, activeCurrency, exchangeRate, userSettings]);

  const handleFormSubmit = useMemo(() => {
    return form.handleSubmit(onSubmit);
  }, [onSubmit, form]);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card card-padding">
              <div className="space-y-6">
                <div
                  className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:!bg-gray-800 dark:from-gray-800 dark:to-gray-800"
                  style={{
                    padding: '20px',
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between mb-4">
                    <div className="h-5 w-32 gradient-shimmer rounded" />
                    <div className="h-6 w-32 gradient-shimmer rounded-full" />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="form-group">
                      <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                      <div className="h-10 w-full gradient-shimmer rounded-lg" />
                    </div>
                    <div className="flex justify-center">
                      <div className="h-12 w-40 gradient-shimmer rounded-lg" />
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                    <div className="h-10 w-full gradient-shimmer rounded-lg" />
                  </div>
                </div>
                <div className="form-group">
                  <div className="h-10 w-full gradient-shimmer rounded-lg" />
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 w-24 gradient-shimmer rounded" />
                    <div className="h-8 w-32 gradient-shimmer rounded" />
                  </div>
                  <div className="h-4 w-24 gradient-shimmer rounded" />
                </div>
                <div className="h-14 w-full gradient-shimmer rounded-lg" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="card card-padding">
                <div className="card-header">
                  <div className="card-icon">
                    <FaCreditCard />
                  </div>
                  <h3 className="card-title">Secure Payment</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  SSL encrypted transactions with UddoktaPay
                </p>
              </div>
              <div className="card card-padding">
                <div className="card-header">
                  <div className="card-icon">
                    <FaShieldAlt />
                  </div>
                  <h3 className="card-title">100% Safe</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your financial data is protected
                </p>
              </div>
              <div className="card card-padding">
                <div className="card-header">
                  <div className="card-icon">
                    <FaWallet />
                  </div>
                  <h3 className="card-title">Instant Credit</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Funds added immediately after payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {toastMessage && (
            <Toast
              message={toastMessage.message}
              type={toastMessage.type}
              onClose={() => setToastMessage(null)}
            />
          )}
          <div className="card card-padding">
            <div className="space-y-6">
              <div
                className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:!bg-gray-800 dark:from-gray-800 dark:to-gray-800"
                style={{
                  padding: '20px',
                }}
              >
                <div className="flex flex-wrap items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    <FaCalculator className="inline mr-2" />
                    Amount Details
                  </h4>
                  <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 mt-2 sm:mt-0 mx-auto sm:mx-0">
                    Rate: 1 USD = {rate || 120} BDT
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {activeCurrency === 'USD' ? (
                    <div className="form-group">
                      <label className="form-label">Amount (USD)</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0.00"
                          min={userSettings?.minimumFundsToAddUSD || 0}
                          max={userSettings?.maximumFundsToAddUSD && userSettings.maximumFundsToAddUSD > 0 ? userSettings.maximumFundsToAddUSD : undefined}
                          step="0.01"
                          className={`form-field w-full pl-10 pr-4 py-3 dark:bg-gray-700/50 border ${
                            amountUSDError 
                              ? 'border-red-500 dark:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                          disabled={isPending}
                          value={form.watch('amountUSD') || ''}
                          onChange={handleUSDChange}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 font-semibold">
                          $
                        </span>
                      </div>
                      {amountUSDError && (
                        <p className="text-red-500 text-sm mt-1">
                          {amountUSDError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Amount (BDT)</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0.00"
                          min={userSettings?.minimumFundsToAddUSD ? (userSettings.minimumFundsToAddUSD * (rate || 120)) : 0}
                          max={userSettings?.maximumFundsToAddUSD && userSettings.maximumFundsToAddUSD > 0 ? (userSettings.maximumFundsToAddUSD * (rate || 120)) : undefined}
                          step="0.01"
                          className="form-field w-full pl-10 pr-4 py-3 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          disabled={isPending}
                          value={form.watch('amountBDT') || ''}
                          onChange={handleBDTChange}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 font-semibold">
                          ৳
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={toggleCurrency}
                      className="btn btn-secondary h-12 px-6 flex items-center gap-2"
                      disabled={isPending}
                      title={`Switch to ${
                        activeCurrency === 'USD' ? 'BDT' : 'USD'
                      }`}
                    >
                      <FaExchangeAlt className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold">
                        Switch to {activeCurrency === 'USD' ? 'BDT' : 'USD'}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-white dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">
                    Converted Amount
                  </div>
                  {activeCurrency === 'USD' ? (
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          className={`form-field w-full pl-10 pr-4 py-3 dark:bg-gray-700/50 border ${
                            convertedAmountError 
                              ? 'border-red-500 dark:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                          disabled
                          placeholder="0.00 BDT"
                          value={formatNumber(form.watch('amountBDTConverted') || '0.00')}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 font-bold">
                          ৳
                        </span>
                      </div>
                      {convertedAmountError && (
                        <p className="text-red-500 text-sm mt-1">
                          {convertedAmountError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          className={`form-field w-full pl-10 pr-4 py-3 dark:bg-gray-700/50 border ${
                            convertedAmountError 
                              ? 'border-red-500 dark:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                          disabled
                          placeholder="0.00 USD"
                          value={formatNumber(form.watch('amountUSD') || '0.00')}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 font-bold">
                          $
                        </span>
                      </div>
                      {convertedAmountError && (
                        <p className="text-red-500 text-sm mt-1">
                          {convertedAmountError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800/90 rounded-lg p-6 border border-blue-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Total Amount:
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatAmount(totalAmount.amount, totalAmount.currency)}
                  </span>
                </div>
                {totalAmount.currency === 'BDT' && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    ≈ {formatAmount(totalAmount.amount / (rate || 120), 'USD')}
                  </div>
                )}
                {totalAmount.currency === 'USD' && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    ≈ {formatAmount(totalAmount.amount * (rate || 120), 'BDT')}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isSubmittingRef.current && !isSubmitting) {
                    handleFormSubmit(e);
                  } else {
                    console.log('Button click ignored - already submitting');
                  }
                }}
                disabled={isPending || isSubmitting || !form.formState.isValid || isSubmittingRef.current}
                className="btn btn-primary w-full h-14 text-lg font-bold"
              >
                {isPending || isSubmitting ? (
                  <div className="flex items-center gap-2">
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Add Funds
                  </div>
                )}
              </button>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaCreditCard />
                </div>
                <h3 className="card-title">Secure Payment</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                SSL encrypted transactions with UddoktaPay
              </p>
            </div>
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaShieldAlt />
                </div>
                <h3 className="card-title">100% Safe</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your financial data is protected
              </p>
            </div>
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaWallet />
                </div>
                <h3 className="card-title">Instant Credit</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Funds added immediately after payment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
