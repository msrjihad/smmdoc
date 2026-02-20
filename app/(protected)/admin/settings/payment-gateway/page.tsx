'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import React, { useEffect, useState, useRef } from 'react';
import {
  FaCheck,
  FaCreditCard,
  FaTimes,
} from 'react-icons/fa';

const ButtonLoader = () => <div className="loading-spinner"></div>;

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
    {type === 'success' && <FaCheck className="toast-icon" />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="toast-close">
      <FaTimes className="toast-close-icon" />
    </button>
  </div>
);

interface PaymentGatewaySettings {
  gatewayName: string;
  liveApiKey: string;
  liveApiUrl: string;
  sandboxApiKey: string;
  sandboxApiUrl: string;
  mode: 'Live' | 'Sandbox';
  exchangeRate: number;
}

const PaymentGatewayPage = () => {
  const { appName } = useAppNameWithFallback();

  const currentUser = useCurrentUser();

  useEffect(() => {
    setPageTitle('Payment Gateway Settings', appName);
  }, [appName]);

  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const hasLoadedData = useRef(false);

  const [gatewaySettings, setGatewaySettings] = useState<PaymentGatewaySettings>({
    gatewayName: 'UddoktaPay',
    liveApiKey: '',
    liveApiUrl: '',
    sandboxApiKey: '',
    sandboxApiUrl: '',
    mode: 'Live',
    exchangeRate: 120.00,
  });

  useEffect(() => {
    hasLoadedData.current = false;
    setIsPageLoading(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!currentUser) {
          console.log('User not authenticated yet, waiting...');
          setIsPageLoading(true);
          return;
        }

        if (hasLoadedData.current) {
          return;
        }

        hasLoadedData.current = true;

        const startTime = Date.now();
        const minLoadingTime = 500;

        await new Promise(resolve => setTimeout(resolve, 100));

        const response = await fetch('/api/admin/payment-gateway-settings');

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings) {
            setGatewaySettings({
              gatewayName: data.settings.gatewayName || 'UddoktaPay',
              liveApiKey: data.settings.liveApiKey || '',
              liveApiUrl: data.settings.liveApiUrl || '',
              sandboxApiKey: data.settings.sandboxApiKey || '',
              sandboxApiUrl: data.settings.sandboxApiUrl || '',
              mode: data.settings.mode || 'Live',
              exchangeRate: data.settings.exchangeRate || 120.00,
            });
          }
        }

        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      } catch (error) {
        console.error('Error loading payment gateway settings:', error);
        showToast('Error loading payment gateway settings', 'error');
        hasLoadedData.current = false;
      } finally {
        setIsPageLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const saveSettings = async () => {
    if (!gatewaySettings.exchangeRate || gatewaySettings.exchangeRate <= 0) {
      showToast('Exchange Rate is required and must be greater than 0', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/payment-gateway-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: gatewaySettings }),
      });

      if (response.ok) {
        (await import('@/lib/settings-invalidation')).dispatchSettingsInvalidated('payment-gateway');
        showToast('Payment gateway settings saved successfully!', 'success');
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to save payment gateway settings', 'error');
      }
    } catch (error) {
      console.error('Error saving payment gateway settings:', error);
      showToast('Error saving payment gateway settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <div className="card card-padding">
                <div className="card-header">
                  <div className="card-icon">
                    <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                  </div>
                  <div className="h-6 w-32 gradient-shimmer rounded ml-3" />
                </div>
                <div className="space-y-4">
                  <div className="form-group">
                    <div className="form-label">
                      <span className="inline-block h-4 w-24 gradient-shimmer rounded" />
                    </div>
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="form-group">
                    <div className="form-label">
                      <span className="inline-block h-4 w-24 gradient-shimmer rounded" />
                    </div>
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="form-group">
                    <div className="form-label">
                      <span className="inline-block h-4 w-32 gradient-shimmer rounded" />
                    </div>
                    <div className="relative">
                      <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                    </div>
                  </div>
                  <div className="h-10 w-full gradient-shimmer rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const modeOptions = [
    { value: 'Live', label: 'Live' },
    { value: 'Sandbox', label: 'Sandbox' },
  ];

  return (
    <div className="page-container">
      <div className="toast-container">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      <div className="page-content">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaCreditCard />
                </div>
                <h3 className="card-title">Payment Gateway Settings</h3>
              </div>

              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Gateway Name</label>
                  <input
                    type="text"
                    value={gatewaySettings.gatewayName}
                    onChange={(e) =>
                      setGatewaySettings(prev => ({
                        ...prev,
                        gatewayName: e.target.value
                      }))
                    }
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    placeholder="Enter gateway name (e.g., UddoktaPay, Stripe, PayPal)"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This name will be used when creating payment records in the database
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Mode</label>
                  <select
                    value={gatewaySettings.mode}
                    onChange={(e) => {
                      const newMode = e.target.value as 'Live' | 'Sandbox';
                      setGatewaySettings(prev => ({
                        ...prev,
                        mode: newMode
                      }));
                    }}
                    className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  >
                    {modeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {gatewaySettings.mode === 'Sandbox' && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                      Use sandbox API credentials for testing. Payments will not be processed with real money.
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <input
                    type="text"
                    value={gatewaySettings.mode === 'Live' ? gatewaySettings.liveApiKey : gatewaySettings.sandboxApiKey}
                    onChange={(e) =>
                      setGatewaySettings(prev => ({
                        ...prev,
                        [prev.mode === 'Live' ? 'liveApiKey' : 'sandboxApiKey']: e.target.value
                      }))
                    }
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    placeholder={gatewaySettings.mode === 'Sandbox' ? "Enter Sandbox API Key" : "Enter Live API Key"}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {gatewaySettings.mode === 'Sandbox' 
                      ? "Use your sandbox/test API key from UddoktaPay"
                      : "Use your live/production API key from UddoktaPay"}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">API URL</label>
                  <input
                    type="url"
                    value={gatewaySettings.mode === 'Live' ? gatewaySettings.liveApiUrl : gatewaySettings.sandboxApiUrl}
                    onChange={(e) =>
                      setGatewaySettings(prev => ({
                        ...prev,
                        [prev.mode === 'Live' ? 'liveApiUrl' : 'sandboxApiUrl']: e.target.value
                      }))
                    }
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    placeholder={gatewaySettings.mode === 'Sandbox' ? "e.g., https://sandbox.uddoktapay.com/api/checkout-v2" : "e.g., https://pay.smmdoc.com/api/checkout-v2"}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {gatewaySettings.mode === 'Sandbox' 
                      ? "Enter your sandbox API URL"
                      : "Enter your live API URL"}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Exchange Rate (1 USD = ? BDT) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={gatewaySettings.exchangeRate}
                    onChange={(e) =>
                      setGatewaySettings(prev => ({
                        ...prev,
                        exchangeRate: parseFloat(e.target.value) || 120.00
                      }))
                    }
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="120.00"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This rate will be used to convert USD amounts to BDT (or gateway currency) when processing payments
                  </p>
                </div>

                <button
                  onClick={saveSettings}
                  disabled={isLoading}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayPage;

