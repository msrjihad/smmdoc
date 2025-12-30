"use client";
import React, { useEffect, useTransition } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FaSave, FaTimes } from "react-icons/fa";
import axiosInstance from "@/lib/axios-instance";
import { mutate } from "swr";
import { useGetCategories } from "@/hooks/categories-fetch";
import {
  createCategoryDefaultValues,
  createCategorySchema,
  CreateCategorySchema,
} from "@/lib/validators/admin/categories/categories.validator";

const FormField = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-2">{children}</div>
);

const FormItem = ({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => <div className={`space-y-2 ${className}`}>{children}</div>;

const FormLabel = ({
  className = "",
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
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => (children ? (
  <div className={`text-xs text-red-500 mt-1 ${className}`}>{children}</div>
) : null);

export const CreateCategoryForm = ({
  categoryId,
  onClose,
  showToast,
  onRefresh,
  refreshAllData,
}: {
  categoryId?: string;
  onClose: () => void;
  showToast: (
    message: string,
    type?: "success" | "error" | "info" | "pending"
  ) => void;
  onRefresh?: () => void;
  refreshAllData?: () => Promise<void>;
}) => {
  const isEditMode = !!categoryId;
  const { data: categoriesData } = useGetCategories();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategorySchema>({
    resolver: zodResolver(createCategorySchema),
    mode: "all",
    defaultValues: {
      ...createCategoryDefaultValues,
      hideCategory: "no",
      position: "top",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && categoriesData?.data && categoryId) {
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
  }, [isEditMode, categoriesData, categoryId, reset]);

  // Reset form when modal closes
  useEffect(() => {
    return () => {
      reset({
        ...createCategoryDefaultValues,
        hideCategory: "no",
        position: "top",
      });
    };
  }, [reset]);

  const handleClose = () => {
    // Reset form before closing
    reset({
      ...createCategoryDefaultValues,
      hideCategory: "no",
      position: "top",
    });
    onClose();
  };

  const onSubmit: SubmitHandler<CreateCategorySchema> = async (values) => {
    startTransition(async () => {
      try {
        let response;
        if (isEditMode && categoryId) {
          response = await axiosInstance.put(
            `/api/admin/categories/${categoryId}`,
            values
          );
        } else {
          response = await axiosInstance.post("/api/admin/categories", values);
        }

        if (response.data.success) {
          // Reset form after successful submit
          reset({
            ...createCategoryDefaultValues,
            hideCategory: "no",
            position: "top",
          });

          showToast(
            response.data.message || (isEditMode ? "Category updated successfully" : "Category created successfully"),
            "success"
          );

          mutate("/api/admin/categories");
          mutate("/api/admin/categories/get-categories");
          mutate("/api/admin/services");

          if (isEditMode && refreshAllData) {
            await refreshAllData();
          } else if (!isEditMode && onRefresh) {
            onRefresh();
          }

          onClose();
        } else {
          showToast(
            response.data.error || (isEditMode ? "Failed to update category" : "Failed to create category"),
            "error"
          );
        }
      } catch (error: any) {
        showToast(
          `Error: ${
            error.response?.data?.error || error.message || "Something went wrong"
          }`,
          "error"
        );
      }
    });
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between p-6">
        <h3 className="text-lg font-semibold">
          {isEditMode ? "Edit Category" : "Create New Category"}
        </h3>
        <button
          onClick={handleClose}
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
                {...register("category_name")}
                disabled={isPending}
                autoFocus
              />
            </FormControl>
            <FormMessage>{errors.category_name?.message}</FormMessage>
          </FormItem>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormItem className="col-span-1">
              <FormLabel className="form-label">Hide Category</FormLabel>
              <FormControl>
                <select
                  className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  {...register("hideCategory")}
                  disabled={isPending}
                >
                  <option value="no">No (Category will be visible/active)</option>
                  <option value="yes">Yes (Category will be hidden/deactivated)</option>
                </select>
              </FormControl>
              <FormMessage>{errors.hideCategory?.message}</FormMessage>
            </FormItem>
            <FormItem className="col-span-1">
              <FormLabel className="form-label">Position</FormLabel>
              <FormControl>
                <select
                  className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  {...register("position")}
                  disabled={isPending}
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              </FormControl>
              <FormMessage>{errors.position?.message}</FormMessage>
            </FormItem>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleClose}
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
                <>{isEditMode ? "Updating..." : "Creating..."}</>
              ) : (
                <>
                  {isEditMode ? <FaSave className="h-4 w-4" /> : null}
                  {isEditMode ? "Update Category" : "Create Category"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};