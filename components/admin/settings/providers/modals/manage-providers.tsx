'use client';

import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface Provider {
  id: number;
  name: string;
  apiUrl: string;
  apiKey: string;
  httpMethod?: string;
  status: 'active' | 'inactive' | 'trash';
  [key: string]: any;
}

interface ProviderFormData {
  name: string;
  apiKey: string;
  apiUrl: string;
  httpMethod: 'POST' | 'GET';
  syncEnabled: boolean;
  apiKeyParam: string;
  actionParam: string;
  servicesAction: string;
  servicesEndpoint: string;
  addOrderAction: string;
  addOrderEndpoint: string;
  serviceIdParam: string;
  linkParam: string;
  quantityParam: string;
  runsParam: string;
  intervalParam: string;
  statusAction: string;
  statusEndpoint: string;
  orderIdParam: string;
  ordersParam: string;
  refillAction: string;
  refillEndpoint: string;
  refillStatusAction: string;
  refillIdParam: string;
  refillsParam: string;
  cancelAction: string;
  cancelEndpoint: string;
  balanceAction: string;
  balanceEndpoint: string;
  responseMapping: string;
  requestFormat: 'form' | 'json';
  responseFormat: 'json' | 'xml';
  rateLimitPerMin: string;
  timeoutSeconds: number;
}

interface ManageProvidersModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProvider: Provider | null;
  formData: ProviderFormData;
  onFormDataChange: (data: ProviderFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, any>(
  ({ className, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="password-input-container">
        <input
          type={showPassword ? 'text' : 'password'}
          className={className}
          ref={ref}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="password-toggle"
          disabled={disabled}
        >
          {showPassword ? (
            <FaEyeSlash className="h-4 w-4" />
          ) : (
            <FaEye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  }
);

const Switch = ({ checked, onCheckedChange, onClick, title, disabled }: any) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`switch ${checked ? 'switch-checked' : 'switch-unchecked'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span className="switch-thumb" />
  </button>
);

const ButtonLoader = () => <div className="loading-spinner"></div>;

const ManageProvidersModal: React.FC<ManageProvidersModalProps> = ({
  isOpen,
  onClose,
  editingProvider,
  formData,
  onFormDataChange,
  onSubmit,
  isLoading,
}) => {
  if (!isOpen) return null;

  const handleChange = (field: keyof ProviderFormData, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="card card-padding">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {editingProvider ? `Edit Provider - ${editingProvider.name}` : 'Add New Provider'}
            </h3>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Provider Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                placeholder="Enter provider name"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">API Configuration</h4>

              <div className="form-group">
                <label className="form-label">API Key</label>
                <PasswordInput
                  value={formData.apiKey}
                  onChange={(e: any) => handleChange('apiKey', e.target.value)}
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your API key"
                  autoComplete="new-password"
                  disabled={!editingProvider && !formData.name}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">API URL</label>
                <input
                  type="url"
                  value={formData.apiUrl}
                  onChange={(e) => handleChange('apiUrl', e.target.value)}
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter API URL (e.g., https://provider.com/api/v2)"
                  disabled={!editingProvider && !formData.name}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">HTTP Method</label>
                <select
                  value={formData.httpMethod}
                  onChange={(e) => handleChange('httpMethod', e.target.value as 'POST' | 'GET')}
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                  disabled={!editingProvider && !formData.name}
                  required
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </select>
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="form-label">Auto Sync</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically sync services and pricing from this provider
                    </p>
                  </div>
                  <div className="ml-4">
                    <Switch
                      checked={formData.syncEnabled}
                      onCheckedChange={(checked: boolean) => handleChange('syncEnabled', checked)}
                      onClick={() => (editingProvider || formData.name) && handleChange('syncEnabled', !formData.syncEnabled)}
                      title={`${formData.syncEnabled ? 'Disable' : 'Enable'} Auto Sync`}
                      disabled={!editingProvider && !formData.name}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || (!editingProvider && !formData.name)}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  editingProvider ? 'Updating...' : <ButtonLoader />
                ) : (
                  editingProvider ? 'Update Provider' : 'Add Provider'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageProvidersModal;

