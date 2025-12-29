'use client';

import React, { useEffect, useState } from 'react';
import {
    FaBox,
    FaCheck,
    FaCheckCircle,
    FaEllipsisH,
    FaEye,
    FaEyeSlash,
    FaSearch,
    FaSync,
    FaTimes,
    FaTrash
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import TicketSystemGuard from '@/components/ticket-system-guard';

const TicketsTableSkeleton = () => {
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
                  <div className="h-4 w-48 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-3 w-24 gradient-shimmer rounded mb-1" />
                  <div className="h-3 w-20 gradient-shimmer rounded" />
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

interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  name: string;
  subject: string;
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

const SupportTicketsPage = () => {
  const { appName } = useAppNameWithFallback();

  useEffect(() => {
    setPageTitle('Support Tickets', appName);
  }, [appName]);

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
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
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  const [closingTicketId, setClosingTicketId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [selectedBulkOperation, setSelectedBulkOperation] = useState('');

  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter,
      });

      const response = await fetch(`/api/admin/tickets?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to fetch tickets (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSupportTickets(data.tickets || []);
      setPagination({
        page: data.page || 1,
        limit: data.limit || 20,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
        hasNext: data.hasNext || false,
        hasPrev: data.hasPrev || false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tickets';
      
      if (errorMessage.includes('Ticket system is currently disabled')) {
        console.log('Ticket system is disabled');
        setSupportTickets([]);
        setPagination({
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        });
        showToast('Ticket system is currently disabled', 'info');
        return;
      }
      
      console.error('Error fetching tickets:', error);
      showToast(errorMessage, 'error');
      setSupportTickets([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [pagination.page, pagination.limit, searchTerm, statusFilter]);

  const formatTicketID = (id: string | number) => {
    return String(id || '0');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Answered':
        return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'Customer Reply':
        return 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'On Hold':
        return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'In Progress':
        return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Closed':
      case 'closed':
        return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const formatStatusDisplay = (status: string) => {
    switch (status) {
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };


  const filteredTickets = supportTickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    const total = filteredTickets.length;
    const totalPages = Math.ceil(total / pagination.limit);
    setPagination((prev) => ({
      ...prev,
      total,
      totalPages,
      hasNext: prev.page < totalPages,
      hasPrev: prev.page > 1,
    }));

    setSelectedTickets([]);
    setSelectedBulkOperation('');
  }, [filteredTickets.length, pagination.limit, statusFilter]);

  const getPaginatedData = () => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredTickets.slice(startIndex, endIndex);
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRefresh = () => {
    fetchTickets();
    showToast('Support tickets refreshed successfully!', 'success');
  };

  const handleSelectAll = () => {
    if (selectedTickets.length === getPaginatedData().length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(getPaginatedData().map((ticket) => ticket.id));
    }
  };

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleViewTicket = (ticketId: string) => {

    window.open(`/admin/tickets/${ticketId}`, '_blank');
  };

  const handleDeleteTicket = async (ticketId: string) => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete ticket');
      }

      setSupportTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
      showToast('Ticket deleted successfully', 'success');
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
      fetchTickets();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      showToast('Error deleting ticket', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleReadStatus = async (ticketId: string) => {
    try {
      const ticket = supportTickets.find(t => t.id === ticketId);
      const response = await fetch(`/api/admin/tickets/${ticketId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: !ticket?.isRead }),
      });

      if (!response.ok) {
        throw new Error('Failed to update read status');
      }

      setSupportTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, isRead: !t.isRead }
            : t
        )
      );
      showToast(
        `Ticket marked as ${ticket?.isRead ? 'unread' : 'read'}`,
        'success'
      );
    } catch (error) {
      console.error('Error updating read status:', error);
      showToast('Error updating ticket status', 'error');
    }
  };


  const handleCloseTicket = async (ticketId: string) => {
    const confirmed = window.confirm('Are you sure you want to close this ticket? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setClosingTicketId(ticketId);
      const response = await fetch(`/api/support-tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'closed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to close ticket');
      }

      const updatedTicket = await response.json();
      setSupportTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: 'Closed', lastUpdated: new Date().toISOString() }
            : ticket
        )
      );
      showToast('Ticket has been closed successfully', 'success');
    } catch (error) {
      console.error('Error closing ticket:', error);
      showToast('Error closing ticket', 'error');
    } finally {
      setClosingTicketId(null);
    }
  };

  const handleBulkOperation = async (operation: string) => {
    try {
      setBulkOperationLoading(true);
      const response = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketIds: selectedTickets,
          operation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk operation');
      }

      const result = await response.json();

      switch (operation) {
        case 'mark_read':
          setSupportTickets((prev) =>
            prev.map((ticket) =>
              selectedTickets.includes(ticket.id)
                ? { ...ticket, isRead: true }
                : ticket
            )
          );
          break;
        case 'mark_unread':
          setSupportTickets((prev) =>
            prev.map((ticket) =>
              selectedTickets.includes(ticket.id)
                ? { ...ticket, isRead: false }
                : ticket
            )
          );
          break;
        case 'delete_selected':
          setSupportTickets((prev) =>
            prev.filter((ticket) => !selectedTickets.includes(ticket.id))
          );
          break;
      }

      showToast(result.message || 'Operation completed successfully', 'success');
      setSelectedTickets([]);
      fetchTickets();
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      showToast('Error performing bulk operation', 'error');
    } finally {
      setBulkOperationLoading(false);
      setSelectedBulkOperation('');
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
                disabled={ticketsLoading}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
              >
                <FaSync className={ticketsLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
            <div className="flex flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>
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
                    {filteredTickets.length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('Open')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'Open'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Open
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'Open'
                        ? 'bg-white/20'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {supportTickets.filter(t => t.status === 'Open').length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('Answered')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'Answered'
                      ? 'bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Answered
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'Answered'
                        ? 'bg-white/20'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}
                  >
                    {supportTickets.filter(t => t.status === 'Answered').length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('Customer Reply')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'Customer Reply'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Customer Reply
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'Customer Reply'
                        ? 'bg-white/20'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {supportTickets.filter(t => t.status === 'Customer Reply').length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('On Hold')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'On Hold'
                      ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  On Hold
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'On Hold'
                        ? 'bg-white/20'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}
                  >
                    {supportTickets.filter(t => t.status === 'On Hold').length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('In Progress')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'In Progress'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  In Progress
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'In Progress'
                        ? 'bg-white/20'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {supportTickets.filter(t => t.status === 'In Progress').length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('Closed')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'Closed'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Closed
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'Closed'
                        ? 'bg-white/20'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {supportTickets.filter(t => t.status === 'Closed').length}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            {selectedTickets.length > 0 && (
              <div className="flex flex-col md:flex-row md:items-center gap-2 py-4 border-b dark:border-gray-700 mb-4">
                <div className="flex items-center gap-2 mb-2 md:mb-0">
                  <span
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    {selectedTickets.length} selected
                  </span>
                  <select 
                    value={selectedBulkOperation}
                    onChange={(e) => setSelectedBulkOperation(e.target.value)}
                    disabled={ticketsLoading}
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
                    }}
                    disabled={ticketsLoading || bulkOperationLoading}
                    className="btn btn-primary flex items-center gap-2 px-4 py-2.5 disabled:opacity-50 w-full md:w-auto"
                  >
                    {bulkOperationLoading ? 'Updating...' : 'Save Changes'}
                  </button>
                )}
              </div>
            )}
            {ticketsLoading ? (
              <div className="min-h-[600px]">
                <TicketsTableSkeleton />
              </div>
            ) : getPaginatedData().length === 0 ? (
              <div className="text-center py-12">
                <FaBox
                  className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
                />
                <h3
                  className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300"
                >
                  No tickets found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No support tickets match your search criteria or no tickets exist yet.
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
                              selectedTickets.length === getPaginatedData().length &&
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
                          Subject
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Created
                        </th>
                        <th
                          className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100"
                        >
                          Last Updated
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
                      {getPaginatedData().map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedTickets.includes(ticket.id)}
                              onChange={() => handleSelectTicket(ticket.id)}
                              className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                              {formatTicketID(ticket.id)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div
                              className="font-medium text-sm text-gray-900 dark:text-gray-100"
                            >
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
                            <div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(ticket.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              {ticket.lastUpdated && ticket.lastUpdated !== ticket.createdAt ? (
                                <>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {new Date(ticket.lastUpdated).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {new Date(ticket.lastUpdated).toLocaleTimeString()}
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
                                getStatusColor(
                                ticket.status
                              )}`}
                            >
                              {formatStatusDisplay(ticket.status)}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button
                                className="btn btn-secondary p-2"
                                title="View Ticket"
                                onClick={() => handleViewTicket(ticket.id)}
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
                                        handleToggleReadStatus(ticket.id);
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
                                          handleCloseTicket(ticket.id);
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
                                        setTicketToDelete(ticket.id);
                                        setDeleteDialogOpen(true);
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
                  <div
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
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
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={!pagination.hasPrev || ticketsLoading}
                      className="btn btn-secondary"
                    >
                      Previous
                    </button>
                    <span
                      className="text-sm text-gray-600 dark:text-gray-400"
                    >
                      {ticketsLoading ? (
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
                      disabled={!pagination.hasNext || ticketsLoading}
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
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Delete Ticket</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this support ticket? This action
                cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setTicketToDelete(null);
                  }}
                  disabled={deleteLoading}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    ticketToDelete && handleDeleteTicket(ticketToDelete)
                  }
                  disabled={deleteLoading}
                  className={`px-4 py-2 text-sm ${
                    deleteLoading 
                      ? 'bg-red-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white rounded-lg font-medium transition-all duration-200 shadow-sm flex items-center gap-2`}
                >
                  {deleteLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProtectedSupportTicketsPage = () => (
  <TicketSystemGuard>
    <SupportTicketsPage />
  </TicketSystemGuard>
);

export default ProtectedSupportTicketsPage;