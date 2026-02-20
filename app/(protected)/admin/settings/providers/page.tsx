'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FaCheck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGlobe,
  FaPlus,
  FaSearch,
  FaSync,
  FaTimes
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import ProvidersTable from '@/components/admin/settings/providers/providers-table';
import MoreActionMenu from '@/components/admin/settings/providers/more-action-menu';
import ManageProvidersModal from '@/components/admin/settings/providers/modals/manage-providers';
import DeleteProviderModal from '@/components/admin/settings/providers/modals/delete-provider';

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
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
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
              <tr key={rowIdx} className="border-t dark:border-gray-700">
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

interface Provider {
  id: number;
  name: string;
  apiUrl: string;
  apiKey: string;
  httpMethod?: string;
  status: 'active' | 'inactive' | 'trash';
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
  const searchParams = useSearchParams();
  const router = useRouter();
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

  const statusFilter = searchParams.get('status') || 'all';
  const searchQuery = searchParams.get('search') || '';

  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updateQueryParams = useCallback((updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams();
    
    const newStatus = 'status' in updates 
      ? (updates.status === 'all' || updates.status === null ? null : updates.status)
      : (statusFilter !== 'all' ? statusFilter : null);
    const newSearch = 'search' in updates 
      ? (updates.search === null || updates.search === '' ? null : updates.search)
      : (searchQuery || null);
    
    if (newStatus && newStatus !== 'all' && newStatus !== null && newStatus !== '') {
      params.set('status', String(newStatus));
    }
    
    if (newSearch && newSearch !== null && newSearch !== '') {
      params.set('search', String(newSearch));
    }
    
    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : window.location.pathname, { scroll: false });
  }, [statusFilter, searchQuery, router]);

  const [searchInput, setSearchInput] = useState(searchQuery);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      updateQueryParams({ search: value });
    }, 500);
  }, [updateQueryParams]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  const [syncingProvider, setSyncingProvider] = useState<number | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null | undefined>(undefined);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const getDefaultFormData = () => ({
    name: '',
    apiKey: '',
    apiUrl: '',
    httpMethod: 'POST' as 'POST' | 'GET',
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
    requestFormat: 'form' as 'form' | 'json',
    responseFormat: 'json' as 'json' | 'xml',
    rateLimitPerMin: '',
    timeoutSeconds: 30,
  });

  const [providerFormData, setProviderFormData] = useState(getDefaultFormData());

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
            currentBalance: p.currentBalance ?? p.current_balance ?? 0,
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
        } else if (result.error && process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Failed to fetch balance for provider ${providerId}:`, result.error);
        }
      } else if (process.env.NODE_ENV === 'development') {
        try {
          const errorData = await response.json();
          console.warn(`⚠️ Balance fetch failed for provider ${providerId}:`, errorData.error || 'Unknown error');
        } catch {
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Network error fetching balance for provider ${providerId}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  };

  const fetchAllProviderBalances = async () => {
    try {
      const activeProviders = providers.filter(p => p.status === 'active');
      
      if (activeProviders.length === 0) {
        return;
      }

      const results = await Promise.all(
        activeProviders.map(async (provider) => {
          try {
            const response = await fetch(`/api/admin/providers/balance?providerId=${provider.id}`);
            const result = await response.json();
            if (response.ok && result.success && result.data) {
              return { id: provider.id, balance: result.data.balance || 0 };
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`⚠️ Network error fetching balance for ${provider.name}:`, error instanceof Error ? error.message : 'Unknown error');
            }
          }
          return null;
        })
      );

      const updates = results.filter((r): r is { id: number; balance: number } => r !== null);
      if (updates.length > 0) {
        setProviders(prev => prev.map(p => {
          const update = updates.find(u => u.id === p.id);
          return update ? { ...p, currentBalance: update.balance } : p;
        }));
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Critical error in fetchAllProviderBalances:', error);
      }
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
      await fetchProviders(statusFilter);
      setIsPageLoading(false);
    };

    console.log('🚀 useEffect triggered for initial loading');
    loadData();
  }, []);

  useEffect(() => {
    if (!isPageLoading) {
      fetchProviders(statusFilter);
    }
  }, [statusFilter]);

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

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const isEditMode = editingProvider !== null;

    if (!providerFormData.name.trim()) {
      showToast('Please enter a provider name', 'error');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/providers', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(isEditMode && { id: editingProvider!.id }),
          ...(isEditMode ? { name: providerFormData.name } : { customProviderName: providerFormData.name }),
          apiKey: providerFormData.apiKey,
          apiUrl: providerFormData.apiUrl,
          httpMethod: providerFormData.httpMethod,
          ...(isEditMode ? {} : {
            apiKeyParam: providerFormData.apiKeyParam,
            actionParam: providerFormData.actionParam,
            servicesAction: providerFormData.servicesAction,
            servicesEndpoint: providerFormData.servicesEndpoint,
            addOrderAction: providerFormData.addOrderAction,
            addOrderEndpoint: providerFormData.addOrderEndpoint,
            serviceIdParam: providerFormData.serviceIdParam,
            linkParam: providerFormData.linkParam,
            quantityParam: providerFormData.quantityParam,
            runsParam: providerFormData.runsParam,
            intervalParam: providerFormData.intervalParam,
            statusAction: providerFormData.statusAction,
            statusEndpoint: providerFormData.statusEndpoint,
            orderIdParam: providerFormData.orderIdParam,
            ordersParam: providerFormData.ordersParam,
            refillAction: providerFormData.refillAction,
            refillEndpoint: providerFormData.refillEndpoint,
            refillStatusAction: providerFormData.refillStatusAction,
            refillIdParam: providerFormData.refillIdParam,
            refillsParam: providerFormData.refillsParam,
            cancelAction: providerFormData.cancelAction,
            cancelEndpoint: providerFormData.cancelEndpoint,
            balanceAction: providerFormData.balanceAction,
            balanceEndpoint: providerFormData.balanceEndpoint,
            responseMapping: providerFormData.responseMapping,
            requestFormat: providerFormData.requestFormat,
            responseFormat: providerFormData.responseFormat,
            rateLimitPerMin: providerFormData.rateLimitPerMin ? parseInt(providerFormData.rateLimitPerMin) : null,
            timeoutSeconds: providerFormData.timeoutSeconds,
          }),
        })
      });

      const result = await response.json();

      if (result.success) {
        await fetchProviders(statusFilter);

        setProviderFormData(getDefaultFormData());
        setEditingProvider(undefined);

        if (isEditMode) {
          setProviders(prev => prev.map(provider =>
            provider.id === editingProvider!.id
              ? {
                  ...provider,
                  name: providerFormData.name,
                  apiUrl: providerFormData.apiUrl,
                  apiKey: providerFormData.apiKey,
                  httpMethod: providerFormData.httpMethod,
                  lastSync: new Date(),
                }
              : provider
          ));
        }

        showToast(result.message || (isEditMode ? 'Provider updated successfully!' : 'Provider added successfully!'), 'success');
      } else {
        showToast(result.error || (isEditMode ? 'Failed to update provider' : 'Failed to add provider'), 'error');
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} provider:`, error);
      showToast(`Failed to ${isEditMode ? 'update' : 'add'} provider`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenProviderModal = (provider: Provider | null = null) => {
    if (provider) {
      setEditingProvider(provider);
      setProviderFormData({
        name: provider.name,
        apiUrl: provider.apiUrl || '',
        apiKey: provider.apiKey || '',
        httpMethod: (provider.httpMethod || 'POST') as 'POST' | 'GET',
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
        requestFormat: (provider.requestFormat || 'form') as 'form' | 'json',
        responseFormat: (provider.responseFormat || 'json') as 'json' | 'xml',
        rateLimitPerMin: provider.rateLimitPerMin?.toString() || '',
        timeoutSeconds: provider.timeoutSeconds || 30,
      });
    } else {
      setEditingProvider(null);
      setProviderFormData(getDefaultFormData());
    }
  };

  const handleCloseProviderModal = () => {
    setEditingProvider(undefined);
    setProviderFormData(getDefaultFormData());
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
        <ManageProvidersModal
          isOpen={editingProvider !== undefined}
          onClose={handleCloseProviderModal}
          editingProvider={editingProvider || null}
          formData={providerFormData}
          onFormDataChange={(data) => setProviderFormData(data as any)}
          onSubmit={handleSaveProvider}
          isLoading={isLoading}
        />

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
                onClick={() => handleOpenProviderModal(null)}
                className="btn btn-primary flex items-center gap-2"
              >
                <FaPlus className="w-4 h-4" />
                Add Provider
              </button>
              <button
                onClick={handleSyncAllProviders}
                disabled={syncingAll}
                className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSync className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
                Sync All Provider Data
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
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
                  onClick={() => updateQueryParams({ status: null })}
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
                  onClick={() => updateQueryParams({ status: 'active' })}
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
                  onClick={() => updateQueryParams({ status: 'inactive' })}
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
                  onClick={() => updateQueryParams({ status: 'trash' })}
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
            <ProvidersTable
              providers={providers}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              connectionStatuses={connectionStatuses}
              syncingProvider={syncingProvider}
              formatDate={formatDate}
              formatTime={formatTime}
              onToggleStatus={handleToggleStatus}
              onSync={handleSyncProvider}
              onEdit={(provider: any) => handleOpenProviderModal(provider)}
              onDelete={(provider: any) => openDeletePopup(provider)}
              onRestore={(provider: any) => handleRestoreProvider(provider)}
            />
              </>
            )}
          </div>
        </div>
      </div>
      <DeleteProviderModal
        isOpen={showDeletePopup}
        onClose={() => {
          setShowDeletePopup(false);
          setProviderToDelete(null);
        }}
        provider={providerToDelete}
        onConfirm={handleDeleteProvider}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default APIProvidersPage;