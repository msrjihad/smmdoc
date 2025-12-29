'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useTransition } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FaSave, FaTimes } from 'react-icons/fa';
import { mutate } from 'swr';
import { useGetCategories } from '@/hooks/categories-fetch';
import axiosInstance from '@/lib/axios-instance';
import {
  createCategoryDefaultValues,
  createCategorySchema,
  CreateCategorySchema,
} from '@/lib/validators/admin/categories/categories.validator';

const FormItem = ({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => <div className={`space-y-2 ${className}`}>{children}</div>;

const FormLabel = ({
  className = '',
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) => (
  <label className={`block text-sm font-medium ${className}`} style={style}>
    {children}
  </label>
);

const FormControl = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

const FormMessage = ({
  className = '',
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) =>
  children ? (
    <div className={`text-xs text-red-500 mt-1 ${className}`}>{children}</div>
  ) : null;

export const EditCategoryForm = ({
  categoryId,
  categoryName,
  onClose,
  showToast,
  refreshAllData,
}: {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'pending'
  ) => void;
  refreshAllData?: () => Promise<void>;
}) => {
  const { data: categoriesData } = useGetCategories();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategorySchema>({
    resolver: zodResolver(createCategorySchema),
    mode: 'all',
    defaultValues: {
      ...createCategoryDefaultValues,
      hideCategory: 'no',
      position: 'top',
    },
  });

  useEffect(() => {
    if (categoriesData?.data && categoryId) {
      const category = categoriesData.data.find(
        (cat: any) => cat.id === parseInt(categoryId)
      );
      if (category) {
        reset({
          category_name: category.category_name || '',
          hideCategory: category.hideCategory || 'no',
          position: category.position || 'top',
        });
      }
    }
  }, [categoriesData, categoryId, reset]);

  const onSubmit: SubmitHandler<CreateCategorySchema> = async (values) => {
    startTransition(async () => {
      try {

        const res = await axiosInstance.put(
          `/api/admin/categories/${categoryId}`,
          values
        );
        if (res.data.success) {
          showToast(
            res.data.message || 'Category updated successfully',
            'success'
          );

          mutate('/api/admin/categories');
          mutate('/api/admin/categories/get-categories');
          mutate('/api/admin/services');

          if (refreshAllData) {
            await refreshAllData();
          }

          onClose();
        } else {
          showToast(res.data.error || 'Failed to update category', 'error');
        }
      } catch (error: any) {
        showToast(
          `Error: ${
            error.response?.data?.error ||
            error.message ||
            'Something went wrong'
          }`,
          'error'
        );
      }
    });
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between p-6">
        <h3 className="text-lg font-semibold">Edit Category</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Close"
        >
          <FaTimes className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 pb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormItem>
            <FormLabel className="form-label">Category Name</FormLabel>
            <FormControl>
              <input
                type="text"
                placeholder="Enter category name"
                className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                {...register('category_name')}
                disabled={isPending}
                autoFocus
              />
            </FormControl>
            <FormMessage>{errors.category_name?.message}</FormMessage>
          </FormItem>
          <FormItem>
            <FormLabel className="form-label">Hide Category</FormLabel>
            <FormControl>
              <select
                className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                {...register('hideCategory')}
                disabled={isPending}
              >
                <option value="no">No (Category will be visible/active)</option>
                <option value="yes">
                  Yes (Category will be hidden/deactivated)
                </option>
              </select>
            </FormControl>
            <FormMessage>{errors.hideCategory?.message}</FormMessage>
          </FormItem>
          <FormItem>
            <FormLabel className="form-label">Position</FormLabel>
            <FormControl>
              <select
                className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                {...register('position')}
                disabled={isPending}
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
              </select>
            </FormControl>
            <FormMessage>{errors.position?.message}</FormMessage>
          </FormItem>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="btn btn-secondary px-8 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary flex items-center gap-2 px-8 py-3"
            >
              {isPending ? (
                <>
                  Updating...
                </>
              ) : (
                <>
                  <FaSave className="h-4 w-4" />
                  Update Category
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};