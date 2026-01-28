'use client';

import React from 'react';
import {
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
  FaEye,
  FaRegStar,
  FaStar
} from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';
import { formatNumber } from '@/lib/utils';

interface Service {
  id: number;
  name: string;
  rate: number;
  min_order: number;
  max_order: number;
  avg_time: string;
  description: string;
  category: {
    category_name: string;
    id: number;
  };
  serviceType?: {
    id: string;
    name: string;
  };
  isFavorite?: boolean;
  refill?: boolean;
  cancel?: boolean;
  refillDays?: number;
  refillDisplay?: number;
}

interface ServicesTableProps {
  groupedServices: Record<string, Service[]>;
  expandedCategories: Record<string, boolean>;
  isSearchLoading: boolean;
  onToggleCategory: (categoryName: string) => void;
  onToggleFavorite: (serviceId: number) => void;
  onViewDetails: (service: Service) => void;
  totalPages: number;
  page: number;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

const ServicesTable: React.FC<ServicesTableProps> = ({
  groupedServices,
  expandedCategories,
  isSearchLoading,
  onToggleCategory,
  onToggleFavorite,
  onViewDetails,
  totalPages,
  page,
  loading,
  onPrevious,
  onNext,
}) => {
  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)] rounded-t-lg">
              <th className="text-left py-3 px-4 font-medium text-sm text-gray-900 dark:text-gray-100 first:rounded-tl-lg">
                Fav
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm text-gray-900 dark:text-gray-100">
                ID
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm text-gray-900 dark:text-gray-100">
                Service
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm text-gray-900 dark:text-gray-100">
                Rate per 1000
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm text-gray-900 dark:text-gray-100">
                Min order
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm text-gray-900 dark:text-gray-100">
                Max order
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm text-gray-900 dark:text-gray-100">
                Average time
              </th>
              <th className="text-center py-3 px-4 font-medium text-sm text-gray-900 dark:text-gray-100">
                Refill
              </th>
              <th className="text-center py-3 px-4 font-medium text-sm text-gray-900 dark:text-gray-100">
                Cancel
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm text-gray-900 dark:text-gray-100 last:rounded-tr-lg">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {isSearchLoading ? (
              <>
                {Array.from({ length: 3 }).map((_, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr>
                      <td colSpan={10} className="p-0">
                        <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium py-4 px-6">
                          <div className="flex items-center justify-between">
                            <div className="h-6 w-64 gradient-shimmer rounded" />
                            <div className="h-4 w-4 gradient-shimmer rounded" />
                          </div>
                        </div>
                      </td>
                    </tr>
                    {Array.from({ length: 5 }).map((_, serviceIdx) => (
                      <tr key={serviceIdx} className="border-b border-gray-100 dark:border-gray-600">
                        <td className="py-3 px-4">
                          <div className="h-4 w-4 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-12 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-48 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-16 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-12 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-12 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 w-16 gradient-shimmer rounded" />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="h-6 w-12 gradient-shimmer rounded mx-auto" />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="h-6 w-12 gradient-shimmer rounded mx-auto" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-8 w-20 gradient-shimmer rounded" />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </>
            ) : Object.keys(groupedServices).length > 0 ? (
              Object.entries(groupedServices).map(([categoryName, categoryServices]) => (
                <React.Fragment key={categoryName}>
                  <tr>
                    <td colSpan={10} className="p-0">
                      <div
                        className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium py-4 px-6 cursor-pointer hover:from-[var(--primary)]/90 hover:to-[var(--secondary)]/90 transition-all duration-200"
                        onClick={() => onToggleCategory(categoryName)}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-base md:text-lg font-semibold">
                            {categoryName} ({categoryServices.length} services)
                          </h3>
                          <div className="flex items-center gap-2">
                            {expandedCategories[categoryName] ? (
                              <FaChevronUp className="w-4 h-4" />
                            ) : (
                              <FaChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {expandedCategories[categoryName] && categoryServices.length > 0 && (
                    categoryServices.map((service) => (
                      <tr
                        key={service.id}
                        className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/30 last:border-b-0"
                      >
                        <td className="py-3 px-4">
                          <button
                            onClick={() => onToggleFavorite(service.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200"
                            title={
                              service.isFavorite
                                ? 'Remove from favorites'
                                : 'Add to favorites'
                            }
                          >
                            {service.isFavorite ? (
                              <FaStar className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                            ) : (
                              <FaRegStar className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-yellow-500 dark:hover:text-yellow-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                            {service.id}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm md:text-base font-medium text-gray-900 dark:text-white">
                            {service.name}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            <PriceDisplay
                              amount={service.rate}
                              originalCurrency="USD"
                            />
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {formatNumber(service.min_order || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {formatNumber(service.max_order || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {service.avg_time || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1">
                              {service.refill ? (
                                <>
                                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">ON</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">OFF</span>
                                </>
                              )}
                            </div>
                            {service.refill && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                                {service.refillDays === null || service.refillDays === undefined ? (
                                  <div>Lifetime</div>
                                ) : (
                                  <>
                                    {service.refillDays && (
                                      <div>Days: {service.refillDays}</div>
                                    )}
                                    {service.refillDisplay && (
                                      <div>Hours: {service.refillDisplay}</div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {service.cancel ? (
                              <>
                                <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">ON</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                                <span className="text-xs text-red-600 dark:text-red-400 font-medium">OFF</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => onViewDetails(service)}
                            className="flex items-center gap-2 px-3 py-1 text-sm text-[var(--primary)] dark:text-[var(--secondary)] hover:text-[#4F0FD8] dark:hover:text-[#A121E8] border border-[var(--primary)] dark:border-[var(--secondary)] rounded hover:bg-[var(--primary)]/10 dark:hover:bg-[var(--secondary)]/10 transition-colors duration-200"
                          >
                            <FaEye className="w-3 h-3" />
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {expandedCategories[categoryName] && categoryServices.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                          <FaClipboardList className="text-2xl md:text-4xl mb-2 dark:text-gray-500" />
                          <p className="text-sm font-medium dark:text-gray-300">No services found!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <FaClipboardList className="text-2xl md:text-4xl mb-2" />
                    <div className="text-base md:text-lg font-medium text-gray-900 dark:text-white">
                      No services found!
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Try adjusting your search criteria
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Page <span className="font-medium">{page}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
            {' '}({Object.keys(groupedServices).length} categories shown)
          </div>
          <div className="flex gap-2">
            <button
              onClick={onPrevious}
              disabled={page === 1 || loading}
              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>
            <button
              onClick={onNext}
              disabled={page === totalPages || loading}
              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ServicesTable;

