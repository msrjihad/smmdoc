'use client';

import React from 'react';
import {
  FaCheck,
  FaEllipsisH,
  FaEye,
  FaEyeSlash,
  FaTrash,
} from 'react-icons/fa';

interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  name: string;
  subject: string;
  ticketType?: string;
  createdAt: string;
  lastUpdated: string;
  status: 'Open' | 'Answered' | 'Customer Reply' | 'On Hold' | 'In Progress' | 'Closed' | 'closed';
  isRead: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface TicketsTableProps {
  tickets: SupportTicket[];
  pagination: PaginationInfo;
  selectedTickets: string[];
  ticketsLoading: boolean;
  closingTicketId: string | null;
  formatTicketID: (id: string | number) => string;
  getStatusColor: (status: string) => string;
  formatStatusDisplay: (status: string) => string;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  getPaginatedData: () => SupportTicket[];
  onSelectAll: () => void;
  onSelectTicket: (ticketId: string) => void;
  onViewTicket: (ticketId: string) => void;
  onToggleReadStatus: (ticketId: string) => void;
  onCloseTicket: (ticketId: string) => void;
  onDeleteTicket: (ticketId: string) => void;
  onPageChange: (page: number) => void;
}

const TicketsTable: React.FC<TicketsTableProps> = ({
  tickets,
  pagination,
  selectedTickets,
  ticketsLoading,
  closingTicketId,
  formatTicketID,
  getStatusColor,
  formatStatusDisplay,
  formatDate,
  formatTime,
  getPaginatedData,
  onSelectAll,
  onSelectTicket,
  onViewTicket,
  onToggleReadStatus,
  onCloseTicket,
  onDeleteTicket,
  onPageChange,
}) => {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                <input
                  type="checkbox"
                  checked={
                    selectedTickets.length === getPaginatedData().length &&
                    getPaginatedData().length > 0
                  }
                  onChange={onSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                />
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                ID
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                User
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Subject
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Type
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Created
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Last Updated
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
            {getPaginatedData().map((ticket) => (
              <tr
                key={ticket.id}
                className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedTickets.includes(ticket.id)}
                    onChange={() => onSelectTicket(ticket.id)}
                    className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                  />
                </td>
                <td className="p-3">
                  <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    {formatTicketID(ticket.id)}
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {ticket.username}
                  </div>
                </td>
                <td className="p-3">
                  <div
                    className={`text-sm text-gray-900 dark:text-gray-100 ${!ticket.isRead ? 'font-bold' : 'font-normal'}`}
                  >
                    {ticket.subject}
                  </div>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium capitalize">
                    {ticket.ticketType || 'Human'}
                  </span>
                </td>
                <td className="p-3">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(ticket.createdAt)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatTime(ticket.createdAt)}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    {ticket.lastUpdated && ticket.lastUpdated !== ticket.createdAt ? (
                      <>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(ticket.lastUpdated)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {formatTime(ticket.lastUpdated)}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-500">-</div>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <span
                    className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border w-26 ${
                      getStatusColor(ticket.status)
                    }`}
                  >
                    {formatStatusDisplay(ticket.status)}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-secondary p-2"
                      title="View Ticket"
                      onClick={() => onViewTicket(ticket.id)}
                    >
                      <FaEye className="h-3 w-3" />
                    </button>
                    <div className="relative">
                      <button
                        className="btn btn-secondary p-2"
                        title="More Actions"
                        onClick={(e) => {
                          e.stopPropagation();
                          const dropdown = e.currentTarget
                            .nextElementSibling as HTMLElement;

                          document
                            .querySelectorAll('.dropdown-menu')
                            .forEach((menu) => {
                              if (menu !== dropdown)
                                menu.classList.add('hidden');
                            });
                          dropdown.classList.toggle('hidden');
                        }}
                      >
                        <FaEllipsisH className="h-3 w-3" />
                      </button>
                      <div className="dropdown-menu hidden absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              onToggleReadStatus(ticket.id);
                              document
                                .querySelector('.dropdown-menu:not(.hidden)')
                                ?.classList.add('hidden');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                          >
                            {ticket.isRead ? (
                              <FaEyeSlash className="h-3 w-3" />
                            ) : (
                              <FaEye className="h-3 w-3" />
                            )}
                            Mark as {ticket.isRead ? 'Unread' : 'Read'}
                          </button>
                          {ticket.status !== 'Closed' && (
                            <button
                              onClick={() => {
                                onCloseTicket(ticket.id);
                                document
                                  .querySelector('.dropdown-menu:not(.hidden)')
                                  ?.classList.add('hidden');
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                              disabled={ticket.status === 'closed' || closingTicketId === ticket.id}
                            >
                              <FaCheck className="h-3 w-3" />
                              {closingTicketId === ticket.id ? 'Closing...' : 'Close Ticket'}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onDeleteTicket(ticket.id);
                              document
                                .querySelector('.dropdown-menu:not(.hidden)')
                                ?.classList.add('hidden');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-red-900/30 flex items-center gap-2"
                          >
                            <FaTrash className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {ticketsLoading ? (
            <div className="flex items-center gap-2">
              <span>Loading pagination...</span>
            </div>
          ) : (
            `Showing ${
              (pagination.page - 1) * pagination.limit + 1
            } to ${Math.min(
              pagination.page * pagination.limit,
              pagination.total
            )} of ${pagination.total} tickets`
          )}
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPrev || ticketsLoading}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {ticketsLoading ? (
              <div className="h-4 w-24 gradient-shimmer rounded" />
            ) : (
              `Page ${pagination.page} of ${pagination.totalPages}`
            )}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={!pagination.hasNext || ticketsLoading}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default TicketsTable;

