'use client';

import React from 'react';
import {
  FaCheckCircle,
  FaClock,
  FaEye,
  FaTimesCircle,
  FaUserCheck,
} from 'react-icons/fa';
import { formatID, formatNumber, formatPrice } from '@/lib/utils';

interface AffiliateReferral {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    name: string;
    joinedAt: string;
  };
  referralCode: string;
  totalVisits: number;
  signUps: number;
  conversionRate: number;
  totalFunds: number;
  totalEarnings: number;
  earnedCommission: number;
  availableEarnings: number;
  requestedCommission: number;
  totalCommission: number;
  totalWithdrawn: number;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  createdAt: string;
  lastActivity: string;
  commissionRate: number;
  paymentMethod: string;
  paymentDetails?: string | null;
  payoutHistory: any[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface AffiliatesTableProps {
  affiliates: AffiliateReferral[];
  pagination: PaginationInfo;
  affiliatesLoading: boolean;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  onViewDetails: (affiliate: AffiliateReferral) => void;
  onChangeStatus: (affiliateId: number, currentStatus: string) => void;
  onPageChange: (page: number) => void;
}

const AffiliatesTable: React.FC<AffiliatesTableProps> = ({
  affiliates,
  pagination,
  affiliatesLoading,
  getStatusIcon,
  getStatusColor,
  onViewDetails,
  onChangeStatus,
  onPageChange,
}) => {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1400px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                ID
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                User
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Total Visits
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Registrations
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Referrals
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Conversion Rate
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Available Funds
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Total Earned
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
            {affiliates.map((affiliate) => (
              <tr
                key={affiliate.id}
                className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
              >
                <td className="p-3">
                  <div className="font-mono text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded">
                    {formatID(affiliate.id.toString())}
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {affiliate.user?.username || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {affiliate.user?.email || 'No email'}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {formatNumber(affiliate.totalVisits)}
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {formatNumber(affiliate.signUps)}
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {formatNumber(affiliate.signUps)}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center">
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {affiliate.conversionRate.toFixed(1)}%
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    ${formatPrice(affiliate.availableEarnings, 2)}
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-semibold text-sm text-green-600 dark:text-green-400">
                    ${formatPrice(affiliate.totalEarnings, 2)}
                  </div>
                </td>
                <td className="p-3">
                  <div 
                    className={`flex items-center gap-1 px-2 py-1 rounded-full w-fit text-xs font-medium ${getStatusColor(affiliate.status)}`}
                  >
                    {getStatusIcon(affiliate.status)}
                    <span className="capitalize">
                      {affiliate.status}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-primary p-2"
                      title="Change Status"
                      onClick={() => onChangeStatus(affiliate.id, affiliate.status)}
                    >
                      <FaUserCheck className="h-3 w-3" />
                    </button>
                    <button
                      className="btn btn-secondary p-2"
                      title="View Details"
                      onClick={() => onViewDetails(affiliate)}
                    >
                      <FaEye className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {affiliatesLoading ? (
            <div className="flex items-center gap-2">
              <span>Loading pagination...</span>
            </div>
          ) : (
            `Showing ${formatNumber(
              (pagination.page - 1) * pagination.limit + 1
            )} to ${formatNumber(
              Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )
            )} of ${formatNumber(pagination.total)} affiliates`
          )}
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPrev || affiliatesLoading}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {affiliatesLoading ? (
              <div className="h-4 w-24 gradient-shimmer rounded" />
            ) : (
              `Page ${formatNumber(
                pagination.page
              )} of ${formatNumber(pagination.totalPages)}`
            )}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={!pagination.hasNext || affiliatesLoading}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default AffiliatesTable;

