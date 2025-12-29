'use client';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    FaBan,
    FaCheckCircle,
    FaClock,
    FaExclamationTriangle,
    FaRobot,
    FaSearch,
    FaSpinner,
    FaTicketAlt,
    FaTimes,
    FaUser,
} from 'react-icons/fa';
import TicketSystemGuard from '@/components/ticket-system-guard';

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

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}) => (
  <div
    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm border ${
      type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
        : type === 'error'
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
    }`}
  >
    <div className="flex items-center space-x-2">
      {type === 'success' && <FaCheckCircle className="w-4 h-4" />}
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
      >
        <FaTimes className="w-3 h-3" />
      </button>
    </div>
  </div>
);


export default function TicketsHistory() {
  const { appName } = useAppNameWithFallback();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'human' | 'ai'>('all');
  const [searchResults, setSearchResults] = useState<Ticket[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setPageTitle('Tickets History', appName);
  }, [appName]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      setError(false);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (status !== 'all') {
        params.append('status', status);
      }

      const response = await fetch(`/api/support-tickets?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to fetch tickets (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {

        const mappedTickets: Ticket[] = data.tickets.map((ticket: any) => ({
           id: ticket.id,
           subject: ticket.subject,
           status: mapApiStatusToFrontend(ticket.status),
           createdAt: ticket.createdAt,
           lastUpdated: ticket.lastUpdated,
           priority: ticket.priority,
           type: ticket.ticketType === 'Human' ? 'human' : 'ai'
         }));

         let finalTickets = mappedTickets;
         if (activeTab !== 'all') {
           finalTickets = mappedTickets.filter((ticket) => ticket.type === activeTab);
         }

        setTickets(finalTickets);
         setTotalPages(data.pagination.totalPages);
         setTotalCount(data.pagination.totalCount || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch tickets');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tickets';
   
      if (errorMessage.includes('Ticket system is currently disabled')) {
        console.log('Ticket system is disabled');
        setError(false);
        setTickets([]);
        setTotalPages(0);
        setTotalCount(0);
        return;
      }
      
      console.error('Error fetching tickets:', error);
      setError(true);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const mapApiStatusToFrontend = (apiStatus: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'open',
      'in_progress': 'in_progress',
      'on_hold': 'on_hold',
      'closed': 'closed',
      'Open': 'open',
      'Answered': 'answered',
      'Customer Reply': 'customer_reply',
      'Closed': 'closed'
    };
    return statusMap[apiStatus] || apiStatus.toLowerCase();
  };

  useEffect(() => {
    fetchTickets();
  }, [page, status, activeTab]);

  useEffect(() => {
    if (search) {


      return;
    }

    if (!search && searchInput === '') {
      fetchTickets();
    }
  }, [search]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim()) {

        const results = tickets.filter(
          (ticket) =>
            ticket.subject.toLowerCase().includes(searchInput.toLowerCase()) ||
            ticket.id.toString().includes(searchInput) ||
            ticket.status.toLowerCase().includes(searchInput.toLowerCase())
        );
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        event.target && !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredTickets = useMemo(() => {
    let filteredTickets = [...tickets];

    if (activeTab !== 'all') {
      filteredTickets = filteredTickets.filter((ticket) => ticket.type === activeTab);
    }

    if (search) {
      filteredTickets = filteredTickets.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
          ticket.id.toString().includes(search)
      );
    }

    return filteredTickets;
  }, [tickets, search, activeTab]);

  const pagination = {
    total: totalCount,
    page: page,
    limit: limit,
    totalPages: totalPages,
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const getStatusCount = (statusKey: string) => {
    let filteredTickets = [...tickets];

    if (activeTab !== 'all') {
      filteredTickets = filteredTickets.filter((ticket) => ticket.type === activeTab);
    }

    if (statusKey === 'all') return filteredTickets.length;
    return filteredTickets.filter((ticket) => ticket.status === statusKey).length;
  };

  const statusFilters = [
    {
      key: 'all',
      label: 'All',
      icon: FaTicketAlt,
      color: 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400',
    },
    {
      key: 'open',
      label: 'Open',
      icon: FaClock,
      color: 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400',
    },
    {
      key: 'answered',
      label: 'Answered',
      icon: FaCheckCircle,
      color: 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400',
    },
    {
      key: 'customer_reply',
      label: 'Customer Reply',
      icon: FaTicketAlt,
      color: 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400',
    },
    {
      key: 'on_hold',
      label: 'On Hold',
      icon: FaSpinner,
      color: 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400',
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      icon: FaSpinner,
      color: 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400',
    },
    {
      key: 'closed',
      label: 'Closed',
      icon: FaBan,
      color: 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-400',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
      case 'open':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Answered':
      case 'answered':
        return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'Customer Reply':
      case 'customer_reply':
        return 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'On Hold':
      case 'on_hold':
        return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'In Progress':
      case 'in_progress':
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
      case 'open':
        return 'Open';
      case 'answered':
        return 'Answered';
      case 'customer_reply':
        return 'Customer Reply';
      case 'on_hold':
        return 'On Hold';
      case 'in_progress':
        return 'In Progress';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  const handleSearchSelect = (ticket: Ticket) => {
    setSearch(ticket.subject);
    setSearchInput(ticket.subject);
    setShowDropdown(false);
    setSearchResults([]);

    setPage(1);
  };

  const router = useRouter();

  const handleViewTicket = (ticketId: string) => {
    router.push(`/support-tickets/${ticketId}`);
  };

  if (error) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="card card-padding">
            <div className="text-red-500 dark:text-red-400 text-center flex flex-col items-center py-8">
              <FaExclamationTriangle className="text-4xl mb-4" />
              <div className="text-lg font-medium">Error loading tickets!</div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <TicketSystemGuard>
      <div className="page-container">
        {toastMessage && (
          <Toast
            message={toastMessage.message}
            type={toastMessage.type}
            onClose={() => setToastMessage(null)}
          />
        )}

        <div className="page-content">
        <div className="md:card md:card-padding">
          <div className="card mb-6" style={{ padding: '8px' }}>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <button
              onClick={() => {
                setActiveTab('all');
                setPage(1);
                setStatus('all');
              }}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm w-full ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-600 dark:hover:from-gray-800 dark:hover:to-blue-900/30 dark:hover:text-blue-400'
              }`}
            >
              <FaTicketAlt className="mr-2 w-4 h-4" />
              All Tickets
            </button>
            <button
              onClick={() => {
                setActiveTab('human');
                setPage(1);
                setStatus('all');
              }}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm w-full ${
                activeTab === 'human'
                  ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 hover:text-purple-600 dark:hover:from-gray-800 dark:hover:to-purple-900/30 dark:hover:text-purple-400'
              }`}
            >
              <FaUser className="mr-2 w-4 h-4" />
              Human Support
            </button>
            <button
              onClick={() => {
                setActiveTab('ai');
                setPage(1);
                setStatus('all');
              }}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm w-full ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:text-green-600 dark:hover:from-gray-800 dark:hover:to-green-900/30 dark:hover:text-green-400'
              }`}
            >
              <FaRobot className="mr-2 w-4 h-4" />
              AI Ticket
            </button>
          </div>
        </div>
        <div className="card card-padding">
          <div className="mb-6">
            <div className="relative w-full" ref={searchRef}>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                <FaSearch className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              </div>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSearch(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value.trim()) {
                    setPage(1);
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                className="form-field w-full pl-10 pr-4 py-3 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                placeholder="Search by ticket ID, subject, or status..."
                autoComplete="off"
                style={{ width: '100%', minWidth: '0' }}
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto left-0 right-0">
                  {searchResults.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => handleSearchSelect(ticket)}
                    >
                      <div className="flex justify-between items-center w-full">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {ticket.id}
                            </span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                              {ticket.subject}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border w-26 ${
                                getStatusColor(ticket.status)
                              }`}
                            >
                              {formatStatusDisplay(ticket.status)}
                            </span>
                            {ticket.type === 'ai' ? (
                              <span className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                <FaRobot className="w-3 h-3" /> AI
                              </span>
                            ) : (
                              <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <FaUser className="w-3 h-3" /> Human
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {moment(ticket.createdAt).format('DD/MM')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              {isLoading ? (
                <>
                  {Array.from({ length: 7 }).map((_, idx) => (
                    <div key={idx} className="h-9 w-24 gradient-shimmer rounded-full" />
                  ))}
                </>
              ) : (
                statusFilters.map((filter) => {
                  const IconComponent = filter.icon;
                  const isActive = status === filter.key;
                  const count = getStatusCount(filter.key);

                  return (
                    <button
                      key={filter.key}
                      onClick={() => {
                        setStatus(filter.key);
                        setPage(1);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white ${
                        isActive
                          ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg'
                          : filter.color
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {filter.label} ({count})
                    </button>
                  );
                })
              )}
            </div>
          </div>
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
                ) : filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket, index) => {
                    const isLastRow = index === filteredTickets.length - 1;
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
                            {moment(ticket.createdAt).format('DD/MM/YYYY')}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {moment(ticket.createdAt).format('HH:mm')}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {ticket.lastUpdated
                              ? moment(ticket.lastUpdated).format('DD/MM/YYYY')
                              : '-'}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {ticket.lastUpdated
                              ? moment(ticket.lastUpdated).format('HH:mm')
                              : ''}
                          </div>
                        </td>
                        <td
                          className={`py-3 px-4 ${
                            isLastRow ? 'last:rounded-br-lg' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleViewTicket(ticket.id.toString())}
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
                <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span>{' '}
                tickets
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
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
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-2 text-sm rounded-lg ${
                            page === pageNum
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
                    setPage(Math.min(pagination.totalPages, page + 1))
                  }
                  disabled={page === pagination.totalPages}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
        </div>
      </div>
    </TicketSystemGuard>
  );
}
