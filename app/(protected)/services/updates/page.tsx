
'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios-instance';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import moment from 'moment';
import {
  FaBell,
  FaCheckCircle,
  FaClipboardList,
  FaSearch,
  FaTimes,
} from 'react-icons/fa';

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'pending';
  onClose: () => void;
}) => (
  <div
    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm border ${
      type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
        : type === 'error'
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        : type === 'info'
        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
    }`}
  >
    <div className="flex items-center space-x-2">
      {type === 'success' && <FaCheckCircle className="w-4 h-4" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded">
        <FaTimes className="w-3 h-3" />
      </button>
    </div>
  </div>
);

interface Service {
  id: number;
  name: string;
  updatedAt: string;
  updateText: string;
}

export default function UpdateServiceTable() {
  const { appName } = useAppNameWithFallback();
  const router = useRouter();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');

  const user = useCurrentUser();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const [isAccessCheckLoading, setIsAccessCheckLoading] = useState(true);
  const [isAccessAllowed, setIsAccessAllowed] = useState(false);

  const limit = 50;

  useEffect(() => {
    setPageTitle('Service Updates', appName);
  }, [appName]);

  useEffect(() => {
    const loadTimeFormat = async () => {
      const storedTimeFormat = (userDetails as any)?.timeFormat;
      if (storedTimeFormat === '12' || storedTimeFormat === '24') {
        setTimeFormat(storedTimeFormat);
        return;
      }

      try {
        const userData = await getUserDetails();
        const userTimeFormat = (userData as any)?.timeFormat || '24';
        setTimeFormat(userTimeFormat === '12' || userTimeFormat === '24' ? userTimeFormat : '24');
      } catch (error) {
        console.error('Error loading time format:', error);
        setTimeFormat('24');
      }
    };

    loadTimeFormat();
  }, [userDetails]);

  const formatTime = (dateString: string | Date): string => {
    if (!dateString) return 'null';
    
    let date: Date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'null';
    }
    
    if (isNaN(date.getTime())) return 'null';

    if (timeFormat === '12') {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
  };

  useEffect(() => {
    const checkServiceUpdateLogsStatus = async () => {
      try {
        const response = await axiosInstance.get('/api/service-update-logs-status');
        if (response.data.success && response.data.serviceUpdateLogsEnabled) {
          setIsAccessAllowed(true);
        } else {
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking service update logs status:', error);
        router.push('/dashboard');
        return;
      } finally {
        setIsAccessCheckLoading(false);
      }
    };

    checkServiceUpdateLogsStatus();
  }, [router]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isAccessAllowed) return;
    
    const fetchServices = async () => {
      setLoading(true);
      try {

        const response = await fetch(
          `/api/user/services/getUpdateServices?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}`,
          {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }
        );
        const data = await response.json();

        if (response.ok) {
          setServices(data.data);
          setTotalPages(data.totalPages);
        } else {
          showToast(data.message || 'Error fetching services', 'error');
        }
      } catch (error) {
        showToast('Error fetching services. Please try again later.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [page, debouncedSearch, user?.id, isAccessAllowed]);

  if (isAccessCheckLoading || !isAccessAllowed) {
    return null;
  }

  const handlePrevious = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };


  if (loading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="card card-padding">
            <div className="flex items-center gap-3 mb-6">
              <div className="card-icon">
                <FaBell className="w-5 h-5 text-white" />
              </div>
              <div className="h-6 w-40 gradient-shimmer rounded" />
            </div>
            <div className="mb-6">
              <div className="h-10 w-full gradient-shimmer rounded-lg" />
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)] rounded-t-lg">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <th key={idx} className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        <div className="h-4 w-20 gradient-shimmer rounded" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-6 py-4">
                        <div className="h-4 w-12 gradient-shimmer rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-48 gradient-shimmer rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-64 gradient-shimmer rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-32 gradient-shimmer rounded" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="h-5 w-32 gradient-shimmer rounded" />
              <div className="flex gap-2">
                <div className="h-9 w-20 gradient-shimmer rounded" />
                <div className="h-9 w-16 gradient-shimmer rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="page-content">
        <div className="card card-padding">
          <div className="flex items-center gap-3 mb-6">
            <div className="card-icon">
              <FaBell className="w-5 h-5 text-white" />
            </div>
            <h1 className="card-title">Service Updates</h1>
          </div>
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-field w-full pl-10 pr-4 py-3 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                autoComplete="off"
              />
            </div>
          </div>
          {services?.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)] rounded-t-lg">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 first:rounded-tl-lg">
                      ID
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 max-w-[400px]">
                      Service Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Date & Time
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 w-[300px] last:rounded-tr-lg">
                      Update
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {services?.map((service, i) => (
                    <tr key={service.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {service.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {service.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-md">
                        <div className="break-words">
                          {(() => {
                            try {
                              const updateData = JSON.parse(service.updateText || '{}');

                              if (updateData.action === 'created' || updateData.type === 'new_service' || updateData.action === 'create') {
                                return 'New service';
                              }

                              if (updateData.action === 'added' || updateData.type === 'service_added' || updateData.action === 'import') {
                                return 'New service';
                              }

                              const updates = [];
                              let hasRateChange = false;
                              let hasStatusChange = false;

                              const rateChange = updateData.changes?.rate || updateData.rate;
                              if (rateChange && rateChange.from !== undefined && rateChange.to !== undefined) {
                                const oldRate = parseFloat(rateChange.from);
                                const newRate = parseFloat(rateChange.to);

                                const formatRate = (rate: number) => {
                                  const formatted = rate.toFixed(6);
                                  return parseFloat(formatted).toString();
                                };

                                if (newRate > oldRate) {
                                  updates.push(`Rate increased from $${formatRate(oldRate)} to $${formatRate(newRate)}`);
                                  hasRateChange = true;
                                } else if (newRate < oldRate) {
                                  updates.push(`Rate decreased from $${formatRate(oldRate)} to $${formatRate(newRate)}`);
                                  hasRateChange = true;
                                }
                              }

                              const statusChange = updateData.changes?.status || updateData.status;
                              if (statusChange && statusChange.from !== undefined && statusChange.to !== undefined) {
                                const oldStatus = statusChange.from;
                                const newStatus = statusChange.to;
                                if (newStatus === 'active' && oldStatus !== 'active') {
                                  updates.push('Service enabled');
                                  hasStatusChange = true;
                                } else if (newStatus !== 'active' && oldStatus === 'active') {
                                  updates.push('Service disabled');
                                  hasStatusChange = true;
                                }
                              }

                              const infoUpdates = [];

                              const minOrderChange = updateData.changes?.min_order || updateData.min_order;
                              if (minOrderChange && minOrderChange.from !== undefined && minOrderChange.to !== undefined) {
                                infoUpdates.push('min order');
                              }

                              const maxOrderChange = updateData.changes?.max_order || updateData.max_order;
                              if (maxOrderChange && maxOrderChange.from !== undefined && maxOrderChange.to !== undefined) {
                                infoUpdates.push('max order');
                              }

                              const nameChange = updateData.changes?.name || updateData.name;
                              if (nameChange && nameChange.from !== undefined && nameChange.to !== undefined) {
                                infoUpdates.push('name');
                              }

                              const descriptionChange = updateData.changes?.description || updateData.description;
                              if (descriptionChange && descriptionChange.from !== undefined && descriptionChange.to !== undefined) {
                                infoUpdates.push('description');
                              }

                              const categoryChange = updateData.changes?.categoryId || updateData.changes?.category || updateData.category;
                              if (categoryChange && categoryChange.from !== undefined && categoryChange.to !== undefined) {
                                infoUpdates.push('category');
                              }

                              if (infoUpdates.length > 0 && !hasRateChange && !hasStatusChange) {
                                updates.push('Service info updated');
                              }

                              return updates.length > 0 ? updates.join(', ') : 'Service updated';

                            } catch (error) {

                              const text = service.updateText || '';
                              if (text.toLowerCase().includes('created') || text.toLowerCase().includes('new')) {
                                return 'New service';
                              }
                              if (text.toLowerCase().includes('added') || text.toLowerCase().includes('imported')) {
                                return 'Service added';
                              }
                              if (text.toLowerCase().includes('disabled')) {
                                return 'Service disabled';
                              }
                              if (text.toLowerCase().includes('enabled')) {
                                return 'Service enabled';
                              }
                              return 'Service updated';
                            }
                          })()
                        }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {moment(service.updatedAt).format('DD/MM/YYYY')}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(service.updatedAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 flex flex-col items-center">
              <FaClipboardList className="text-4xl text-gray-400 dark:text-gray-500 mb-4" />
              <div className="text-lg font-medium dark:text-gray-300">
                No service updates found
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search criteria
              </div>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page <span className="font-medium">{page}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={page === 1 || loading}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={page === totalPages || loading}
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
  );
}
