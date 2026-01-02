'use client';

import {
    FaSearch,
    FaEye
} from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';
import moment from 'moment';

type Withdrawal = {
  id: number;
  invoice_id: number;
  amount: number;
  status: 'Success' | 'Pending' | 'Cancelled';
  method: string;
  payment_method?: string;
  transaction_id?: string;
  createdAt: string;
  processedAt?: string;
  notes?: string;
  cancelReason?: string | null;
};

interface WithdrawalsListProps {
  withdrawals: Withdrawal[];
  page: number;
  limit: number;
  onViewCancelReason?: (reason: string) => void;
  formatTime?: (dateString: string | Date) => string;
}

export function WithdrawalsList({
  withdrawals,
  page,
  limit,
  onViewCancelReason,
  formatTime,
}: WithdrawalsListProps) {

  if (!withdrawals.length) {
    return (
      <div className="card card-padding">
        <div className="text-center py-8 flex flex-col items-center">
          <FaSearch className="text-4xl text-gray-400 dark:text-gray-500 mb-4" />
          <div className="text-lg font-medium text-gray-900 dark:text-gray-300">No withdrawals found</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            You haven't made any withdrawal requests yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Sl. No.
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Transaction ID
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Amount
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Method
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Requested Date
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((withdrawal, index) => {
              const serialNumber = (page - 1) * limit + index + 1;
              return (
              <tr
                key={withdrawal.id}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]"
              >
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {serialNumber}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {withdrawal.transaction_id || '-'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    <PriceDisplay
                      amount={withdrawal.amount}
                      originalCurrency="USD"
                    />
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {withdrawal.payment_method || withdrawal.method || 'N/A'}
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {moment(withdrawal.createdAt).format('DD/MM/YYYY')}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime 
                      ? formatTime(withdrawal.createdAt)
                      : new Intl.DateTimeFormat('en', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        }).format(new Date(withdrawal.createdAt))}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={withdrawal.status} />
                </td>
                <td className="py-3 px-4">
                  {withdrawal.status === 'Cancelled' && withdrawal.cancelReason && onViewCancelReason ? (
                    <button
                      onClick={() => onViewCancelReason(withdrawal.cancelReason!)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md transition-colors duration-200"
                    >
                      <FaEye className="h-3 w-3" />
                      View
                    </button>
                  ) : null}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Withdrawal['status'] }) {
  switch (status) {
    case 'Success':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
          Success
        </span>
      );
    case 'Pending':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">
          Pending
        </span>
      );
    case 'Cancelled':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
          {status}
        </span>
      );
  }
}

