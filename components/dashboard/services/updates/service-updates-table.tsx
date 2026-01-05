'use client';

import React from 'react';
import { FaClipboardList } from 'react-icons/fa';

interface Service {
  id: number;
  name: string;
  updatedAt: string;
  updateText: string;
}

interface ServiceUpdatesTableProps {
  services: Service[];
  loading: boolean;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  totalPages: number;
  page: number;
  onPrevious: () => void;
  onNext: () => void;
}

const ServiceUpdatesTable: React.FC<ServiceUpdatesTableProps> = ({
  services,
  loading,
  formatDate,
  formatTime,
  totalPages,
  page,
  onPrevious,
  onNext,
}) => {
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)] rounded-t-lg">
              {Array.from({ length: 4 }).map((_, idx) => (
                <th key={idx} className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                  <div className="h-4 w-20 gradient-shimmer rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, idx) => (
              <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-6 py-4">
                  <div className="h-4 w-12 gradient-shimmer rounded" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-48 gradient-shimmer rounded" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-64 gradient-shimmer rounded" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-32 gradient-shimmer rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (services?.length === 0) {
    return (
      <div className="text-center py-8 flex flex-col items-center">
        <FaClipboardList className="text-4xl text-gray-400 dark:text-gray-500 mb-4" />
        <div className="text-lg font-medium dark:text-gray-300">
          No service updates found
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Try adjusting your search criteria
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)] rounded-t-lg">
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 first:rounded-tl-lg">
                ID
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 max-w-[400px]">
                Service Name
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Date & Time
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 w-[300px] last:rounded-tr-lg">
                Update
              </th>
            </tr>
          </thead>
          <tbody>
            {services?.map((service) => (
              <tr key={service.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {service.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {service.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(service.updatedAt)}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(service.updatedAt)}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-md">
                  <div className="break-words">
                    {(() => {
                      try {
                        const updateData = JSON.parse(service.updateText || '{}');

                        if (updateData.action === 'created' || updateData.type === 'new_service' || updateData.action === 'create') {
                          return 'New service';
                        }

                        if (updateData.action === 'added' || updateData.type === 'service_added' || updateData.action === 'import') {
                          return 'New service';
                        }

                        const updates = [];
                        let hasRateChange = false;
                        let hasStatusChange = false;

                        const rateChange = updateData.changes?.rate || updateData.rate;
                        if (rateChange && rateChange.from !== undefined && rateChange.to !== undefined) {
                          const oldRate = parseFloat(rateChange.from);
                          const newRate = parseFloat(rateChange.to);

                          const formatRate = (rate: number) => {
                            const formatted = rate.toFixed(6);
                            return parseFloat(formatted).toString();
                          };

                          if (newRate > oldRate) {
                            updates.push(`Rate increased from $${formatRate(oldRate)} to $${formatRate(newRate)}`);
                            hasRateChange = true;
                          } else if (newRate < oldRate) {
                            updates.push(`Rate decreased from $${formatRate(oldRate)} to $${formatRate(newRate)}`);
                            hasRateChange = true;
                          }
                        }

                        const statusChange = updateData.changes?.status || updateData.status;
                        if (statusChange && statusChange.from !== undefined && statusChange.to !== undefined) {
                          const oldStatus = statusChange.from;
                          const newStatus = statusChange.to;
                          if (newStatus === 'active' && oldStatus !== 'active') {
                            updates.push('Service enabled');
                            hasStatusChange = true;
                          } else if (newStatus !== 'active' && oldStatus === 'active') {
                            updates.push('Service disabled');
                            hasStatusChange = true;
                          }
                        }

                        const infoUpdates = [];

                        const minOrderChange = updateData.changes?.min_order || updateData.min_order;
                        if (minOrderChange && minOrderChange.from !== undefined && minOrderChange.to !== undefined) {
                          infoUpdates.push('min order');
                        }

                        const maxOrderChange = updateData.changes?.max_order || updateData.max_order;
                        if (maxOrderChange && maxOrderChange.from !== undefined && maxOrderChange.to !== undefined) {
                          infoUpdates.push('max order');
                        }

                        const nameChange = updateData.changes?.name || updateData.name;
                        if (nameChange && nameChange.from !== undefined && nameChange.to !== undefined) {
                          infoUpdates.push('name');
                        }

                        const descriptionChange = updateData.changes?.description || updateData.description;
                        if (descriptionChange && descriptionChange.from !== undefined && descriptionChange.to !== undefined) {
                          infoUpdates.push('description');
                        }

                        const categoryChange = updateData.changes?.categoryId || updateData.changes?.category || updateData.category;
                        if (categoryChange && categoryChange.from !== undefined && categoryChange.to !== undefined) {
                          infoUpdates.push('category');
                        }

                        if (infoUpdates.length > 0 && !hasRateChange && !hasStatusChange) {
                          updates.push('Service info updated');
                        }

                        return updates.length > 0 ? updates.join(', ') : 'Service updated';

                      } catch (error) {
                        const text = service.updateText || '';
                        if (text.toLowerCase().includes('created') || text.toLowerCase().includes('new')) {
                          return 'New service';
                        }
                        if (text.toLowerCase().includes('added') || text.toLowerCase().includes('imported')) {
                          return 'Service added';
                        }
                        if (text.toLowerCase().includes('disabled')) {
                          return 'Service disabled';
                        }
                        if (text.toLowerCase().includes('enabled')) {
                          return 'Service enabled';
                        }
                        return 'Service updated';
                      }
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Page <span className="font-medium">{page}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onPrevious}
              disabled={page === 1 || loading}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={onNext}
              disabled={page === totalPages || loading}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceUpdatesTable;

