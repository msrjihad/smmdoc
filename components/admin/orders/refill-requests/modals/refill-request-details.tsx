'use client';

import React from 'react';
import {
  FaTimes,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSync,
} from 'react-icons/fa';
import { formatID, formatNumber } from '@/lib/utils';

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

interface RefillRequestDetailsModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
}

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

const safeFormatOrderId = (id: any) => {
  return formatID(String(id || 'null'));
};

const RefillRequestDetailsModal: React.FC<RefillRequestDetailsModalProps> = ({
  isOpen,
  order,
  onClose,
  formatDate,
  formatTime,
}) => {
  if (!isOpen || !order || !order.refillRequest) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Refill Request Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Status</label>
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mt-1">
                {getRefillRequestStatusIcon(order.refillRequest.status)}
                <span className="text-xs font-medium capitalize text-gray-900 dark:text-gray-100">
                  {formatRefillRequestStatus(order.refillRequest.status)}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Requested</label>
              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                {order.refillRequest.createdAt ? (
                  <>
                    {formatDate(order.refillRequest.createdAt)} at{' '}
                    {formatTime(order.refillRequest.createdAt)}
                  </>
                ) : (
                  'Unknown'
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">User</label>
              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                {order.user?.username ||
                  order.user?.email?.split('@')[0] ||
                  'Unknown'}{' '}
                ({order.user?.email || 'No email'})
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">Order Summary</h4>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Order ID</label>
                <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded w-fit mt-1">
                  {safeFormatOrderId(order.id)}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Service</label>
              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                {order.service?.name || 'Unknown Service'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Category: {order.category?.category_name || 'Unknown'}{' '}
                {order.service?.provider && (
                  <>
                    • Provider: {order.service.provider || 'Self'}
                  </>
                )}
              </div>
            </div>
            {order.refillRequest.status === 'completed' && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Start Count</label>
                  <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {formatNumber(order.startCount || 0)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Refill Quantity</label>
                  <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {formatNumber(order.qty || 0)}
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Order Link</label>
              <div className="text-sm mt-1">
                {order.link ? (
                  <a
                    href={order.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 break-all"
                  >
                    {order.link}
                  </a>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">No link provided</span>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Order Created</label>
              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                {order.createdAt ? (
                  <>
                    {formatDate(order.createdAt)} at{' '}
                    {formatTime(order.createdAt)}
                  </>
                ) : (
                  'Unknown'
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">Refill Reason</h4>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded">
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {order.refillRequest.reason || 'No reason provided'}
            </div>
          </div>
        </div>
        {order.refillRequest.adminNotes && (
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">Admin Notes</h4>
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4 rounded">
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {(() => {
                  try {
                    const notes = order.refillRequest.adminNotes;
                    const parsed = JSON.parse(notes!);
                    if (typeof parsed === 'object' && parsed !== null) {
                      const parts: string[] = [];
                      if (parsed.startCount !== undefined) {
                        parts.push(`Start Count: ${formatNumber(parsed.startCount)}`);
                      }
                      if (parsed.quantity !== undefined) {
                        parts.push(`Quantity: ${formatNumber(parsed.quantity)}`);
                      }
                      return parts.length > 0 ? parts.join(', ') : notes;
                    }
                    return notes;
                  } catch (e) {
                    return order.refillRequest.adminNotes;
                  }
                })()}
              </div>
              {order.refillRequest.processedAt && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Processed on{' '}
                  {formatDate(order.refillRequest.processedAt)} at{' '}
                  {formatTime(order.refillRequest.processedAt)}
                  {order.refillRequest.processedBy &&
                    ` by ${order.refillRequest.processedBy}`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefillRequestDetailsModal;

