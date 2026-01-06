
'use client';

import React, { useEffect, useState } from 'react';
import {
  FaCheckCircle,
  FaSearch,
  FaTimes
} from 'react-icons/fa';

import ServiceDetailsModal from '@/components/dashboard/services/modals/service-details';
import ServicesTable from '@/components/dashboard/services/services-table';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';

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
      .filter(({ services }) => services.length > 0)
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
            <ServicesTable
              groupedServices={{}}
              expandedCategories={{}}
              isSearchLoading={true}
              onToggleCategory={() => {}}
              onToggleFavorite={() => {}}
              onViewDetails={() => {}}
              totalPages={1}
              page={1}
              loading={true}
              onPrevious={() => {}}
              onNext={() => {}}
            />
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
          <ServicesTable
            groupedServices={groupedServices}
            expandedCategories={expandedCategories}
            isSearchLoading={isSearchLoading}
            onToggleCategory={toggleCategory}
            onToggleFavorite={toggleFavorite}
            onViewDetails={handleViewDetails}
            totalPages={totalPages}
            page={page}
            loading={loading}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        </div>
      </div>
      {isOpen && selected && (
        <ServiceDetailsModal
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          service={selected}
        />
      )}
    </div>
  );
};

export default FavoriteServicesTable;
