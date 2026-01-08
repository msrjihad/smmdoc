'use client';

import { FaSearch } from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';
import moment from 'moment';

type Transaction = {
  id: number;
  invoice_id: number;
  amount: number;
  status: 'Success' | 'Processing' | 'Cancelled' | 'Failed';
  method: string;
  payment_method?: string;
  gateway?: string;
  transaction_id?: string | null;
  transaction_type?: string | null;
  related_username?: string | null;
  createdAt: string;
  phone?: string;
  currency?: string;
};

interface TransactionsTableProps {
  transactions: Transaction[];
  page: number;
  limit: number;
  formatTime?: (dateString: string | Date) => string;
  formatDate?: (dateString: string | Date) => string;
}

function StatusBadge({ status }: { status: Transaction['status'] }) {
  switch (status) {
    case 'Success':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
          Success
        </span>
      );
    case 'Processing':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">
          Processing
        </span>
      );
    case 'Cancelled':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
          Cancelled
        </span>
      );
    case 'Failed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">
          Failed
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

export function TransactionsTable({
  transactions,
  page,
  limit,
  formatTime,
  formatDate,
}: TransactionsTableProps) {
  if (!transactions.length) {
    return (
      <div className="card card-padding">
        <div className="text-center py-8 flex flex-col items-center">
          <FaSearch className="text-4xl text-gray-400 dark:text-gray-500 mb-4" />
          <div className="text-lg font-medium dark:text-gray-300">No transactions found</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            You haven't made any transactions yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)] rounded-t-lg">
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 first:rounded-tl-lg">
              ID
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
              Transaction ID
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
              Amount
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
              Type
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
              Method
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
              Date and Time
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 last:rounded-tr-lg">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => {
            const isLastRow = index === transactions.length - 1;
            return (
              <tr
                key={transaction.id}
                className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] ${isLastRow ? 'last:border-b-0' : ''}`}
              >
                  <td className={`py-3 px-4 ${isLastRow ? 'first:rounded-bl-lg' : ''}`}>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {transaction.id}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {transaction.transaction_id ? transaction.transaction_id : 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      <PriceDisplay
                        amount={transaction.amount}
                        originalCurrency={transaction.currency === 'USD' || transaction.currency === 'USDT' ? 'USD' : (transaction.currency === 'BDT' ? 'BDT' : 'USD')}
                      />
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {(() => {
                      const transactionType = transaction.transaction_type || 'deposit';
                      const tooltipTitle = 
                        transaction.transaction_type === 'transfer' && transaction.related_username
                          ? `Transferred to @${transaction.related_username}`
                          : transaction.transaction_type === 'received' && transaction.related_username
                          ? `Received from @${transaction.related_username}`
                          : undefined;
                      
                      return (
                        <span 
                          className={`text-sm text-gray-700 dark:text-gray-300 capitalize ${tooltipTitle ? 'cursor-help' : ''}`}
                          title={tooltipTitle}
                        >
                          {transactionType}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {transaction.payment_method ||
                        transaction.gateway ||
                        transaction.method ||
                        'UddoktaPay'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {formatDate 
                        ? formatDate(transaction.createdAt)
                        : moment(transaction.createdAt).format('DD/MM/YYYY')}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime 
                        ? formatTime(transaction.createdAt)
                        : new Intl.DateTimeFormat('en', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            timeZone: 'Asia/Dhaka',
                          }).format(new Date(transaction.createdAt))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={transaction.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
    </div>
  );
}

