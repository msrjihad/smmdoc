'use client';

import { useCurrency } from '@/contexts/currency-context';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { clearCurrencyCache } from '@/lib/currency-utils';
import { useEffect, useState } from 'react';
import {
    FaCheck,
    FaDollarSign,
    FaEdit,
    FaTimes,
    FaTrash
} from 'react-icons/fa';

const CurrencyPageSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card card-padding h-fit">
        <div className="card-header mb-6">
          <div className="h-10 w-10 gradient-shimmer rounded-lg" />
          <div className="h-6 w-40 gradient-shimmer rounded ml-3" />
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="h-9 w-28 gradient-shimmer rounded-lg" />
              <div className="h-9 w-24 gradient-shimmer rounded-lg" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-12 gap-3 flex-1">
                  <div className="h-4 w-16 gradient-shimmer rounded col-span-2" />
                  <div className="h-4 w-12 gradient-shimmer rounded col-span-2" />
                  <div className="h-4 w-16 gradient-shimmer rounded col-span-4" />
                  <div className="h-4 w-16 gradient-shimmer rounded col-span-2" />
                  <div className="h-4 w-12 gradient-shimmer rounded col-span-2" />
                </div>
                <div className="h-4 w-16 gradient-shimmer rounded" />
              </div>
              <div className="space-y-2 mt-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg min-h-[60px]">
                    <div className="grid grid-cols-12 gap-3 flex-1">
                      <div className="h-6 w-6 gradient-shimmer rounded-full col-span-2" />
                      <div className="h-4 w-12 gradient-shimmer rounded col-span-2" />
                      <div className="h-4 w-24 gradient-shimmer rounded col-span-4" />
                      <div className="h-4 w-8 gradient-shimmer rounded col-span-2" />
                      <div className="h-4 w-16 gradient-shimmer rounded col-span-2" />
                    </div>
                    <div className="flex gap-2 w-20">
                      <div className="h-6 w-6 gradient-shimmer rounded" />
                      <div className="h-6 w-6 gradient-shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="h-5 w-32 gradient-shimmer rounded mb-3" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="h-4 w-24 gradient-shimmer rounded" />
                  <div className="h-10 w-full gradient-shimmer rounded-lg" />
                </div>
              ))}
            </div>
            <div className="h-9 w-full gradient-shimmer rounded-lg mt-4" />
          </div>
        </div>
      </div>
      <div className="card card-padding h-fit">
        <div className="card-header mb-6">
          <div className="h-10 w-10 gradient-shimmer rounded-lg" />
          <div className="h-6 w-40 gradient-shimmer rounded ml-3" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="space-y-2">
              <div className="h-4 w-32 gradient-shimmer rounded" />
              <div className="h-10 w-full gradient-shimmer rounded-lg" />
            </div>
          ))}
          <div className="h-10 w-full gradient-shimmer rounded-lg" />
        </div>
      </div>
    </div>
  );
};

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

const Switch = ({ checked, onCheckedChange, onClick, title }: any) => (
  <button
    onClick={onClick}
    title={title}
    className={`switch ${checked ? 'switch-checked' : 'switch-unchecked'}`}
  >
    <span className="switch-thumb" />
  </button>
);

