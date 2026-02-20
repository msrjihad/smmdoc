'use client';

import React from 'react';
import {
  FaEye,
  FaRedo,
  FaSync,
  FaEllipsisH,
  FaCheckCircle,
  FaTimesCircle,
  FaExternalLinkAlt,
  FaClock,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { formatID, formatNumber, formatPrice } from '@/lib/utils';
import { PriceDisplay } from '@/components/price-display';

const cleanLinkDisplay = (link: string): string => {
  if (!link) return link;
  let cleaned = link;
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./i, '');
  return cleaned;
};

interface Order {
  id: number;
  user: {
    id: number;
    email: string;
    name: string;
    username?: string;
    currency: string;
    balance: number;
  };
  service: {
    id: number;
    name: string;
    rate: number;
    min_order: number;
    max_order: number;
    status: string;
    provider?: string;
    providerId?: number | null;
  };
  category: {
    id: number;
    category_name: string;
  };
  qty: number;
  price: number;
  charge: number;
  usdPrice: number;
  currency: string;
  status: 'completed' | 'partial';
  createdAt: string;
  updatedAt: string;
  link: string;
  startCount: number;
  remains: number;
  avg_time: string;
  providerOrderId?: string | null;
  refillRequest?: {
    id: string;
    reason: string;
    status: string;
    adminNotes?: string;
    processedBy?: string;
    processedAt?: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface RefillTableProps {
  orders: Order[];
  ordersLoading: boolean;
  pagination: PaginationInfo;
  processing: boolean;
  onPageChange: (page: number) => void;
  onViewRefillRequestDetails: (order: Order) => void;
  onResendRefillToProvider: (order: Order) => void;
  onOpenRefillDialog: (order: Order) => void;
  onUpdateRefillStatus: (refillRequestId: string, newStatus: string) => void;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
}

const safeFormatOrderId = (id: any) => {
  return formatID(String(id || 'null'));
};

const getRefillRequestStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return <FaClock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />;
    case 'refilling':
      return <FaSync className="h-3 w-3 text-blue-500 dark:text-blue-400" />;
    case 'completed':
      return <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />;
    case 'rejected':
      return <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />;
    case 'error':
    case 'failed':
      return <FaExclamationTriangle className="h-3 w-3 text-orange-500 dark:text-orange-400" />;
    case 'approved':
      return <FaCheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />;
    case 'declined':
      return <FaTimesCircle className="h-3 w-3 text-red-500 dark:text-red-400" />;
    default:
      return <FaClock className="h-3 w-3 text-gray-500 dark:text-gray-400" />;
  }
};

const formatRefillRequestStatus = (status: string) => {
  if (status?.toLowerCase() === 'error') {
    return 'Failed';
  }
  return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || status;
};

const RefillTable: React.FC<RefillTableProps> = ({
  orders,
  ordersLoading,
  pagination,
  processing,
  onPageChange,
  onViewRefillRequestDetails,
  onResendRefillToProvider,
  onOpenRefillDialog,
  onUpdateRefillStatus,
  formatDate,
  formatTime,
}) => {
  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm min-w-[1300px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Order ID
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                User
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Service
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Provider
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Link
              </th>
              <th className="text-right p-3 font-semibold text-gray-900 dark:text-gray-100">
                Quantity
              </th>
              <th className="text-right p-3 font-semibold text-gray-900 dark:text-gray-100">
                Amount
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Request Date
              </th>
              <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">
                Status
              </th>
              <th className="text-right p-3 font-semibold text-gray-900 dark:text-gray-100">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order, index) => (
              <tr
                key={`${order.id}-${index}`}
                className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
              >
                <td className="p-3">
                  <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    {safeFormatOrderId(order.id)}
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <div
                      className="font-medium text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {order.user?.username ||
                        order.user?.email?.split('@')[0] ||
                        order.user?.name ||
                        'Unknown'}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <div
                      className="font-mono text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {order.service?.id
                        ? safeFormatOrderId(order.service.id)
                        : 'null'}
                    </div>
                    <div
                      className="font-medium text-sm truncate max-w-44"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {order.service?.name || 'Unknown Service'}
                    </div>
                    <div
                      className="text-xs truncate max-w-44"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {order.category?.category_name || 'Unknown Category'}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <div
                      className="font-medium text-sm capitalize"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {order.service?.provider || 'Self'}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="max-w-28">
                    <div className="flex items-center gap-1">
                      <a
                        href={order.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs truncate flex-1"
                      >
                        {(() => {
                          const cleanedLink = cleanLinkDisplay(order.link);
                          return cleanedLink.length > 18
                            ? cleanedLink.substring(0, 18) + '...'
                            : cleanedLink;
                        })()}
                      </a>
                      <button
                        onClick={() => window.open(order.link, '_blank')}
                        className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 flex-shrink-0"
                        title="Open link in new tab"
                      >
                        <FaExternalLinkAlt className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div>
                    <div
                      className="font-semibold text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {order.qty.toString()}
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div>
                    <div
                      className="font-semibold text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <PriceDisplay
                        amount={order.charge || order.price || 0}
                        originalCurrency="USD"
                        className="font-semibold text-sm"
                      />
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {order.currency}
                    </div>
                  </div>
                </td>
                <td className="p-3 text-left">
                  <div>
                    {order.refillRequest?.createdAt ? (() => {
                      try {
                        let dateStr: any = order.refillRequest.createdAt;
                        
                        if (typeof dateStr === 'object' && dateStr !== null) {
                          if (dateStr instanceof Date) {
                            dateStr = dateStr.toISOString();
                          } else if (typeof (dateStr as any).toISOString === 'function') {
                            dateStr = (dateStr as any).toISOString();
                          } else {
                            console.error('Invalid date object:', dateStr);
                            return <div className="text-xs text-gray-400">Invalid date</div>;
                          }
                        }
                        
                        if (typeof dateStr !== 'string') {
                          console.error('Date value is not a string:', dateStr, typeof dateStr);
                          return <div className="text-xs text-gray-400">Invalid date</div>;
                        }
                        
                        const date = new Date(dateStr);
                        
                        if (isNaN(date.getTime())) {
                          console.error('Invalid date value:', dateStr, typeof dateStr);
                          return <div className="text-xs text-gray-400">Invalid date</div>;
                        }
                        
                        return (
                          <>
                            <div className="text-xs text-gray-900 dark:text-gray-300">
                              {formatDate(date)}
                            </div>
                            <div className="text-xs text-gray-900 dark:text-gray-300">
                              {formatTime(date)}
                            </div>
                          </>
                        );
                      } catch (error) {
                        console.error('Error parsing date:', error, order.refillRequest.createdAt);
                        return <div className="text-xs text-gray-400">Invalid date</div>;
                      }
                    })() : (
                      <div className="text-xs text-gray-400">-</div>
                    )}
                  </div>
                </td>
                <td className="p-3 text-center">
                  {order.refillRequest ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto">
                      {getRefillRequestStatusIcon(order.refillRequest.status)}
                      <span className="text-xs font-medium capitalize text-gray-900 dark:text-gray-100">
                        {formatRefillRequestStatus(order.refillRequest.status)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {order.service?.providerId ? (
                      <>
                        <button
                          onClick={() => onViewRefillRequestDetails(order)}
                          className="btn btn-secondary p-2"
                          title="View"
                        >
                          <FaEye className="h-3 w-3" />
                        </button>
                        {order.refillRequest && (order.refillRequest.status === 'error' || order.refillRequest.status === 'failed') && (
                          <button
                            onClick={() => onResendRefillToProvider(order)}
                            className="btn btn-primary p-2"
                            title="Resend Refill Request to Provider"
                            disabled={processing}
                          >
                            <FaRedo className="h-3 w-3" />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {order.refillRequest && order.refillRequest.status !== 'completed' && order.refillRequest.status !== 'rejected' && (
                          <button
                            onClick={() => onOpenRefillDialog(order)}
                            className="btn btn-primary p-2"
                            title="Create Refill"
                          >
                            <FaSync className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => onViewRefillRequestDetails(order)}
                          className="btn btn-secondary p-2"
                          title="View Refill Request Details"
                        >
                          <FaEye className="h-3 w-3" />
                        </button>
                        {order.refillRequest && order.refillRequest.status !== 'completed' && order.refillRequest.status !== 'rejected' && (
                          <div className="relative inline-block">
                            <button
                              className="btn btn-secondary p-2"
                              title="Update Refill Status"
                              onClick={(e) => {
                                e.stopPropagation();
                                const menu = document.getElementById(`status-menu-${order.refillRequest?.id}`);
                                if (menu) {
                                  menu.classList.toggle('hidden');
                                }
                              }}
                            >
                              <FaEllipsisH className="h-3 w-3" />
                            </button>
                            <div
                              id={`status-menu-${order.refillRequest.id}`}
                              className="hidden absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700"
                            >
                              <div className="py-1">
                                <div className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 text-center">
                                  Update Refill Status
                                </div>
                                <button
                                  onClick={() => {
                                    onUpdateRefillStatus(String(order.refillRequest?.id), 'refilling');
                                    document.getElementById(`status-menu-${order.refillRequest?.id}`)?.classList.add('hidden');
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <FaSync className="h-3 w-3" />
                                  Refilling
                                </button>
                                <button
                                  onClick={() => {
                                    onUpdateRefillStatus(String(order.refillRequest?.id), 'completed');
                                    document.getElementById(`status-menu-${order.refillRequest?.id}`)?.classList.add('hidden');
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <FaCheckCircle className="h-3 w-3" />
                                  Complete
                                </button>
                                <button
                                  onClick={() => {
                                    onUpdateRefillStatus(String(order.refillRequest?.id), 'rejected');
                                    document.getElementById(`status-menu-${order.refillRequest?.id}`)?.classList.add('hidden');
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                  <FaTimesCircle className="h-3 w-3" />
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lg:hidden">
        <div className="space-y-4">
          {orders?.map((order, index) => (
            <div
              key={`${order.id}-${index}`}
              className="card card-padding border-l-4 border-blue-500 dark:border-blue-400 mb-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    {safeFormatOrderId(order.id)}
                  </div>
                  {order.refillRequest && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                      {getRefillRequestStatusIcon(order.refillRequest.status)}
                      <span className="text-xs font-medium capitalize text-gray-900 dark:text-gray-100">
                        {formatRefillRequestStatus(order.refillRequest.status)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {order.service?.providerId ? (
                    <>
                      <button
                        onClick={() => onViewRefillRequestDetails(order)}
                        className="btn btn-secondary p-2"
                        title="View"
                      >
                        <FaEye className="h-3 w-3" />
                      </button>
                      {order.refillRequest && (order.refillRequest.status === 'error' || order.refillRequest.status === 'failed') && (
                        <button
                          onClick={() => onResendRefillToProvider(order)}
                          className="btn btn-primary p-2"
                          title="Resend Refill Request to Provider"
                          disabled={processing}
                        >
                          <FaRedo className="h-3 w-3" />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {order.refillRequest && order.refillRequest.status !== 'completed' && order.refillRequest.status !== 'rejected' && (
                        <button
                          onClick={() => onOpenRefillDialog(order)}
                          className="btn btn-primary p-2"
                          title="Create Refill"
                        >
                          <FaSync className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => onViewRefillRequestDetails(order)}
                        className="btn btn-secondary p-2"
                        title="View Refill Request Details"
                      >
                        <FaEye className="h-3 w-3" />
                      </button>
                      {order.refillRequest && order.refillRequest.status !== 'completed' && order.refillRequest.status !== 'rejected' && (
                        <div className="relative inline-block">
                          <button
                            className="btn btn-secondary p-2"
                            title="Update Refill Status"
                            onClick={(e) => {
                              e.stopPropagation();
                              const menu = document.getElementById(`status-menu-mobile-${order.refillRequest?.id}`);
                              if (menu) {
                                menu.classList.toggle('hidden');
                              }
                            }}
                          >
                            <FaEllipsisH className="h-3 w-3" />
                          </button>
                          <div
                            id={`status-menu-mobile-${order.refillRequest.id}`}
                            className="hidden absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="py-1">
                              <div className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 text-center">
                                Update Refill Status
                              </div>
                              <button
                                onClick={() => {
                                  onUpdateRefillStatus(String(order.refillRequest?.id), 'refilling');
                                  document.getElementById(`status-menu-mobile-${order.refillRequest?.id}`)?.classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <FaSync className="h-3 w-3" />
                                Refilling
                              </button>
                              <button
                                onClick={() => {
                                  onUpdateRefillStatus(String(order.refillRequest?.id), 'completed');
                                  document.getElementById(`status-menu-mobile-${order.refillRequest?.id}`)?.classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <FaCheckCircle className="h-3 w-3" />
                                Refill Complete
                              </button>
                              <button
                                onClick={() => {
                                  onUpdateRefillStatus(String(order.refillRequest?.id), 'rejected');
                                  document.getElementById(`status-menu-mobile-${order.refillRequest?.id}`)?.classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              >
                                <FaTimesCircle className="h-3 w-3" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="mb-4 pb-4 border-b dark:border-gray-700">
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  User
                </div>
                <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {order.user?.username ||
                    order.user?.email?.split('@')[0] ||
                    order.user?.name ||
                    'Unknown'}
                </div>
              </div>
              <div className="mb-4">
                <div
                  className="font-mono text-xs mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {order.service?.id
                    ? safeFormatOrderId(order.service.id)
                    : 'null'}
                </div>
                <div
                  className="font-medium text-sm mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {order.service?.name || 'Unknown Service'}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {order.category?.category_name || 'Unknown Category'}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Provider:
                  </span>
                  <span className="text-xs font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                    {order.service?.provider || 'Self'}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-1">
                  <a
                    href={order.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs flex-1 truncate"
                  >
                    {order.link.length > 38
                      ? order.link.substring(0, 38) + '...'
                      : order.link}
                  </a>
                  <button
                    onClick={() => window.open(order.link, '_blank')}
                    className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 flex-shrink-0"
                    title="Open link in new tab"
                  >
                    <FaExternalLinkAlt className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Amount
                  </div>
                  <div className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                    <PriceDisplay
                      amount={order.charge || order.price || 0}
                      originalCurrency="USD"
                      className="font-semibold text-sm text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {order.currency}
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Request Date
                  </div>
                  {order.refillRequest?.createdAt ? (() => {
                    try {
                      let dateStr: any = order.refillRequest.createdAt;
                      
                      if (typeof dateStr === 'object' && dateStr !== null) {
                        if (dateStr instanceof Date) {
                          dateStr = dateStr.toISOString();
                        } else if (typeof (dateStr as any).toISOString === 'function') {
                          dateStr = (dateStr as any).toISOString();
                        } else {
                          console.error('Invalid date object:', dateStr);
                          return <div className="text-xs text-gray-400">Invalid date</div>;
                        }
                      }
                      
                      if (typeof dateStr !== 'string') {
                        console.error('Date value is not a string:', dateStr, typeof dateStr);
                        return <div className="text-xs text-gray-400">Invalid date</div>;
                      }
                      
                      const date = new Date(dateStr);
                      
                      if (isNaN(date.getTime())) {
                        console.error('Invalid date value:', dateStr, typeof dateStr);
                        return <div className="text-xs text-gray-400">Invalid date</div>;
                      }
                      
                      return (
                        <>
                          <div className="text-xs text-gray-900 dark:text-gray-300">
                            {formatDate(date)}
                          </div>
                          <div className="text-xs text-gray-900 dark:text-gray-300">
                            {formatTime(date)}
                          </div>
                        </>
                      );
                    } catch (error) {
                      console.error('Error parsing date:', error, order.refillRequest.createdAt);
                      return <div className="text-xs text-gray-400">Invalid date</div>;
                    }
                  })() : (
                    <div className="text-xs text-gray-400">-</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    User Balance
                  </div>
                  <div className="font-semibold text-sm text-green-600 dark:text-green-400">
                    ${formatPrice(order.user?.balance || 0, 2)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Quantity
                  </div>
                  <div
                    className="font-semibold text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {order.qty.toString()}
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Start Count
                  </div>
                  <div
                    className="font-semibold text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {formatNumber(order.startCount)}
                  </div>
                </div>
              </div>
              {!order.service?.providerId && (!order.refillRequest || (order.refillRequest.status !== 'completed' && order.refillRequest.status !== 'rejected')) && (
                <div className="flex justify-center">
                  <button
                    onClick={() => onOpenRefillDialog(order)}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <FaSync className="h-4 w-4" />
                    Create Refill
                  </button>
                </div>
              )}
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Date: {formatDate(order.createdAt)}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Time: {formatTime(order.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t">
        <div
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          {ordersLoading ? (
            <div className="h-5 w-48 gradient-shimmer rounded" />
          ) : (
            `Showing ${formatNumber(
              (pagination.page - 1) * pagination.limit + 1
            )} to ${formatNumber(
              Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )
            )} of ${formatNumber(pagination.total)} orders`
          )}
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPrev || ordersLoading}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {ordersLoading ? (
              <div className="h-5 w-24 gradient-shimmer rounded" />
            ) : (
              `Page ${formatNumber(
                pagination.page
              )} of ${formatNumber(pagination.totalPages)}`
            )}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={!pagination.hasNext || ordersLoading}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default RefillTable;

