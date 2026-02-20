'use client';
import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { formatNumber } from '@/lib/utils';

interface Service {
  id: number;
  name: string;
  min_order: number;
  max_order: number;
  rate: number;
  description: string;
  categoryId: number;
  category?: {
    id: number;
    category_name: string;
  };
  status: 'active' | 'inactive';
  provider?: string;
  service_type?: string;
  serviceType?: string;
  refill?: boolean;
  cancel?: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ServicesTableProps {
  services: Service[];
  editedServices: { [key: string]: Partial<Service> };
  pagination: PaginationInfo;
  localServicesLoading: boolean;
  onFieldChange: (serviceId: string | number, field: keyof Service, value: string | number) => void;
  getCurrentValue: (service: Service, field: keyof Service) => any;
  formatID: (id: string | number) => string;
  onPageChange: (page: number) => void;
}

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white"></div>
    </div>
  </div>
);

export const ServicesTable: React.FC<ServicesTableProps> = ({
  services,
  editedServices,
  pagination,
  localServicesLoading,
  onFieldChange,
  getCurrentValue,
  formatID,
  onPageChange,
}) => {
  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm min-w-[1200px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                ID
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Name
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Min
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Max
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Price (USD)
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Description
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr
                key={service.id}
                className={`border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200 ${
                  editedServices[service.id] ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                }`}
              >
                <td className="p-3">
                  <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded w-fit">
                    {formatID(service.id)}
                  </div>
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    value={getCurrentValue(service, 'name') as string}
                    onChange={(e) => onFieldChange(service.id, 'name', e.target.value)}
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    value={getCurrentValue(service, 'min_order') as number}
                    onChange={(e) => onFieldChange(service.id, 'min_order', parseInt(e.target.value) || 0)}
                    className="form-field w-20 px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="0"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    value={getCurrentValue(service, 'max_order') as number}
                    onChange={(e) => onFieldChange(service.id, 'max_order', parseInt(e.target.value) || 0)}
                    className="form-field w-24 px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="0"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    value={getCurrentValue(service, 'rate') as number}
                    onChange={(e) => onFieldChange(service.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="form-field w-20 px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="p-3">
                  <textarea
                    value={getCurrentValue(service, 'description') as string}
                    onChange={(e) => onFieldChange(service.id, 'description', e.target.value)}
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 resize-y"
                    rows={2}
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full w-fit">
                    <FaCheckCircle className={`h-3 w-3 ${service.status === 'active' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`} />
                    <span className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">
                      {service.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lg:hidden">
        <div className="space-y-4 pt-6">
          {services.map((service) => (
            <div
              key={service.id}
              className={`card card-padding border-l-4 border-blue-500 dark:border-blue-400 mb-4 ${
                editedServices[service.id] ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    {formatID(service.id)}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <FaCheckCircle className={`h-3 w-3 ${service.status === 'active' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`} />
                    <span className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">
                      {service.status}
                    </span>
                  </div>
                </div>
                {editedServices[service.id] && (
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded">
                    Modified
                  </span>
                )}
              </div>
              <div className="mb-4">
                <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Service Name</label>
                <input
                  type="text"
                  value={getCurrentValue(service, 'name') as string}
                  onChange={(e) => onFieldChange(service.id, 'name', e.target.value)}
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Min Order</label>
                  <input
                    type="number"
                    value={getCurrentValue(service, 'min_order') as number}
                    onChange={(e) => onFieldChange(service.id, 'min_order', parseInt(e.target.value) || 0)}
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Max Order</label>
                  <input
                    type="number"
                    value={getCurrentValue(service, 'max_order') as number}
                    onChange={(e) => onFieldChange(service.id, 'max_order', parseInt(e.target.value) || 0)}
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="0"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Price (USD)</label>
                <input
                  type="number"
                  value={getCurrentValue(service, 'rate') as number}
                  onChange={(e) => onFieldChange(service.id, 'rate', parseFloat(e.target.value) || 0)}
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  value={getCurrentValue(service, 'description') as string}
                  onChange={(e) => onFieldChange(service.id, 'description', e.target.value)}
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-y"
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 border-t dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {localServicesLoading ? (
            <div className="flex items-center gap-2">
              <span>Loading pagination...</span>
            </div>
          ) : (
            `Showing ${
              (pagination.page - 1) * pagination.limit + 1
            } to ${
              Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )
            } of ${pagination.total} services`
          )}
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPrev || localServicesLoading}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {localServicesLoading ? (
              <GradientSpinner size="w-4 h-4" />
            ) : (
              `Page ${formatNumber(
                pagination.page
              )} of ${formatNumber(pagination.totalPages)}`
            )}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={!pagination.hasNext || localServicesLoading}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

