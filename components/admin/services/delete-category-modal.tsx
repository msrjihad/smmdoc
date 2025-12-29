"use client";
import React, { useState } from "react";
import { FaTimes, FaExclamationTriangle, FaTrash } from "react-icons/fa";

export const DeleteCategoryModal = ({
  onClose,
  onConfirm,
  categoryName,
  categoryId,
  isUpdating,
  servicesCount,
  categoriesData,
}: {
  onClose: () => void;
  onConfirm: (action: "delete" | "move", targetCategoryId?: string) => void;
  categoryName: string;
  categoryId: number;
  isUpdating: boolean;
  servicesCount: number;
  categoriesData: any;
}) => {
  const [deleteAction, setDeleteAction] = useState<"delete" | "move">("delete");
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");

  const availableCategories =
    categoriesData?.data?.filter((cat: any) => cat.id !== categoryId) || [];

  const handleConfirm = () => {
    if (deleteAction === "move" && !targetCategoryId) {
      return;
    }
    onConfirm(deleteAction, targetCategoryId || undefined);
  };

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center justify-between p-6">
        <h3
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Delete "{categoryName}" Category
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Close"
        >
          <FaTimes className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 pb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <FaExclamationTriangle className="h-6 w-6 text-red-500 dark:text-red-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                This category contains {servicesCount} service
                {servicesCount !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                Choose how to handle the services before deleting the category.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="font-medium text-gray-800 dark:text-gray-100">
              What would you like to do with the services?
            </p>
            <label className="flex items-start gap-3 p-3 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <input
                type="radio"
                name="deleteAction"
                value="delete"
                checked={deleteAction === "delete"}
                onChange={(e) => setDeleteAction(e.target.value as "delete")}
                className="mt-0.5"
              />
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-100">
                  Delete category with all services
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Permanently remove the category and all {servicesCount} service
                  {servicesCount !== 1 ? "s" : ""}
                </div>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <input
                type="radio"
                name="deleteAction"
                value="move"
                checked={deleteAction === "move"}
                onChange={(e) => setDeleteAction(e.target.value as "move")}
                className="mt-0.5"
                disabled={availableCategories.length === 0}
              />
              <div className="flex-1">
                <div className="font-medium text-gray-800 dark:text-gray-100">
                  Move services to another category
                  {availableCategories.length === 0 && (
                    <span className="text-red-500 dark:text-red-400 text-sm ml-2">
                      (No other categories available)
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Transfer all services to a different category before deleting
                  this one
                </div>
                {deleteAction === "move" && availableCategories.length > 0 && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select target category:
                    </label>
                    <select
                      value={targetCategoryId}
                      onChange={(e) => setTargetCategoryId(e.target.value)}
                      className="w-full pl-4 pr-10 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="">Choose a category...</option>
                      {availableCategories.map((category: any) => (
                        <option key={category.id} value={category.id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </label>
          </div>
          {deleteAction === "delete" && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Warning:</strong> This will permanently delete both the
                category and all {servicesCount} service
                {servicesCount !== 1 ? "s" : ""} inside it. This action cannot
                be undone.
              </p>
            </div>
          )}
          {deleteAction === "move" && targetCategoryId && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Ready:</strong> All services will be moved to "
                {
                  availableCategories.find(
                    (cat: any) => cat.id === targetCategoryId
                  )?.category_name
                }
                " before deleting this category.
              </p>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="btn btn-secondary px-6 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                isUpdating || (deleteAction === "move" && !targetCategoryId)
              }
              className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  {deleteAction === "delete" ? "Deleting..." : "Moving & Deleting..."}
                </>
              ) : (
                <>
                  <FaTrash className="h-4 w-4" />
                  {deleteAction === "delete" ? "Delete All" : "Move & Delete Category"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};