const CurrencyItem = ({
  currency,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  currency: { id: number; code: string; name: string; symbol: string; rate: number; enabled: boolean };
  onEdit: (id: number, updates: Partial<typeof currency>) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol,
    rate: currency.rate,
  });

  const handleSave = () => {
    if (currency.code === 'USD') {
      return;
    }
    if (editValues.code.trim() && editValues.name.trim()) {
      onEdit(currency.id, editValues);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValues({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      rate: currency.rate,
    });
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg min-h-[60px]">
      {isEditing ? (
        <div className="flex items-center gap-3 w-full">
          <div className="grid grid-cols-12 gap-3 flex-1 items-center">
            <div className="flex justify-start col-span-2">
              <Switch
                checked={currency.enabled}
                onClick={() => onToggleStatus(currency.id)}
                title={`${currency.enabled ? 'Disable' : 'Enable'} ${currency.code}`}
              />
            </div>
            <input
              type="text"
              value={editValues.code}
              onChange={(e) => setEditValues(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="USD"
              maxLength={3}
              disabled={currency.code === 'USD'}
              className={`form-field w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none col-span-2 ${
                currency.code === 'USD'
                  ? 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            />
            <input
              type="text"
              value={editValues.name}
              onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
              placeholder="US Dollar"
              disabled={currency.code === 'USD'}
              className={`form-field w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none col-span-4 ${
                currency.code === 'USD'
                  ? 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            />
            <input
              type="text"
              value={editValues.symbol}
              onChange={(e) => setEditValues(prev => ({ ...prev, symbol: e.target.value }))}
              placeholder="$"
              maxLength={3}
              disabled={currency.code === 'USD'}
              className={`form-field w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none col-span-2 ${
                currency.code === 'USD'
                  ? 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            />
            <input
              type="number"
              value={editValues.rate}
              onChange={(e) => setEditValues(prev => ({ ...prev, rate: parseFloat(e.target.value) || 1 }))}
              step="0.01"
              min="0"
              disabled={currency.code === 'USD'}
              className={`form-field w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none col-span-2 ${
                currency.code === 'USD'
                  ? 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            />
          </div>
          <div className="flex items-center justify-center gap-2 w-20">
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              title="Save"
            >
              <FaCheck className="w-3 h-3" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              title="Cancel"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 w-full">
          <div className="grid grid-cols-12 gap-3 flex-1 text-sm items-center">
            <div className="flex justify-start col-span-2">
              <Switch
                checked={currency.enabled}
                onClick={() => onToggleStatus(currency.id)}
                title={`${currency.enabled ? 'Disable' : 'Enable'} ${currency.code}`}
              />
            </div>
            <span className="font-mono font-semibold text-left col-span-2">{currency.code}</span>
            <span className="text-left col-span-4">{currency.name}</span>
            <span className="font-mono text-left col-span-2">{currency.symbol}</span>
            <span className="text-left font-mono col-span-2">{currency.rate.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-center gap-2 w-20">
            {currency.code === 'USD' ? (
              <div className="w-3 h-3" />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                title="Edit"
              >
                <FaEdit className="w-3 h-3" />
              </button>
            )}
            {currency.code === 'USD' ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300 font-medium">
                <span>Core</span>
              </div>
            ) : (
              <button
                onClick={() => onDelete(currency.id)}
                className="p-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                title="Delete"
              >
                <FaTrash className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface CurrencySettings {
  defaultCurrency: string;
  displayDecimals: number;
  currencyPosition: 'left' | 'right' | 'left_space' | 'right_space';
  thousandsSeparator: string;
  decimalSeparator: string;
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  rate: number;
  enabled: boolean;
}

const PaymentCurrencyPage = () => {
  const { appName } = useAppNameWithFallback();

  const currentUser = useCurrentUser();
  const { refreshCurrencyData } = useCurrency();

  useEffect(() => {
    setPageTitle('Payment Currency', appName);
  }, [appName]);

  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>({
    defaultCurrency: 'USD',
    displayDecimals: 2,
    currencyPosition: 'left',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  });

  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const [newCurrency, setNewCurrency] = useState({
    code: '',
    name: '',
    symbol: '',
    rate: 1,
    symbolPosition: 'left' as 'left' | 'right' | 'left_space' | 'right_space',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsPageLoading(true);

        const response = await fetch('/api/admin/currency-settings');
        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            if (data.currencySettings) setCurrencySettings(data.currencySettings);
            if (data.currencies) setCurrencies(data.currencies);
          } else {
            const errorMessage = data.error || 'Failed to load currency settings';
            console.error('API returned error:', errorMessage);
            setToast({ message: errorMessage, type: 'error' });
            setTimeout(() => setToast(null), 4000);
          }
        } else {
          const errorText = await response.text();
          console.error('API request failed:', response.status, errorText);
          setToast({ message: 'Failed to load currency settings. Please try again.', type: 'error' });
          setTimeout(() => setToast(null), 4000);
        }
      } catch (error) {
        console.error('Error loading currency settings:', error);
        setToast({ message: 'Error loading currency settings. Please refresh the page.', type: 'error' });
        setTimeout(() => setToast(null), 4000);
      } finally {
        setIsPageLoading(false);
      }
    };

    loadSettings();
  }, []);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const saveCurrencySettings = async () => {
    setIsLoading(true);
    try {
      const formattedCurrencies = currencies.map(c => ({
        ...c,
        rate: typeof c.rate === 'number' ? c.rate : parseFloat(String(c.rate)) || 1
      }));

      const response = await fetch('/api/admin/currency-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencySettings, currencies: formattedCurrencies }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        clearCurrencyCache();
        await refreshCurrencyData();
        showToast('Currency settings saved successfully!', 'success');
      } else {
        const errorMessage = data.error || 'Failed to save currency settings';
        console.error('Save failed:', errorMessage);
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error saving currency settings:', error);
      showToast('Error saving currency settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const addCurrency = async () => {
    if (newCurrency.code.trim() && newCurrency.name.trim() && newCurrency.symbol.trim()) {
      const newId = Math.max(...currencies.map(c => c.id), 0) + 1;
      const newCurrencyItem = {
        id: newId,
        code: newCurrency.code.toUpperCase(),
        name: newCurrency.name,
        symbol: newCurrency.symbol,
        rate: newCurrency.rate,
        enabled: true,
      };

      const updatedCurrencies = [...currencies, newCurrencyItem];
      setCurrencies(updatedCurrencies);

      try {
        const response = await fetch('/api/admin/currency-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currencySettings, currencies: updatedCurrencies }),
        });

        if (response.ok) {

          clearCurrencyCache();
          await refreshCurrencyData();
          showToast('Currency added and saved successfully!', 'success');
        } else {
          showToast('Currency added but failed to save', 'error');
        }
      } catch (error) {
        console.error('Error auto-saving currency:', error);
        showToast('Currency added but failed to save', 'error');
      }

      setNewCurrency({ code: '', name: '', symbol: '', rate: 1, symbolPosition: 'left' });
    }
  };

  const editCurrency = async (id: number, updates: Partial<Currency>) => {
    const currencyToEdit = currencies.find(c => c.id === id);
    if (currencyToEdit?.code === 'USD') {
      showToast('Cannot edit USD - it\'s the core currency', 'error');
      return;
    }
    const updatedCurrencies = currencies.map(c => c.id === id ? { ...c, ...updates } : c);
    setCurrencies(updatedCurrencies);

    try {
      const formattedCurrencies = updatedCurrencies.map(c => ({
        ...c,
        rate: typeof c.rate === 'number' ? c.rate : parseFloat(String(c.rate)) || 1
      }));

      const response = await fetch('/api/admin/currency-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencies: formattedCurrencies }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        clearCurrencyCache();
        await refreshCurrencyData();
        showToast('Currency updated and saved successfully!', 'success');
      } else {
        const errorMessage = data.message || data.error || 'Failed to save currency';
        console.error('Save failed:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          error: errorMessage
        });
        showToast(`Currency updated but failed to save: ${errorMessage}`, 'error');
        setCurrencies(currencies);
      }
    } catch (error) {
      console.error('Error auto-saving currency:', error);
      showToast('Currency updated but failed to save', 'error');
      setCurrencies(currencies);
    }
  };

  const deleteCurrency = async (id: number) => {

    const currencyToDelete = currencies.find(c => c.id === id);
    if (!currencyToDelete) {
      showToast('Currency not found', 'error');
      return;
    }

    if (currencyToDelete.code === 'USD') {
      showToast('Cannot delete USD - it\'s the core currency', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${currencyToDelete.code} (${currencyToDelete.name})?`)) {
      return;
    }

    const updatedCurrencies = currencies.filter(c => c.id !== id);
    setCurrencies(updatedCurrencies);

    try {
      console.log('=== Deleting Currency - Frontend ===');
      console.log('Updated currencies:', updatedCurrencies.map(c => c.code));
      console.log('Deleted currency:', currencyToDelete.code);

      const response = await fetch('/api/admin/currency-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencySettings, currencies: updatedCurrencies }),
      });

      if (response.ok) {

        clearCurrencyCache();
        await refreshCurrencyData();
        showToast(`${currencyToDelete.code} deleted successfully!`, 'success');

        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('currencyUpdated'));
        }, 500);
      } else {
        showToast('Failed to delete currency', 'error');

        setCurrencies(currencies);
      }
    } catch (error) {
      console.error('Error deleting currency:', error);
      showToast('Error deleting currency', 'error');

      setCurrencies(currencies);
    }
  };

  const toggleCurrencyStatus = async (id: number) => {
    const updatedCurrencies = currencies.map(c =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    );

    setCurrencies(updatedCurrencies);

    try {
      const response = await fetch('/api/admin/currency-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencySettings, currencies: updatedCurrencies }),
      });

      if (response.ok) {

        clearCurrencyCache();
        await refreshCurrencyData();
        const currency = updatedCurrencies.find(c => c.id === id);
        showToast(`${currency?.code} ${currency?.enabled ? 'enabled' : 'disabled'} successfully!`, 'success');
      } else {
        showToast('Failed to save currency status', 'error');

        setCurrencies(currencies);
      }
    } catch (error) {
      console.error('Error saving currency status:', error);
      showToast('Failed to save currency status', 'error');

      setCurrencies(currencies);
    }
  };

  if (isPageLoading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <CurrencyPageSkeleton />
        </div>
      </div>
    );
  }

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card card-padding h-fit">
            <div className="card-header">
              <div className="card-icon">
                <FaDollarSign />
              </div>
              <h3 className="card-title">Manage Currencies</h3>
            </div>

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400">
                    <div className="grid grid-cols-12 gap-3 flex-1">
                      <span className="text-left col-span-2">Status</span>
                      <span className="text-left col-span-2">Code</span>
                      <span className="text-left col-span-4">Name</span>
                      <span className="text-left col-span-2">Symbol</span>
                      <span className="text-left col-span-2">Rate</span>
                    </div>
                    <div className="w-20 text-center">Action</div>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto mt-2">
                    {currencies.map((currency) => (
                      <CurrencyItem
                        key={currency.id}
                        currency={currency}
                        onEdit={editCurrency}
                        onDelete={deleteCurrency}
                        onToggleStatus={toggleCurrencyStatus}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Add New Currency</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Currency Code</label>
                    <input
                      type="text"
                      placeholder="USD"
                      maxLength={3}
                      value={newCurrency.code}
                      onChange={(e) => setNewCurrency(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency Name</label>
                    <input
                      type="text"
                      placeholder="US Dollar"
                      value={newCurrency.name}
                      onChange={(e) => setNewCurrency(prev => ({ ...prev, name: e.target.value }))}
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Symbol</label>
                    <input
                      type="text"
                      placeholder="$"
                      maxLength={3}
                      value={newCurrency.symbol}
                      onChange={(e) => setNewCurrency(prev => ({ ...prev, symbol: e.target.value }))}
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Exchange Rate</label>
                    <input
                      type="number"
                      placeholder="1.00"
                      step="0.01"
                      min="0"
                      value={newCurrency.rate}
                      onChange={(e) => setNewCurrency(prev => ({ ...prev, rate: parseFloat(e.target.value) || 1 }))}
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="form-group col-span-2">
                    <label className="form-label">Currency Symbol Position</label>
                    <select
                      value={newCurrency.symbolPosition}
                      onChange={(e) =>
                        setNewCurrency(prev => ({
                          ...prev,
                          symbolPosition: e.target.value as 'left' | 'right' | 'left_space' | 'right_space'
                        }))
                      }
                      className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="left">Left ($100.00)</option>
                      <option value="right">Right (100.00$)</option>
                      <option value="left_space">Left with space ($ 100.00)</option>
                      <option value="right_space">Right with space (100.00 $)</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={addCurrency}
                  className="btn btn-primary btn-sm mt-4 w-full"
                >
                  Add Currency
                </button>
              </div>
            </div>
          </div>
          <div className="card card-padding h-fit">
            <div className="card-header">
              <div className="card-icon">
                <FaDollarSign />
              </div>
              <h3 className="card-title">Currency Settings</h3>
            </div>

            <div className="space-y-6">
              <div className="form-group">
                <label className="form-label">Default Currency</label>
                <div className="form-field w-full px-4 py-3 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white cursor-not-allowed">
                  USD - US Dollar
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  USD is the base currency and cannot be changed
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Display Decimals</label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={currencySettings.displayDecimals}
                  onChange={(e) =>
                    setCurrencySettings(prev => ({
                      ...prev,
                      displayDecimals: parseInt(e.target.value) || 2
                    }))
                  }
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Currency Symbol Position</label>
                <select
                  value={currencySettings.currencyPosition}
                  onChange={(e) =>
                    setCurrencySettings(prev => ({
                      ...prev,
                      currencyPosition: e.target.value as 'left' | 'right' | 'left_space' | 'right_space'
                    }))
                  }
                  className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="left">Left ($100.00)</option>
                  <option value="right">Right (100.00$)</option>
                  <option value="left_space">Left with space ($ 100.00)</option>
                  <option value="right_space">Right with space (100.00 $)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Thousands Separator</label>
                  <input
                    type="text"
                    maxLength={1}
                    value={currencySettings.thousandsSeparator}
                    onChange={(e) =>
                      setCurrencySettings(prev => ({ ...prev, thousandsSeparator: e.target.value }))
                    }
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder=","
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Decimal Separator</label>
                  <input
                    type="text"
                    maxLength={1}
                    value={currencySettings.decimalSeparator}
                    onChange={(e) =>
                      setCurrencySettings(prev => ({ ...prev, decimalSeparator: e.target.value }))
                    }
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="."
                  />
                </div>
              </div>

              <button
                onClick={saveCurrencySettings}
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? <ButtonLoader /> : 'Save Currency Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCurrencyPage;