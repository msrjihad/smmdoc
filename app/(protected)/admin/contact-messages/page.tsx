'use client';

import React, { useEffect, useState } from 'react';
import {
    FaBox,
    FaCheckCircle,
    FaEdit,
    FaEnvelope,
    FaEye,
    FaReply,
    FaSearch,
    FaSync,
    FaTimes,
    FaTrash
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';

const ContactMessagesTableSkeleton = () => {
  const rows = Array.from({ length: 10 });

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              {Array.from({ length: 8 }).map((_, idx) => (
                <th key={idx} className="text-left p-3">
                  <div className="h-4 rounded w-3/4 gradient-shimmer" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((_, rowIdx) => (
              <tr key={rowIdx} className="border-t dark:border-gray-700">
                <td className="p-3">
                  <div className="h-4 w-4 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-6 w-16 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-24 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-32 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-5 w-24 gradient-shimmer rounded-full" />
                </td>
                <td className="p-3">
                  <div className="h-3 w-24 gradient-shimmer rounded mb-1" />
                  <div className="h-3 w-20 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-5 w-20 gradient-shimmer rounded-full" />
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 gradient-shimmer rounded" />
                    <div className="h-8 w-8 gradient-shimmer rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="h-5 w-48 gradient-shimmer rounded" />
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <div className="h-9 w-20 gradient-shimmer rounded" />
          <div className="h-5 w-24 gradient-shimmer rounded" />
          <div className="h-9 w-16 gradient-shimmer rounded" />
        </div>
      </div>
    </>
  );
};

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'pending';
  onClose: () => void;
}) => {
  const getDarkClasses = () => {
    switch (type) {
      case 'success':
        return 'dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
      case 'error':
        return 'dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'info':
        return 'dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
      case 'pending':
        return 'dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      default:
        return '';
    }
  };

  return (
    <div className={`toast toast-${type} toast-enter ${getDarkClasses()}`}>
      {type === 'success' && <FaCheckCircle className="toast-icon" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="toast-close dark:hover:bg-white/10">
        <FaTimes className="toast-close-icon" />
      </button>
    </div>
  );
};

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

const ContactMessagesPage = () => {
  const { appName } = useAppNameWithFallback();

  useEffect(() => {
    setPageTitle('Contact Messages', appName);
  }, [appName]);

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [messageCounts, setMessageCounts] = useState({
    total: 0,
    unread: 0,
    read: 0,
    replied: 0
  });


  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [messagesLoading, setMessagesLoading] = useState(false);
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [fallbackMode, setFallbackMode] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const [selectedBulkOperation, setSelectedBulkOperation] = useState('');

  const fetchContactMessages = async () => {
    setMessagesLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter === 'all' ? 'All' : statusFilter,
        search: searchTerm,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/contact-messages?${params}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setContactMessages(data.messages || []);
        setMessageCounts(data.messageCounts || { total: 0, unread: 0, read: 0, replied: 0 });

        if (data.fallbackMode) {
          setFallbackMode(true);
          setWarningMessage(data.warning || 'Database connection unavailable. Showing sample data.');
        } else {
          setFallbackMode(false);
          setWarningMessage('');
        }

        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false,
        }));
      } else {
        console.error('Failed to fetch contact messages:', data.error);
        setContactMessages([]);
        setMessageCounts({ total: 0, unread: 0, read: 0, replied: 0 });
        setFallbackMode(false);
        setWarningMessage('');
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      setContactMessages([]);
      setMessageCounts({ total: 0, unread: 0, read: 0, replied: 0 });
      setFallbackMode(false);
      setWarningMessage('');
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchContactMessages();
  }, [statusFilter, searchTerm, pagination.page, pagination.limit]);

  const formatMessageID = (id: number | string) => {
    return `${String(id)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Unread':
        return 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'Read':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Replied':
        return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Unread':
        return <FaEnvelope className="h-3 w-3" />;
      case 'Read':
        return <FaEye className="h-3 w-3" />;
      case 'Replied':
        return <FaReply className="h-3 w-3" />;
      default:
        return <FaEnvelope className="h-3 w-3" />;
    }
  };

  const getPaginatedData = () => {
    return contactMessages;
  };

  const loadContactMessages = async () => {
    setMessagesLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter === 'all' ? 'All' : statusFilter,
        search: searchTerm,
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      const response = await fetch(`/api/admin/contact-messages?${params}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setContactMessages(data.messages || []);

        if (data.fallbackMode) {
          setFallbackMode(true);
          setWarningMessage(data.warning || 'Database connection unavailable. Showing sample data.');
        } else {
          setFallbackMode(false);
          setWarningMessage('');
        }

        const totalCount = data.messageCounts?.total || 0;
        setPagination(prev => ({
          ...prev,
          total: totalCount,
          totalPages: Math.ceil(totalCount / prev.limit),
          hasNext: prev.page < Math.ceil(totalCount / prev.limit),
          hasPrev: prev.page > 1
        }));

        setMessageCounts({
          total: data.messageCounts?.total || 0,
          unread: data.messageCounts?.unread || 0,
          read: data.messageCounts?.read || 0,
          replied: data.messageCounts?.replied || 0
        });
      } else {
        showToast(data.error || 'Failed to load contact messages', 'error');
      }
    } catch (error) {
      console.error('Error loading contact messages:', error);
      setContactMessages([]);
      setMessageCounts({ total: 0, unread: 0, read: 0, replied: 0 });
      setFallbackMode(false);
      setWarningMessage('');
      showToast('Failed to load contact messages', 'error');
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadContactMessages();
  }, [statusFilter, searchTerm, pagination.page]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRefresh = async () => {
    try {
      await fetchContactMessages();
      showToast('Contact messages refreshed successfully!', 'success');
    } catch (error) {
      showToast('Failed to refresh contact messages', 'error');
    }
  };

  const handleSelectAll = () => {
    if (selectedMessages.length === getPaginatedData().length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(getPaginatedData().map((message) => message.id));
    }
  };

  const handleSelectMessage = (messageId: string) => {
    setSelectedMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleViewEditMessage = (messageId: string) => {

    window.open(`/admin/contact-messages/${messageId}`, '_blank');
  };

  const handleDeleteMessage = async (messageId: string) => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setContactMessages((prev) => prev.filter((message) => message.id !== messageId));
        showToast('Message deleted successfully', 'success');

        fetchContactMessages();
      } else {
        showToast(data.error || 'Error deleting message', 'error');
      }

      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      showToast('Error deleting message', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStatus',
          status: 'Read',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setContactMessages((prev) =>
          prev.map((message) =>
            message.id === messageId
              ? { ...message, status: 'Read' }
              : message
          )
        );
        showToast('Message marked as read', 'success');

        fetchContactMessages();
      } else {
        showToast(data.error || 'Error updating message status', 'error');
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      showToast('Error updating message status', 'error');
    }
  };

  const handleBulkOperation = async (operation: string) => {
    if (!operation || selectedMessages.length === 0) return;

    setBulkOperationLoading(true);
    const selectedIds = selectedMessages;

    try {
      const response = await fetch('/api/admin/contact-messages/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          messageIds: selectedIds,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {

        await fetchContactMessages();

        switch (operation) {
          case 'mark_read':
            showToast(`Marked ${selectedIds.length} message(s) as read`, 'success');
            break;
          case 'mark_unread':
            showToast(`Marked ${selectedIds.length} message(s) as unread`, 'success');
            break;
          case 'delete_selected':
            showToast(`Deleted ${selectedIds.length} message(s)`, 'success');
            break;
        }

        setSelectedMessages([]);
      } else {
        showToast(data.error || 'Bulk operation failed', 'error');
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      showToast('Failed to perform bulk operation', 'error');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="toast-container">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      <div className="page-content">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <select
                value={pagination.limit}
                onChange={(e) =>
                  setPagination((prev) => ({
                    ...prev,
                    limit:
                      e.target.value === 'all'
                        ? 1000
                        : parseInt(e.target.value),
                    page: 1,
                  }))
                }
                className="pl-4 pr-8 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="all">All</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={messagesLoading}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
              >
                <FaSync className={messagesLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
                />
                <input
                  type="text"
                  placeholder={`Search ${statusFilter === 'all' ? 'all' : statusFilter} messages...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>
        {fallbackMode && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Database Connection Issue
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {warningMessage}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                The system will automatically reconnect when the database becomes available.
              </p>
            </div>
          </div>
        )}
        <div className="card">
          <div className="card-header" style={{ padding: '24px 24px 0 24px' }}>
            <div className="mb-4">
              <div className="block space-y-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'all'
                      ? 'bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'all'
                        ? 'bg-white/20'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {messageCounts.total}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('Unread')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'Unread'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Unread
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'Unread'
                        ? 'bg-white/20'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {messageCounts.unread}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('Read')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'Read'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Read
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'Read'
                        ? 'bg-white/20'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {messageCounts.read}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('Replied')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'Replied'
                      ? 'bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Replied
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'Replied'
                        ? 'bg-white/20'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}
                  >
                    {messageCounts.replied}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            {selectedMessages.length > 0 && (
              <div className="flex flex-col md:flex-row md:items-center gap-2 py-4 border-b dark:border-gray-700 mb-4">
                <div className="flex items-center gap-2 mb-2 md:mb-0">
                  <span
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    {selectedMessages.length} selected
                  </span>
                  <select 
                    value={selectedBulkOperation}
                    onChange={(e) => setSelectedBulkOperation(e.target.value)}
                    disabled={bulkOperationLoading || messagesLoading}
                    className="pl-4 pr-8 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm disabled:opacity-50"
                  >
                    <option value="" disabled>Bulk Operations</option>
                    <option value="mark_read">Mark all as read</option>
                    <option value="mark_unread">Mark all as unread</option>
                    <option value="delete_selected">Delete Selected</option>
                  </select>
                </div>
                {selectedBulkOperation && (
                  <button
                    onClick={() => {
                      handleBulkOperation(selectedBulkOperation);
                      setSelectedBulkOperation('');
                    }}
                    disabled={bulkOperationLoading || messagesLoading}
                    className="btn btn-primary flex items-center gap-2 px-4 py-2.5 disabled:opacity-50 w-full md:w-auto"
                  >
                    {bulkOperationLoading ? (
                      <>
                        Updating...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                )}
              </div>
            )}
            {messagesLoading ? (
              <div className="min-h-[600px]">
                <ContactMessagesTableSkeleton />
              </div>
            ) : getPaginatedData().length === 0 ? (
              <div className="text-center py-12">
                <FaBox
                  className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
                />
                <h3
                  className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300"
                >
                  No messages found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No contact messages match your search criteria or no messages exist yet.
                </p>
              </div>
            ) : (
              <React.Fragment>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
                      <tr>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          <input
                            type="checkbox"
                            checked={
                              selectedMessages.length === getPaginatedData().length &&
                              getPaginatedData().length > 0
                            }
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                          />
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          ID
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          User
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Email
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Category
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Created
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Status
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
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
                              onChange={() => handleSelectMessage(message.id)}
                              className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                              {formatMessageID(message.id)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div
                              className="font-medium text-sm text-gray-900 dark:text-gray-100"
                            >
                              {message.user?.username || message.username || 'No Username'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div
                              className="text-sm text-gray-900 dark:text-gray-100"
                            >
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
                                {new Date(message.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(message.createdAt).toLocaleTimeString()}
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
                                  onClick={() => handleViewEditMessage(message.id)}
                                >
                                  <FaEye className="h-3 w-3" />
                                </button>
                              ) : (
                                <button
                                  className="btn btn-primary p-2"
                                  title="Edit Message"
                                  onClick={() => handleViewEditMessage(message.id)}
                                >
                                  <FaEdit className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                className="btn btn-secondary p-2"
                                title="Delete Message"
                                onClick={() => {
                                  setMessageToDelete(message.id);
                                  setDeleteDialogOpen(true);
                                }}
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
                  <div
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
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
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={!pagination.hasPrev || messagesLoading}
                      className="btn btn-secondary"
                    >
                      Previous
                    </button>
                    <span
                      className="text-sm text-gray-600 dark:text-gray-400"
                    >
                      {messagesLoading ? (
                        <div className="h-4 w-24 gradient-shimmer rounded" />
                      ) : (
                        `Page ${pagination.page} of ${pagination.totalPages}`
                      )}
                    </span>
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.totalPages, prev.page + 1),
                        }))
                      }
                      disabled={!pagination.hasNext || messagesLoading}
                      className="btn btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Delete Message</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this contact message? This action
                cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setMessageToDelete(null);
                  }}
                  className="btn btn-secondary"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    messageToDelete && handleDeleteMessage(messageToDelete)
                  }
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <div className="flex items-center gap-2">
                      Deleting...
                    </div>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactMessagesPage;