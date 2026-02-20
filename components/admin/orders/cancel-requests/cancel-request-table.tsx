'use client';

import React from 'react';
import {
  FaCheckCircle,
  FaClock,
  FaExternalLinkAlt,
  FaEye,
  FaRedo,
  FaTimesCircle,
} from 'react-icons/fa';
import { formatID, formatNumber } from '@/lib/utils';
import { PriceDisplay } from '@/components/price-display';

const cleanLinkDisplay = (link: string): string => {
  if (!link) return link;
  let cleaned = link;
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./i, '');
  return cleaned;
};

interface CancelRequest {
  id: number;
  order: {
    id: number;
    service: {
      id: number;
      name: string;
      rate: number;
      providerName?: string | null;
      providerId?: number | null;
    };
    category: {
      id: number;
      category_name: string;
    };
    qty: number;
    price: number;
    charge: number;
    link: string;
    status: string;
    createdAt: string;
    seller: string;
  };
  user: {
    id: number;
    email: string;
    name: string;
    username?: string;
    currency: string;
  };
  reason: string;
  status: 'pending' | 'approved' | 'declined' | 'failed';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  refundAmount?: number;
  adminNotes?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CancelRequestTableProps {
  cancelRequests: CancelRequest[];
  requestsLoading: boolean;
  pagination: PaginationInfo;
  selectedRequests: string[];
  resendingRequestId: number | null;
  onSelectAll: () => void;
  onSelectRequest: (requestId: string) => void;
  onViewDetails: (request: CancelRequest) => void;
  onResendRequest: (requestId: number) => void;
  onApproveRequest: (requestId: number, refundAmount: number) => void;
  onDeclineRequest: (requestId: number) => void;
  onPageChange: (page: number) => void;
  getStatusIcon: (status: string) => React.ReactNode;
}

const CancelRequestTable: React.FC<CancelRequestTableProps> = ({
  cancelRequests,
  requestsLoading,
  pagination,
  selectedRequests,
  resendingRequestId,
  onSelectAll,
  onSelectRequest,
  onViewDetails,
  onResendRequest,
  onApproveRequest,
  onDeclineRequest,
  onPageChange,
  getStatusIcon,
}) => {
  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                <input
                  type="checkbox"
                  checked={
                    selectedRequests.length ===
                      cancelRequests.length &&
                    cancelRequests.length > 0
                  }
                  onChange={onSelectAll}
                  className="rounded border-gray-300 w-4 h-4"
                />
              </th>

              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Order ID
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                User
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Service
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Provider
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Link
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Quantity
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Amount
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Status
              </th>
              <th
                className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {cancelRequests.map((request) => (
              <tr
                key={request.id}
                className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
              >
                <td className="p-3">
                  {request.status !== 'declined' &&
                    request.status !== 'approved' &&
                    request.status !== 'failed' &&
                    request.order?.seller === 'Self' && (
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(
                          request.id.toString()
                        )}
                        onChange={() =>
                          onSelectRequest(request.id.toString())
                        }
                        className="rounded border-gray-300 w-4 h-4"
                      />
                    )}
                </td>

                <td className="p-3">
                  <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    {formatID(String(request.order.id).slice(-8))}
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <div
                      className="font-medium text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {request.user?.username ||
                        request.user?.email?.split('@')[0] ||
                        request.user?.name ||
                        'Unknown'}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <div
                      className="font-medium text-sm truncate max-w-44"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {request.order?.service?.name ||
                        'Unknown Service'}
                    </div>
                    <div
                      className="text-xs truncate max-w-44"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {request.order?.category?.category_name ||
                        'Unknown Category'}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {request.order?.seller === 'Self' 
                      ? 'Self' 
                      : (request.order?.service?.providerName || request.order?.seller || 'Unknown')}
                  </div>
                </td>
                <td className="p-3">
                  <div className="max-w-32">
                    {request.order?.link ? (
                      <a
                        href={request.order.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-xs truncate"
                      >
                        <span className="truncate">{cleanLinkDisplay(request.order.link)}</span>
                        <FaExternalLinkAlt className="h-3 w-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">No link</span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatNumber(request.order?.qty || 0)}
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <PriceDisplay
                      amount={request.order?.charge || 0}
                      originalCurrency="USD"
                      className="text-sm font-semibold"
                    />
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full w-fit">
                    {getStatusIcon(request.status)}
                    <span className="text-xs font-medium capitalize text-gray-900 dark:text-gray-100">
                      {request.status}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-secondary p-2"
                      title="View Details"
                      onClick={() => onViewDetails(request)}
                    >
                      <FaEye className="h-3 w-3" />
                    </button>

                    {request.status === 'failed' && (
                      <>
                        <button
                          className="btn btn-primary p-2"
                          title="Resend to Provider"
                          onClick={() => onResendRequest(request.id)}
                          disabled={resendingRequestId === request.id}
                        >
                          <FaRedo className={`h-3 w-3 ${resendingRequestId === request.id ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          className="btn btn-secondary p-2"
                          title="Decline Request"
                          onClick={() => onDeclineRequest(request.id)}
                        >
                          <FaTimesCircle className="h-3 w-3" />
                        </button>
                      </>
                    )}

                    {request.status !== 'declined' &&
                      request.status !== 'approved' &&
                      request.status !== 'failed' &&
                      request.order?.seller === 'Self' && (
                        <>
                          <button
                            className="btn btn-primary p-2"
                            title="Approve"
                            onClick={() =>
                              onApproveRequest(
                                request.id,
                                request.refundAmount || request.order?.charge || 0
                              )
                            }
                          >
                            <FaCheckCircle className="h-3 w-3" />
                          </button>
                          <button
                            className="btn btn-secondary p-2"
                            title="Decline"
                            onClick={() =>
                              onDeclineRequest(request.id)
                            }
                          >
                            <FaTimesCircle className="h-3 w-3" />
                          </button>
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
          {cancelRequests.map((request) => (
            <div
              key={request.id}
              className="card card-padding border-l-4 border-blue-500 dark:border-blue-400 mb-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedRequests.includes(request.id.toString())}
                    onChange={() => onSelectRequest(request.id.toString())}
                    className="rounded border-gray-300 w-4 h-4"
                  />

                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                    {getStatusIcon(request.status)}
                    <span className="text-xs font-medium capitalize text-gray-900 dark:text-gray-100">
                      {request.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="btn btn-secondary p-2"
                    title="View Details"
                    onClick={() => onViewDetails(request)}
                  >
                    <FaEye className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div>
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    User
                  </div>
                  <div
                    className="font-medium text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {request.user?.username ||
                      request.user?.email?.split('@')[0] ||
                      request.user?.name ||
                      'Unknown'}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {request.user?.email || 'No email'}
                  </div>
                </div>
                <div
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    request.order?.seller === 'Auto'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      : request.order?.seller === 'Manual'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                  }`}
                >
                  {request.order?.seller === 'Self' 
                    ? 'Self' 
                    : (request.order?.service?.providerName || request.order?.seller || 'Unknown')}
                </div>
              </div>
              <div className="mb-4">
                <div
                  className="font-medium text-sm mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {request.order?.service?.name || 'Unknown Service'}
                </div>
                <div
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {request.order?.category?.category_name ||
                    'Unknown Category'}{' '}
                  • Provider: {request.order?.seller === 'Self' 
                    ? 'Self' 
                    : (request.order?.service?.providerName || request.order?.seller || 'Unknown')}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
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
                    {(request.order?.qty || 0).toString()}
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Amount
                  </div>
                  <div
                    className="font-semibold text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <PriceDisplay
                      amount={request.order?.charge || 0}
                      originalCurrency="USD"
                      className="font-semibold text-sm"
                    />
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Requested
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {request.requestedAt
                      ? new Date(
                          request.requestedAt
                        ).toLocaleDateString()
                      : 'Unknown'}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div
                  className="text-xs font-medium mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Link
                </div>
                {request.order?.link ? (
                  <a
                    href={request.order.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-xs"
                  >
                    <span className="truncate">{cleanLinkDisplay(request.order.link)}</span>
                    <FaExternalLinkAlt className="h-3 w-3 flex-shrink-0" />
                  </a>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs">No link provided</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
        <div
          className="text-sm text-gray-600 dark:text-gray-300"
        >
          {requestsLoading ? (
            <div className="h-5 w-48 gradient-shimmer rounded" />
          ) : (
            `Showing ${formatNumber(
              (pagination.page - 1) * pagination.limit + 1
            )} to ${formatNumber(
              Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )
            )} of ${formatNumber(pagination.total)} requests`
          )}
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPrev || requestsLoading}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span
            className="text-sm text-gray-600 dark:text-gray-300"
          >
            {requestsLoading ? (
              <div className="h-5 w-24 gradient-shimmer rounded" />
            ) : (
              `Page ${formatNumber(
                pagination.page
              )} of ${formatNumber(pagination.totalPages)}`
            )}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={!pagination.hasNext || requestsLoading}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default CancelRequestTable;

