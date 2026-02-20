'use client';
import React from 'react';

interface Category {
  id: number;
  category_name: string;
  hideCategory?: string;
  position?: string;
}

interface SelectCategoryModalProps {
  isOpen: boolean;
  categories: Category[];
  tempSelectedCategory: string | number;
  onCategoryChange: (categoryId: string | number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const SelectCategoryModal: React.FC<SelectCategoryModalProps> = ({
  isOpen,
  categories,
  tempSelectedCategory,
  onCategoryChange,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Select Category
        </h3>
        <div className="mb-4">
          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">
            Choose a category to modify its services
          </label>
          <select
            value={tempSelectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="">-- Select Category --</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.category_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!tempSelectedCategory}
            className="btn btn-primary"
          >
            Load Services
          </button>
        </div>
      </div>
    </div>
  );
};

