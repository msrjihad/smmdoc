'use client';

import React from 'react';
import {
  FaEdit,
  FaEnvelope,
  FaEye,
  FaReply,
  FaTrash,
} from 'react-icons/fa';

interface ContactMessage {
  id: string;
  userId: string;
  username?: string;
  email?: string;
  category: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'Unread' | 'Read' | 'Replied';
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: number;
  user?: {
    username?: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface MessagesTableProps {
  messages: ContactMessage[];
  pagination: PaginationInfo;
  selectedMessages: string[];
  messagesLoading: boolean;
  formatMessageID: (id: number | string) => string;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  getPaginatedData: () => ContactMessage[];
  onSelectAll: () => void;
  onSelectMessage: (messageId: string) => void;
  onViewEditMessage: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onPageChange: (page: number) => void;
}

const MessagesTable: React.FC<MessagesTableProps> = ({
  messages,
  pagination,
  selectedMessages,
  messagesLoading,
  formatMessageID,
  getStatusColor,
  getStatusIcon,
  formatDate,
  formatTime,
  getPaginatedData,
  onSelectAll,
  onSelectMessage,
  onViewEditMessage,
  onDeleteMessage,
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
                    selectedMessages.length === getPaginatedData().length &&
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
                Email
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Category
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Created
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
            {getPaginatedData().length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    <FaEnvelope className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No contact messages found</p>
                    <p className="text-sm">Try adjusting your search or filter criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              getPaginatedData().map((message) => (
                <tr
                  key={message.id}
                  className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedMessages.includes(message.id)}
                      onChange={() => onSelectMessage(message.id)}
                      className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                      {formatMessageID(message.id)}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {message.user?.username || message.username || 'No Username'}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {message.email || 'No Email'}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {message.category}
                    </div>
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(message.createdAt)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-full text-xs font-medium border w-26 ${getStatusColor(
                        message.status
                      )}`}
                    >
                      {getStatusIcon(message.status)}
                      {message.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {message.adminReply ? (
                        <button
                          className="btn btn-secondary p-2"
                          title="View Message"
                          onClick={() => onViewEditMessage(message.id)}
                        >
                          <FaEye className="h-3 w-3" />
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary p-2"
                          title="Edit Message"
                          onClick={() => onViewEditMessage(message.id)}
                        >
                          <FaEdit className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        className="btn btn-secondary p-2"
                        title="Delete Message"
                        onClick={() => onDeleteMessage(message.id)}
                      >
                        <FaTrash className="h-3 w-3 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {messagesLoading ? (
            <div className="flex items-center gap-2">
              <span>Loading pagination...</span>
            </div>
          ) : (
            `Showing ${
              (pagination.page - 1) * pagination.limit + 1
            } to ${Math.min(
              pagination.page * pagination.limit,
              pagination.total
            )} of ${pagination.total} messages`
          )}
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPrev || messagesLoading}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {messagesLoading ? (
              <div className="h-4 w-24 gradient-shimmer rounded" />
            ) : (
              `Page ${pagination.page} of ${pagination.totalPages}`
            )}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={!pagination.hasNext || messagesLoading}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default MessagesTable;

