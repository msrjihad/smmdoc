'use client';

import React from 'react';
import { FaTimes, FaMoneyBillWave, FaUserCheck } from 'react-icons/fa';
import { formatID, formatNumber, formatPrice } from '@/lib/utils';

interface PayoutRecord {
  id: number;
  amount: number;
  requestedAt: string;
  processedAt?: string;
  status: 'pending' | 'approved' | 'declined' | 'paid';
  method: string;
  notes?: string;
}

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
  payoutHistory: PayoutRecord[];
}

interface AffiliateDetailsModalProps {
  isOpen: boolean;
  affiliate: AffiliateReferral | null;
  formatTime: (dateString: string | Date) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  onClose: () => void;
  onProcessPayout: (affiliateId: number, requestedAmount: number, availableAmount: number, paymentMethod: string) => void;
  onChangeStatus: (affiliateId: number, currentStatus: string) => void;
}

const AffiliateDetailsModal: React.FC<AffiliateDetailsModalProps> = ({
  isOpen,
  affiliate,
  formatTime,
  getStatusIcon,
  getStatusColor,
  onClose,
  onProcessPayout,
  onChangeStatus,
}) => {
  if (!isOpen || !affiliate) return null;

  const getWithdrawalMethodDisplayName = (method: string): string => {
    const names: Record<string, string> = {
      bkash: 'bKash',
      nagad: 'Nagad',
      rocket: 'Rocket',
      upay: 'Upay',
      bank: 'Bank Transfer',
    };
    return names[method.toLowerCase()] || method;
  };

  let withdrawalMethods: any[] = [];
  if (affiliate.paymentDetails) {
    try {
      const parsed = JSON.parse(affiliate.paymentDetails);
      if (Array.isArray(parsed) && parsed.length > 0) {
        withdrawalMethods = parsed;
      }
    } catch (e) {
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Affiliate Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Basic Information
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Affiliate ID
                  </label>
                  <div className="font-mono text-sm bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded w-fit mt-1">
                    {formatID(affiliate.id.toString())}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Username
                  </label>
                  <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {affiliate.user?.username || 'Unknown'}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Email
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {affiliate.user?.email || 'No email'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Referral Code
                  </label>
                  <div className="font-mono text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded w-fit mt-1">
                    {affiliate.referralCode || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </label>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full w-fit text-xs font-medium mt-1 ${getStatusColor(affiliate.status)}`}>
                    {getStatusIcon(affiliate.status)}
                    <span className="capitalize">
                      {affiliate.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Performance Metrics
            </h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Visits
                </label>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {formatNumber(affiliate.totalVisits)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Registrations
                </label>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {formatNumber(affiliate.signUps)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Referrals
                </label>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-1">
                  {formatNumber(affiliate.signUps)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Conversion Rate
                </label>
                <div className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-1">
                  {affiliate.conversionRate.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>
        {withdrawalMethods.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Withdrawal Methods
            </h4>
            <div className="space-y-3">
              {withdrawalMethods.map((wm: any, index: number) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {getWithdrawalMethodDisplayName(wm.method || '')}
                    </span>
                  </div>
                  {wm.method === 'bank' ? (
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      {wm.bankName && <div><strong className="dark:text-gray-100">Bank:</strong> {wm.bankName}</div>}
                      {wm.accountHolderName && <div><strong className="dark:text-gray-100">Account Holder:</strong> {wm.accountHolderName}</div>}
                      {wm.bankAccountNumber && <div><strong className="dark:text-gray-100">Account Number:</strong> {wm.bankAccountNumber}</div>}
                      {wm.routingNumber && <div><strong className="dark:text-gray-100">Routing Number:</strong> {wm.routingNumber}</div>}
                      {wm.swiftCode && <div><strong className="dark:text-gray-100">SWIFT Code:</strong> {wm.swiftCode}</div>}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {wm.mobileNumber && <div><strong className="dark:text-gray-100">Mobile Number:</strong> {wm.mobileNumber}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Financial Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                Total Earnings
              </div>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                ${formatPrice(affiliate.totalEarnings || affiliate.totalFunds, 2)}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                Available Earnings
              </div>
              <div className="text-xl font-bold text-green-700 dark:text-green-300">
                ${formatPrice(affiliate.availableEarnings || affiliate.earnedCommission, 2)}
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                Withdraw Requested
              </div>
              <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
                ${formatPrice(affiliate.requestedCommission, 2)}
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                Total Withdrawn
              </div>
              <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                ${formatPrice(affiliate.totalWithdrawn || 0, 2)}
              </div>
            </div>
          </div>
        </div>
        {affiliate.payoutHistory && affiliate.payoutHistory.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Payout History
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                {affiliate.payoutHistory.map((payout, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        ${formatPrice(payout.amount, 2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {payout.method} • {new Date(payout.requestedAt).toLocaleDateString()} at {formatTime(payout.requestedAt)}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                      {payout.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
          {affiliate.requestedCommission > 0 && (
            <button
              onClick={() => {
                onClose();
                onProcessPayout(
                  affiliate.id,
                  affiliate.requestedCommission,
                  affiliate.totalCommission,
                  affiliate.paymentMethod
                );
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <FaMoneyBillWave />
              Process Payout
            </button>
          )}
          <button
            onClick={() => {
              onClose();
              onChangeStatus(affiliate.id, affiliate.status);
            }}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FaUserCheck />
            Change Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDetailsModal;

