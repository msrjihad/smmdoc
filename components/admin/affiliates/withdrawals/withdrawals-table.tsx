'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaEllipsisH,
  FaEye,
  FaTimesCircle,
} from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';

interface Withdrawal {
  id: number;
  affiliate: {
    id: number;
    user: {
      id: number;
      email: string;
      name: string;
      username?: string;
    };
  };
  withdrawalId: string;
  amount: number;
  status: 'Success' | 'Pending' | 'Cancelled';
  method: string;
  payment_method?: string;
  createdAt: string;
  processedAt?: string;
  notes?: string;
  transactionIdEdited?: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface WithdrawalsTableProps {
  withdrawals: Withdrawal[];
  pagination: PaginationInfo;
  withdrawalsLoading: boolean;
  formatID: (id: any) => string;
  formatNumber: (num: number) => string;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  onApprove: (withdrawalId: number) => void;
  onCancel: (withdrawalId: number) => void;
  onViewDetails: (withdrawal: Withdrawal) => void;
  onEditTransactionId: (withdrawal: Withdrawal) => void;
  onPageChange: (page: number) => void;
}

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

interface DropdownMenuProps {
  withdrawal: Withdrawal;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onViewDetails: () => void;
  onEditTransactionId: () => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  withdrawal,
  isOpen,
  onToggle,
  onClose,
  onViewDetails,
  onEditTransactionId,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, onClose);

  return (
    <div className="flex items-center relative" ref={dropdownRef}>
      <button
        className="btn btn-secondary p-2"
        title="More Actions"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <FaEllipsisH className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {withdrawal.status === 'Success' && 
             !withdrawal.transactionIdEdited && (
              <button
                onClick={onEditTransactionId}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
              >
                <FaEdit className="h-3 w-3" />
                Edit Transaction ID
              </button>
            )}
            <button
              onClick={onViewDetails}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
            >
              <FaEye className="h-3 w-3" />
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const WithdrawalsTable: React.FC<WithdrawalsTableProps> = ({
  withdrawals,
  pagination,
  withdrawalsLoading,
  formatID,
  formatNumber,
  formatDate,
  formatTime,
  getStatusBadge,
  onApprove,
  onCancel,
  onViewDetails,
  onEditTransactionId,
  onPageChange,
}) => {
  const [openDropdowns, setOpenDropdowns] = useState<Set<number>>(new Set());

  const toggleDropdown = (withdrawalId: number) => {
    setOpenDropdowns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(withdrawalId)) {
        newSet.delete(withdrawalId);
      } else {
        newSet.add(withdrawalId);
      }
      return newSet;
    });
  };

  const closeDropdown = (withdrawalId: number) => {
    setOpenDropdowns((prev) => {
      const newSet = new Set(prev);
      newSet.delete(withdrawalId);
      return newSet;
    });
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1200px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                ID
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                User
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Transaction ID
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Amount
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Method
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Date
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Status
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((withdrawal) => {
              const isDropdownOpen = openDropdowns.has(withdrawal.id);

              return (
                <tr
                  key={withdrawal.id}
                  className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
                >
                  <td className="p-3">
                    <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                      {withdrawal.id
                        ? formatID(withdrawal.id.toString().slice(-8))
                        : 'null'}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {withdrawal.affiliate.user?.username ||
                        withdrawal.affiliate.user?.email?.split('@')[0] ||
                        withdrawal.affiliate.user?.name ||
                        'null'}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {withdrawal.withdrawalId || '-'}
                    </div>
                  </td>
                  <td className="p-3">
                    <PriceDisplay
                      amount={withdrawal.amount}
                      originalCurrency="USD"
                      className="font-semibold text-sm"
                    />
                  </td>
                  <td className="p-3">
                    {withdrawal.payment_method ? (
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {withdrawal.payment_method}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="text-xs text-gray-900 dark:text-gray-100">
                        {withdrawal.createdAt
                          ? formatDate(withdrawal.createdAt)
                          : 'null'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {withdrawal.createdAt
                          ? formatTime(withdrawal.createdAt)
                          : 'null'}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    {getStatusBadge(withdrawal.status)}
                  </td>
                  <td className="p-3">
                    {withdrawal.status === 'Pending' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onApprove(withdrawal.id)}
                          className="btn btn-primary flex items-center gap-1 px-3 py-1.5 text-xs bg-green-500 text-white border border-green-500 hover:bg-green-600"
                          title="Approve"
                        >
                          <FaCheckCircle className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onCancel(withdrawal.id)}
                          className="btn btn-secondary flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500 text-white border border-red-500 hover:bg-red-600"
                          title="Cancel"
                        >
                          <FaTimesCircle className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <DropdownMenu
                        withdrawal={withdrawal}
                        isOpen={isDropdownOpen}
                        onToggle={() => toggleDropdown(withdrawal.id)}
                        onClose={() => closeDropdown(withdrawal.id)}
                        onViewDetails={() => {
                          closeDropdown(withdrawal.id);
                          onViewDetails(withdrawal);
                        }}
                        onEditTransactionId={() => {
                          closeDropdown(withdrawal.id);
                          onEditTransactionId(withdrawal);
                        }}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {withdrawalsLoading ? (
            <div className="flex items-center gap-2">
              <span>Loading pagination...</span>
            </div>
          ) : (
            pagination.limit > 10000
              ? `Showing all ${formatNumber(pagination.total)} withdrawals`
              : `Showing ${formatNumber(
                  (pagination.page - 1) * pagination.limit + 1
                )} to ${formatNumber(
                  Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )
                )} of ${formatNumber(pagination.total)} withdrawals`
          )}
        </div>
        {pagination.limit <= 10000 && (
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <button
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={!pagination.hasPrev || withdrawalsLoading}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {withdrawalsLoading ? (
                <div className="h-4 w-24 gradient-shimmer rounded" />
              ) : (
                `Page ${formatNumber(
                  pagination.page
                )} of ${formatNumber(pagination.totalPages)}`
              )}
            </span>
            <button
              onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={!pagination.hasNext || withdrawalsLoading}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default WithdrawalsTable;

