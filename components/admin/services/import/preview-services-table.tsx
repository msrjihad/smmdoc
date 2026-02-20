'use client';
import React from 'react';
import {
  FaChevronDown,
  FaChevronRight,
  FaExclamationTriangle,
  FaToggleOff,
  FaToggleOn,
} from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';
import { formatID } from '@/lib/utils';

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
  refillDays?: number | null;
  refillDisplay?: number;
}

interface PreviewServicesTableProps {
  groupedServices: { [key: string]: Service[] };
  collapsedCategories: { [key: string]: boolean };
  editedServices: { [key: string]: Partial<Service> };
  duplicateServices: Set<string>;
  onToggleCategoryCollapse: (category: string) => void;
  onFieldChange: (
    serviceId: string | number,
    field: keyof Service,
    value: string | number
  ) => void;
  getCurrentValue: (service: Service, field: keyof Service) => any;
  getCurrentSalePrice: (service: Service) => number;
}

export const PreviewServicesTable: React.FC<PreviewServicesTableProps> = ({
  groupedServices,
  collapsedCategories,
  editedServices,
  duplicateServices,
  onToggleCategoryCollapse,
  onFieldChange,
  getCurrentValue,
  getCurrentSalePrice,
}) => {
  return (
    <>
      <div className="hidden lg:block card animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                  ID
                </th>
                <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                  Service Name
                </th>
                <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                  Type
                </th>
                <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                  Price (USD)
                </th>
                <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                  Percent
                </th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">
                  Refill
                </th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">
                  Cancel
                </th>
                <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
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
                              onClick={() => onToggleCategoryCollapse(category)}
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
                              {categoryServices.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {categoryServices.filter(
                              (service) => editedServices[service.id]
                            ).length > 0 && (
                              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded-full">
                                {
                                  categoryServices.filter(
                                    (service) => editedServices[service.id]
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
                                    onFieldChange(
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
                                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                      <PriceDisplay
                                        amount={getCurrentSalePrice(service)}
                                        originalCurrency="USD"
                                        className="font-semibold text-sm text-gray-900 dark:text-gray-100"
                                      />
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Provider:{' '}
                                      <PriceDisplay
                                        amount={
                                          service.providerPrice
                                            ? parseFloat(
                                                service.providerPrice.toString()
                                              )
                                            : 0
                                        }
                                        originalCurrency="USD"
                                        className="text-xs text-gray-500 dark:text-gray-400"
                                      />
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
                                      onFieldChange(
                                        service.id,
                                        'percent',
                                        parseFloat(e.target.value) || 0
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
                                    {(() => {
                                      const refillValue = getCurrentValue(
                                        service,
                                        'refill'
                                      ) as boolean | undefined;
                                      const refillDays = getCurrentValue(
                                        service,
                                        'refillDays'
                                      ) as number | null | undefined;
                                      const refillDisplay = getCurrentValue(
                                        service,
                                        'refillDisplay'
                                      ) as number | undefined;
                                      return (
                                        <>
                                          <button
                                            className={`p-1 rounded transition-colors duration-200 ${
                                              refillValue
                                                ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            }`}
                                            title={
                                              refillValue
                                                ? 'Refill Enabled'
                                                : 'Refill Disabled'
                                            }
                                            onClick={() => {}}
                                          >
                                            {refillValue ? (
                                              <FaToggleOn className="h-5 w-5" />
                                            ) : (
                                              <FaToggleOff className="h-5 w-5" />
                                            )}
                                          </button>
                                          {refillValue && (
                                            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-1">
                                              {refillDays === null ||
                                              refillDays === undefined ? (
                                                <div>Lifetime</div>
                                              ) : (
                                                <div>
                                                  {refillDays}D{' '}
                                                  {refillDisplay || 0}H
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
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
                                        service.cancel
                                          ? 'Cancel Enabled'
                                          : 'Cancel Disabled'
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
                                      onFieldChange(
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
                          <td colSpan={8} className="p-8 text-center">
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
                      onClick={() => onToggleCategoryCollapse(category)}
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
                              getCurrentValue(service, 'name') as string
                            }
                            onChange={(e) =>
                              onFieldChange(service.id, 'name', e.target.value)
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
                              <div className="font-semibold text-sm bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded text-gray-900 dark:text-gray-100">
                                <PriceDisplay
                                  amount={getCurrentSalePrice(service)}
                                  originalCurrency="USD"
                                  className="font-semibold text-sm text-gray-900 dark:text-gray-100"
                                />
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 px-3">
                                Provider:{' '}
                                <PriceDisplay
                                  amount={
                                    service.providerPrice
                                      ? parseFloat(
                                          service.providerPrice.toString()
                                        )
                                      : 0
                                  }
                                  originalCurrency="USD"
                                  className="text-xs text-gray-500 dark:text-gray-400"
                                />
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
                                getCurrentValue(service, 'percent') as number
                              }
                              onChange={(e) =>
                                onFieldChange(
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
                            <div className="flex flex-col">
                              {(() => {
                                const refillValue = getCurrentValue(
                                  service,
                                  'refill'
                                ) as boolean | undefined;
                                const refillDays = getCurrentValue(
                                  service,
                                  'refillDays'
                                ) as number | null | undefined;
                                const refillDisplay = getCurrentValue(
                                  service,
                                  'refillDisplay'
                                ) as number | undefined;
                                return (
                                  <>
                                    <div className="flex items-center">
                                      <button
                                        className={`p-1 rounded transition-colors duration-200 ${
                                          refillValue
                                            ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                            : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                        title={
                                          refillValue
                                            ? 'Refill Enabled'
                                            : 'Refill Disabled'
                                        }
                                        onClick={() => {}}
                                      >
                                        {refillValue ? (
                                          <FaToggleOn className="h-6 w-6" />
                                        ) : (
                                          <FaToggleOff className="h-6 w-6" />
                                        )}
                                      </button>
                                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                        {refillValue ? 'Enabled' : 'Disabled'}
                                      </span>
                                    </div>
                                    {refillValue && (
                                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-1">
                                        {refillDays === null ||
                                        refillDays === undefined ? (
                                          <div>Lifetime</div>
                                        ) : (
                                          <div>
                                            {refillDays}D {refillDisplay || 0}H
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
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
                                  service.cancel
                                    ? 'Cancel Enabled'
                                    : 'Cancel Disabled'
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
                              getCurrentValue(service, 'description') as string
                            }
                            onChange={(e) =>
                              onFieldChange(
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
    </>
  );
};

