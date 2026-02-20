'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FaClipboardList, FaExclamationTriangle, FaExternalLinkAlt } from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';
import { formatCount } from '@/lib/utils';

interface CancelRequest {
  id: number;
  status: string;
  createdAt: string;
}

interface Order {
  id: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  link?: string;
  usdPrice?: number;
  startCount?: number;
  qty?: number;
  remains?: number;
  providerStatus?: string;
  cancelRequests?: CancelRequest[];
  refillRequests?: any[];
  service?: {
    id?: number;
    name?: string;
    cancel?: boolean;
    refill?: boolean;
    refillDays?: number;
  };
  category?: {
    category_name?: string;
  };
  [key: string]: any;
}

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  error: any;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  getStatusBadge: (status: string) => string;
  formatStatusDisplay: (status: string) => string;
  localPendingCancelRequests: Set<number>;
  onOpenRefillModal: (orderId: number) => void;
  onOpenCancelModal: (orderId: number) => void;
  totalPages: number;
  page: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPrevious: () => void;
  onNext: () => void;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  error,
  formatDate,
  formatTime,
  getStatusBadge,
  formatStatusDisplay,
  localPendingCancelRequests,
  onOpenRefillModal,
  onOpenCancelModal,
  totalPages,
  page,
  pagination,
  onPrevious,
  onNext,
}) => {
  const router = useRouter();

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)] rounded-t-lg">
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 first:rounded-tl-lg">
                ID
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Date
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Link
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Charge
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Start count
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Quantity
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Service
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Remains
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 last:rounded-tr-lg">
                Quick Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                {Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4">
                      <div className="h-4 w-16 gradient-shimmer rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-20 gradient-shimmer rounded mb-1" />
                      <div className="h-3 w-12 gradient-shimmer rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-32 gradient-shimmer rounded" />
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
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="h-4 w-40 gradient-shimmer rounded mb-1" />
                      <div className="h-3 w-24 gradient-shimmer rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-12 gradient-shimmer rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-6 w-20 gradient-shimmer rounded-full" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-6 w-16 gradient-shimmer rounded" />
                    </td>
                  </tr>
                ))}
              </>
            ) : error ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-red-500 dark:text-red-400">
                  <div className="flex flex-col items-center">
                    <FaExclamationTriangle className="text-4xl mb-4" />
                    <div className="text-lg font-medium">Error loading orders!</div>
                    <div className="text-sm mt-2">Please try refreshing the page</div>
                  </div>
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order: Order, index: number) => {
                const isLastRow = index === orders.length - 1;
                return (
                  <tr
                    key={order.id}
                    className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] ${isLastRow ? 'last:border-b-0' : ''
                      }`}
                  >
                    <td
                      className={`py-3 px-4 ${isLastRow ? 'first:rounded-bl-lg' : ''
                        }`}
                    >
                      <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                        {order.id}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(order.createdAt)}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(order.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-[120px]">
                        <a
                          href={order.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs flex items-center hover:underline"
                          title={order.link}
                        >
                          <span className="truncate mr-1">
                            {order.link?.replace(/^https?:\/\//, '') ||
                              'N/A'}
                          </span>
                          <FaExternalLinkAlt className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        <PriceDisplay
                          amount={order.usdPrice || 0}
                          originalCurrency="USD"
                        />
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formatCount(order.startCount || 0)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCount(order.qty || 0)}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {order.service?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {order.category?.category_name || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formatCount(order.remains || order.qty || 0)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                          order.providerStatus === 'forward_failed' && order.status === 'failed' ? 'pending' : order.status
                        )}`}
                      >
                        {formatStatusDisplay(
                          order.providerStatus === 'forward_failed' && order.status === 'failed' ? 'pending' : order.status
                        )}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 ${isLastRow ? 'last:rounded-br-lg' : ''
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {order.status === 'completed' && (
                          <>
                            {order.service?.refill && (() => {
                              const refillDays = order.service?.refillDays;
                              const completionTime = new Date(order.updatedAt).getTime();
                              const currentTime = new Date().getTime();

                              let isRefillTimeValid = true;

                              if (refillDays) {
                                const daysSinceCompletion = Math.floor(
                                  (currentTime - completionTime) / (1000 * 60 * 60 * 24)
                                );
                                isRefillTimeValid = daysSinceCompletion <= refillDays;
                              }

                              const refillRequests = order.refillRequests || [];
                              const hasPendingOrApprovedRefillRequest = refillRequests.some((req: any) => 
                                req.status === 'pending' || req.status === 'approved'
                              );
                              const hasRejectedRefillRequest = refillRequests.some((req: any) => 
                                req.status === 'rejected'
                              );
                              const hasRefillingRefillRequest = refillRequests.some((req: any) => 
                                req.status === 'refilling'
                              );
                              const hasCompletedRefillRequest = refillRequests.some((req: any) => 
                                req.status === 'completed'
                              );
                              const hasErrorRefillRequest = refillRequests.some((req: any) => 
                                req.status === 'error'
                              );

                              const canRefill = isRefillTimeValid && !hasPendingOrApprovedRefillRequest && !hasRejectedRefillRequest && !hasRefillingRefillRequest && !hasCompletedRefillRequest && !hasErrorRefillRequest;

                              let buttonText = 'Refill';
                              let buttonTitle = 'Refill Order';
                              
                              if (hasRejectedRefillRequest) {
                                buttonText = 'Refill Rejected';
                                buttonTitle = 'This refill request has been rejected';
                              } else if (hasRefillingRefillRequest) {
                                buttonText = 'Refilling';
                                buttonTitle = 'Refill is currently being processed';
                              } else if (hasCompletedRefillRequest) {
                                buttonText = 'Refill';
                                buttonTitle = 'Previous Refill Request is already completed';
                              } else if (hasErrorRefillRequest) {
                                buttonText = 'Pending Refill';
                                buttonTitle = 'Refill request is pending review';
                              } else if (hasPendingOrApprovedRefillRequest) {
                                buttonText = 'Refill Requested';
                                buttonTitle = 'A refill request has already been submitted for this order';
                              } else if (!isRefillTimeValid) {
                                buttonTitle = `Refill period has expired. Refill is only available for ${refillDays} days after order completion.`;
                              }

                              return (
                                <button
                                  onClick={() => {
                                    if (canRefill) {
                                      onOpenRefillModal(order.id);
                                    }
                                  }}
                                  disabled={!canRefill || hasErrorRefillRequest}
                                  className={`text-xs px-2 py-1 border rounded transition-colors ${
                                    canRefill
                                      ? 'text-green-600 hover:text-green-800 border-green-300 hover:bg-green-50 cursor-pointer'
                                      : hasRejectedRefillRequest
                                      ? 'text-red-600 border-red-300 bg-red-50/50 dark:bg-red-900/10 cursor-not-allowed opacity-60'
                                      : hasRefillingRefillRequest
                                      ? 'text-blue-600 border-blue-300 bg-blue-50/50 dark:bg-blue-900/10 cursor-not-allowed opacity-60'
                                      : hasErrorRefillRequest
                                      ? 'text-gray-400 border-gray-300 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                                      : 'text-gray-400 border-gray-300 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                                  }`}
                                  title={buttonTitle}
                                >
                                  {buttonText}
                                </button>
                              );
                            })()}
                            {order.service?.id && (
                              <button
                                onClick={() => router.push(`/new-order?sId=${order.service?.id}`)}
                                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                                title="Order Again"
                              >
                                Order Again
                              </button>
                            )}
                          </>
                        )}
                        {order.status === 'pending' && order.service?.cancel && (() => {
                          const hasPendingCancelRequest =
                            (order.cancelRequests && order.cancelRequests.some((req: CancelRequest) => req.status === 'pending')) ||
                            localPendingCancelRequests.has(order.id);

                          const hasFailedCancelRequest =
                            order.cancelRequests && order.cancelRequests.some((req: CancelRequest) => req.status === 'failed');

                          const hasDeclinedCancelRequest =
                            order.cancelRequests && order.cancelRequests.some((req: CancelRequest) => req.status === 'declined');

                          if (hasDeclinedCancelRequest) {
                            return (
                              <button
                                disabled
                                className="text-gray-400 text-xs px-2 py-1 border border-gray-300 rounded bg-gray-50 opacity-60 cursor-not-allowed"
                                title="Cancel request was declined"
                              >
                                Cancel Declined
                              </button>
                            );
                          }

                          if (hasPendingCancelRequest || hasFailedCancelRequest) {
                            return (
                              <button
                                disabled
                                className="text-gray-400 text-xs px-2 py-1 border border-gray-300 rounded bg-gray-50 opacity-60 cursor-not-allowed"
                                title={hasFailedCancelRequest ? "Cancel request failed but was submitted" : "Cancel request submitted"}
                              >
                                Cancel Requested
                              </button>
                            );
                          }

                          return (
                            <button
                              onClick={() => onOpenCancelModal(order.id)}
                              className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                              title="Cancel Order"
                            >
                              Cancel
                            </button>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center">
                    <FaClipboardList className="text-4xl text-gray-400 dark:text-gray-500 mb-4" />
                    <div className="text-lg font-medium dark:text-gray-300">
                      No results found!
                    </div>
                    <div className="text-sm dark:text-gray-400">
                      Try adjusting your search or filter criteria
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
            {' '}({pagination.total || 0} orders total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={onPrevious}
              disabled={page === 1 || isLoading}
              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>
            <button
              onClick={onNext}
              disabled={page === totalPages || isLoading}
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

export default OrderTable;

