'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import React, { useEffect, useState, useRef } from 'react';
import {
  FaCheck,
  FaDollarSign,
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

interface Provider {
  id: string;
  name: string;
  label: string;
  value: string;
  status: string;
}

interface PriceUpdateSettings {
  serviceType: 'all-services' | 'provider-services' | 'manual-services';
  profitPercentage: number;
  providerId?: string;
}

const UpdatePricePage = () => {
  const { appName } = useAppNameWithFallback();

  const currentUser = useCurrentUser();

  useEffect(() => {
    setPageTitle('Update Price', appName);
  }, [appName]);

  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const hasLoadedData = useRef(false);

  const [priceSettings, setPriceSettings] = useState<PriceUpdateSettings>({
    serviceType: 'all-services',
    profitPercentage: 10,
    providerId: '',
  });

  const [providers, setProviders] = useState<Provider[]>([]);

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

        const [settingsResponse, providersResponse] = await Promise.all([
          fetch('/api/admin/price-settings'),
          fetch('/api/admin/providers?filter=with-services')
        ]);

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.priceSettings) {
            setPriceSettings(settingsData.priceSettings);
          }
        }

        if (providersResponse.ok) {
          const providersData = await providersResponse.json();
          console.log('Providers API Response:', providersData);
          if (providersData.success && providersData.data && providersData.data.providers) {
            console.log('Providers data:', providersData.data.providers);
            setProviders(providersData.data.providers);
          } else {
            console.log('No providers found or invalid response structure');
          }
        } else {
          console.log('Failed to fetch providers, status:', providersResponse.status);
          showToast('Failed to load providers', 'error');
        }

        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data', 'error');
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

  const updatePrices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/update-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceSettings }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result);
        const updatedCount = result.data?.updatedCount || 0;
        showToast(`Prices updated successfully!`, 'success');
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to update prices', 'error');
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      showToast('Error updating prices', 'error');
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

  const serviceTypeOptions = [
    { value: 'all-services', label: 'All Services' },
    { value: 'provider-services', label: 'Provider Services' },
    { value: 'manual-services', label: 'Manual Services' },
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
                  <FaDollarSign />
                </div>
                <h3 className="card-title">Update Price</h3>
              </div>

              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Service Types</label>
                  <select
                    value={priceSettings.serviceType}
                    onChange={(e) =>
                      setPriceSettings(prev => ({
                        ...prev,
                        serviceType: e.target.value as 'all-services' | 'provider-services' | 'manual-services',

                        providerId: e.target.value === 'provider-services' ? prev.providerId : ''
                      }))
                    }
                    className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  >
                    {serviceTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {priceSettings.serviceType === 'provider-services' && (
                  <div className="form-group">
                    <label className="form-label">Provider</label>
                    <select
                      value={priceSettings.providerId || ''}
                      onChange={(e) =>
                        setPriceSettings(prev => ({
                          ...prev,
                          providerId: e.target.value
                        }))
                      }
                      className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="">Select Provider</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.label || provider.name || provider.value}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Profit Percentage</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={priceSettings.profitPercentage}
                      onChange={(e) =>
                        setPriceSettings(prev => ({
                          ...prev,
                          profitPercentage: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="form-field w-full px-4 py-3 pr-8 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="10"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      %
                    </span>
                  </div>
                </div>

                <button
                  onClick={updatePrices}
                  disabled={
                    isLoading || 
                    (priceSettings.serviceType === 'provider-services' && !priceSettings.providerId)
                  }
                  className="btn btn-primary w-full"
                >
                  {isLoading ? 'Updating...' : 'Update Prices'}
                </button>

                {priceSettings.serviceType === 'provider-services' && !priceSettings.providerId && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    Please select a provider to update prices for provider services.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePricePage;