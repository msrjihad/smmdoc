'use client';

import {
  FaRobot,
  FaTicketAlt,
  FaUser,
} from 'react-icons/fa';

type Ticket = {
  id: number;
  subject: string;
  status:
    | 'open'
    | 'answered'
    | 'customer_reply'
    | 'on_hold'
    | 'in_progress'
    | 'closed';
  createdAt: string;
  priority?: 'low' | 'medium' | 'high';
  lastUpdated?: string;
  type: 'ai' | 'human';
};

interface TicketsTableProps {
  tickets: Ticket[];
  isLoading: boolean;
  activeTab: 'all' | 'human' | 'ai';
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  getStatusColor: (status: string) => string;
  formatStatusDisplay: (status: string) => string;
  onViewTicket: (ticketId: string) => void;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export function TicketsTable({
  tickets,
  isLoading,
  activeTab,
  formatDate,
  formatTime,
  getStatusColor,
  formatStatusDisplay,
  onViewTicket,
  pagination,
  onPageChange,
}: TicketsTableProps) {
  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)] rounded-t-lg">
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 first:rounded-tl-lg">
                Ticket ID
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Type
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Subject
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Created
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                Last Updated
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 last:rounded-tr-lg">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                {Array.from({ length: 10 }).map((_, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4">
                      <div className="h-4 w-16 gradient-shimmer rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-12 gradient-shimmer rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-48 gradient-shimmer rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-6 w-20 gradient-shimmer rounded-full" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-24 gradient-shimmer rounded mb-1" />
                      <div className="h-3 w-16 gradient-shimmer rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-24 gradient-shimmer rounded mb-1" />
                      <div className="h-3 w-16 gradient-shimmer rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-7 w-16 gradient-shimmer rounded" />
                    </td>
                  </tr>
                ))}
              </>
            ) : tickets.length > 0 ? (
              tickets.map((ticket, index) => {
                const isLastRow = index === tickets.length - 1;
                return (
                  <tr
                    key={ticket.id}
                    className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] ${
                      isLastRow ? 'last:border-b-0' : ''
                    }`}
                  >
                    <td
                      className={`py-3 px-4 ${
                        isLastRow ? 'first:rounded-bl-lg' : ''
                      }`}
                    >
                      <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                        {ticket.id}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {ticket.type === 'ai' ? (
                          <>
                            <FaRobot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                              AI
                            </span>
                          </>
                        ) : (
                          <>
                            <FaUser className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              Human
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-[300px]">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {ticket.subject}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border w-26 ${
                          getStatusColor(ticket.status)
                        }`}
                      >
                        {formatStatusDisplay(ticket.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(ticket.createdAt)}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(ticket.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {ticket.lastUpdated
                          ? formatDate(ticket.lastUpdated)
                          : '-'}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {ticket.lastUpdated
                          ? formatTime(ticket.lastUpdated)
                          : ''}
                      </div>
                    </td>
                    <td
                      className={`py-3 px-4 ${
                        isLastRow ? 'last:rounded-br-lg' : ''
                      }`}
                    >
                      <button
                        onClick={() => onViewTicket(ticket.id.toString())}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs px-2 py-1 border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        title="View Ticket"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center">
                    <FaTicketAlt className="text-4xl text-gray-400 dark:text-gray-500 mb-4" />
                    <div className="text-lg font-medium dark:text-gray-300">
                      No{' '}
                      {activeTab === 'all'
                        ? ''
                        : activeTab === 'human'
                        ? 'human support'
                        : 'AI'}{' '}
                      tickets found
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
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Showing{' '}
            <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span>{' '}
            tickets
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
            </div>

            <button
              onClick={() =>
                onPageChange(Math.min(pagination.totalPages, pagination.page + 1))
              }
              disabled={pagination.page === pagination.totalPages}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}

