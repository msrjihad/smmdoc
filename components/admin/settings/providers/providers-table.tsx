'use client';

import React from 'react';
import { FaGlobe, FaToggleOff, FaToggleOn } from 'react-icons/fa';
import MoreActionMenu from './more-action-menu';

interface Provider {
  id: number;
  name: string;
  apiUrl: string;
  status: 'active' | 'inactive' | 'trash';
  services: number;
  orders: number;
  importedServices: number;
  activeServices: number;
  inactiveServices: number;
  currentBalance: number;
  lastSync: Date | string;
  [key: string]: any;
}

interface ProvidersTableProps {
  providers: Provider[];
  searchQuery: string;
  statusFilter: string;
  connectionStatuses: {[key: number]: 'connected' | 'disconnected' | 'testing' | 'unknown'};
  syncingProvider: number | null;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  onToggleStatus: (providerId: number) => void;
  onSync: (providerId: number) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onRestore: (provider: Provider) => void;
}

const ProvidersTable: React.FC<ProvidersTableProps> = ({
  providers,
  searchQuery,
  statusFilter,
  connectionStatuses,
  syncingProvider,
  formatDate,
  formatTime,
  onToggleStatus,
  onSync,
  onEdit,
  onDelete,
  onRestore,
}) => {
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
    <>
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
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
            {filteredProviders.map((provider, index) => (
              <tr key={provider.id || `provider-${provider.name}-${index}`} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200">
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
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {provider.lastSync
                          ? formatDate(provider.lastSync)
                          : 'null'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
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
                      onClick={() => onToggleStatus(provider.id)}
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
                  <MoreActionMenu
                    provider={provider}
                    syncingProvider={syncingProvider}
                    onSync={onSync}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onRestore={onRestore}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {filteredProviders.map((provider, index) => (
          <div key={provider.id || `provider-${provider.name}-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">#{provider.id}</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{provider.name}</div>
              </div>
              <button
                onClick={() => onToggleStatus(provider.id)}
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
            <MoreActionMenu
              provider={provider}
              syncingProvider={syncingProvider}
              onSync={onSync}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default ProvidersTable;