'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import {
    FaCheck,
    FaCheckCircle,
    FaChevronDown,
    FaChevronLeft,
    FaChevronRight,
    FaChevronUp,
    FaEdit,
    FaExclamationTriangle,
    FaHandshake,
    FaList,
    FaSave,
    FaSearch,
    FaSync,
    FaTimes,
    FaToggleOn,
    FaToggleOff,
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { formatID } from '@/lib/utils';

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
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="toast-close dark:hover:bg-white/10">
        <FaTimes className="toast-close-icon" />
      </button>
    </div>
  );
};

const StepProgress = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { number: 1, title: 'Choose Provider', icon: FaHandshake },
    { number: 2, title: 'Select Category', icon: FaList },
    { number: 3, title: 'Customize Services', icon: FaEdit },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                    isCompleted
                      ? 'bg-green-500 dark:bg-green-400 border-green-500 dark:border-green-400 text-white'
                      : isActive
                      ? 'bg-gradient-to-r from-purple-700 to-purple-500 border-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <FaCheck className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={`text-sm font-medium ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : isCompleted
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Step {step.number}
                  </div>
                  <div
                    className={`text-xs ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : isCompleted
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentStep > step.number ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

interface Provider {
  id: string | number;
  name: string;
  url: string;
  status: 'active' | 'inactive';
  description: string;
}

interface ApiCategory {
  id: number;
  name: string;
  servicesCount: number;
  selected?: boolean;
}

interface Service {
  id: string | number;
  name: string;
  category: string;
  min: number;
  max: number;
  rate: number;
  description: string;
  type: string;
  percent?: number;
  providerPrice?: number;
  refill?: boolean;
  cancel?: boolean;
  currency?: string;
}

const ImportServicesPage = () => {
  const { appName } = useAppNameWithFallback();

  const router = useRouter();

  useEffect(() => {
    setPageTitle('Import Services', appName);
  }, [appName]);

  const [realProviders, setRealProviders] = useState<Provider[]>([]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/admin/providers?filter=active');
        const result = await response.json();

        if (result.success) {
          const formattedProviders = result.data.providers
            .filter((p: any) => p.configured && p.status === 'active')
            .map((p: any) => ({
              id: p.id?.toString() || '',
              name: p.label,
              url: p.apiUrl,
              status: p.status,
              description: `${p.label} - Ready for service import`
            }));
          setRealProviders(formattedProviders);
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
        showToast('Failed to fetch providers', 'error');
      }
    };

    fetchProviders();
  }, []);


  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedServices, setEditedServices] = useState<{
    [key: string]: Partial<Service>;
  }>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<{
    [key: string]: boolean;
  }>({});

  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [profitPercent, setProfitPercent] = useState<number>(10);

  const [apiCategories, setApiCategories] =
    useState<ApiCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [hasMoreServices, setHasMoreServices] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [duplicateServices, setDuplicateServices] = useState<Set<string>>(new Set());

  const checkDuplicateServices = async (servicesToCheck: Service[]) => {
    try {
      console.log('🔍 Checking duplicates for services:', servicesToCheck.length);
      console.log('Selected provider:', selectedProvider);
      console.log('Sample service IDs:', servicesToCheck.slice(0, 3).map(s => s.id));

      const response = await fetch('/api/admin/services/check-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          services: servicesToCheck,
          providerId: selectedProvider 
        })
      });

      console.log('API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Duplicate check result:', result);
        if (result.success && result.data && result.data.duplicateIds) {
          console.log('Setting duplicate services:', result.data.duplicateIds);
          setDuplicateServices(new Set(result.data.duplicateIds));
        } else {
          console.log('No duplicates found or invalid response structure');
          setDuplicateServices(new Set());
        }
      } else {
        console.error('API response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
    }
  };

  const groupedServices = useMemo(() => {
    const filteredServices = services.filter(
      (service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.id?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const grouped: { [key: string]: Service[] } = {};
    filteredServices.forEach((service) => {
      if (!grouped[service.category]) {
        grouped[service.category] = [];
      }
      grouped[service.category].push(service);
    });

    return grouped;
  }, [services, searchTerm]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleCategorySelect = (categoryId: string | number) => {
    setApiCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, selected: !cat.selected } : cat
      )
    );
  };

  const handleSelectAllCategories = () => {
    const allSelected = apiCategories.every((cat) => cat.selected);
    setApiCategories((prev) =>
      prev.map((cat) => ({ ...cat, selected: !allSelected }))
    );
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    setIsLoading(true);

    try {

      const response = await fetch(`/api/admin/services/import?action=categories&providerId=${selectedProvider}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      console.log('Categories API response:', result);

      if (result.success) {
        const categories = result.data.categories.map((cat: any) => ({
          ...cat,
          servicesCount: cat.servicesCount || 0,
          selected: false
        }));

        setApiCategories(categories);

        showToast(
          `Loaded ${categories.length} categories from ${result.data.provider}`,
          'success'
        );
      } else {
        showToast(`Failed to load categories: ${result.error}`, 'error');

        setApiCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Failed to load categories', 'error');

      setApiCategories([]);
    } finally {
      setCategoriesLoading(false);
      setIsLoading(false);
    }
  };

  const getProviderName = (providerId: string) => {
    const provider = realProviders.find((p) => p.id?.toString() === providerId);
    return provider ? provider.name : 'Unknown Provider';
  };

  const loadServicesForCategories = async (page = 1, append = false) => {
    if (!append) {
      setIsLoading(true);
      setServices([]);
      setCurrentPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const selectedCategoryNames = apiCategories
        .filter((cat) => cat.selected)
        .map((cat) => cat.name);

      if (selectedCategoryNames.length === 0) {
        setServices([]);
        setIsLoading(false);
        setLoadingMore(false);
        return;
      }

      const response = await fetch('/api/admin/services/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'services',
          providerId: selectedProvider,
          categories: selectedCategoryNames,
          page: page,
          limit: 1000
        })
      });

      console.log('🔥 API Response status:', response.status);
      console.log('🔥 API Response headers:', response.headers.get('content-type'));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔥 API Error response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('🔥 Raw API Response:', responseText.substring(0, 500));

      if (!responseText.trim()) {
        throw new Error('Empty response from API');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('🔥 JSON Parse Error:', parseError);
        console.error('🔥 Response text:', responseText);
        throw new Error('Invalid JSON response from API');
      }

      if (result.success) {
        const categoryServices = result.data.services || [];
        const pagination = result.data.pagination || {};

        console.log('📄 Pagination info:', pagination);

        const servicesWithProfit = categoryServices.map((service: any) => {
          const providerPrice = parseFloat(service.rate) || 0;
          const salePrice = parseFloat((providerPrice * (1 + profitPercent / 100)).toFixed(2));

          console.log(`🔥 Service: ${service.name}, Provider: $${providerPrice}, Sale: $${salePrice}, Profit: ${profitPercent}%`);
          console.log(`📝 Service Description: "${service.description}" (length: ${service.description?.length || 0})`);
          console.log(`🔄 Refill: ${service.refill}, Cancel: ${service.cancel}`);

          return {
            ...service,
            providerPrice: providerPrice,
            rate: salePrice,
            percent: profitPercent,
            description: service.description || '',
            refill: service.refill || false,
            cancel: service.cancel || false,
          };
        });

        setCurrentPage(pagination.page || 1);
        setTotalPages(pagination.totalPages || 1);
        setTotalServices(pagination.total || categoryServices.length);
        setHasMoreServices(pagination.hasMore || false);

        if (append) {

          setServices(prev => [...prev, ...servicesWithProfit]);
          showToast(`Loaded ${servicesWithProfit.length} more services (${services.length + servicesWithProfit.length}/${pagination.total || servicesWithProfit.length} total)`, 'success');
        } else {

          setServices(servicesWithProfit);
          showToast(`Loaded ${servicesWithProfit.length} services from selected categories (${pagination.total || servicesWithProfit.length} total available)`, 'success');
        }

        await checkDuplicateServices(servicesWithProfit);
      } else {
        showToast(`Failed to load services: ${result.error}`, 'error');
        if (!append) {
          setServices([]);
        }
      }
    } catch (error) {
      console.error('Error loading services:', error);
      showToast('Failed to load services', 'error');
      if (!append) {
        setServices([]);
      }
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreServices = async () => {
    if (hasMoreServices && !loadingMore && !isLoading) {
      const nextPage = currentPage + 1;
      console.log(`🔄 Loading more services - Page ${nextPage}`);
      await loadServicesForCategories(nextPage, true);
    }
  };

  const calculateSalePrice = (service: Service, percentage: number) => {
    const providerPrice = parseFloat(service.providerPrice?.toString() || '0') || 0;
    const salePrice = parseFloat((providerPrice * (1 + percentage / 100)).toFixed(2));

    console.log(`💰 Calculating: Provider $${providerPrice} + ${percentage}% = $${salePrice}`);

    return salePrice;
  };

  const getCurrentSalePrice = (service: Service) => {
    const currentPercent = getCurrentValue(service, 'percent') as number;
    return calculateSalePrice(service, currentPercent);
  };

  const handleFieldChange = (
    serviceId: string | number,
    field: keyof Service,
    value: string | number
  ) => {
    const id = serviceId?.toString();
    if (!id) return;

    setEditedServices((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const getCurrentValue = (service: Service, field: keyof Service) => {
    if (!service || !service.id) return service?.[field];

    const serviceId = service.id?.toString();
    if (!serviceId) return service[field];

    return editedServices[serviceId]?.[field] !== undefined
      ? editedServices[serviceId][field]
      : service[field];
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!selectedProvider) {
        showToast('Please select a provider', 'error');
        return;
      }

      const selectedProviderData = realProviders.find(
        (p) => p.id?.toString() === selectedProvider
      );

      if (selectedProviderData?.status === 'inactive') {
        showToast('Selected provider is inactive. Please select an active provider.', 'error');
        return;
      }

      if (profitPercent < 0 || profitPercent > 100) {
        showToast('Profit percent must be between 0 and 100', 'error');
        return;
      }
      setCurrentStep(2);
      await loadCategories();
    } else if (currentStep === 2) {
      const selectedCategories = apiCategories.filter((cat) => cat.selected);
      console.log('🔥 DEBUG: Selected categories for step 3:', selectedCategories);
      if (selectedCategories.length === 0) {
        showToast('Please select at least one category', 'error');
        return;
      }
      console.log('🔥 DEBUG: Moving to step 3, about to load services...');
      setCurrentStep(3);
      console.log('🔥 DEBUG: Current services before loading:', services.length);
      await loadServicesForCategories();
      console.log('🔥 DEBUG: Current services after loading:', services.length);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveServices = async () => {
    try {
      setIsImporting(true);
      showToast('Importing services...', 'pending');

      const response = await fetch('/api/admin/services/import', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: parseInt(selectedProvider),
          profitMargin: profitPercent,
          services: services.map(service => ({
            ...service,
            ...editedServices[service.id]
          }))
        }),
      });

      const result = await response.json();

      if (result.success) {
        const { imported, skipped, errors, provider } = result.data;

        showToast(
          `Successfully imported ${imported} services from ${provider}${
            skipped > 0 ? ` (${skipped} skipped)` : ''
          }${errors > 0 ? ` (${errors} errors)` : ''}`,
          'success'
        );

        try {
          await fetch('/api/admin/categories/get-categories', {
            method: 'GET',
            cache: 'no-store'
          });
          await fetch('/api/admin/services', {
            method: 'GET',
            cache: 'no-store'
          });
        } catch (refreshError) {
          console.log('Cache refresh error (non-critical):', refreshError);
        }

      } else {
        showToast(`Failed to import services: ${result.error}`, 'error');
        setIsImporting(false);
        return;
      }

      setCurrentStep(1);
      setSelectedProvider('');
      setServices([]);
      setEditedServices({});

      setTimeout(() => {
        router.push('/admin/services');
      }, 1500);
    } catch (error: any) {
      console.error('Error importing services:', error);
      setIsImporting(false);
      showToast(
        `Error importing services: ${error.message || 'Unknown error'}`,
        'error'
      );
    }
  };

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
        <StepProgress currentStep={currentStep} />
        <div className="card animate-in fade-in duration-500">
          <div className="px-6 py-6">
            <h2
              className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100"
            >
              {currentStep === 1 && 'Choose Provider'}
              {currentStep === 2 && 'Select Categories'}
              {currentStep === 3 && 'Customize Services'}
            </h2>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label
                    className="form-label mb-3 text-gray-700 dark:text-gray-300"
                  >
                    Select API Provider
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="">-- Select API Provider --</option>
                    {realProviders.map((provider) => (
                      <option
                        key={provider.id}
                        value={provider.id}
                        disabled={provider.status === 'inactive'}
                        style={{
                          color: provider.status === 'inactive' ? '#9CA3AF' : 'inherit',
                          fontStyle: provider.status === 'inactive' ? 'italic' : 'normal'
                        }}
                      >
                        {provider.name} {provider.status === 'inactive' ? '(inactive)' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedProvider && (
                    <div className="mt-2 space-y-2">
                      {(() => {
                        const selectedProviderData = realProviders.find(
                          (p) => p.id?.toString() === selectedProvider
                        );

                        if (selectedProviderData?.status === 'inactive') {
                          return (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FaExclamationTriangle className="text-red-500 dark:text-red-400 w-4 h-4" />
                                <div className="text-sm text-red-700 dark:text-red-200 font-medium">
                                  This provider is inactive and cannot be used for importing services.
                                </div>
                              </div>
                              <div className="text-xs text-red-600 dark:text-red-300 mt-1">
                                Please select an active provider to continue.
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div
                              className="text-sm text-gray-600 dark:text-gray-400"
                            >
                              {selectedProviderData?.description}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div>
                  <label
                    className="form-label mb-3 text-gray-700 dark:text-gray-300"
                  >
                    Profit Percent
                  </label>
                  <div className="max-w-md">
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={profitPercent}
                        onChange={(e) =>
                          setProfitPercent(parseInt(e.target.value))
                        }
                        className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={profitPercent}
                          onChange={(e) =>
                            setProfitPercent(
                              Math.max(
                                0,
                                Math.min(100, parseInt(e.target.value) || 0)
                              )
                            )
                          }
                          className="form-field w-20 px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="0"
                          max="100"
                        />
                        <span
                          className="font-medium text-gray-600 dark:text-gray-400"
                        >
                          %
                        </span>
                      </div>
                    </div>
                    <p
                      className="text-xs mt-2 text-gray-500 dark:text-gray-400"
                    >
                      This percentage will be added to all imported service
                      prices as your profit margin.
                    </p>
                  </div>
                </div>
                {selectedProvider && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Import Summary
                    </h4>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <p>
                        <strong>Provider:</strong>{' '}
                        {getProviderName(selectedProvider)}
                      </p>
                      <p>
                        <strong>Profit Margin:</strong> {profitPercent}%
                      </p>
                      <p>
                        <strong>Example:</strong> If provider price is $1.00,
                        your price will be $
                        {(1 * (1 + profitPercent / 100)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-6">
                {categoriesLoading ? (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="h-5 w-48 gradient-shimmer rounded mb-2" />
                          <div className="h-4 w-64 gradient-shimmer rounded" />
                        </div>
                        <div className="h-9 w-24 gradient-shimmer rounded-lg" />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[600px]">
                        <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
                          <tr>
                            <th className="text-left p-3">
                              <div className="h-4 w-4 gradient-shimmer rounded" />
                            </th>
                            <th className="text-left p-3">
                              <div className="h-4 w-32 gradient-shimmer rounded" />
                            </th>
                            <th className="text-left p-3">
                              <div className="h-4 w-28 gradient-shimmer rounded" />
                            </th>
                            <th className="text-left p-3">
                              <div className="h-4 w-20 gradient-shimmer rounded" />
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 8 }).map((_, idx) => (
                            <tr key={idx} className="border-t dark:border-gray-700">
                              <td className="p-3">
                                <div className="h-4 w-4 gradient-shimmer rounded" />
                              </td>
                              <td className="p-3">
                                <div className="h-4 w-40 gradient-shimmer rounded" />
                              </td>
                              <td className="p-3">
                                <div className="h-4 w-16 gradient-shimmer rounded" />
                              </td>
                              <td className="p-3">
                                <div className="h-6 w-20 gradient-shimmer rounded-full" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4
                            className="font-semibold text-gray-900 dark:text-gray-100"
                          >
                            Connected to {getProviderName(selectedProvider)}
                          </h4>
                          <p
                            className="text-sm text-gray-600 dark:text-gray-400"
                          >
                            Select categories to import services from
                          </p>
                        </div>
                        <button
                          onClick={loadCategories}
                          className="btn btn-secondary flex items-center gap-2"
                        >
                          <FaSync />
                          Refresh
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[600px]">
                        <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
                          <tr>
                            <th className="text-left p-3 font-semibold">
                              <input
                                type="checkbox"
                                checked={apiCategories.every(
                                  (cat) => cat.selected
                                )}
                                onChange={handleSelectAllCategories}
                                className="rounded border-gray-300 w-4 h-4"
                              />
                            </th>
                            <th
                              className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                            >
                              Category Name
                            </th>
                            <th
                              className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                            >
                              Services Count
                            </th>
                            <th
                              className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                            >
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiCategories.map((category) => (
                            <tr
                              key={category.id}
                              className={`border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200 ${
                                category.selected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                              }`}
                            >
                              <td className="p-3">
                                <input
                                  type="checkbox"
                                  checked={category.selected || false}
                                  onChange={() =>
                                    handleCategorySelect(category.id)
                                  }
                                  className="rounded border-gray-300 w-4 h-4"
                                />
                              </td>
                              <td className="p-3">
                                <div
                                  className="font-medium text-gray-900 dark:text-gray-100"
                                >
                                  {category.name}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    {category.servicesCount.toString()}
                                  </span>
                                  <span
                                    className="text-xs text-gray-500 dark:text-gray-400"
                                  >
                                    services
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                {category.selected ? (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
                                    <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
                                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                      Selected
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full w-fit">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                      Available
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {apiCategories.some((cat) => cat.selected) && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                          Selection Summary
                        </h4>
                        <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <p>
                            <strong>Selected Categories:</strong>{' '}
                            {apiCategories.filter((cat) => cat.selected).length}
                          </p>
                          <p>
                            <strong>Total Services:</strong>{' '}
                            {apiCategories
                              .filter((cat) => cat.selected)
                              .reduce((sum, cat) => sum + (cat.servicesCount || 0), 0)
                              .toString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-6">
                {isLoading ? (
                  <>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                        <div className="mb-2 md:mb-0">
                          <div className="h-5 w-48 gradient-shimmer rounded mb-2" />
                          <div className="h-4 w-64 gradient-shimmer rounded" />
                        </div>
                        <div className="h-4 w-32 gradient-shimmer rounded" />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-2">
                      <div className="h-10 w-full md:max-w-md gradient-shimmer rounded-lg" />
                      <div className="h-10 w-32 gradient-shimmer rounded-lg" />
                    </div>
                    <div className="hidden lg:block card animate-in fade-in duration-500">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[1000px]">
                          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
                            <tr>
                              {Array.from({ length: 8 }).map((_, idx) => (
                                <th key={idx} className="text-left p-3">
                                  <div className="h-4 w-20 gradient-shimmer rounded" />
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 3 }).map((_, catIdx) => (
                              <React.Fragment key={catIdx}>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-t-2 border-gray-200 dark:border-gray-700">
                                  <td colSpan={8} className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="h-4 w-4 gradient-shimmer rounded" />
                                        <div className="h-5 w-32 gradient-shimmer rounded" />
                                        <div className="h-6 w-20 gradient-shimmer rounded-full" />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                                {Array.from({ length: 3 }).map((_, serviceIdx) => (
                                  <tr key={serviceIdx} className="border-t dark:border-gray-700">
                                    <td className="p-3 pl-8">
                                      <div className="h-6 w-16 gradient-shimmer rounded" />
                                    </td>
                                    <td className="p-3">
                                      <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                                    </td>
                                    <td className="p-3">
                                      <div className="h-6 w-16 gradient-shimmer rounded-full" />
                                    </td>
                                    <td className="p-3">
                                      <div className="h-4 w-12 gradient-shimmer rounded mb-1" />
                                      <div className="h-3 w-20 gradient-shimmer rounded" />
                                    </td>
                                    <td className="p-3">
                                      <div className="h-[42px] w-20 gradient-shimmer rounded-lg" />
                                    </td>
                                    <td className="p-3">
                                      <div className="h-8 w-8 gradient-shimmer rounded mx-auto" />
                                    </td>
                                    <td className="p-3">
                                      <div className="h-8 w-8 gradient-shimmer rounded mx-auto" />
                                    </td>
                                    <td className="p-3">
                                      <div className="h-16 w-full gradient-shimmer rounded-lg" />
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="lg:hidden space-y-6">
                      {Array.from({ length: 3 }).map((_, catIdx) => (
                        <div key={catIdx} className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="h-4 w-4 gradient-shimmer rounded" />
                                <div className="h-5 w-32 gradient-shimmer rounded" />
                                <div className="h-6 w-20 gradient-shimmer rounded-full ml-auto" />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4 ml-4">
                            {Array.from({ length: 2 }).map((_, serviceIdx) => (
                              <div key={serviceIdx} className="card card-padding border-l-4 border-blue-500">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="h-6 w-16 gradient-shimmer rounded" />
                                  <div className="h-5 w-16 gradient-shimmer rounded-full" />
                                </div>
                                <div className="mb-4">
                                  <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                                  <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                                    <div className="h-10 w-full gradient-shimmer rounded" />
                                  </div>
                                  <div>
                                    <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <div className="h-4 w-16 gradient-shimmer rounded mb-2" />
                                    <div className="h-8 w-8 gradient-shimmer rounded" />
                                  </div>
                                  <div>
                                    <div className="h-4 w-16 gradient-shimmer rounded mb-2" />
                                    <div className="h-8 w-8 gradient-shimmer rounded" />
                                  </div>
                                </div>
                                <div>
                                  <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                                  <div className="h-20 w-full gradient-shimmer rounded-lg" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                    <div className="mb-2 md:mb-0">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                        Services Ready for Import
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {services.length} services loaded{totalServices > 0 && ` of ${totalServices} total`} with {profitPercent}%
                        profit margin applied
                      </p>
                      {hasMoreServices && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          📄 Page {currentPage} of {totalPages} • {totalServices - services.length} more services available
                        </p>
                      )}
                    </div>
                    <div className="text-left md:text-right">
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Provider:</strong>{' '}
                        {getProviderName(selectedProvider)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-2">
                  <div className="relative flex-1 md:max-w-md">
                    <FaSearch
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                    {hasChanges && (
                      <div className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <FaEdit className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                          You have unsaved changes
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        const allCategories = Object.keys(groupedServices);
                        const allCollapsed = allCategories.every(
                          (cat) => collapsedCategories[cat]
                        );

                        if (allCollapsed) {

                          setCollapsedCategories({});
                        } else {

                          const newCollapsed: { [key: string]: boolean } = {};
                          allCategories.forEach((cat) => {
                            newCollapsed[cat] = true;
                          });
                          setCollapsedCategories(newCollapsed);
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title={
                        Object.keys(groupedServices).every(
                          (cat) => collapsedCategories[cat]
                        )
                          ? 'Expand all categories'
                          : 'Collapse all categories'
                      }
                    >
                      {Object.keys(groupedServices).every(
                        (cat) => collapsedCategories[cat]
                      ) ? (
                        <>
                          <FaChevronDown className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Expand All
                          </span>
                        </>
                      ) : (
                        <>
                          <FaChevronUp className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Collapse All
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {Object.keys(groupedServices).length === 0 ? (
                  <div className="text-center py-12">
                    <FaExclamationTriangle
                      className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
                    />
                    <h3
                      className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300"
                    >
                      No services found
                    </h3>
                    <p
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
                      {searchTerm
                        ? 'No services match your search criteria.'
                        : 'No services available for selected categories.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden lg:block card animate-in fade-in duration-500">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[1000px]">
                          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
                            <tr>
                              <th
                                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                              >
                                ID
                              </th>
                              <th
                                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                              >
                                Service Name
                              </th>
                              <th
                                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                              >
                                Type
                              </th>
                              <th
                                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                              >
                                Price (USD)
                              </th>
                              <th
                                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                              >
                                Percent
                              </th>
                              <th
                                className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100"
                              >
                                Refill
                              </th>
                              <th
                                className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100"
                              >
                                Cancel
                              </th>
                              <th
                                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                              >
                                Description
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(groupedServices).map(
                              ([category, categoryServices]) => (
                                <React.Fragment key={category}>
                                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-t-2 border-gray-200 dark:border-gray-700">
                                    <td colSpan={8} className="p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <button
                                            onClick={() =>
                                              toggleCategoryCollapse(category)
                                            }
                                            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded p-1 transition-colors"
                                          >
                                            {collapsedCategories[category] ? (
                                              <FaChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                            ) : (
                                              <FaChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                            )}
                                          </button>

                                          <span className="font-semibold text-md text-gray-800 dark:text-gray-100">
                                            {category}
                                          </span>
                                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded-full text-sm font-medium">
                                            {categoryServices.length} service
                                            {categoryServices.length !== 1
                                              ? 's'
                                              : ''}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {categoryServices.filter(
                                            (service) =>
                                              editedServices[service.id]
                                          ).length > 0 && (
                                            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded-full">
                                              {
                                                categoryServices.filter(
                                                  (service) =>
                                                    editedServices[service.id]
                                                ).length
                                              }{' '}
                                              modified
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  {!collapsedCategories[category] &&
                                    (categoryServices.length > 0 ? (
                                      categoryServices.map((service, index) => (
                                        <tr
                                          key={`${category}-${service.id}-${index}`}
                                          className={`border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200 animate-in fade-in slide-in-from-left-1 ${
                                            duplicateServices.has(service.id.toString())
                                              ? 'bg-red-50/70 dark:bg-red-900/20'
                                              : editedServices[service.id]
                                              ? 'bg-yellow-50 dark:bg-yellow-900/20'
                                              : ''
                                          }`}
                                          style={{
                                            animationDelay: `${index * 25}ms`,
                                          }}
                                        >
                                          <td className="p-3 pl-8">
                                            <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded w-fit">
                                              {formatID(service.id)}
                                            </div>
                                          </td>
                                          <td className="p-3">
                                            {duplicateServices.has(service.id.toString()) ? (
                                              <div className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                                                {getCurrentValue(service, 'name') as string}
                                              </div>
                                            ) : (
                                              <input
                                                type="text"
                                                value={
                                                  getCurrentValue(
                                                    service,
                                                    'name'
                                                  ) as string
                                                }
                                                onChange={(e) =>
                                                  handleFieldChange(
                                                    service.id,
                                                    'name',
                                                    e.target.value
                                                  )
                                                }
                                                className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                                              />
                                            )}
                                          </td>
                                          {duplicateServices.has(service.id.toString()) ? (
                                            <td colSpan={6} className="p-3 text-center">
                                              <div className="text-red-600 dark:text-red-400 font-medium text-sm flex items-center justify-center gap-1">
                                                Already imported!
                                              </div>
                                            </td>
                                          ) : (
                                            <>
                                              <td className="p-3">
                                                <div className="text-sm">
                                                  <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                                                    {service.type || 'Default'}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="p-3">
                                                <div className="text-left">
                                                  <div
                                                    className="font-semibold text-sm text-gray-900 dark:text-gray-100"
                                                  >
                                                    ${getCurrentSalePrice(service)}
                                                  </div>
                                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Provider: $
                                                    {service.providerPrice ? parseFloat(service.providerPrice.toString()).toFixed(2) : '0.00'}
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="p-3">
                                                <input
                                                  type="number"
                                                  value={
                                                    getCurrentValue(
                                                      service,
                                                      'percent'
                                                    ) as number
                                                  }
                                                  onChange={(e) =>
                                                    handleFieldChange(
                                                      service.id,
                                                      'percent',
                                                      parseFloat(e.target.value) ||
                                                        0
                                                    )
                                                  }
                                                  className="form-field w-20 px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                  min="0"
                                                  max="1000"
                                                  step="0.1"
                                                />
                                              </td>
                                              <td className="p-3">
                                                <div className="text-center">
                                                  <button
                                                    className={`p-1 rounded transition-colors duration-200 ${
                                                      service.refill
                                                        ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                    }`}
                                                    title={
                                                      service.refill ? 'Refill Enabled' : 'Refill Disabled'
                                                    }
                                                    onClick={() => {}}
                                                  >
                                                    {service.refill ? (
                                                      <FaToggleOn className="h-5 w-5" />
                                                    ) : (
                                                      <FaToggleOff className="h-5 w-5" />
                                                    )}
                                                  </button>
                                                </div>
                                              </td>
                                              <td className="p-3">
                                                <div className="text-center">
                                                  <button
                                                    className={`p-1 rounded transition-colors duration-200 ${
                                                      service.cancel
                                                        ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                    }`}
                                                    title={
                                                      service.cancel ? 'Cancel Enabled' : 'Cancel Disabled'
                                                    }
                                                    onClick={() => {}}
                                                  >
                                                    {service.cancel ? (
                                                      <FaToggleOn className="h-5 w-5" />
                                                    ) : (
                                                      <FaToggleOff className="h-5 w-5" />
                                                    )}
                                                  </button>
                                                </div>
                                              </td>
                                              <td className="p-3">
                                                <textarea
                                                  value={
                                                    getCurrentValue(
                                                      service,
                                                      'description'
                                                    ) as string
                                                  }
                                                  onChange={(e) =>
                                                    handleFieldChange(
                                                      service.id,
                                                      'description',
                                                      e.target.value
                                                    )
                                                  }
                                                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 resize-y"
                                                  rows={2}
                                                />
                                              </td>
                                            </>
                                          )}
                                        </tr>
                                      ))
                                    ) : (
                                      <tr className="border-t dark:border-gray-700">
                                        <td
                                          colSpan={8}
                                          className="p-8 text-center"
                                        >
                                          <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                            <FaExclamationTriangle className="h-8 w-8 mb-2 text-gray-400 dark:text-gray-500" />
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                              No services in this category
                                            </p>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                </React.Fragment>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="lg:hidden space-y-6">
                      {Object.entries(groupedServices).map(
                        ([category, categoryServices]) => (
                          <div
                            key={category}
                            className="space-y-4 animate-in fade-in duration-500"
                          >
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border-l-4 border-blue-500 dark:border-blue-400">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <button
                                    onClick={() =>
                                      toggleCategoryCollapse(category)
                                    }
                                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded p-1 transition-colors"
                                  >
                                    {collapsedCategories[category] ? (
                                      <FaChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                    ) : (
                                      <FaChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                    )}
                                  </button>

                                  <span className="font-semibold text-md text-gray-800 dark:text-gray-100">
                                    {category}
                                  </span>
                                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded-full text-sm font-medium ml-auto">
                                    {categoryServices.length} service
                                    {categoryServices.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              {categoryServices.filter(
                                (service) => editedServices[service.id]
                              ).length > 0 && (
                                <div className="mt-2">
                                  <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded-full text-xs">
                                    {
                                      categoryServices.filter(
                                        (service) => editedServices[service.id]
                                      ).length
                                    }{' '}
                                    modified
                                  </span>
                                </div>
                              )}
                            </div>
                            {!collapsedCategories[category] && (
                              <div className="space-y-4 ml-4">
                                {categoryServices.length > 0 ? (
                                  categoryServices.map((service, index) => (
                                    <div
                                      key={`${category}-${service.id}-${index}`}
                                      className={`card card-padding border-l-4 border-blue-500 dark:border-blue-400 animate-in fade-in slide-in-from-right-1 ${
                                        editedServices[service.id]
                                          ? 'bg-yellow-50 dark:bg-yellow-900/20'
                                          : ''
                                      }`}
                                      style={{
                                        animationDelay: `${index * 50}ms`,
                                      }}
                                    >
                                      <div className="flex items-center justify-between mb-4">
                                        <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                                          {formatID(service.id)}
                                        </div>
                                        {editedServices[service.id] && (
                                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded">
                                            Modified
                                          </span>
                                        )}
                                      </div>
                                      <div className="mb-4">
                                        <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
                                          Service Name
                                        </label>
                                        <input
                                          type="text"
                                          value={
                                            getCurrentValue(
                                              service,
                                              'name'
                                            ) as string
                                          }
                                          onChange={(e) =>
                                            handleFieldChange(
                                              service.id,
                                              'name',
                                              e.target.value
                                            )
                                          }
                                          className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
                                            Price (USD)
                                          </label>
                                          <div className="space-y-1">
                                            <div
                                              className="font-semibold text-sm bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded text-gray-900 dark:text-gray-100"
                                            >
                                              ${getCurrentSalePrice(service)}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 px-3">
                                              Provider: $
                                              {service.providerPrice ? parseFloat(service.providerPrice.toString()).toFixed(2) : '0.00'}
                                            </div>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
                                            Profit Percent
                                          </label>
                                          <input
                                            type="number"
                                            value={
                                              getCurrentValue(
                                                service,
                                                'percent'
                                              ) as number
                                            }
                                            onChange={(e) =>
                                              handleFieldChange(
                                                service.id,
                                                'percent',
                                                parseFloat(e.target.value) || 0
                                              )
                                            }
                                            className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            min="0"
                                            max="1000"
                                            step="0.1"
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
                                            Refill
                                          </label>
                                          <div className="flex items-center">
                                            <button
                                              className={`p-1 rounded transition-colors duration-200 ${
                                                service.refill
                                                  ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                              }`}
                                              title={
                                                service.refill ? 'Refill Enabled' : 'Refill Disabled'
                                              }
                                              onClick={() => {}}
                                            >
                                              {service.refill ? (
                                                <FaToggleOn className="h-6 w-6" />
                                              ) : (
                                                <FaToggleOff className="h-6 w-6" />
                                              )}
                                            </button>
                                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                              {service.refill ? 'Enabled' : 'Disabled'}
                                            </span>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
                                            Cancel
                                          </label>
                                          <div className="flex items-center">
                                            <button
                                              className={`p-1 rounded transition-colors duration-200 ${
                                                service.cancel
                                                  ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                              }`}
                                              title={
                                                service.cancel ? 'Cancel Enabled' : 'Cancel Disabled'
                                              }
                                              onClick={() => {}}
                                            >
                                              {service.cancel ? (
                                                <FaToggleOn className="h-6 w-6" />
                                              ) : (
                                                <FaToggleOff className="h-6 w-6" />
                                              )}
                                            </button>
                                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                              {service.cancel ? 'Enabled' : 'Disabled'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
                                          Description
                                        </label>
                                        <textarea
                                          value={
                                            getCurrentValue(
                                              service,
                                              'description'
                                            ) as string
                                          }
                                          onChange={(e) =>
                                            handleFieldChange(
                                              service.id,
                                              'description',
                                              e.target.value
                                            )
                                          }
                                          className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-y"
                                          rows={3}
                                        />
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-8 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                      <FaExclamationTriangle className="h-8 w-8 mb-2 text-gray-400 dark:text-gray-500" />
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                        No services in this category
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                    {hasMoreServices && !isLoading && (
                      <div className="flex justify-center py-6">
                        <button
                          onClick={loadMoreServices}
                          disabled={loadingMore}
                          className="btn btn-primary flex items-center gap-2 px-6 py-3"
                        >
                          {loadingMore ? (
                            <>
                              Loading More...
                            </>
                          ) : (
                            <>
                              <FaChevronDown />
                              Load More Services ({totalServices - services.length} remaining)
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
                </>
                )}
              </div>
            )}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t dark:border-gray-700 mt-8">
              <div className="w-full md:w-auto">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevious}
                    disabled={isLoading}
                    className="btn btn-secondary flex items-center gap-2 w-full justify-center"
                  >
                    <FaChevronLeft />
                    Previous
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {currentStep < 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={
                      isLoading ||
                      (currentStep === 1 && (
                        !selectedProvider ||
                        realProviders.find(
                          (p) => p.id?.toString() === selectedProvider
                        )?.status === 'inactive'
                      ))
                    }
                    className="btn btn-primary flex items-center gap-2 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <FaChevronRight />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveServices}
                    disabled={isLoading || isImporting || services.length === 0}
                    className="btn btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700 w-full justify-center"
                  >
                    {isLoading ? (
                      <>
                        Loading Services...
                      </>
                    ) : isImporting ? (
                      <>
                        Importing...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Import {services.length} Services
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportServicesPage;