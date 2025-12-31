'use client';
import React, { Fragment, useEffect } from 'react';
import {
  FaBriefcase,
  FaChevronDown,
  FaChevronRight,
  FaChevronUp,
  FaEdit,
  FaEllipsisH,
  FaGripVertical,
  FaShieldAlt,
  FaTimesCircle,
  FaToggleOff,
  FaToggleOn,
  FaTrash,
  FaCheckCircle,
  FaUndo,
} from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';
import { formatID } from '@/lib/utils';
import { getServiceTypeConfig } from '@/lib/service-types';

const useClickOutside = (
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || !event.target || !(event.target instanceof Node)) {
        return;
      }
      if (ref.current.contains(event.target)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white"></div>
    </div>
  </div>
);

const ServiceActionsDropdown = React.memo(({
  service,
  statusFilter,
  categoryName,
  activeCategoryToggles,
  onEdit,
  onToggleStatus,
  onRestore,
  onDelete,
}: {
  service: any;
  statusFilter: string;
  categoryName: string;
  activeCategoryToggles: Record<string, boolean>;
  onEdit: () => void;
  onToggleStatus: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) => {
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="btn btn-secondary p-2"
        title="More Actions"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaEllipsisH className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {statusFilter !== 'trash' && (
              <button
                onClick={() => {
                  onToggleStatus();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
              >
                {service.status === 'active' ? (
                  <FaTimesCircle className="h-3 w-3" />
                ) : (
                  <FaCheckCircle className="h-3 w-3" />
                )}
                {service.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            )}
            {statusFilter === 'trash' && (
              <button
                onClick={() => {
                  onRestore();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
              >
                <FaUndo className="h-3 w-3" />
                Restore
              </button>
            )}
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
            >
              <FaEdit className="h-3 w-3" />
              Edit
            </button>
            <hr className="my-1 dark:border-gray-700" />
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
            >
              <FaTrash className="h-3 w-3" />
              {statusFilter === 'trash' ? 'Delete Permanently' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

ServiceActionsDropdown.displayName = 'ServiceActionsDropdown';

const getStatusIcon = (status: string, deletedAt?: string | null) => {
  if (deletedAt) {
    return <FaTrash className="h-3 w-3 text-red-500 dark:text-red-400" />;
  }
  if (status === 'inactive') {
    return <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />;
  }
  return <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />;
};

const getActualCategoryName = (displayCategoryName: string) => {
  return displayCategoryName.includes(' (ID: ')
    ? displayCategoryName.split(' (ID: ')[0]
    : displayCategoryName;
};

const getProviderRefillCancelStatus = (service: any) => {
  let providerAllowsRefill = true;
  let providerAllowsCancel = true;
  
  if (service.providerId) {
    try {
      const updateText = service.updateText;
      if (updateText) {
        const providerData = JSON.parse(updateText);
        
        if (providerData.providerRefill !== undefined) {
          providerAllowsRefill = providerData.providerRefill === true || 
                                 providerData.providerRefill === 1 || 
                                 providerData.providerRefill === '1' || 
                                 providerData.providerRefill === 'true';
        }
        
        if (providerData.providerCancel !== undefined) {
          providerAllowsCancel = providerData.providerCancel === true || 
                                  providerData.providerCancel === 1 || 
                                  providerData.providerCancel === '1' || 
                                  providerData.providerCancel === 'true';
        }
        
        if (providerData.providerRefill === undefined) {
          if (providerData.refill === false || providerData.refill === 0 || providerData.refill === '0' || 
              providerData.refillable === false || providerData.can_refill === false) {
            providerAllowsRefill = false;
          } else if (providerData.refill === true || providerData.refill === 1 || providerData.refill === '1' ||
                     providerData.refillable === true || providerData.can_refill === true) {
            providerAllowsRefill = true;
          }
        }
        
        if (providerData.providerCancel === undefined) {
          if (providerData.cancel === false || providerData.cancel === 0 || providerData.cancel === '0' || 
              providerData.cancelable === false || providerData.can_cancel === false) {
            providerAllowsCancel = false;
          } else if (providerData.cancel === true || providerData.cancel === 1 || providerData.cancel === '1' ||
                     providerData.cancelable === true || providerData.can_cancel === true) {
            providerAllowsCancel = true;
          }
        }
      }
    } catch (error) {
    }
  }
  
  return { providerAllowsRefill, providerAllowsCancel };
};

interface ServicesTableProps {
  groupedServices: Record<string, any[]>;
  statusFilter: string;
  categoriesData: any;
  selectedServices: string[];
  selectedCategories: string[];
  collapsedCategories: string[];
  allCategoriesCollapsed: boolean;
  activeCategoryToggles: Record<string, boolean>;
  isUpdating: boolean;
  draggedCategory: string | null;
  dropTargetCategory: string | null;
  dropPosition: 'before' | 'after' | null;
  draggedService: string | null;
  dropTargetService: string | null;
  dropPositionService: 'before' | 'after' | null;
  getProviderNameById: (providerId: number | string | null, providerName?: string) => string;
  handleSelectAll: () => void;
  handleSelectCategory: (categoryName: string, services: any[]) => void;
  handleCategoryCheckboxChange: (categoryName: string) => void;
  handleSelectService: (serviceId: string) => void;
  toggleCategory: (categoryName: string) => void;
  toggleAllCategories: () => void;
  toggleCategoryAndServices: (categoryName: string, services: any[]) => void;
  handleEditService: (serviceId: number) => void;
  toggleServiceStatus: (service: any) => void;
  restoreService: (service: any) => void;
  deleteService: (id: string) => void;
  toggleRefill: (service: any) => void;
  toggleCancel: (service: any) => void;
  editCategory: (categoryName: string, categoryId: string) => void;
  handleOpenDeleteCategoryModal: (categoryName: string, categoryId: string | number, servicesCount: number) => void;
  handleDragStart: (e: React.DragEvent, categoryName: string) => void;
  handleDragOver: (e: React.DragEvent, targetCategoryName: string) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragEnd: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetCategoryName: string) => void;
  handleServiceDragStart: (e: React.DragEvent, serviceId: string) => void;
  handleServiceDragOver: (e: React.DragEvent, serviceId: string) => void;
  handleServiceDragLeave: (e: React.DragEvent) => void;
  handleServiceDragEnd: (e: React.DragEvent) => void;
  handleServiceDrop: (e: React.DragEvent, serviceId: string, categoryName: string) => void;
}

export const ServicesTable: React.FC<ServicesTableProps> = ({
  groupedServices,
  statusFilter,
  categoriesData,
  selectedServices,
  selectedCategories,
  collapsedCategories,
  allCategoriesCollapsed,
  activeCategoryToggles,
  isUpdating,
  draggedCategory,
  dropTargetCategory,
  dropPosition,
  draggedService,
  dropTargetService,
  dropPositionService,
  getProviderNameById,
  handleSelectAll,
  handleSelectCategory,
  handleCategoryCheckboxChange,
  handleSelectService,
  toggleCategory,
  toggleAllCategories,
  toggleCategoryAndServices,
  handleEditService,
  toggleServiceStatus,
  restoreService,
  deleteService,
  toggleRefill,
  toggleCancel,
  editCategory,
  handleOpenDeleteCategoryModal,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDragEnd,
  handleDrop,
  handleServiceDragStart,
  handleServiceDragOver,
  handleServiceDragLeave,
  handleServiceDragEnd,
  handleServiceDrop,
}) => {
  return (
    <div className="lg:block">
      <table className="w-full text-sm min-w-[1200px]">
        <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
          <tr>
            <th
              className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
            >
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={
                  Object.values(groupedServices).flat().length > 0 &&
                  selectedServices.length === Object.values(groupedServices).flat().length &&
                  selectedCategories.length === Object.keys(groupedServices).length
                }
                className="rounded border-gray-300 w-4 h-4"
              />
            </th>
            <th
              className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
            >
              ID
            </th>
            <th
              className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
            >
              Service
            </th>
            <th
              className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
            >
              Type
            </th>
            <th
              className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
            >
              Provider
            </th>
            <th
              className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
            >
              Price
            </th>
            <th
              className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
            >
              Min/Max
            </th>
            <th
              className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
            >
              Refill
            </th>
            <th
              className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
            >
              Cancel
            </th>
            {statusFilter !== 'trash' && (
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Status
              </th>
            )}
            <th
              className="text-left p-3 font-semibold relative text-gray-900 dark:text-gray-100"
            >
              Actions
              <button
                onClick={toggleAllCategories}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors"
                title={
                  allCategoriesCollapsed
                    ? 'Expand all categories'
                    : 'Collapse all categories'
                }
              >
                {allCategoriesCollapsed ? (
                  <FaChevronDown className="h-3 w-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                ) : (
                  <FaChevronUp className="h-3 w-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                )}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {(Object.entries(groupedServices) as [string, any[]][])
            .filter(([categoryName, services]) => {



              if (statusFilter === 'inactive') {
                const actualCategoryName = getActualCategoryName(categoryName);
                const categoryData = categoriesData?.data?.find(
                  (cat: any) => cat.category_name === actualCategoryName
                );

                const isCategoryInactive = !activeCategoryToggles[categoryName];

                const hasInactiveServices = services.some((service: any) => service.status === 'inactive');

                return isCategoryInactive || hasInactiveServices;
              }

              return true;
            })
            .sort(([categoryNameA], [categoryNameB]) => {

              const actualCategoryNameA =
                getActualCategoryName(categoryNameA);
              const actualCategoryNameB =
                getActualCategoryName(categoryNameB);

              const categoryA = categoriesData?.data?.find(
                (cat: any) =>
                  cat.category_name === actualCategoryNameA
              );
              const categoryB = categoriesData?.data?.find(
                (cat: any) =>
                  cat.category_name === actualCategoryNameB
              );

              const positionA = categoryA?.position || 'bottom';
              const positionB = categoryB?.position || 'bottom';

              if (positionA === 'top' && positionB === 'bottom')
                return -1;
              if (positionA === 'bottom' && positionB === 'top')
                return 1;
              return categoryNameA.localeCompare(categoryNameB);
            })
            .map(([categoryName, services], categoryIndex) => (
              <Fragment key={categoryName}>
                {draggedCategory &&
                  draggedCategory !== categoryName && (
                    <tr
                      className={`transition-all duration-200 ${
                        dropTargetCategory === categoryName &&
                        dropPosition === 'before'
                          ? 'h-8 bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 dark:border-blue-500'
                          : 'h-1'
                      }`}
                      onDragOver={(e) =>
                        handleDragOver(e, categoryName)
                      }
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, categoryName)}
                    >
                      <td colSpan={11}>
                        {dropTargetCategory === categoryName &&
                          dropPosition === 'before' && (
                            <div className="flex items-center justify-center h-6 text-blue-600 dark:text-blue-400 text-sm font-medium">
                              Drop here
                            </div>
                          )}
                      </td>
                    </tr>
                  )}
                <tr
                  className={`bg-gray-50 dark:bg-gray-800/50 border-t-2 border-gray-200 dark:border-gray-700 ${
                    draggedCategory === categoryName
                      ? 'opacity-50'
                      : ''
                  } ${
                    !activeCategoryToggles[categoryName]
                      ? 'bg-gray-300/90 dark:bg-gray-700/90 border-l-4 border-l-gray-600 dark:border-l-gray-500'
                      : ''
                  }`}
                  onDragOver={(e) =>
                    handleDragOver(e, categoryName)
                  }
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, categoryName)}
                >
                  <td colSpan={11} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(categoryName)}
                          onChange={() => handleCategoryCheckboxChange(categoryName)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          title={`Select ${categoryName} category`}
                        />
                          <div
                            className="cursor-grab hover:text-gray-600 dark:hover:text-gray-400 transition-colors active:cursor-grabbing select-none"
                            title="Drag to reorder category"
                            draggable={true}
                            onDragStart={(e) =>
                              handleDragStart(e, categoryName)
                            }
                            onDragEnd={handleDragEnd}
                            style={{
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                            }}
                          >
                            <FaGripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                        <button
                          onClick={() =>
                            toggleCategory(categoryName)
                          }
                          className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded p-1 transition-colors"
                        >
                          {collapsedCategories.includes(
                            categoryName
                          ) ? (
                            <FaChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                          ) : (
                            <FaChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategoryAndServices(
                              categoryName,
                              services
                            );
                          }}
                          disabled={isUpdating}
                          className={`p-1 rounded transition-colors ${
                            activeCategoryToggles[categoryName]
                              ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                              : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                          } ${
                            isUpdating
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          title={`${
                            activeCategoryToggles[categoryName]
                              ? 'Deactivate'
                              : 'Activate'
                          } ${categoryName} category`}
                        >
                          {isUpdating ? (
                            <GradientSpinner size="w-4 h-4" />
                          ) : activeCategoryToggles[
                              categoryName
                            ] ? (
                            <FaToggleOn className="h-4 w-4" />
                          ) : (
                            <FaToggleOff className="h-4 w-4" />
                          )}
                        </button>

                        <span className="font-semibold text-md text-gray-800 dark:text-gray-100">
                          {categoryName}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {services.length} service
                          {services.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const actualCategoryName =
                              getActualCategoryName(categoryName);
                            const category =
                              categoriesData?.data?.find(
                                (cat: any) =>
                                  cat.category_name ===
                                  actualCategoryName
                              );
                            if (category) {
                              editCategory(
                                actualCategoryName,
                                category.id.toString()
                              );
                            }
                          }}
                          disabled={isUpdating}
                          className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 text-gray-400 dark:text-gray-500 rounded transition-colors disabled:opacity-50"
                          title={`Edit ${categoryName} category`}
                        >
                          <FaEdit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const actualCategoryName =
                              getActualCategoryName(categoryName);
                            const category =
                              categoriesData?.data?.find(
                                (cat: any) =>
                                  cat.category_name ===
                                  actualCategoryName
                              );
                            if (category) {
                              handleOpenDeleteCategoryModal(
                                actualCategoryName,
                                category.id,
                                services.length
                              );
                            }
                          }}
                          disabled={isUpdating}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 text-red-600 dark:text-red-400 rounded transition-colors disabled:opacity-50"
                          title={`Delete ${categoryName} category`}
                        >
                          <FaTrash className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={services.every((service) =>
                            selectedServices.includes(service.id)
                          )}
                          onChange={() =>
                            handleSelectCategory(categoryName, services)
                          }
                          className="rounded border-gray-300 w-4 h-4"
                          title="Select all services in this category"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Select All
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
                {!collapsedCategories.includes(categoryName) &&
                  (services.length > 0 ? (
                    services.map((service: any, i: number) => (
                      <Fragment key={service.id}>
                        {draggedService &&
                          draggedService !== service.id && (
                            <tr
                              className={`transition-all duration-200 ${
                                dropTargetService === service.id &&
                                dropPositionService === 'before'
                                  ? 'h-2 bg-blue-100 dark:bg-blue-900/30'
                                  : 'h-0'
                              }`}
                              onDragOver={(e) =>
                                handleServiceDragOver(e, service.id)
                              }
                              onDragLeave={handleServiceDragLeave}
                              onDrop={(e) =>
                                handleServiceDrop(
                                  e,
                                  service.id,
                                  categoryName
                                )
                              }
                            >
                              <td colSpan={11}>
                                {dropTargetService === service.id &&
                                  dropPositionService ===
                                    'before' && (
                                    <div className="h-1 bg-blue-400 dark:bg-blue-500 rounded"></div>
                                  )}
                              </td>
                            </tr>
                          )}

                        <tr
                          className={`border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-all duration-200 animate-in fade-in slide-in-from-left-1 ${
                            draggedService === service.id
                              ? 'opacity-50'
                              : ''
                          } ${
                            service.status === 'inactive' && statusFilter !== 'trash'
                              ? 'bg-gray-200/70 dark:bg-gray-700/70 border-l-4 border-l-gray-500 dark:border-l-gray-400'
                              : ''
                          }`}
                          style={{ animationDelay: `${i * 50}ms` }}
                          onDragOver={(e) =>
                            handleServiceDragOver(e, service.id)
                          }
                          onDragLeave={handleServiceDragLeave}
                          onDrop={(e) =>
                            handleServiceDrop(
                              e,
                              service.id,
                              categoryName
                            )
                          }
                        >
                          <td className="p-3 pl-8">
                            <div className="flex items-center gap-2">
                              <div
                                className="cursor-grab hover:text-gray-600 dark:hover:text-gray-400 transition-colors active:cursor-grabbing select-none"
                                title="Drag to reorder service"
                                draggable={true}
                                onDragStart={(e) =>
                                  handleServiceDragStart(
                                    e,
                                    service.id
                                  )
                                }
                                onDragEnd={handleServiceDragEnd}
                                style={{
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                }}
                              >
                                <FaGripVertical className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                              </div>
                              <input
                                type="checkbox"
                                checked={selectedServices.includes(
                                  service.id
                                )}
                                onChange={() =>
                                  handleSelectService(service.id)
                                }
                                className="rounded border-gray-300 w-4 h-4"
                              />
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                              {service.id
                                ? formatID(service.id)
                                : 'null'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <div
                                className="font-medium text-sm max-w-44 text-gray-900 dark:text-gray-100"
                              >
                                {service?.name || 'null'}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 w-fit">
                              {(() => {
                                const serviceTypeId = service?.serviceTypeId;
                                const packageType = service?.packageType;
                                
                                if (serviceTypeId) {
                                  const config = getServiceTypeConfig(serviceTypeId);
                                  if (config) return config.name;
                                }
                                
                                if (packageType) {
                                  const config = getServiceTypeConfig(packageType);
                                  if (config) return config.name;
                                }
                                
                                return 'Standard';
                              })()}
                            </div>
                          </td>
                          <td className="p-3">
                            <div
                              className="text-sm font-medium text-gray-900 dark:text-gray-100"
                            >
                              {(() => {
                                try {
                                  const updateData =
                                    service?.updateText
                                      ? JSON.parse(
                                          service.updateText
                                        )
                                      : null;
                                  return (
                                    updateData?.provider || 'Self'
                                  );
                                } catch {
                                  return 'Self';
                                }
                              })()}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-left">
                              <div
                                className="font-semibold text-sm text-gray-900 dark:text-gray-100"
                              >
                                <PriceDisplay
                                  amount={service?.rate}
                                  originalCurrency="USD"
                                />
                              </div>
                              <div
                                className="text-xs text-gray-500 dark:text-gray-400"
                              >
                                Cost:{' '}
                                <PriceDisplay
                                  amount={
                                    service?.providerPrice ||
                                    service?.provider_price ||
                                    service?.self_price ||
                                    service?.cost_price ||
                                    service?.rate
                                  }
                                  originalCurrency="USD"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <div
                                className="text-sm font-medium text-gray-900 dark:text-gray-100"
                              >
                                {(
                                  service?.min_order || 0
                                ).toString()}{' '}
                                -{' '}
                                {(
                                  service?.max_order || 0
                                ).toString()}
                              </div>
                              <div
                                className="text-xs text-gray-500 dark:text-gray-400"
                              >
                                Min / Max
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-2">
                              {(() => {
                                const { providerAllowsRefill } = getProviderRefillCancelStatus(service);
                                const isDisabled = !providerAllowsRefill;
                                
                                return (
                                  <>
                                    <button
                                      onClick={() => !isDisabled && toggleRefill(service)}
                                      disabled={isDisabled}
                                      className={`p-1 rounded transition-colors ${
                                        isDisabled
                                          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                          : service.refill
                                          ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                          : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                                      }`}
                                      title={
                                        isDisabled
                                          ? 'Provider service does not allow refill'
                                          : service.refill
                                          ? 'Disable Refill'
                                          : 'Enable Refill'
                                      }
                                    >
                                      {service.refill ? (
                                        <FaToggleOn className="h-5 w-5" />
                                      ) : (
                                        <FaToggleOff className="h-5 w-5" />
                                      )}
                                    </button>
                                    {service.refill && (
                                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                        {service.refillDays === null || service.refillDays === undefined ? (
                                          <div>Lifetime</div>
                                        ) : (
                                          service.refillDays && (
                                            <div>
                                              {service.refillDays}D {service.refillDisplay || 0}H
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="p-3">
                            {(() => {
                              const { providerAllowsCancel } = getProviderRefillCancelStatus(service);
                              const isDisabled = !providerAllowsCancel;
                              
                              return (
                                <button
                                  onClick={() => !isDisabled && toggleCancel(service)}
                                  disabled={isDisabled}
                                  className={`p-1 rounded transition-colors ${
                                    isDisabled
                                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                      : service.cancel
                                      ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                      : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                                  }`}
                                  title={
                                    isDisabled
                                      ? 'Provider service does not allow cancel'
                                      : service.cancel
                                      ? 'Disable Cancel'
                                      : 'Enable Cancel'
                                  }
                                >
                                  {service.cancel ? (
                                    <FaToggleOn className="h-5 w-5" />
                                  ) : (
                                    <FaToggleOff className="h-5 w-5" />
                                  )}
                                </button>
                              );
                            })()}
                          </td>
                          {statusFilter !== 'trash' && (
                            <td className="p-3">
                              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full w-fit">
                                {getStatusIcon(service.status, service.deletedAt)}
                                <span className="text-xs font-medium capitalize text-gray-900 dark:text-gray-100">
                                  {service.deletedAt ? 'trash' : (service.status || 'null')}
                                </span>
                              </div>
                            </td>
                          )}
                          <td className="p-3">
                            <div className="relative">
                              <ServiceActionsDropdown
                                service={service}
                                statusFilter={statusFilter}
                                categoryName={categoryName}
                                activeCategoryToggles={activeCategoryToggles}
                                onEdit={() => handleEditService(service.id)}
                                onToggleStatus={() => toggleServiceStatus(service)}
                                onRestore={() => restoreService(service)}
                                onDelete={() => deleteService(service?.id)}
                              />
                            </div>
                          </td>
                        </tr>
                        {draggedService &&
                          draggedService !== service.id && (
                            <tr
                              className={`transition-all duration-200 ${
                                dropTargetService === service.id &&
                                dropPositionService === 'after'
                                  ? 'h-2 bg-blue-100 dark:bg-blue-900/30'
                                  : 'h-0'
                              }`}
                              onDragOver={(e) =>
                                handleServiceDragOver(e, service.id)
                              }
                              onDragLeave={handleServiceDragLeave}
                              onDrop={(e) =>
                                handleServiceDrop(
                                  e,
                                  service.id,
                                  categoryName
                                )
                              }
                            >
                              <td colSpan={11}>
                                {dropTargetService === service.id &&
                                  dropPositionService ===
                                    'after' && (
                                    <div className="h-1 bg-blue-400 dark:bg-blue-500 rounded"></div>
                                  )}
                              </td>
                            </tr>
                          )}
                      </Fragment>
                    ))
                  ) : (
                    <tr className="border-t dark:border-gray-700">
                      <td colSpan={11} className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                          <FaBriefcase className="h-8 w-8 mb-2 text-gray-400 dark:text-gray-500" />
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
                            No services in this category
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Add services to populate this category
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                {draggedCategory &&
                  draggedCategory !== categoryName && (
                    <tr
                      className={`transition-all duration-200 ${
                        dropTargetCategory === categoryName &&
                        dropPosition === 'after'
                          ? 'h-8 bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 dark:border-blue-500'
                          : 'h-1'
                      }`}
                      onDragOver={(e) =>
                        handleDragOver(e, categoryName)
                      }
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, categoryName)}
                    >
                      <td colSpan={11}>
                        {dropTargetCategory === categoryName &&
                          dropPosition === 'after' && (
                            <div className="flex items-center justify-center h-6 text-blue-600 dark:text-blue-400 text-sm font-medium">
                              Drop here
                            </div>
                          )}
                      </td>
                    </tr>
                  )}
              </Fragment>
            ))}
        </tbody>
      </table>
    </div>
  );
};
