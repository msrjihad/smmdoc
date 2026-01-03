'use client';

import React, { useEffect, useState } from 'react';
import {
  FaChartBar,
  FaCheck,
  FaCheckCircle,
  FaCog,
  FaEdit,
  FaEllipsisH,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaGlobe,
  FaPause,
  FaPlay,
  FaPlus,
  FaSearch,
  FaSync,
  FaTimes,
  FaToggleOff,
  FaToggleOn,
  FaTrash,
  FaUndo
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';

const ProvidersTableSkeleton = () => {
  const rows = Array.from({ length: 10 });

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-9 w-20 gradient-shimmer rounded-lg" />
          ))}
        </div>
      </div>
      <div className="hidden md:block">
        <table className="w-full text-sm border border-gray-200 dark:border-gray-700">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b border-gray-200 dark:border-gray-700 z-10">
            <tr>
              {Array.from({ length: 8 }).map((_, idx) => (
                <th key={idx} className="text-left p-3">
                  <div className="h-4 rounded w-3/4 gradient-shimmer" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((_, rowIdx) => (
              <tr key={rowIdx} className="border-t border-gray-200 dark:border-gray-700">
                <td className="p-3">
                  <div className="h-6 w-16 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-32 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-20 gradient-shimmer rounded mb-1" />
                  <div className="h-3 w-16 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-16 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-20 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-3 w-24 gradient-shimmer rounded mb-1" />
                  <div className="h-3 w-20 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-5 w-20 gradient-shimmer rounded-full" />
                </td>
                <td className="p-3">
                  <div className="h-5 w-24 gradient-shimmer rounded-full" />
                </td>
                <td className="p-3">
                  <div className="flex gap-1 justify-end">
                    <div className="h-8 w-8 gradient-shimmer rounded" />
                    <div className="h-8 w-8 gradient-shimmer rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-4">
        {rows.map((_, idx) => (
          <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-12 gradient-shimmer rounded" />
                <div className="h-4 w-32 gradient-shimmer rounded" />
              </div>
              <div className="h-6 w-6 gradient-shimmer rounded" />
            </div>
            <div className="mb-3">
              <div className="h-6 w-24 gradient-shimmer rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="h-3 w-16 gradient-shimmer rounded mb-1" />
                <div className="h-4 w-20 gradient-shimmer rounded" />
                <div className="h-3 w-12 gradient-shimmer rounded mt-1" />
              </div>
              <div>
                <div className="h-3 w-12 gradient-shimmer rounded mb-1" />
                <div className="h-4 w-16 gradient-shimmer rounded" />
              </div>
              <div>
                <div className="h-3 w-24 gradient-shimmer rounded mb-1" />
                <div className="h-4 w-20 gradient-shimmer rounded" />
              </div>
              <div>
                <div className="h-3 w-16 gradient-shimmer rounded mb-1" />
                <div className="h-4 w-24 gradient-shimmer rounded" />
                <div className="h-3 w-20 gradient-shimmer rounded mt-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 gradient-shimmer rounded" />
              <div className="h-8 w-8 gradient-shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    </>
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
    {type === 'error' && <FaTimes className="toast-icon" />}
    {type === 'info' && <FaExclamationTriangle className="toast-icon" />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="toast-close">
      <FaTimes className="toast-close-icon" />
    </button>
  </div>
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

interface Provider {
  id: number;
  name: string;
  apiUrl: string;
  apiKey: string;
  httpMethod?: string;
  status: 'active' | 'inactive' | 'trash';
  services: number;
  orders: number;
  importedServices: number;
  activeServices: number;
  inactiveServices: number;
  currentBalance: number;
  successRate: number;
  avgResponseTime: number;
  createdAt: Date;
  lastSync: Date;
  description?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'testing' | 'unknown';

  apiKeyParam?: string;
  actionParam?: string;
  servicesAction?: string;
  servicesEndpoint?: string;
  addOrderAction?: string;
  addOrderEndpoint?: string;
  serviceIdParam?: string;
  linkParam?: string;
  quantityParam?: string;
  runsParam?: string;
  intervalParam?: string;
  statusAction?: string;
  statusEndpoint?: string;
  orderIdParam?: string;
  ordersParam?: string;
  refillAction?: string;
  refillEndpoint?: string;
  refillStatusAction?: string;
  refillIdParam?: string;
  refillsParam?: string;
  cancelAction?: string;
  cancelEndpoint?: string;
  balanceAction?: string;
  balanceEndpoint?: string;
  responseMapping?: string;
  requestFormat?: string;
  responseFormat?: string;
  rateLimitPerMin?: number;
  timeoutSeconds?: number;
}

const APIProvidersPage = () => {
  console.log('🚀 APIProvidersPage component loaded');

  if (typeof window !== 'undefined') {
    console.log('🌐 Window object available, component is in browser');
  }

  const { appName } = useAppNameWithFallback();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');

  useEffect(() => {
    document.title = `API Providers — ${appName}`;
  }, [appName]);

  useEffect(() => {
    const loadTimeFormat = async () => {
      const storedTimeFormat = (userDetails as any)?.timeFormat;
      const storedTimezone = (userDetails as any)?.timezone;
      
      if (storedTimeFormat === '12' || storedTimeFormat === '24') {
        setTimeFormat(storedTimeFormat);
      }
      
      if (storedTimezone) {
        setUserTimezone(storedTimezone);
      }

      if ((storedTimeFormat === '12' || storedTimeFormat === '24') && storedTimezone) {
        return;
      }

      try {
        const userData = await getUserDetails();
        const userTimeFormat = (userData as any)?.timeFormat || '24';
        const userTz = (userData as any)?.timezone || 'Asia/Dhaka';
        setTimeFormat(userTimeFormat === '12' || userTimeFormat === '24' ? userTimeFormat : '24');
        setUserTimezone(userTz);
      } catch (error) {
        console.error('Error loading time format:', error);
        setTimeFormat('24');
        setUserTimezone('Asia/Dhaka');
      }
    };

    loadTimeFormat();
  }, [userDetails]);

  const formatTime = (dateString: string | Date): string => {
    if (!dateString) return 'null';
    
    let date: Date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'null';
    }
    
    if (isNaN(date.getTime())) return 'null';

    if (timeFormat === '12') {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: userTimezone,
      });
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: userTimezone,
      });
    }
  };

  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return 'null';
    
    let date: Date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'null';
    }
    
    if (isNaN(date.getTime())) return 'null';

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: userTimezone,
    });
  };

  const [providers, setProviders] = useState<Provider[]>([]);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<{[key: number]: 'connected' | 'disconnected' | 'testing' | 'unknown'}>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncingProvider, setSyncingProvider] = useState<number | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedDeleteOption, setSelectedDeleteOption] = useState<'trash' | 'permanent'>('trash');

  const [formData, setFormData] = useState({
    customProviderName: '',
    apiKey: '',
    apiUrl: '',
    httpMethod: 'POST',
    syncEnabled: true,

    apiKeyParam: 'key',
    actionParam: 'action',
    servicesAction: 'services',
    servicesEndpoint: '',
    addOrderAction: 'add',
    addOrderEndpoint: '',
    serviceIdParam: 'service',
    linkParam: 'link',
    quantityParam: 'quantity',
    runsParam: 'runs',
    intervalParam: 'interval',
    statusAction: 'status',
    statusEndpoint: '',
    orderIdParam: 'order',
    ordersParam: 'orders',
    refillAction: 'refill',
    refillEndpoint: '',
    refillStatusAction: 'refill_status',
    refillIdParam: 'refill',
    refillsParam: 'refills',
    cancelAction: 'cancel',
    cancelEndpoint: '',
    balanceAction: 'balance',
    balanceEndpoint: '',
    responseMapping: '',
    requestFormat: 'form',
    responseFormat: 'json',
    rateLimitPerMin: '',
    timeoutSeconds: 30,
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    apiUrl: '',
    apiKey: '',
    httpMethod: 'POST',
    syncEnabled: true,

    apiKeyParam: 'key',
    actionParam: 'action',
    servicesAction: 'services',
    servicesEndpoint: '',
    addOrderAction: 'add',
    addOrderEndpoint: '',
    serviceIdParam: 'service',
    linkParam: 'link',
    quantityParam: 'quantity',
    runsParam: 'runs',
    intervalParam: 'interval',
    statusAction: 'status',
    statusEndpoint: '',
    orderIdParam: 'order',
    ordersParam: 'orders',
    refillAction: 'refill',
    refillEndpoint: '',
    refillStatusAction: 'refill_status',
    refillIdParam: 'refill',
    refillsParam: 'refills',
    cancelAction: 'cancel',
    cancelEndpoint: '',
    balanceAction: 'balance',
    balanceEndpoint: '',
    responseMapping: '',
    requestFormat: 'form',
    responseFormat: 'json',
    rateLimitPerMin: '',
    timeoutSeconds: 30,
  });

  const fetchProviders = async (filter: string = 'all') => {
    try {
      console.log('🔄 fetchProviders called with filter:', filter);
      console.log('🌐 Making API call to:', `/api/admin/providers?filter=${filter}`);
      const response = await fetch(`/api/admin/providers?filter=${filter}`);
      console.log('📡 API response status:', response.status);
      const result = await response.json();

      if (result.success) {
        console.log('Fetched providers:', result.data.providers);

        setAvailableProviders(result.data.providers);

        const uiProviders = result.data.providers
          .map((p: any) => ({
            id: p.id,
            name: p.label,
            apiUrl: p.apiUrl,
            apiKey: p.apiKey || '',
            status: p.deletedAt ? 'trash' : p.status,
            services: p.services || 0,
            orders: p.orders || 0,
            importedServices: p.importedServices || 0,
            activeServices: p.activeServices || 0,
            inactiveServices: p.inactiveServices || 0,
            currentBalance: 0,
            successRate: 0,
            avgResponseTime: 0,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            lastSync: p.updatedAt ? new Date(p.updatedAt) : new Date(),
            deletedAt: p.deletedAt || null,
            description: p.description
          }));
        setProviders(uiProviders);

        if (filter !== 'trash') {
          testAllConnections();

          setTimeout(() => {
            fetchAllProviderBalances();
          }, 2000);
        }

        console.log('Available providers for dropdown:', result.data.providers);
      } else {
        console.error('Failed to fetch providers:', result.error);
        showToast('Failed to fetch providers', 'error');
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      showToast('Failed to fetch providers', 'error');
    }
  };

  const fetchProviderBalance = async (providerId: number) => {
    try {
      const response = await fetch(`/api/admin/providers/balance?providerId=${providerId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {

          setProviders(prev => prev.map(p => 
            p.id === providerId 
              ? { ...p, currentBalance: result.data.balance || 0 }
              : p
          ));
        }
      }
    } catch (error) {
      console.error(`Error fetching balance for provider ${providerId}:`, error);
    }
  };

  const fetchAllProviderBalances = async () => {
    try {
      console.log('🔍 Fetching balances for all active providers...');
      console.log('📋 Total providers in state:', providers.length);
      console.log('📋 All providers:', providers.map(p => ({ id: p.id, name: p.name, status: p.status })));

      const activeProviders = providers.filter(p => p.status === 'active');
      console.log('Active providers to check balance:', activeProviders.map(p => ({ id: p.id, name: p.name })));

      for (const provider of activeProviders) {
        try {
          console.log(`📊 Fetching balance for provider ${provider.id} (${provider.name})...`);
          const response = await fetch(`/api/admin/providers/balance?providerId=${provider.id}`);
          console.log(`Response status for provider ${provider.id}:`, response.status);

          if (response.ok) {
            const result = await response.json();
            console.log(`Balance result for provider ${provider.id}:`, result);

            if (result.success && result.data) {

              setProviders(prev => prev.map(p => 
                p.id === provider.id 
                  ? { ...p, currentBalance: result.data.balance || 0 }
                  : p
              ));
              console.log(`✅ Updated balance for ${provider.name}: ${result.data.balance}`);
            }
          } else {
            const errorText = await response.text();
            console.error(`❌ Failed to fetch balance for provider ${provider.id}:`, errorText);
          }
        } catch (error) {
          console.error(`❌ Error fetching balance for provider ${provider.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching provider balances:', error);
    }
  };

  const testAllConnections = async () => {
    try {
      const response = await fetch('/api/admin/providers/test-all-connections', {
        method: 'POST'
      });
      const result = await response.json();

      if (result.success) {
        const newStatuses: {[key: number]: 'connected' | 'disconnected' | 'testing' | 'unknown'} = {};
        result.results.forEach((r: any) => {
          newStatuses[r.id] = r.connected ? 'connected' : 'disconnected';
        });
        setConnectionStatuses(newStatuses);

        setTimeout(() => {
          fetchAllProviderBalances();
        }, 1000);
      }
    } catch (error) {
      console.error('Error testing connections:', error);
    }
  };

  const testProviderConnection = async (providerId: number) => {
    setConnectionStatuses(prev => ({ ...prev, [providerId]: 'testing' }));

    try {
      const response = await fetch(`/api/admin/providers/${providerId}/test-connection`, {
        method: 'POST'
      });
      const result = await response.json();

      setConnectionStatuses(prev => ({ 
        ...prev, 
        [providerId]: result.connected ? 'connected' : 'disconnected' 
      }));

      return result.connected;
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatuses(prev => ({ ...prev, [providerId]: 'disconnected' }));
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      console.log('🔄 loadData called in useEffect');
      await fetchProviders('all');
      setIsPageLoading(false);
    };

    console.log('🚀 useEffect triggered for initial loading');
    loadData();
  }, []);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRefresh = async () => {
    console.log('🔄 handleRefresh called with statusFilter:', statusFilter);
    setIsRefreshing(true);
    showToast('Refreshing providers data...', 'pending');

    try {
      await fetchProviders(statusFilter);
      showToast('Providers data refreshed successfully!', 'success');
    } catch (error) {
      console.error('❌ Error in handleRefresh:', error);
      showToast('Failed to refresh providers data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.customProviderName.trim()) {
      showToast('Please enter a provider name', 'error');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customProviderName: formData.customProviderName,
          apiKey: formData.apiKey,
          apiUrl: formData.apiUrl,
          httpMethod: formData.httpMethod,

          apiKeyParam: formData.apiKeyParam,
          actionParam: formData.actionParam,
          servicesAction: formData.servicesAction,
          servicesEndpoint: formData.servicesEndpoint,
          addOrderAction: formData.addOrderAction,
          addOrderEndpoint: formData.addOrderEndpoint,
          serviceIdParam: formData.serviceIdParam,
          linkParam: formData.linkParam,
          quantityParam: formData.quantityParam,
          runsParam: formData.runsParam,
          intervalParam: formData.intervalParam,
          statusAction: formData.statusAction,
          statusEndpoint: formData.statusEndpoint,
          orderIdParam: formData.orderIdParam,
          ordersParam: formData.ordersParam,
          refillAction: formData.refillAction,
          refillEndpoint: formData.refillEndpoint,
          refillStatusAction: formData.refillStatusAction,
          refillIdParam: formData.refillIdParam,
          refillsParam: formData.refillsParam,
          cancelAction: formData.cancelAction,
          cancelEndpoint: formData.cancelEndpoint,
          balanceAction: formData.balanceAction,
          balanceEndpoint: formData.balanceEndpoint,
          responseMapping: formData.responseMapping,
          requestFormat: formData.requestFormat,
          responseFormat: formData.responseFormat,
          rateLimitPerMin: formData.rateLimitPerMin ? parseInt(formData.rateLimitPerMin) : null,
          timeoutSeconds: formData.timeoutSeconds,
        })
      });

      const result = await response.json();

      if (result.success) {

        await fetchProviders(statusFilter);

        setFormData({
          customProviderName: '',
          apiKey: '',
          apiUrl: '',
          httpMethod: 'POST',
          syncEnabled: true,

          apiKeyParam: 'key',
          actionParam: 'action',
          servicesAction: 'services',
          servicesEndpoint: '',
          addOrderAction: 'add',
          addOrderEndpoint: '',
          serviceIdParam: 'service',
          linkParam: 'link',
          quantityParam: 'quantity',
          runsParam: 'runs',
          intervalParam: 'interval',
          statusAction: 'status',
          statusEndpoint: '',
          orderIdParam: 'order',
          ordersParam: 'orders',
          refillAction: 'refill',
          refillEndpoint: '',
          refillStatusAction: 'refill_status',
          refillIdParam: 'refill',
          refillsParam: 'refills',
          cancelAction: 'cancel',
          cancelEndpoint: '',
          balanceAction: 'balance',
          balanceEndpoint: '',
          responseMapping: '',
          requestFormat: 'form',
          responseFormat: 'json',
          rateLimitPerMin: '',
          timeoutSeconds: 30,
        });
        setShowAddForm(false);
        showToast(result.message || 'Provider added successfully!', 'success');
      } else {
        showToast(result.error || 'Failed to add provider', 'error');
      }
    } catch (error) {
      console.error('Error adding provider:', error);
      showToast('Failed to add provider', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
    setEditFormData({
      name: provider.name,
      apiUrl: provider.apiUrl || '',
      apiKey: provider.apiKey || '',
      httpMethod: provider.httpMethod || 'POST',
      syncEnabled: true,

      apiKeyParam: provider.apiKeyParam || 'key',
      actionParam: provider.actionParam || 'action',
      servicesAction: provider.servicesAction || 'services',
      servicesEndpoint: provider.servicesEndpoint || '',
      addOrderAction: provider.addOrderAction || 'add',
      addOrderEndpoint: provider.addOrderEndpoint || '',
      serviceIdParam: provider.serviceIdParam || 'service',
      linkParam: provider.linkParam || 'link',
      quantityParam: provider.quantityParam || 'quantity',
      runsParam: provider.runsParam || 'runs',
      intervalParam: provider.intervalParam || 'interval',
      statusAction: provider.statusAction || 'status',
      statusEndpoint: provider.statusEndpoint || '',
      orderIdParam: provider.orderIdParam || 'order',
      ordersParam: provider.ordersParam || 'orders',
      refillAction: provider.refillAction || 'refill',
      refillEndpoint: provider.refillEndpoint || '',
      refillStatusAction: provider.refillStatusAction || 'refill_status',
      refillIdParam: provider.refillIdParam || 'refill',
      refillsParam: provider.refillsParam || 'refills',
      cancelAction: provider.cancelAction || 'cancel',
      cancelEndpoint: provider.cancelEndpoint || '',
      balanceAction: provider.balanceAction || 'balance',
      balanceEndpoint: provider.balanceEndpoint || '',
      responseMapping: provider.responseMapping || '',
      requestFormat: provider.requestFormat || 'form',
      responseFormat: provider.responseFormat || 'json',
      rateLimitPerMin: provider.rateLimitPerMin?.toString() || '',
      timeoutSeconds: provider.timeoutSeconds || 30,
    });
    setShowEditForm(true);
  };

  const handleEditProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/providers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingProvider.id,
          name: editFormData.name,
          apiKey: editFormData.apiKey,
          apiUrl: editFormData.apiUrl,
          httpMethod: editFormData.httpMethod,
        })
      });

      const result = await response.json();

      if (result.success) {

        setProviders(prev => prev.map(provider =>
          provider.id === editingProvider.id
            ? {
                ...provider,
                name: editFormData.name,
                apiUrl: editFormData.apiUrl,
                apiKey: editFormData.apiKey,
                httpMethod: editFormData.httpMethod,
                lastSync: new Date(),
              }
            : provider
        ));

        setEditFormData({
          name: '',
          apiUrl: '',
          apiKey: '',
          httpMethod: 'POST',
          syncEnabled: true,
          apiKeyParam: 'key',
          actionParam: 'action',
          servicesAction: 'services',
          servicesEndpoint: '',
          addOrderAction: 'add',
          addOrderEndpoint: '',
          serviceIdParam: 'service',
          linkParam: 'link',
          quantityParam: 'quantity',
          runsParam: 'runs',
          intervalParam: 'interval',
          statusAction: 'status',
          statusEndpoint: '',
          orderIdParam: 'order',
          ordersParam: 'orders',
          refillAction: 'refill',
          refillEndpoint: '',
          refillStatusAction: 'refill_status',
          refillIdParam: 'refill',
          refillsParam: 'refills',
          cancelAction: 'cancel',
          cancelEndpoint: '',
          balanceAction: 'balance',
          balanceEndpoint: '',
          responseMapping: '',
          requestFormat: 'form',
          responseFormat: 'json',
          rateLimitPerMin: '',
          timeoutSeconds: 30,
        });
        setShowEditForm(false);
        setEditingProvider(null);

        if (typeof window !== 'undefined' && window.localStorage) {

          const cacheKey = '/api/admin/providers';
          const swrCache = JSON.parse(localStorage.getItem('swr-cache') || '{}');
          if (swrCache[cacheKey]) {
            delete swrCache[cacheKey];
            localStorage.setItem('swr-cache', JSON.stringify(swrCache));
          }
        }

        window.dispatchEvent(new CustomEvent('providerUpdated', { 
          detail: { providerId: editingProvider.id, providerName: editFormData.name } 
        }));

        showToast('Provider updated successfully!', 'success');
      } else {
        showToast(result.error || 'Failed to update provider', 'error');
      }
    } catch (error) {
      console.error('Error updating provider:', error);
      showToast('Failed to update provider', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (providerId: number) => {
    try {
      const provider = providers.find(p => p.id === providerId);
      const newStatus = provider?.status === 'active' ? 'inactive' : 'active';

      const response = await fetch('/api/admin/providers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: providerId,
          status: newStatus
        })
      });

      const result = await response.json();

      if (result.success) {

        setProviders(prev => prev.map(provider =>
          provider.id === providerId
            ? { ...provider, status: newStatus as 'active' | 'inactive' }
            : provider
        ));
        showToast(result.message || `Provider ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`, 'success');
      } else {
        showToast(result.error || 'Failed to update provider status', 'error');
      }
    } catch (error) {
      console.error('Error toggling provider status:', error);
      showToast('Failed to update provider status', 'error');
    }
  };

  const handleDeleteProvider = async (providerId: number, deleteType: 'trash' | 'permanent') => {

    if (!providerId || providerId === null || providerId === undefined) {
      showToast('Cannot delete unconfigured provider', 'error');
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/providers?id=${providerId}&type=${deleteType}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {

        if (deleteType === 'trash') {

          setProviders(prev => prev.map(provider => 
            provider.id === providerId 
              ? { 
                  ...provider, 
                  status: 'trash' as 'active' | 'inactive' | 'trash',
                  deletedAt: new Date().toISOString()
                }
              : provider
          ));

          if (statusFilter === 'trash') {
            setTimeout(() => fetchProviders('trash'), 500);
          }
        } else {

          setProviders(prev => prev.filter(provider => provider.id !== providerId));
        }

        const message = deleteType === 'trash' 
          ? 'Provider and associated imported services are moved to trash successfully!' 
          : 'Provider permanently deleted successfully!';
        showToast(result.message || message, 'success');
      } else {
        showToast(result.error || 'Failed to delete provider', 'error');
      }
    } catch (error) {
      console.error('Error deleting provider:', error);
      showToast('Failed to delete provider', 'error');
    } finally {
      setDeleteLoading(false);
      setShowDeletePopup(false);
      setProviderToDelete(null);
    }
  };

  const openDeletePopup = (provider: Provider) => {
    setProviderToDelete(provider);
    setSelectedDeleteOption('trash');
    setShowDeletePopup(true);
  };

  const handleRestoreProvider = async (provider: Provider) => {
    try {
      const response = await fetch(`/api/admin/providers?id=${provider.id}&action=restore`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (result.success) {

        setProviders(prevProviders =>
          prevProviders.map(p =>
            p.id === provider.id ? { ...p, status: 'active', deletedAt: null } : p
          )
        );
        showToast(result.message || 'Provider restored successfully!', 'success');

        await fetchProviders(statusFilter);
      } else {
        showToast(result.error || 'Failed to restore provider', 'error');
      }
    } catch (error) {
      console.error('Error restoring provider:', error);
      showToast('Failed to restore provider', 'error');
    }
  };

  const handleSyncAllProviders = async () => {
    setSyncingAll(true);
    let timeoutId: NodeJS.Timeout | null = null;
    let controller: AbortController | null = null;

    try {

      await testAllConnections();

      controller = new AbortController();
      timeoutId = setTimeout(() => {
        if (controller) {
          controller.abort();
        }
      }, 120000);

      showToast('Starting sync for all providers (updating existing services only)...', 'pending');

      const response = await fetch('/api/admin/providers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncType: 'all',
          profitMargin: 20
        }),
        signal: controller.signal
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        const totals = result.data.totals;
        const providersCount = result.data.providersProcessed;

        showToast(
          `All ${providersCount} providers synchronized successfully! ` +
          `Updated: ${totals.updated} existing services, ` +
          `Price changes: ${totals.priceChanges}, Status changes: ${totals.statusChanges}`,
          'success'
        );

        setProviders(prev => prev.map(provider => ({
          ...provider,
          lastSync: new Date()
        })));

        await fetchProviders(statusFilter);
      } else {
        showToast(`Bulk sync failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error syncing providers:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          showToast('Bulk sync timeout: Operation took too long to complete', 'error');
        } else {
          showToast(`Bulk sync failed: ${error.message}`, 'error');
        }
      } else {
        showToast('Failed to sync all providers', 'error');
      }
    } finally {

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (controller) {
        controller.abort();
      }

      setSyncingAll(false);
    }
  };

  const handleSyncProvider = async (providerId: number) => {
    setSyncingProvider(providerId);
    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout | null = null;
    let controller: AbortController | null = null;

    try {

      const currentStatus = connectionStatuses[providerId];

      if (currentStatus === 'disconnected') {
        showToast('Cannot sync: Provider is not connected. Please test the connection first.', 'error');
        return;
      }

      if (currentStatus === 'unknown' || !currentStatus) {

        const { testProviderConnection: validateConnection } = await import('@/lib/utils/provider-validator');
        const connectionPromise = validateConnection(providerId);
        const timeoutPromise = new Promise<{success: boolean, error?: string}>((_, reject) => 
          setTimeout(() => reject(new Error('Connection test timeout')), 15000)
        );

        const isConnected = await Promise.race([connectionPromise, timeoutPromise]);

        if (!isConnected.success) {
          showToast(`Cannot sync: ${isConnected.error || 'Provider API is not connected'}. Please check your API configuration.`, 'error');
          return;
        }

        setConnectionStatuses(prev => ({ ...prev, [providerId]: 'connected' }));
      }

      controller = new AbortController();
      timeoutId = setTimeout(() => {
        if (controller) {
          controller.abort();
        }
      }, 30000);

      const response = await fetch('/api/admin/providers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          syncType: 'all',
          profitMargin: 20
        }),
        signal: controller.signal
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        const providerResult = result.data.results[0];
        if (providerResult) {
          showToast(
            `${providerResult.provider} synchronized successfully! ` +
            `Updated: ${providerResult.updated} existing services, ` +
            `Price changes: ${providerResult.priceChanges || 0}`,
            'success'
          );
        } else {
          showToast('Provider synchronized successfully!', 'success');
        }

        setProviders(prev => prev.map(provider =>
          provider.id === providerId
            ? { ...provider, lastSync: new Date() }
            : provider
        ));

        await fetchProviders(statusFilter);

        setTimeout(() => {
          fetchProviderBalance(providerId);
        }, 1000);
      } else {
        showToast(`Provider sync failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error syncing provider:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          showToast('Sync timeout: Operation took too long to complete', 'error');
        } else if (error.message === 'Connection test timeout') {
          showToast('Connection test timeout: Provider API is not responding', 'error');
        } else {
          showToast(`Sync failed: ${error.message}`, 'error');
        }
      } else {
        showToast('Failed to sync provider', 'error');
      }
    } finally {

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (controller) {
        controller.abort();
      }

      const elapsedTime = Date.now() - startTime;
      const minSpinTime = 1000;

      if (elapsedTime < minSpinTime) {
        setTimeout(() => {
          setSyncingProvider(null);
        }, minSpinTime - elapsedTime);
      } else {
        setSyncingProvider(null);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'inactive': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'inactive': return <FaTimes className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default: return <FaExclamationTriangle className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const ProviderActions = ({ provider }: { provider: Provider }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="flex items-center gap-2 justify-center">
        {provider.status !== 'trash' && (
          <button
            onClick={() => handleSyncProvider(provider.id)}
            disabled={syncingProvider === provider.id}
            className="btn btn-sm btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Sync Provider Data"
          >
            <FaSync className={`w-3 h-3 ${syncingProvider === provider.id ? 'animate-spin' : ''}`} />
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="btn btn-sm btn-secondary p-2"
            title="More actions"
          >
            <FaEllipsisH className="w-3 h-3" />
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <div className="py-1">
                  {provider.status === 'trash' ? (
                    <>
                      <button
                        onClick={() => {
                          handleRestoreProvider(provider);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2"
                      >
                        <FaUndo className="w-3 h-3" />
                        Restore
                      </button>

                      <button
                        onClick={() => {
                          openDeletePopup(provider);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <FaTrash className="w-3 h-3" />
                        Permanently Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          handleOpenEditProvider(provider);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <FaEdit className="w-3 h-3" />
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          openDeletePopup(provider);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <FaTrash className="w-3 h-3" />
                        Delete Provider
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (isPageLoading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-24 gradient-shimmer rounded-lg" />
                <div className="h-10 w-32 gradient-shimmer rounded-lg" />
              </div>
              <div className="h-10 w-full md:w-80 gradient-shimmer rounded-lg" />
            </div>
            <div className="card card-padding min-h-[600px]">
              <ProvidersTableSkeleton />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card card-padding">
                <div className="card-header mb-4">
                  <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                  <div className="h-6 w-32 gradient-shimmer rounded ml-3" />
                </div>
                <div className="space-y-3">
                  <div className="h-10 w-full gradient-shimmer rounded-lg" />
                  <div className="h-10 w-full gradient-shimmer rounded-lg" />
                </div>
              </div>
              <div className="card card-padding">
                <div className="card-header mb-4">
                  <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                  <div className="h-6 w-24 gradient-shimmer rounded ml-3" />
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 7 }).map((_, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="h-4 w-32 gradient-shimmer rounded" />
                      <div className="h-4 w-16 gradient-shimmer rounded" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="card card-padding">
                <div className="card-header mb-4">
                  <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                  <div className="h-6 w-28 gradient-shimmer rounded ml-3" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 gradient-shimmer rounded" />
                    <div className="h-5 w-20 gradient-shimmer rounded-full" />
                  </div>
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="h-3 w-20 gradient-shimmer rounded" />
                      <div className="h-4 w-16 gradient-shimmer rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
        {showAddForm && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddForm(false);
                setFormData({
                  customProviderName: '',
                  apiKey: '',
                  apiUrl: '',
                  httpMethod: 'POST',
                  syncEnabled: true,
                  apiKeyParam: 'key',
                  actionParam: 'action',
                  servicesAction: 'services',
                  servicesEndpoint: '',
                  addOrderAction: 'add',
                  addOrderEndpoint: '',
                  serviceIdParam: 'service',
                  linkParam: 'link',
                  quantityParam: 'quantity',
                  runsParam: 'runs',
                  intervalParam: 'interval',
                  statusAction: 'status',
                  statusEndpoint: '',
                  orderIdParam: 'order',
                  ordersParam: 'orders',
                  refillAction: 'refill',
                  refillEndpoint: '',
                  refillStatusAction: 'refill_status',
                  refillIdParam: 'refill',
                  refillsParam: 'refills',
                  cancelAction: 'cancel',
                  cancelEndpoint: '',
                  balanceAction: 'balance',
                  balanceEndpoint: '',
                  responseMapping: '',
                  requestFormat: 'form',
                  responseFormat: 'json',
                  rateLimitPerMin: '',
                  timeoutSeconds: 30,
                });
              }
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="card card-padding">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Provider</h3>
                </div>

                <form onSubmit={handleAddProvider} className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Provider Name</label>
                    <input
                      type="text"
                      value={formData.customProviderName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customProviderName: e.target.value }))}
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
                        onChange={(e: any) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your API key"
                        autoComplete="new-password"
                        disabled={!formData.customProviderName}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">API URL</label>
                      <input
                        type="url"
                        value={formData.apiUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter API URL (e.g., https://provider.com/api/v2)"
                        disabled={!formData.customProviderName}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">HTTP Method</label>
                      <select
                        value={formData.httpMethod}
                        onChange={(e) => setFormData(prev => ({ ...prev, httpMethod: e.target.value }))}
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                        disabled={!formData.customProviderName}
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
                            onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, syncEnabled: checked }))}
                            onClick={() => formData.customProviderName && setFormData(prev => ({ ...prev, syncEnabled: !prev.syncEnabled }))}
                            title={`${formData.syncEnabled ? 'Disable' : 'Enable'} Auto Sync`}
                            disabled={!formData.customProviderName}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setFormData({
                          customProviderName: '',
                          apiKey: '',
                          apiUrl: '',
                          httpMethod: 'POST',
                          syncEnabled: true,
                          apiKeyParam: 'key',
                          actionParam: 'action',
                          servicesAction: 'services',
                          servicesEndpoint: '',
                          addOrderAction: 'add',
                          addOrderEndpoint: '',
                          serviceIdParam: 'service',
                          linkParam: 'link',
                          quantityParam: 'quantity',
                          runsParam: 'runs',
                          intervalParam: 'interval',
                          statusAction: 'status',
                          statusEndpoint: '',
                          orderIdParam: 'order',
                          ordersParam: 'orders',
                          refillAction: 'refill',
                          refillEndpoint: '',
                          refillStatusAction: 'refill_status',
                          refillIdParam: 'refill',
                          refillsParam: 'refills',
                          cancelAction: 'cancel',
                          cancelEndpoint: '',
                          balanceAction: 'balance',
                          balanceEndpoint: '',
                          responseMapping: '',
                          requestFormat: 'form',
                          responseFormat: 'json',
                          rateLimitPerMin: '',
                          timeoutSeconds: 30,
                        });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !formData.customProviderName}
                      className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <ButtonLoader /> : 'Add Provider'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {showEditForm && editingProvider && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEditForm(false);
                setEditingProvider(null);
                setEditFormData({
                  name: '',
                  apiUrl: '',
                  apiKey: '',
                  httpMethod: 'POST',
                  syncEnabled: true,
                  apiKeyParam: 'key',
                  actionParam: 'action',
                  servicesAction: 'services',
                  servicesEndpoint: '',
                  addOrderAction: 'add',
                  addOrderEndpoint: '',
                  serviceIdParam: 'service',
                  linkParam: 'link',
                  quantityParam: 'quantity',
                  runsParam: 'runs',
                  intervalParam: 'interval',
                  statusAction: 'status',
                  statusEndpoint: '',
                  orderIdParam: 'order',
                  ordersParam: 'orders',
                  refillAction: 'refill',
                  refillEndpoint: '',
                  refillStatusAction: 'refill_status',
                  refillIdParam: 'refill',
                  refillsParam: 'refills',
                  cancelAction: 'cancel',
                  cancelEndpoint: '',
                  balanceAction: 'balance',
                  balanceEndpoint: '',
                  responseMapping: '',
                  requestFormat: 'form',
                  responseFormat: 'json',
                  rateLimitPerMin: '',
                  timeoutSeconds: 30,
                });
              }
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="card card-padding">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Provider - {editingProvider.name}</h3>
                </div>

                <form onSubmit={handleEditProvider} className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Provider Name</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
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
                        value={editFormData.apiKey}
                        onChange={(e: any) => setEditFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        placeholder="Enter your API key"
                        autoComplete="new-password"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">API URL</label>
                      <input
                        type="url"
                        value={editFormData.apiUrl}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        placeholder="Enter API URL (e.g., https://provider.com/api/v2)"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">HTTP Method</label>
                      <select
                        value={editFormData.httpMethod}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, httpMethod: e.target.value }))}
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
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
                            checked={editFormData.syncEnabled}
                            onCheckedChange={(checked: boolean) => setEditFormData(prev => ({ ...prev, syncEnabled: checked }))}
                            onClick={() => setEditFormData(prev => ({ ...prev, syncEnabled: !prev.syncEnabled }))}
                            title={`${editFormData.syncEnabled ? 'Disable' : 'Enable'} Auto Sync`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingProvider(null);
                        setEditFormData({
                          name: '',
                          apiUrl: '',
                          apiKey: '',
                          httpMethod: 'POST',
                          syncEnabled: true,
                          apiKeyParam: 'key',
                          actionParam: 'action',
                          servicesAction: 'services',
                          servicesEndpoint: '',
                          addOrderAction: 'add',
                          addOrderEndpoint: '',
                          serviceIdParam: 'service',
                          linkParam: 'link',
                          quantityParam: 'quantity',
                          runsParam: 'runs',
                          intervalParam: 'interval',
                          statusAction: 'status',
                          statusEndpoint: '',
                          orderIdParam: 'order',
                          ordersParam: 'orders',
                          refillAction: 'refill',
                          refillEndpoint: '',
                          refillStatusAction: 'refill_status',
                          refillIdParam: 'refill',
                          refillsParam: 'refills',
                          cancelAction: 'cancel',
                          cancelEndpoint: '',
                          balanceAction: 'balance',
                          balanceEndpoint: '',
                          responseMapping: '',
                          requestFormat: 'form',
                          responseFormat: 'json',
                          rateLimitPerMin: '',
                          timeoutSeconds: 30,
                        });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Updating...' : 'Update Provider'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSync className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn btn-primary flex items-center gap-2"
              >
                <FaPlus className="w-4 h-4" />
                Add Provider
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-80 pl-10 pr-4 py-2.5 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                />
              </div>
            </div>
          </div>
          <div className="card card-padding relative">
            {isRefreshing ? (
              <ProvidersTableSkeleton />
            ) : (
              <>
                <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    fetchProviders('all');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    statusFilter === 'all'
                      ? 'bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'all'
                        ? 'bg-white/20'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {providers.filter(p => p.status !== 'trash').length}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('active');
                    fetchProviders('active');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    statusFilter === 'active'
                      ? 'bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  Active
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'active'
                        ? 'bg-white/20'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}
                  >
                    {providers.filter(p => p.status === 'active').length}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('inactive');
                    fetchProviders('inactive');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    statusFilter === 'inactive'
                      ? 'bg-gradient-to-r from-red-600 to-red-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  Inactive
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'inactive'
                        ? 'bg-white/20'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {providers.filter(p => p.status === 'inactive').length}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('trash');
                    fetchProviders('trash');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    statusFilter === 'trash'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  Trash
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'trash'
                        ? 'bg-white/20'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {providers.filter(p => p.status === 'trash').length}
                  </span>
                </button>
              </div>
            </div>
            <div className="hidden md:block">
              {(() => {
                const filteredProviders = providers.filter(provider => {

                  const matchesSearch = searchQuery === '' ||
                    provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    provider.status.toLowerCase().includes(searchQuery.toLowerCase());

                  const matchesStatus = statusFilter === 'all' 
                    ? provider.status !== 'trash'
                    : provider.status === statusFilter;

                  return matchesSearch && matchesStatus;
                });

                if (filteredProviders.length === 0) {
                  return (
                    <div className="p-12 text-center">
                      <FaGlobe
                        className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
                      />
                      <h3
                        className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300"
                      >
                        No providers found
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery && statusFilter !== 'all'
                          ? `No ${statusFilter} providers match your search "${searchQuery}".`
                          : searchQuery
                          ? `No providers match your search "${searchQuery}".`
                          : statusFilter !== 'all'
                          ? `No ${statusFilter} providers found.`
                          : 'No providers exist yet.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <table className="w-full text-sm border border-gray-200 dark:border-gray-700">
                    <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b border-gray-200 dark:border-gray-700 z-10">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">ID</th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Provider</th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Services</th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Orders</th>
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Current Balance</th>
                        {statusFilter !== 'trash' && <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Last Sync</th>}
                        {statusFilter !== 'trash' && <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Status</th>}
                        <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">API Status</th>
                        <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProviders
                    .map((provider, index) => (
                    <tr key={provider.id || `provider-${provider.name}-${index}`} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200">
                      <td className="p-3">
                        <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                          {provider.id}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{provider.name}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {provider.importedServices || provider.services} Total
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {provider.status === 'trash' 
                              ? `${provider.inactiveServices || 0} Deactive`
                              : `${provider.activeServices} Active`
                            }
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{provider.orders.toLocaleString()}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          ${provider.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      {statusFilter !== 'trash' && (
                        <td className="p-3">
                          <div>
                            <div
                              className="text-sm text-gray-900 dark:text-gray-100"
                            >
                              {provider.lastSync
                                ? formatDate(provider.lastSync)
                                : 'null'}
                            </div>
                            <div
                              className="text-xs text-gray-500 dark:text-gray-400"
                            >
                              {provider.lastSync
                                ? formatTime(provider.lastSync)
                                : 'null'}
                            </div>
                          </div>
                        </td>
                      )}
                      {statusFilter !== 'trash' && (
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleStatus(provider.id)}
                            className={`p-1 rounded transition-colors ${
                              provider.status === 'active'
                                ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                            }`}
                            title={
                              provider.status === 'active'
                                ? 'Deactivate Provider'
                                : 'Activate Provider'
                            }
                          >
                            {provider.status === 'active' ? (
                              <FaToggleOn className="h-5 w-5" />
                            ) : (
                              <FaToggleOff className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="p-3">
                        {connectionStatuses[provider.id] === 'testing' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium w-fit bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                            Testing...
                          </span>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${
                            connectionStatuses[provider.id] === 'connected'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : connectionStatuses[provider.id] === 'disconnected'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                          }`}>
                            {connectionStatuses[provider.id] === 'connected' 
                              ? 'Connected' 
                              : connectionStatuses[provider.id] === 'disconnected'
                              ? 'Not Connected'
                              : 'Unknown'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <ProviderActions provider={provider} />
                      </td>
                    </tr>
                  ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
            <div className="md:hidden space-y-4">
              {providers
                .filter(provider => {

                  const matchesSearch = searchQuery === '' ||
                    provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    provider.status.toLowerCase().includes(searchQuery.toLowerCase());

                  const matchesStatus = statusFilter === 'all' 
                    ? provider.status !== 'trash'
                    : provider.status === statusFilter;

                  return matchesSearch && matchesStatus;
                }).length === 0 ? (
                <div className="text-center py-12">
                  <FaGlobe
                    className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
                  />
                  <h3
                    className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300"
                  >
                    No providers found
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery && statusFilter !== 'all'
                      ? `No ${statusFilter} providers match your search "${searchQuery}".`
                      : searchQuery
                      ? `No providers match your search "${searchQuery}".`
                      : statusFilter !== 'all'
                      ? `No ${statusFilter} providers found.`
                      : 'No providers exist yet.'}
                  </p>
                </div>
              ) : (
                providers
                .filter(provider => {

                  const matchesSearch = searchQuery === '' ||
                    provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    provider.status.toLowerCase().includes(searchQuery.toLowerCase());

                  const matchesStatus = statusFilter === 'all' 
                    ? provider.status !== 'trash'
                    : provider.status === statusFilter;

                  return matchesSearch && matchesStatus;
                })
                .map((provider, index) => (
                <div key={provider.id || `provider-${provider.name}-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">#{provider.id}</span>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{provider.name}</div>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(provider.id)}
                      className={`p-1 rounded transition-colors ${
                        provider.status === 'active'
                          ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                          : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                      }`}
                      title={
                        provider.status === 'active'
                          ? 'Deactivate Provider'
                          : 'Activate Provider'
                      }
                    >
                      {provider.status === 'active' ? (
                        <FaToggleOn className="h-5 w-5" />
                      ) : (
                        <FaToggleOff className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${
                      provider.apiUrl && provider.apiUrl.trim() !== '' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {provider.apiUrl && provider.apiUrl.trim() !== '' ? 'API Connected' : 'API Not Connected'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Services</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {provider.importedServices || provider.services} Total
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {provider.status === 'trash' 
                          ? `${provider.inactiveServices || 0} Deactive`
                          : `${provider.activeServices} Active`
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Orders</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{provider.orders.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Current Balance</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        ${provider.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Last Sync</div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {provider.lastSync
                            ? formatDate(provider.lastSync)
                            : 'null'}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {provider.lastSync
                            ? formatTime(provider.lastSync)
                            : 'null'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <ProviderActions provider={provider} />
                </div>
              ))
              )}
            </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaCog />
                </div>
                <h3 className="card-title">Quick Actions</h3>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleSyncAllProviders}
                  disabled={syncingAll}
                  className="btn btn-secondary w-full justify-start disabled:opacity-50"
                >
                  <FaSync className={`w-4 h-4 mr-2 ${syncingAll ? 'animate-spin' : ''}`} />
                  Sync All Provider Data
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to deactivate all providers? This will stop all provider services.')) {
                      setProviders(prev => prev.map(provider => ({ ...provider, status: 'inactive' as 'active' | 'inactive' })));
                      showToast('All providers have been deactivated!', 'success');
                    }
                  }}
                  className="btn btn-secondary w-full justify-start"
                >
                  <FaPause className="w-4 h-4 mr-2" />
                  Deactivate All Providers
                </button>
              </div>
            </div>
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaChartBar />
                </div>
                <h3 className="card-title">Overview</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Providers</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{providers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Providers</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {providers.filter(p => p.status === 'active').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Inactive Providers</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {providers.filter(p => p.status === 'inactive').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Orders</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {providers.reduce((sum, p) => sum + p.orders, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Imported Services</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {providers.reduce((sum, p) => sum + p.importedServices, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Services</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {providers.reduce((sum, p) => sum + p.activeServices, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Balance</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    ${providers.reduce((sum, p) => sum + p.currentBalance, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
            {providers.length > 0 && (
              <div className="card card-padding">
                <div className="card-header">
                  <div className="card-icon">
                    <FaCheckCircle />
                  </div>
                  <h3 className="card-title">Top Performer</h3>
                </div>

                {(() => {
                  const topProvider = providers.reduce((best, current) => 
                    current.orders > best.orders ? current : best
                  );
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{topProvider.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(topProvider.status)}`}>
                          {topProvider.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Orders: <span className="font-semibold text-green-600">{topProvider.orders}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Imported: <span className="font-semibold text-orange-600">{topProvider.importedServices}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Active: <span className="font-semibold text-purple-600">{topProvider.activeServices}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Balance: <span className="font-semibold text-blue-600">${topProvider.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
      {showDeletePopup && providerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg">
              <div className="flex items-center justify-between p-6">
                <h3
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                  {providerToDelete.status === 'trash' 
                    ? `Permanently Delete "${providerToDelete.name}" Provider`
                    : `Delete "${providerToDelete.name}" Provider`
                  }
                </h3>
                <button
                  onClick={() => setShowDeletePopup(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Close"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <FaExclamationTriangle className="h-6 w-6 text-red-500 dark:text-red-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">
                        This provider may have associated services
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        Choose how to handle the provider and its services.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      {providerToDelete.status === 'trash' 
                        ? 'This provider is currently in trash. This action will permanently delete it.'
                        : 'What would you like to do with this provider?'
                      }
                    </p>

                    {providerToDelete.status === 'trash' ? (

                      <div className="p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <div className="font-medium text-red-800 dark:text-red-200">
                          Permanently Delete
                        </div>
                        <div className="text-sm text-red-600 dark:text-red-300">
                          This will permanently remove the provider and all imported services. This action cannot be undone.
                        </div>
                      </div>
                    ) : (

                      <>
                        <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <input
                            type="radio"
                            name="deleteOption"
                            value="trash"
                            checked={selectedDeleteOption === 'trash'}
                            onChange={(e) => setSelectedDeleteOption(e.target.value as 'trash' | 'permanent')}
                            className="mt-0.5"
                          />
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-100">
                              Move to Trash
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              All imported services will be permanently deleted
                            </div>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <input
                            type="radio"
                            name="deleteOption"
                            value="permanent"
                            checked={selectedDeleteOption === 'permanent'}
                            onChange={(e) => setSelectedDeleteOption(e.target.value as 'trash' | 'permanent')}
                            className="mt-0.5"
                          />
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-100">
                              Permanently Delete
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Permanently remove the provider and all imported services
                            </div>
                          </div>
                        </label>
                      </>
                    )}
                  </div>
                   <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                     <p className="text-sm text-red-800 dark:text-red-200">
                       <strong>Warning:</strong> The action will be scheduled until the completion of any orders/refill/cancel request operation.
                     </p>
                   </div>
                   <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                     <p className="text-sm text-blue-800 dark:text-blue-200">
                       <strong>Note:</strong> After being scheduled, users are not able to see the associated services of the scheduled deletion or trash of the provider.
                     </p>
                   </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => setShowDeletePopup(false)}
                      disabled={deleteLoading}
                      className="btn btn-secondary px-6 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const deleteType = providerToDelete.status === 'trash' 
                          ? 'permanent' 
                          : selectedDeleteOption;
                        handleDeleteProvider(providerToDelete.id, deleteType);
                      }}
                      disabled={deleteLoading}
                      className={`btn ${
                        deleteLoading 
                          ? 'bg-red-400 cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700'
                      } text-white flex items-center gap-2 px-6 py-2`}
                    >
                      <FaTrash className="h-4 w-4" />
                      {deleteLoading 
                        ? (() => {
                            const deleteType = providerToDelete.status === 'trash' 
                              ? 'permanent' 
                              : selectedDeleteOption;
                            return deleteType === 'trash' ? 'Updating...' : 'Deleting...';
                          })()
                        : (() => {
                            if (providerToDelete.status === 'trash') {
                              return 'Permanently Delete';
                            } else {
                              return selectedDeleteOption === 'trash' ? 'Move to Trash' : 'Permanently Delete';
                            }
                          })()
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIProvidersPage;