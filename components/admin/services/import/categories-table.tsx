'use client';
import React from 'react';
import { FaCheckCircle, FaSync } from 'react-icons/fa';

interface ApiCategory {
  id: number;
  name: string;
  servicesCount: number;
  selected?: boolean;
}

interface CategoriesTableProps {
  apiCategories: ApiCategory[];
  providerName: string;
  onCategorySelect: (categoryId: string | number) => void;
  onSelectAllCategories: () => void;
  onRefresh: () => void;
}

export const CategoriesTable: React.FC<CategoriesTableProps> = ({
  apiCategories,
  providerName,
  onCategorySelect,
  onSelectAllCategories,
  onRefresh,
}) => {
  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Connected to {providerName}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select categories to import services from
            </p>
          </div>
          <button
            onClick={onRefresh}
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
                  checked={apiCategories.every((cat) => cat.selected)}
                  onChange={onSelectAllCategories}
                  className="rounded border-gray-300 w-4 h-4"
                />
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Category Name
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Services Count
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {apiCategories.map((category) => (
              <tr
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200 cursor-pointer ${
                  category.selected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={category.selected || false}
                    onChange={() => onCategorySelect(category.id)}
                    className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="p-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {category.name}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {category.servicesCount.toString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
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
  );
};

