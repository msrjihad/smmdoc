'use client';

import React, { Fragment, useEffect, useState } from 'react';
import {
  FaCheckCircle,
  FaClipboardList,
  FaEye,
  FaRegStar,
  FaSearch,
  FaStar,
  FaTimes,
} from 'react-icons/fa';

import { PriceDisplay } from '@/components/price-display';
import { useCurrentUser } from '@/hooks/use-current-user';
import ServiceViewModal from '@/app/(protected)/services/serviceViewModal';

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white"></div>
    </div>
  </div>
);

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
        ? 'bg-green-50 border-green-200 text-green-800'
        : type === 'error'
        ? 'bg-red-50 border-red-200 text-red-800'
        : type === 'info'
        ? 'bg-blue-50 border-blue-200 text-blue-800'
        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }`}
  >
    <div className="flex items-center space-x-2">
      {type === 'success' && <FaCheckCircle className="w-4 h-4" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-black/10 rounded">
        <FaTimes className="w-3 h-3" />
      </button>
    </div>
  </div>
);

interface Service {
  id: number;
  name: string;
  rate: number;
  min_order: number | string;
  max_order: number | string;
  avg_time: string;
  description: string;
  category: {
    category_name: string;
    id: number;
  };
  isFavorite?: boolean;
}

const ServicesTable: React.FC = () => {
  const user = useCurrentUser();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [groupedServices, setGroupedServices] = useState<
    Record<string, Service[]>
  >({});

  const ensureGroupedServicesIsValid = (grouped: Record<string, Service[]>) => {
    const valid: Record<string, Service[]> = {};
    Object.entries(grouped).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        valid[key] = value;
      }
    });
    return valid;
  };
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const [limit, setLimit] = useState('10');
  const [isShowAll, setIsShowAll] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Service | null>(null);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearch('');
      e.currentTarget.blur();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {

        const response = await fetch(
          `/api/user/services?page=${page}&limit=${limit}&search=${debouncedSearch}`,
          {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch services: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || !data.data) {
          console.error('Invalid response data:', data);
          throw new Error('Invalid response format');
        }

        if (!user?.id) {
          const servicesData =
            data?.data?.map((service: Service) => ({
              ...service,
              isFavorite: false,
            })) || [];

          setServices(servicesData);

          const grouped = servicesData.reduce(
            (acc: Record<string, Service[]>, service: Service) => {
              const categoryName =
                service.category?.category_name || 'Uncategorized';
              if (!acc[categoryName]) {
                acc[categoryName] = [];
              }
              acc[categoryName].push(service);
              return acc;
            },
          );
          setGroupedServices(ensureGroupedServicesIsValid(grouped));
          setTotalPages(data.totalPages || 1);
          return;
        }

        try {

          const favResponse = await fetch(
            `/api/user/services/favorite-status?userId=${user.id}`,
            {
              method: 'GET',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
              },
            }
          );

          if (!favResponse.ok) {
            throw new Error(
              `Failed to fetch favorites: ${favResponse.statusText}`
            );
          }

          const favData = await favResponse.json();
          const favoriteServiceIds = favData.favoriteServiceIds || [];

          const servicesWithFavorites =
            data?.data?.map((service: Service) => ({
              ...service,
              isFavorite: favoriteServiceIds.includes(service.id),
            })) || [];

          setServices(servicesWithFavorites);

          const grouped = servicesWithFavorites.reduce(
            (acc: Record<string, Service[]>, service: Service) => {
              const categoryName =
                service.category?.category_name || 'Uncategorized';
              if (!acc[categoryName]) {
                acc[categoryName] = [];
              }
              acc[categoryName].push(service);
              return acc;
            },
          );
          setGroupedServices(ensureGroupedServicesIsValid(grouped));
        } catch (favError) {
          console.error('Error fetching favorites:', favError);

          const servicesData =
            data?.data?.map((service: Service) => ({
              ...service,
              isFavorite: false,
            })) || [];

          setServices(servicesData);

          const grouped = servicesData.reduce(
            (acc: Record<string, Service[]>, service: Service) => {
              const categoryName =
                service.category?.category_name || 'Uncategorized';
              if (!acc[categoryName]) {
                acc[categoryName] = [];
              }
              acc[categoryName].push(service);
              return acc;
            },
          );
          setGroupedServices(ensureGroupedServicesIsValid(grouped));
        }

        setTotalPages(data.totalPages || 1);
        setIsShowAll(data.isShowAll || false);

        if (data.allCategories && data.allCategories.length > 0) {
          const servicesData = data?.data || [];

          const grouped = servicesData.reduce(
            (acc: Record<string, Service[]>, service: Service) => {
              const categoryName =
                service.category?.category_name || 'Uncategorized';
              if (!acc[categoryName]) {
                acc[categoryName] = [];
              }
              acc[categoryName].push(service);
              return acc;
            },
          );

          data.allCategories.forEach((category: any) => {
            if (!grouped[category.category_name]) {
              grouped[category.category_name] = [];
            }
          });

          setGroupedServices(ensureGroupedServicesIsValid(grouped));
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        showToast(`Error fetching services: ${errorMessage}`, 'error');
        setServices([]);
        setGroupedServices({});
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [page, debouncedSearch, user?.id, limit]);

  const handlePrevious = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
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
          action: currentService.isFavorite ? 'remove' : 'add',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setServices((prevServices) =>
          prevServices.map((service) =>
            service.id === serviceId
              ? { ...service, isFavorite: !service.isFavorite }
              : service
          )
        );

        setGroupedServices((prevGrouped) => {
          const newGrouped = { ...prevGrouped };
          Object.keys(newGrouped).forEach((categoryName) => {
            newGrouped[categoryName] = newGrouped[categoryName].map((service) =>
              service.id === serviceId
                ? { ...service, isFavorite: !service.isFavorite }
                : service
            );
          });
          return newGrouped;
        });

        showToast(data.message, 'success');
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

  if (loading && !search) {
    return (
      <div className="card card-padding">
        <div className="text-center py-8 flex flex-col items-center">
          <GradientSpinner size="w-14 h-14" className="mb-4" />
          <div className="text-lg font-medium">Loading services...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-padding">
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FaSearch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <input
            id="service-search"
            type="search"
            placeholder="Search by service title or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            autoComplete="off"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              title="Clear search"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          )}
        </div>
        {search && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-[var(--primary)] rounded-full animate-spin"></div>
                Searching...
              </div>
            ) : (
              <div>
                {services.length > 0 ? (
                  <>
                    Found <span className="font-medium text-[var(--primary)] dark:text-[var(--secondary)]">{services.length}</span> service{services.length !== 1 ? 's' : ''} matching "{search}"
                  </>
                ) : (
                  <>
                    No services found matching "{search}". Try different keywords or{' '}
                    <button
                      onClick={() => setSearch('')}
                      className="text-[var(--primary)] dark:text-[var(--secondary)] hover:underline font-medium"
                    >
                      clear search
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {Object.keys(groupedServices).length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 rounded-t-lg">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 first:rounded-tl-lg">
                    Fav
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Service
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Rate per 1000
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Min order
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Max order
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Average time
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 last:rounded-tr-lg">
                    Action
                  </th>
                </tr>
              </thead>
            <tbody>
              {Object.entries(groupedServices)
                .filter(([_, categoryServices]) => Array.isArray(categoryServices) && categoryServices.length > 0)
                .map(
                ([categoryName, categoryServices]) => (
                  <Fragment key={categoryName}>
                    <tr>
                      <td colSpan={8} className="py-0">
                        <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium py-3 px-6 shadow-lg">
                          <h3 className="text-lg font-semibold">
                            {categoryName}
                          </h3>
                        </div>
                      </td>
                    </tr>
                    {Array.isArray(categoryServices) && categoryServices.map((service, index) => {
                      const isLastInCategory =
                        index === categoryServices.length - 1;
                      const isLastCategory =
                        Object.keys(groupedServices).indexOf(categoryName) ===
                        Object.keys(groupedServices).length - 1;
                      const isLastRow = isLastInCategory && isLastCategory;

                      return (
                        <tr
                          key={service.id}
                          className={`border-b border-gray-200 hover:bg-gray-50 ${
                            isLastRow ? 'last:border-b-0' : ''
                          }`}
                        >
                          <td
                            className={`py-3 px-4 ${
                              isLastRow ? 'first:rounded-bl-lg' : ''
                            }`}
                          >
                            <button
                              onClick={() => toggleFavorite(service.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                              title={
                                service.isFavorite
                                  ? 'Remove from favorites'
                                  : 'Add to favorites'
                              }
                            >
                              {service.isFavorite ? (
                                <FaStar className="w-4 h-4 text-yellow-500" />
                              ) : (
                                <FaRegStar className="w-4 h-4 text-gray-400 hover:text-yellow-500" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm font-mono text-gray-700">
                              {service.id}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {service.name}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm font-medium text-gray-900">
                              <PriceDisplay
                                amount={service.rate}
                                originalCurrency={'USD'}
                              />
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-700">
                              {typeof service.min_order === 'string' ? service.min_order : (service.min_order || 0).toString()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-700">
                              {typeof service.max_order === 'string' ? service.max_order : (service.max_order || 0).toString()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-700">
                              {service.avg_time || 'N/A'}
                            </span>
                          </td>
                          <td
                            className={`py-3 px-4 ${
                              isLastRow ? 'last:rounded-br-lg' : ''
                            }`}
                          >
                            <button 
                              onClick={() => handleViewDetails(service)}
                              className="flex items-center gap-2 px-3 py-1 text-sm text-[var(--primary)] hover:text-[#4F0FD8] border border-[var(--primary)] rounded hover:bg-[var(--primary)]/10 transition-colors duration-200"
                            >
                              <FaEye className="w-3 h-3" />
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <FaClipboardList className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {search ? 'No services found' : 'No services available'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {search 
              ? `No services match your search "${search}". Try different keywords.`
              : 'There are no services available at the moment.'
            }
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-4 px-4 py-2 text-[var(--primary)] dark:text-[var(--secondary)] hover:text-[#4F0FD8] dark:hover:text-[#A121E8] border border-[var(--primary)] dark:border-[var(--secondary)] rounded-lg hover:bg-[var(--primary)]/10 dark:hover:bg-[var(--secondary)]/10 transition-colors duration-200"
            >
              Clear search
            </button>
          )}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Page <span className="font-medium">{page}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
            {services.length > 0 && (
              <span className="ml-2">
                ({services.length} services)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              title="First page"
            >
              ««
            </button>
            <button
              onClick={handlePrevious}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {(() => {
                const pageNumbers = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                if (endPage - startPage < maxVisiblePages - 1) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }

                if (startPage > 1) {
                  pageNumbers.push(
                    <button
                      key={1}
                      onClick={() => setPage(1)}
                      className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                      1
                    </button>
                  );
                  if (startPage > 2) {
                    pageNumbers.push(
                      <span key="ellipsis1" className="px-2 text-gray-500">...</span>
                    );
                  }
                }

                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`px-3 py-2 text-sm rounded transition-colors duration-200 ${
                        i === page
                          ? 'bg-[var(--primary)] dark:bg-[var(--secondary)] text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {i}
                    </button>
                  );
                }

                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pageNumbers.push(
                      <span key="ellipsis2" className="px-2 text-gray-500">...</span>
                    );
                  }
                  pageNumbers.push(
                    <button
                      key={totalPages}
                      onClick={() => setPage(totalPages)}
                      className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pageNumbers;
              })()}
            </div>
            <button
              onClick={handleNext}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              title="Last page"
            >
              »»
            </button>
          </div>
        </div>
      )}
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

const Services: React.FC = () => {
  return (
    <section className="pt-[30px] lg:pt-[60px] pb-[120px] lg:pb-[120px] transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
            Our Services & Pricing
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto transition-colors duration-200">
            Browse our comprehensive list of social media services with
            transparent pricing.
          </p>
        </div>
        <ServicesTable />
      </div>
    </section>
  );
};

export default Services;