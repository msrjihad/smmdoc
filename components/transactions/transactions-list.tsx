'use client';

import {
    FaSearch
} from 'react-icons/fa';

type Transaction = {
  id: number;
  invoice_id: number;
  amount: number;
  status: 'Success' | 'Processing' | 'Cancelled' | 'Failed';
  method: string;
  payment_method?: string;
  transaction_id?: string | null;
  createdAt: string;
  reference_id?: string;
  sender_number?: string;
  phone?: string;
  currency?: string;
};

interface TransactionsListProps {
  transactions: Transaction[];
  page: number;
  limit: number;
  formatDateTime?: (dateString: string | Date) => string;
}

export function TransactionsList({
  transactions,
  page,
  limit,
  formatDateTime,
}: TransactionsListProps) {

  const formatTransactionCurrency = (amount: number, transactionCurrency?: string) => {

    if (transactionCurrency === 'USD' || transactionCurrency === 'USDT') {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `৳${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

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
                Phone Number
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Method
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Date and Time
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Status
              </th>

            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => {
              const serialNumber = (page - 1) * limit + index + 1;
              return (
              <tr
                key={transaction.id}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]"
              >
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {serialNumber}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {transaction.transaction_id ? transaction.transaction_id : 'N/A'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatTransactionCurrency(transaction.amount, transaction.currency)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {transaction.phone || transaction.sender_number || 'N/A'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {transaction.payment_method ||
                      transaction.method ||
                      'UddoktaPay'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDateTime 
                      ? formatDateTime(transaction.createdAt)
                      : new Intl.DateTimeFormat('en', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          hour12: false,
                          timeZone: 'Asia/Dhaka',
                        }).format(new Date(transaction.createdAt))}
                  </span>
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
    </div>
  );
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
