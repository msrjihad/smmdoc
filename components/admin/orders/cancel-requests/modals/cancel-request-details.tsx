'use client';

import React from 'react';
import {
  FaCheckCircle,
  FaRedo,
  FaTimes,
  FaTimesCircle,
} from 'react-icons/fa';
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

interface CancelRequestDetailsModalProps {
  isOpen: boolean;
  request: CancelRequest | null;
  resendingRequestId: number | null;
  formatTime: (dateString: string | Date) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  onClose: () => void;
  onResendRequest: (requestId: number) => void;
  onApproveRequest: (requestId: number, refundAmount: number) => void;
  onDeclineRequest: (requestId: number) => void;
}

const CancelRequestDetailsModal: React.FC<CancelRequestDetailsModalProps> = ({
  isOpen,
  request,
  resendingRequestId,
  formatTime,
  getStatusIcon,
  onClose,
  onResendRequest,
  onApproveRequest,
  onDeclineRequest,
}) => {
  if (!isOpen || !request || !request.order) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Cancel Request Details
          </h3>
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
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Status
              </label>
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mt-1">
                {getStatusIcon(request.status)}
                <span className="text-xs font-medium capitalize text-gray-900 dark:text-gray-100">
                  {request.status}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Requested
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                {request.requestedAt ? (
                  <>
                    {new Date(
                      request.requestedAt
                    ).toLocaleDateString()}{' '}
                    at{' '}
                    {formatTime(request.requestedAt)}
                  </>
                ) : (
                  'Unknown'
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                User
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                {request.user?.username ||
                  request.user?.email?.split(
                    '@'
                  )[0] ||
                  'Unknown'}{' '}
                ({request.user?.email || 'No email'})
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Order Summary
          </h4>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Order ID
                </label>
                <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded w-fit mt-1">
                  {request.order.id}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Order Status
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1 capitalize">
                  {request.order?.status ||
                    'Unknown'}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Service
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                {request.order?.service?.name ||
                  'Unknown Service'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Category:{' '}
                {request.order?.category
                  ?.category_name || 'Unknown'}{' '}
                • Seller:{' '}
                {request.order?.seller === 'Self' 
                  ? 'Self' 
                  : (request.order?.service?.providerName || request.order?.seller || 'Unknown')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Quantity
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {(request.order?.qty || 0).toString()}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Amount
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  <PriceDisplay
                    amount={request.order?.charge || 0}
                    originalCurrency="USD"
                    className="text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Order Link
              </label>
              <div className="text-sm mt-1">
                {request.order?.link ? (
                  <a
                    href={request.order.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 break-all"
                  >
                    {cleanLinkDisplay(request.order.link)}
                  </a>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">
                    No link provided
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Order Created
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                {request.order?.createdAt ? (
                  <>
                    {new Date(
                      request.order.createdAt
                    ).toLocaleDateString()}{' '}
                    at{' '}
                    {formatTime(request.order.createdAt)}
                  </>
                ) : (
                  'Unknown'
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">
            Cancel Reason
          </h4>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded">
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {request.reason ||
                'No reason provided'}
            </div>
          </div>
        </div>
        {request.adminNotes && (
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">
              Admin Notes
            </h4>
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4 rounded">
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {request.adminNotes}
              </div>
              {request.processedAt && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Processed on{' '}
                  {new Date(
                    request.processedAt
                  ).toLocaleDateString()}{' '}
                  at{' '}
                  {formatTime(request.processedAt)}
                  {request.processedBy &&
                    ` by ${request.processedBy}`}
                </div>
              )}
            </div>
          </div>
        )}
        {request.status === 'failed' && (
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              onClick={() => {
                onClose();
                onDeclineRequest(request.id);
              }}
              className="btn btn-secondary flex items-center gap-2"
            >
              <FaTimesCircle />
              Decline Request
            </button>
            <button
              onClick={() => {
                onClose();
                onResendRequest(request.id);
              }}
              className="btn btn-primary flex items-center gap-2"
              disabled={resendingRequestId === request.id}
            >
              <FaRedo className={resendingRequestId === request.id ? 'animate-spin' : ''} />
              Resend to Provider
            </button>
          </div>
        )}
        {request.status === 'pending' &&
          request.order?.seller === 'Self' && (
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                onClick={() => {
                  onClose();
                  onDeclineRequest(request.id);
                }}
                className="btn btn-secondary flex items-center gap-2"
              >
                <FaTimesCircle />
                Decline
              </button>
              <button
                onClick={() => {
                  onClose();
                  onApproveRequest(
                    request.id,
                    request.refundAmount || request.order?.charge || 0
                  );
                }}
                className="btn btn-primary flex items-center gap-2"
              >
                <FaCheckCircle />
                Approve
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default CancelRequestDetailsModal;

