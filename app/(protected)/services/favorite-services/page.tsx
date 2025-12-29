
'use client';

import React, { useEffect, useState } from 'react';
import {
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
  FaEye,
  FaHeart,
  FaRegHeart,
  FaRegStar,
  FaSearch,
  FaStar,
  FaTimes
} from 'react-icons/fa';

import ServiceViewModal from '@/app/(protected)/services/serviceViewModal';
import { PriceDisplay } from '@/components/price-display';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { formatNumber } from '@/lib/utils';

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
  rate: number;
  min_order: number;
  max_order: number;
  avg_time: string;
  description: string;
  category: {
    category_name: string;
    id: number;
  };
  serviceType?: {
    id: string;
    name: string;
  };
  isFavorite?: boolean;
  refill?: boolean;
  cancel?: boolean;
  refillDays?: number;
  refillDisplay?: number;
}

const FavoriteServicesTable: React.FC = () => {
  const user = useCurrentUser();
  const { appName } = useAppNameWithFallback();
  const [services, setServices] = useState<Service[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [groupedServices, setGroupedServices] = useState<
    Record<string, Service[]>
  >({});
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const [limit, setLimit] = useState('10');
  const [hasMoreData, setHasMoreData] = useState(true);
  const [favoriteServices, setFavoriteServices] = useState<Service[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const [totalServices, setTotalServices] = useState(0);
  const [displayLimit] = useState(50);

  useEffect(() => {
    setPageTitle('Favorite Services', appName);
  }, [appName]);

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

    if (search.trim()) {
      setIsSearchLoading(true);
    } else {
      setIsSearchLoading(false);
    }

    return () => clearTimeout(timer);
  }, [search]);

  const fetchServices = React.useCallback(async () => {

    if (!debouncedSearch && page === 1) {
      setLoading(true);
    }

    try {
      if (!user?.id) {
        showToast(
          'You need to be logged in to view favorite services',
          'error'
        );
        setLoading(false);
        return;
      }

      const currentLimit = limit === 'all' ? '500' : limit;

      const searchParams = new URLSearchParams({
        userId: user.id,
        page: page.toString(),
        limit: currentLimit,
        ...(debouncedSearch.trim() && { search: encodeURIComponent(debouncedSearch.trim()) })
      });

      const response = await fetch(
        `/api/user/services/favorites?${searchParams.toString()}`,
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch favorite services: ${response.statusText}`);
      }

      const data = await response.json();

      setTotalPages(data.totalPages || 1);
      setTotalServices(data.total || 0);
      setHasMoreData(page < (data.totalPages || 1));

      const favoriteServicesData =
        data?.data?.map((service: Service) => ({
          ...service,
          isFavorite: true,
        })) || [];

      setServices(favoriteServicesData);

      processServicesData(favoriteServicesData, data.allCategories || []);
    } catch (error) {
      console.error('Error fetching favorite services:', error);
      showToast('Error fetching favorite services. Please try again later.', 'error');
      setServices([]);
      setGroupedServices({});
    } finally {
      setLoading(false);
      setIsSearchLoading(false);
    }
  }, [debouncedSearch, user?.id, page, limit]);

  const processServicesData = React.useCallback((servicesData: Service[], categoriesData: any[]) => {

    const favorites = servicesData.filter(service => service.isFavorite);
    setFavoriteServices(favorites);

    const groupedById: Record<string, { category: any; services: Service[] }> = {};

    categoriesData
      .filter((category: any) => category.hideCategory !== 'yes')
      .forEach((category: any) => {

        const categoryKey = `${category.category_name}_${category.id}`;
        groupedById[categoryKey] = {
          category: category,
          services: []
        };
      });

    servicesData.forEach((service: Service) => {
      const categoryId = service.category?.id;
      const categoryName = service.category?.category_name || 'Uncategorized';
      const categoryKey = categoryId ? `${categoryName}_${categoryId}` : 'Uncategorized_0';

      if (!groupedById[categoryKey]) {
        groupedById[categoryKey] = {
          category: service.category || { id: 0, category_name: 'Uncategorized', hideCategory: 'no', position: 999 },
          services: []
        };
      }
      groupedById[categoryKey].services.push(service);
    });

    const grouped: Record<string, Service[]> = {};
    Object.values(groupedById)
      .sort((a, b) => {

        const idDiff = (a.category.id || 999) - (b.category.id || 999);
        if (idDiff !== 0) return idDiff;

        return (a.category.position || 999) - (b.category.position || 999);
      })
      .forEach(({ category, services }) => {

        const displayName = `${category.category_name} (ID: ${category.id})`;
        grouped[displayName] = services;
      });

    setGroupedServices(grouped);

    const initialExpanded: Record<string, boolean> = {};
    Object.keys(grouped).forEach(categoryName => {
      initialExpanded[categoryName] = true;
    });

    setExpandedCategories(initialExpanded);
  }, []);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  useEffect(() => {
    fetchServices();
  }, [fetchServices, debouncedSearch, page, limit]);

  const handleLimitChange = (newLimit: string) => {
    setLimit(newLimit);
    setPage(1);
    setServices([]);
    setGroupedServices({});
    setHasMoreData(true);

    setTimeout(() => {
      fetchServices();
    }, 100);
  };

  const handlePrevious = () => {
    if (page > 1) {
      setPage(page - 1);
      setServices([]);
      setGroupedServices({});
      setHasMoreData(true);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
      setServices([]);
      setGroupedServices({});
    }
  };

  const handleViewDetails = (service: Service) => {
    setSelected(service);
    setIsOpen(true);
  };

  const toggleFavorite = async (serviceId: number) => {
    if (!user?.id) {
      showToast('You need to be logged in to favorite services', 'error');
      return;
    }

    try {

      const currentService = services.find(
        (service) => service.id === serviceId
      );
      if (!currentService) return;

      const response = await fetch('/api/user/services/servicefav', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          serviceId,
          userId: user.id,
          action: 'remove',
        }),
      });

      const data = await response.json();

      if (response.ok) {

        setServices((prevServices) =>
          prevServices.filter((service) => service.id !== serviceId)
        );

        setGroupedServices((prevGrouped) => {
          const newGrouped = { ...prevGrouped };
          Object.keys(newGrouped).forEach((categoryName) => {
            newGrouped[categoryName] = newGrouped[categoryName].filter(
              (service) => service.id !== serviceId
            );

            if (newGrouped[categoryName].length === 0) {
              delete newGrouped[categoryName];
            }
          });
          return newGrouped;
        });

        setFavoriteServices((prevFavorites) => {
          return prevFavorites.filter(service => service.id !== serviceId);
        });

        showToast(data.message || 'Service removed from favorites', 'success');
      } else {
        throw new Error(data.error || 'Failed to update favorite status');
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'An error occurred',
        'error'
      );
    }
  };

  if (loading && !debouncedSearch && page === 1) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="card card-padding">
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4 h-12">
                  <div className="h-12 w-40 gradient-shimmer rounded-lg" />
                </div>
                <div className="w-full md:w-100 h-12">
                  <div className="h-12 w-full gradient-shimmer rounded-lg" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)] rounded-t-lg">
                    {Array.from({ length: 11 }).map((_, idx) => (
                      <th key={idx} className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          <div className="h-4 w-20 gradient-shimmer rounded" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 3 }).map((_, catIdx) => (
                      <React.Fragment key={catIdx}>
                        <tr>
                          <td colSpan={11} className="p-0">
                            <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium py-4 px-6">
                              <div className="flex items-center justify-between">
                                <div className="h-6 w-64 gradient-shimmer rounded" />
                                <div className="h-4 w-4 gradient-shimmer rounded" />
                              </div>
                            </div>
                          </td>
                        </tr>
                        {Array.from({ length: 5 }).map((_, serviceIdx) => (
                          <tr key={serviceIdx} className="border-b border-gray-100 dark:border-gray-600">
                            <td className="py-3 px-4">
                              <div className="h-4 w-4 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-4 w-12 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-4 w-48 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-6 w-20 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-4 w-16 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-4 w-12 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-4 w-12 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-4 w-16 gradient-shimmer rounded" />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="h-6 w-12 gradient-shimmer rounded mx-auto" />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="h-6 w-12 gradient-shimmer rounded mx-auto" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="h-8 w-20 gradient-shimmer rounded" />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="h-5 w-48 gradient-shimmer rounded" />
                  <div className="h-5 w-32 gradient-shimmer rounded" />
                  <div className="h-5 w-32 gradient-shimmer rounded" />
                </div>
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
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2 h-12">
                <div className="relative">
                  <select
                    value={limit}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    className="form-field pl-4 pr-8 py-3 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm min-w-[160px] h-12"
                  >
                    {totalServices > 0 && (
                      <>
                        {totalServices >= 10 && <option value="10">10 per page</option>}
                        {totalServices >= 25 && <option value="25">25 per page</option>}
                        {totalServices >= 50 && <option value="50">50 per page</option>}
                        {totalServices >= 100 && <option value="100">100 per page</option>}
                        {totalServices >= 200 && <option value="200">200 per page</option>}
                        {totalServices >= 500 && <option value="500">500 per page</option>}
                        <option value="all">Show All</option>
                      </>
                    )}
                    {totalServices === 0 && (
                      <option value="50">No services found</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="w-full md:w-100 h-12 items-center">
                <div className="form-group mb-0 w-full">
                  <div className="relative flex items-center h-12">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FaSearch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <input
                      type="search"
                      placeholder="Search by ID, Service Name, Category..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="form-field w-full pl-10 pr-10 py-3 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm h-12"
                      autoComplete="off"
                    />
                    {isSearchLoading && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-10">
                        <div className="h-4 w-4 gradient-shimmer rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)] rounded-t-lg">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 first:rounded-tl-lg">
                    Fav
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Service
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Rate per 1000
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Min order
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Max order
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Average time
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Refill
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    Cancel
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100 last:rounded-tr-lg">
                    Action
                  </th>
                </tr>
              </thead>
                <tbody>
                  {isSearchLoading ? (
                    <>
                      {Array.from({ length: 3 }).map((_, catIdx) => (
                        <React.Fragment key={catIdx}>
                          <tr>
                            <td colSpan={11} className="p-0">
                              <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium py-4 px-6">
                                <div className="flex items-center justify-between">
                                  <div className="h-6 w-64 gradient-shimmer rounded" />
                                  <div className="h-4 w-4 gradient-shimmer rounded" />
                                </div>
                              </div>
                            </td>
                          </tr>
                          {Array.from({ length: 5 }).map((_, serviceIdx) => (
                            <tr key={serviceIdx} className="border-b border-gray-100 dark:border-gray-600">
                              <td className="py-3 px-4">
                                <div className="h-4 w-4 gradient-shimmer rounded" />
                              </td>
                              <td className="py-3 px-4">
                                <div className="h-4 w-12 gradient-shimmer rounded" />
                              </td>
                              <td className="py-3 px-4">
                                <div className="h-4 w-48 gradient-shimmer rounded" />
                              </td>
                              <td className="py-3 px-4">
                                <div className="h-6 w-20 gradient-shimmer rounded" />
                              </td>
                              <td className="py-3 px-4">
                                <div className="h-4 w-16 gradient-shimmer rounded" />
                              </td>
                              <td className="py-3 px-4">
                                <div className="h-4 w-12 gradient-shimmer rounded" />
                              </td>
                              <td className="py-3 px-4">
                                <div className="h-4 w-12 gradient-shimmer rounded" />
                              </td>
                              <td className="py-3 px-4">
                                <div className="h-4 w-16 gradient-shimmer rounded" />
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="h-6 w-12 gradient-shimmer rounded mx-auto" />
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="h-6 w-12 gradient-shimmer rounded mx-auto" />
                              </td>
                              <td className="py-3 px-4">
                                <div className="h-8 w-20 gradient-shimmer rounded" />
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </>
                  ) : Object.keys(groupedServices).length > 0 ? (
                    Object.entries(groupedServices).map(([categoryName, categoryServices]) => (
                      <React.Fragment key={categoryName}>
                        <tr>
                          <td colSpan={11} className="p-0">
                            <div
                              className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium py-4 px-6 cursor-pointer hover:from-[var(--primary)]/90 hover:to-[var(--secondary)]/90 transition-all duration-200"
                              onClick={() => toggleCategory(categoryName)}
                            >
                              <div className="flex items-center justify-between">
                                <h3 className="text-base md:text-lg font-semibold">
                                  {categoryName} ({categoryServices.length} services)
                                </h3>
                                <div className="flex items-center gap-2">
                                  {expandedCategories[categoryName] ? (
                                    <FaChevronUp className="w-4 h-4" />
                                  ) : (
                                    <FaChevronDown className="w-4 h-4" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {expandedCategories[categoryName] && categoryServices.length > 0 && (
                            categoryServices.map((service) => (
                              <tr
                                key={service.id}
                                className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/30 last:border-b-0"
                              >
                                <td className="py-3 px-4">
                                  <button
                                    onClick={() => toggleFavorite(service.id)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200"
                                    title="Remove from favorites"
                                  >
                                    <FaStar className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                                  </button>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                    {service.id}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-sm md:text-base font-medium text-gray-900 dark:text-white">
                                    {service.name}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-sm font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 w-fit">
                                    {service?.serviceType?.name || 'Standard'}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    <PriceDisplay
                                      amount={service.rate}
                                      originalCurrency={'USD'}
                                    />
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {formatNumber(service.min_order || 0)}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {formatNumber(service.max_order || 0)}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {service.avg_time || 'N/A'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-center gap-1">
                                      {service.refill ? (
                                        <>
                                          <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">ON</span>
                                        </>
                                      ) : (
                                        <>
                                          <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">OFF</span>
                                        </>
                                      )}
                                    </div>
                                    {service.refill && (
                                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                                        {service.refillDays && (
                                          <div>Days: {service.refillDays}</div>
                                        )}
                                        {service.refillDisplay && (
                                          <div>Hours: {service.refillDisplay}</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {service.cancel ? (
                                      <>
                                        <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">ON</span>
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">OFF</span>
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    onClick={() => handleViewDetails(service)}
                                    className="flex items-center gap-2 px-3 py-1 text-sm text-[var(--primary)] dark:text-[var(--secondary)] hover:text-[#4F0FD8] dark:hover:text-[#A121E8] border border-[var(--primary)] dark:border-[var(--secondary)] rounded hover:bg-[var(--primary)]/10 dark:hover:bg-[var(--secondary)]/10 transition-colors duration-200"
                                  >
                                    <FaEye className="w-3 h-3" />
                                    Details
                                  </button>
                                </td>
                              </tr>
                            ))
                        )}
                          {expandedCategories[categoryName] && categoryServices.length === 0 && (
                            <tr>
                              <td colSpan={11} className="py-8 text-center">
                                <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                  <FaClipboardList className="text-2xl md:text-4xl mb-2 dark:text-gray-500" />
                                  <p className="text-sm font-medium dark:text-gray-300">No services found!</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="py-8 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <FaClipboardList className="text-2xl md:text-4xl mb-2" />
                            <div className="text-base md:text-lg font-medium text-gray-900 dark:text-white">
                              No favorite services found!
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Try adjusting your search criteria or add some services to favorites
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page <span className="font-medium">{page}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
                {' '}({Object.keys(groupedServices).length} categories shown)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={page === 1 || loading}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={page === totalPages || loading}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {isOpen && selected && (
        <ServiceViewModal
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          service={selected}
        />
      )}
    </div>
  );
};

export default FavoriteServicesTable;
