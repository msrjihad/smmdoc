
'use client';

import { useCurrency } from '@/contexts/currency-context';
import { useGetCategories } from '@/hooks/categories-fetch';
import { useCurrentUser } from '@/hooks/use-current-user';
import axiosInstance from '@/lib/axios-instance';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import {
    dashboardApi,
    useGetUserStatsQuery,
} from '@/lib/services/dashboard-api';
import { userOrderApi } from '@/lib/services/user-order-api';
import { ServiceTypeFields } from '@/components/service-type-fields';
import { validateOrderByType, getServiceTypeConfig, ServiceTypeConfig } from '@/lib/service-types';
import { PriceDisplay } from '@/components/price-display';
import { convertCurrency, formatCurrencyAmount } from '@/lib/currency-utils';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
    FaBuffer,
    FaCheck,
    FaCheckCircle,
    FaClock,
    FaDiscord,
    FaFacebook,
    FaFilter,
    FaGlobe,
    FaInfoCircle,
    FaInstagram,
    FaLayerGroup,
    FaLink,
    FaLinkedin,
    FaRedo,
    FaSearch,
    FaShieldAlt,
    FaShoppingCart,
    FaSpotify,
    FaTachometerAlt,
    FaTelegram,
    FaTiktok,
    FaTimes,
    FaTwitter,
    FaYoutube
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';

const toNumber = (value: number | bigint | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'bigint') {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? 0 : num;
};

const toString = (value: number | bigint | string | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  if (typeof value === 'bigint') return value.toString();
  return String(value);
};

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string | { message?: string } | unknown;
  type?: 'success' | 'error' | 'info' | 'pending';
  onClose: () => void;
}) => {
  const displayMessage = typeof message === 'string' 
    ? message 
    : (typeof message === 'object' && message !== null && 'message' in message && typeof message.message === 'string'
      ? message.message
      : JSON.stringify(message) || 'An error occurred');
  
  return (
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
        <span className="font-medium">{displayMessage}</span>
        <button onClick={onClose} className="ml-2 p-1 hover:bg-black/10 rounded">
          <FaTimes className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const ServiceDetailsCard = ({
  selectedService,
  services,
  servicesData,
  isLoading = false,
}: {
  selectedService: string;
  services: any[];
  servicesData?: any[];
  isLoading?: boolean;
}) => {
  const selected = services?.find((s) => s.id === parseInt(selectedService) || s.id === selectedService) 
    || servicesData?.find((s) => s.id === parseInt(selectedService) || s.id === selectedService);

  if (isLoading) {
    return (
      <div className="card card-padding">
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            color: 'white',
            padding: '24px',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-16 gradient-shimmer rounded-full" />
          </div>
          <div className="h-6 w-64 gradient-shimmer rounded mb-2" />
          <div className="h-4 w-full gradient-shimmer rounded" />
        </div>
        <div className="card card-padding">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx}>
                <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                <div className="flex items-center">
                  <div className="h-8 w-8 gradient-shimmer rounded-full mr-3" />
                  <div className="h-4 w-20 gradient-shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
            <div className="h-24 w-full gradient-shimmer rounded-lg" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="h-6 w-12 gradient-shimmer rounded mx-auto mb-2" />
              <div className="h-3 w-16 gradient-shimmer rounded mx-auto" />
            </div>
            <div className="text-center">
              <div className="h-6 w-12 gradient-shimmer rounded mx-auto mb-2" />
              <div className="h-3 w-16 gradient-shimmer rounded mx-auto" />
            </div>
            <div className="text-center">
              <div className="h-6 w-16 gradient-shimmer rounded mx-auto mb-2" />
              <div className="h-3 w-20 gradient-shimmer rounded mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="card card-padding">
        <div className="text-center py-8">
          <FaInfoCircle className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-500">Select a service to view details</p>
        </div>
      </div>
    );
  }

  function decodeHTML(html: string) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  return (
    <div className="space-y-6">
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
          color: 'white',
          padding: '24px',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
            {selected.id}
          </div>
        </div>
        <h3 className="text-lg font-bold leading-tight">{selected.name}</h3>
        <div className="text-sm opacity-90 mt-2">
          Max {toString(selected.max_order) || 'N/A'} ~ NO REFILL ~{' '}
          {selected.avg_time || 'N/A'} ~ INSTANT - <PriceDisplay amount={selected.rate || 0} originalCurrency="USD" />{' '}
          per 1000
        </div>
      </div>
      <div className="card card-padding">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Example Link</h4>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                selected.exampleLink ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                <FaLink className={`text-sm ${
                  selected.exampleLink ? 'text-blue-600' : 'text-red-600'
                }`} />
              </div>
              {selected.exampleLink ? (
                <a
                  href={selected.exampleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline truncate max-w-48"
                  title={selected.exampleLink}
                >
                  {selected.exampleLink}
                </a>
              ) : (
                <span className="text-sm dark:text-gray-300">-</span>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Speed</h4>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                !selected.serviceSpeed ? 'bg-gray-100' :
                selected.serviceSpeed === 'slow' ? 'bg-red-100' :
                selected.serviceSpeed === 'sometimes_slow' ? 'bg-orange-100' :
                selected.serviceSpeed === 'normal' || selected.serviceSpeed === 'medium' ? 'bg-yellow-100' :
                selected.serviceSpeed === 'fast' ? 'bg-green-100' :
                'bg-gray-100'
              }`}>
                <FaTachometerAlt className={`text-sm ${
                  !selected.serviceSpeed ? 'text-gray-600 dark:text-gray-400' :
                  selected.serviceSpeed === 'slow' ? 'text-red-600 dark:text-red-400' :
                  selected.serviceSpeed === 'sometimes_slow' ? 'text-orange-600 dark:text-orange-400' :
                  selected.serviceSpeed === 'normal' || selected.serviceSpeed === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                  selected.serviceSpeed === 'fast' ? 'text-green-600 dark:text-green-400' :
                  'text-gray-600 dark:text-gray-400'
                }`} />
              </div>
              <span className={`text-sm font-medium ${
                !selected.serviceSpeed ? 'text-gray-600 dark:text-gray-400' :
                selected.serviceSpeed === 'slow' ? 'text-red-600 dark:text-red-400' :
                selected.serviceSpeed === 'sometimes_slow' ? 'text-orange-600 dark:text-orange-400' :
                selected.serviceSpeed === 'normal' || selected.serviceSpeed === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                selected.serviceSpeed === 'fast' ? 'text-green-600 dark:text-green-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {(() => {
                  if (!selected.serviceSpeed) return '-';

                  const speedMapping: { [key: string]: string } = {
                    'slow': 'Slow',
                    'sometimes_slow': 'Sometimes Slow',
                    'normal': 'Normal',
                    'medium': 'Normal',
                    'fast': 'Fast'
                  };

                  return speedMapping[selected.serviceSpeed] || '-';
                })()}
              </span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Start Time</h4>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <FaClock className="text-blue-600 text-sm" />
              </div>
              <span className="text-sm dark:text-gray-300">Instant</span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Refill</h4>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                selected.refill ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <FaRedo className={`text-sm ${
                  selected.refill ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <span className={`text-sm font-medium ${
                selected.refill ? 'text-green-600' : 'text-red-600'
              }`}>
                {selected.refill ? 'Available' : 'Not Available'}
              </span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Cancel</h4>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                selected.cancel ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <FaTimes className={`text-sm ${
                  selected.cancel ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <span className={`text-sm font-medium ${
                selected.cancel ? 'text-green-600' : 'text-red-600'
              }`}>
                {selected.cancel ? 'Available' : 'Not Available'}
              </span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Average Time</h4>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <FaClock className="text-blue-600 text-sm" />
              </div>
              <span className="text-sm dark:text-gray-300">
                {selected.avg_time || 'Not enough data'}
              </span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Guarantee</h4>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                selected.refill ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <FaShieldAlt className={`text-sm ${
                  selected.refill ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              {selected.refill ? (
                <span className="text-sm text-green-600 flex items-center">
                  <FaCheck className="text-green-600 text-xs mr-1" />
                  {selected.refillDays === null || selected.refillDays === undefined || selected.refillDays === 0 ? (
                    'Lifetime'
                  ) : (
                    <>
                      {selected.refillDays} {selected.refillDays === 1 ? 'day' : 'days'}
                      {selected.refillDisplay && selected.refillDisplay > 0 && (
                        <span className="ml-1">({selected.refillDisplay} {selected.refillDisplay === 1 ? 'hour' : 'hours'})</span>
                      )}
                    </>
                  )}
                </span>
              ) : (
                <span className="text-sm text-red-600">
                  <FaTimes className="text-red-600 text-xs" />
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">More Details</h4>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div
              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: decodeHTML(
                  selected.description || 'No additional details available.'
                ),
              }}
            />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {toString(selected.min_order) || '0'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Min Order</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {toString(selected.max_order) || '0'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Max Order</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              <PriceDisplay amount={selected.rate || 0} originalCurrency="USD" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Per 1000</div>
          </div>
        </div>
      </div>
    </div>
  );
};

function NewOrder() {
  const user = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { data: userStatsResponse, refetch: refetchUserStats } =
    useGetUserStatsQuery(undefined);
  const serviceIdFromUrl =
    searchParams?.get('sId') || searchParams?.get('serviceId');
  const categoryIdFromUrl = searchParams?.get('categoryId');
  const platformFromUrl = searchParams?.get('platform');
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const [massOrderEnabled, setMassOrderEnabled] = useState<boolean | null>(null);

  const {
    data: category,
    error: categoryError,
    isLoading: categoryLoading,
  } = useGetCategories();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [qty, setQty] = useState(0);
  const [link, setLink] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');

  const [favoriteCategories, setFavoriteCategories] = useState<any[]>([]);
  const [combinedCategories, setCombinedCategories] = useState<any[]>([]);
  const [categoriesWithServices, setCategoriesWithServices] = useState<any[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [isServiceDetailsLoading, setIsServiceDetailsLoading] = useState(false);

  const [serviceTypeFields, setServiceTypeFields] = useState({
    comments: '',
    username: '',
    posts: undefined as number | undefined,
    delay: undefined as number | undefined,
    minQty: undefined as number | undefined,
    maxQty: undefined as number | undefined,
    isDripfeed: false,
    dripfeedRuns: undefined as number | undefined,
    dripfeedInterval: undefined as number | undefined,
    isSubscription: false,
  });
  const [serviceTypeErrors, setServiceTypeErrors] = useState<Record<string, string>>({});

  const showToast = (
    message: string | any,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    const messageString = typeof message === 'string' 
      ? message 
      : (message?.message || message?.error || JSON.stringify(message) || 'An error occurred');
    setToastMessage({ message: messageString, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleServiceTypeFieldChange = (field: string, value: any) => {
    setServiceTypeFields(prev => ({
      ...prev,
      [field]: value
    }));

    if (serviceTypeErrors[field]) {
      setServiceTypeErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const resetServiceTypeFields = () => {
    setServiceTypeFields({
      comments: '',
      username: '',
      posts: undefined,
      delay: undefined,
      minQty: undefined,
      maxQty: undefined,
      isDripfeed: false,
      dripfeedRuns: undefined,
      dripfeedInterval: undefined,
      isSubscription: false,
    });
    setServiceTypeErrors({});
  };

  const selected = services?.find((s) => s.id === parseInt(selectedService) || s.id === selectedService);
  const perQty = Number(selected?.perqty) || 1;
  const price = Number(selected?.rate) || 0;

  const { currency, availableCurrencies, currentCurrencyData, currencySettings } = useCurrency();

  let totalPrice = 0;
  const baseUsdPrice = (price * qty) / 1000;

  if (currency === 'USD') {
    totalPrice = baseUsdPrice;
  } else if (currency === 'BDT') {

    const bdtCurrency = availableCurrencies?.find(c => c.code === 'BDT');
    const usdToBdtRate = bdtCurrency?.rate || 121;
    totalPrice = baseUsdPrice * usdToBdtRate;
  } else {

    const targetCurrency = availableCurrencies?.find(c => c.code === currency);
    const conversionRate = targetCurrency?.rate || 1;
    totalPrice = baseUsdPrice * conversionRate;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFormLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkMassOrderStatus = async () => {
      try {
        const response = await axiosInstance.get('/api/mass-order-system-status');
        if (response.data.success) {
          setMassOrderEnabled(response.data.massOrderEnabled ?? false);
        } else {
          setMassOrderEnabled(false);
        }
      } catch (error) {
        console.error('Error checking mass order status:', error);
        setMassOrderEnabled(false);
      }
    };
    checkMassOrderStatus();
  }, []);

  useEffect(() => {
    if (user?.id) {
      axiosInstance
        .get(`/api/user/services/favorites?userId=${user.id}`)
        .then((res) => {
          setFavoriteCategories(res?.data?.data || []);
        })
        .catch((error) => {
          console.error('Error fetching favorite categories:', error);
          showToast('Error fetching favorite categories', 'error');
        });
    }
  }, [user?.id]);

  useEffect(() => {
    const checkFavoriteCategories = async () => {
      const checkedFavorites = await Promise.all(
        favoriteCategories.map(async (favCat) => {
          try {
            const res = await axios.post('/api/user/services/favserviceById', {
              favrouteCatId: favCat.id,
            });
            return {
              ...favCat,
              hasServices: res?.data?.data?.length > 0,
            };
          } catch (error) {
            return {
              ...favCat,
              hasServices: false,
            };
          }
        })
      );
      return checkedFavorites.filter((fav) => fav.hasServices);
    };

    if (favoriteCategories.length > 0) {
      checkFavoriteCategories().then((validFavorites) => {
        if (category?.data) {
          let combined = [
            ...validFavorites.map((favCat) => ({
              ...favCat,
              isFavorite: true,
              category_name: `⭐ ${favCat.name}`,
            })),

            ...category.data.map((regCat: any) => ({
              ...regCat,
              isFavorite: false,
            })),
          ];

          if (platformFromUrl && platformFromUrl !== 'Everything') {
            combined = combined
              .filter((cat) =>
                platformFromUrl === 'Others'
                  ? ![
                      'Instagram',
                      'Facebook',
                      'YouTube',
                      'TikTok',
                      'Twitter',
                      'Telegram',
                      'Spotify',
                      'LinkedIn',
                      'Discord',
                      'Website',
                    ].some((keyword) =>
                      cat.category_name
                        .toLowerCase()
                        .includes(keyword.toLowerCase())
                    )
                  : cat.category_name
                      .toLowerCase()
                      .includes(platformFromUrl.toLowerCase())
              )
              .sort((a, b) => {
                const aMatch = a.category_name
                  .toLowerCase()
                  .includes(platformFromUrl.toLowerCase())
                  ? -1
                  : 1;
                const bMatch = b.category_name
                  .toLowerCase()
                  .includes(platformFromUrl.toLowerCase())
                  ? -1
                  : 1;
                return aMatch - bMatch;
              });
          }

          setCombinedCategories(combined);
          setCategoriesWithServices(combined);

          if (!selectedCategory && combined.length > 0) {
            setSelectedCategory(combined[0].id);
          }
        }
      });
    } else if (category?.data) {
      let regularCategories = category.data.map((regCat: any) => ({
        ...regCat,
        isFavorite: false,
      }));

      if (platformFromUrl && platformFromUrl !== 'Everything') {
        regularCategories = regularCategories
          .filter((cat: any) =>
            platformFromUrl === 'Others'
              ? ![
                  'Instagram',
                  'Facebook',
                  'YouTube',
                  'TikTok',
                  'Twitter',
                  'Telegram',
                  'Spotify',
                  'LinkedIn',
                  'Discord',
                  'Website',
                ].some((keyword) =>
                  cat.category_name
                    .toLowerCase()
                    .includes(keyword.toLowerCase())
                )
              : cat.category_name
                  .toLowerCase()
                  .includes(platformFromUrl.toLowerCase())
          )
          .sort((a: any, b: any) => {
            const aMatch = a.category_name
              .toLowerCase()
              .includes(platformFromUrl.toLowerCase())
              ? -1
              : 1;
            const bMatch = b.category_name
              .toLowerCase()
              .includes(platformFromUrl.toLowerCase())
              ? -1
              : 1;
            return aMatch - bMatch;
          });
      }

      setCombinedCategories(regularCategories);
      setCategoriesWithServices(regularCategories);

      if (!selectedCategory && regularCategories.length > 0) {
        setSelectedCategory(regularCategories[0].id);
      }
    }
  }, [category, favoriteCategories, platformFromUrl, selectedCategory]);

  useEffect(() => {
    if (!selectedCategory) return;

    console.log('Selected category changed:', selectedCategory);
    setIsServiceDetailsLoading(true);
    
    const currentSelectedService = selectedService;
    setServices([]);

    axios
      .post('/api/admin/services/catId-by-services', {
        categoryId: parseInt(selectedCategory),
      })
      .then((res) => {
        const fetchedServices = res?.data?.data || [];
        console.log('Fetched services for category', selectedCategory, ':', fetchedServices);
        setServices(fetchedServices);
        
        const serviceExists = fetchedServices.some((s: any) => 
          String(s.id) === String(currentSelectedService) || s.id === parseInt(String(currentSelectedService))
        );
        
        if (serviceExists) {
          setSelectedService(String(currentSelectedService));
          console.log('Preserved selected service:', currentSelectedService);
        } else if (fetchedServices?.length > 0) {
          setSelectedService(String(fetchedServices[0]?.id));
          console.log('Auto-selected service:', fetchedServices[0]?.id);
          resetServiceTypeFields();
        } else {
          setSelectedService('');
          console.log('No services found for category:', selectedCategory);
          resetServiceTypeFields();
        }
      })
      .catch((error) => {
        console.error('Error fetching services:', error);
        showToast('Error fetching services', 'error');
        setServices([]);
        if (!currentSelectedService) {
          setSelectedService('');
        }
      })
      .finally(() => {
        setIsServiceDetailsLoading(false);
      });
  }, [selectedCategory]);

  useEffect(() => {
    if (
      categoryIdFromUrl &&
      combinedCategories.length > 0 &&
      !selectedCategory
    ) {
      const categoryExists = combinedCategories.find(
        (cat: any) => cat.id === categoryIdFromUrl
      );
      if (categoryExists) {
        setSelectedCategory(categoryIdFromUrl);
      }
    }
  }, [categoryIdFromUrl, combinedCategories, selectedCategory]);

  useEffect(() => {
    if (serviceIdFromUrl && !selectedService && category?.data) {
      const allServices = category?.data?.flatMap(
        (cat: any) => cat.services || []
      );
      const serviceFromUrl = allServices.find(
        (s: any) => s.id === serviceIdFromUrl
      );

      if (serviceFromUrl) {
        setSelectedCategory(serviceFromUrl.categoryId);
        setSelectedService(serviceIdFromUrl);
        setSearch(serviceFromUrl.name);
      } else {
        fetchServiceById(serviceIdFromUrl);
      }
    }
  }, [serviceIdFromUrl, category]);

  const fetchServiceById = async (serviceId: string) => {
    try {
      const res = await axiosInstance.get(
        `/api/user/services/serviceById?svId=${serviceId}`
      );
      const service = res?.data?.data;
      if (service) {
        setSelectedCategory(service.categoryId);
        setSelectedService(service.id);
        setSearch(service.name);
      }
    } catch (error) {
      showToast('Error fetching service details', 'error');
    }
  };

  async function getServices() {
    try {
      setIsSearchLoading(true);
      const res = await axiosInstance.get(
        `/api/user/services/neworderservice?search=${encodeURIComponent(search)}`
      );
      let fetchedServices = res?.data?.data || [];

      if (platformFromUrl && platformFromUrl !== 'Everything') {
        fetchedServices = fetchedServices.filter((service: any) => {
          const serviceCategory = combinedCategories.find(
            (cat) => cat.id === service.categoryId
          );
          if (!serviceCategory) return false;
          if (platformFromUrl === 'Others') {
            return ![
              'Instagram',
              'Facebook',
              'YouTube',
              'TikTok',
              'Twitter',
              'Telegram',
              'Spotify',
              'LinkedIn',
              'Discord',
              'Website',
            ].some((keyword) =>
              serviceCategory.category_name
                .toLowerCase()
                .includes(keyword.toLowerCase())
            );
          }
          return serviceCategory.category_name
            .toLowerCase()
            .includes(platformFromUrl.toLowerCase());
        });
      }

      setServicesData(fetchedServices);
    } catch (error) {
      showToast('Error fetching services', 'error');
    } finally {
      setIsSearchLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim()) {
        getServices();
      } else {
        setServicesData([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, platformFromUrl]);

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

  function decodeHTML(html: string) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  const userData = useSelector((state: any) => state.userDetails);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedService) {
      showToast('Please select a service', 'error');
      return;
    }

    if (selected?.orderLink === 'username') {
      if (!link || link.trim().length === 0) {
        showToast('Please enter a valid username', 'error');
        return;
      }
    } else {
      if (!link || !link.startsWith('http')) {
        showToast(
          'Please enter a valid link starting with http or https',
          'error'
        );
        return;
      }
    }

    if (qty < 1) {
      showToast('Please enter a valid quantity', 'error');
      return;
    }

    const minOrder = toNumber(selected?.min_order);
    const maxOrder = toNumber(selected?.max_order);

    if (qty < minOrder) {
      showToast(`Minimum order quantity is ${toString(selected?.min_order) || '0'}`, 'error');
      return;
    }

    if (qty > maxOrder) {
      showToast(`Maximum order quantity is ${toString(selected?.max_order) || '0'}`, 'error');
      return;
    }

    const userBalanceAmount =
      userStatsResponse?.data?.balance ||
      (userData as any)?.balance ||
      (user as any)?.balance ||
      0;
    const finalTotalPrice = parseFloat(totalPrice.toFixed(4));

    if (userBalanceAmount < finalTotalPrice) {
      showToast(
        `Insufficient balance to create this order. Available: ${userBalanceAmount.toFixed(
          2
        )}, Required: ${finalTotalPrice.toFixed(2)}`,
        'error'
      );
      return;
    }

    const serviceTypeId = selected?.packageType || 1;
    const typeConfig = getServiceTypeConfig(serviceTypeId);
    const validationData = {
      link,
      qty,
      ...serviceTypeFields
    };

    const errors = typeConfig 
      ? validateOrderByType(serviceTypeId, validationData) 
      : { general: 'Unsupported or unknown service type' };

    if (errors && Object.keys(errors).length > 0) {
      const fieldErrors: Record<string, string> = {};
      
      Object.entries(errors).forEach(([field, message]) => {
        if (field === 'general') {
          showToast(`Service type validation failed: ${message}`, 'error');
        } else {
          fieldErrors[field] = message;
        }
      });

      if (Object.keys(fieldErrors).length > 0) {
        setServiceTypeErrors(fieldErrors);
        showToast('Please fix the highlighted fields', 'error');
      }
      return;
    }

    try {
    setIsSubmitting(true);

    const currentUserResponse = await axiosInstance.get('/api/user/current');
    const currentUser = currentUserResponse.data;

    const usdPrice = (price * qty) / 1000;

    const bdtCurrency = availableCurrencies?.find(c => c.code === 'BDT');
    const usdToBdtRate = bdtCurrency?.rate || 121;

    console.log('Price Calculation Debug:', {
      serviceRate: price,
      quantity: qty,
      usdPrice: usdPrice,
      finalTotalPrice: finalTotalPrice,
      userCurrency: currentUser?.currency,
      sessionUserCurrency: user?.currency,
    });

    const orderPayload = [
      {
        link: String(link || ''),
        qty: Number(qty) || 0,
        price: Number(finalTotalPrice) || 0,
        usdPrice: Number(usdPrice) || 0,
        currency: String(currentUser?.currency || user?.currency || 'USD'),
        serviceId: parseInt(String(selectedService)),
        categoryId: parseInt(String(selectedCategory)),
        userId: parseInt(String(user?.id || currentUser?.id || '')),
        avg_time: String(selected?.avg_time || 'N/A'),

        comments: serviceTypeFields.comments ? String(serviceTypeFields.comments) : undefined,
        username: serviceTypeFields.username ? String(serviceTypeFields.username) : undefined,
        posts: serviceTypeFields.posts ? Number(serviceTypeFields.posts) : undefined,
        delay: serviceTypeFields.delay ? Number(serviceTypeFields.delay) : undefined,
        minQty: serviceTypeFields.minQty ? Number(serviceTypeFields.minQty) : undefined,
        maxQty: serviceTypeFields.maxQty ? Number(serviceTypeFields.maxQty) : undefined,
        isDripfeed: Boolean(serviceTypeFields.isDripfeed || false),
        dripfeedRuns: serviceTypeFields.dripfeedRuns ? Number(serviceTypeFields.dripfeedRuns) : undefined,
        dripfeedInterval: serviceTypeFields.dripfeedInterval ? Number(serviceTypeFields.dripfeedInterval) : undefined,
        isSubscription: Boolean(serviceTypeFields.isSubscription || false),
      },
    ];

    const response = await axiosInstance.post(
      '/api/user/create-orders',
      orderPayload
    );

    if (response.data.success) {
      showToast('Order created successfully!', 'success');

      dispatch(dashboardApi.util.invalidateTags(['UserStats']));
      dispatch(userOrderApi.util.invalidateTags(['UserOrders']));

      refetchUserStats();

      setLink('');
      setQty(0);
      setSelectedService('');
      setSelectedCategory('');
      setSearch('');
      resetServiceTypeFields();

      setTimeout(() => {
        router.push('/my-orders');
      }, 1500);
    } else {
      const errorMsg = response.data?.message || 'Failed to create order';
      showToast(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg), 'error');
    }
  } catch (error: any) {
    console.error('Error creating order:', error);
    let errorMessage = 'Failed to create order';
    
    if (error.response) {
      const responseData = error.response.data;
      if (responseData?.message) {
        errorMessage = typeof responseData.message === 'string' 
          ? responseData.message 
          : JSON.stringify(responseData.message);
      } else if (responseData?.error) {
        errorMessage = typeof responseData.error === 'string' 
          ? responseData.error 
          : JSON.stringify(responseData.error);
      } else if (error.response.status === 404) {
        errorMessage = 'Selected service not found or inactive.';
      } else if (error.response.status === 400) {
        errorMessage = responseData?.message || 'Invalid order data. Please check your inputs.';
      } else if (error.response.status === 500) {
        errorMessage = responseData?.message || 'Server error. Please try again later.';
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showToast(errorMessage, 'error');
  } finally {
    setIsSubmitting(false);
  }
  }

  const handleSearchSelect = (serviceId: string, categoryId: string) => {
    const selected = servicesData.find((s) => s.id === serviceId);

    if (selected) {
      setServicesData([]);
      setSearch(selected.name);
      setShowDropdown(false);
      resetServiceTypeFields();
      
      setSelectedService(String(serviceId));
      
      setServices((prevServices) => {
        const exists = prevServices.some((s) => s.id === serviceId || s.id === parseInt(serviceId));
        if (exists) {
          return prevServices;
        }
        return [...prevServices, selected];
      });
      
      setSelectedCategory(categoryId);
    }
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="w-full space-y-4 lg:space-y-6">
            {massOrderEnabled && (
              <div className="card" style={{ padding: '8px' }}>
                <div className="flex space-x-2">
                  <button className="flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg">
                    <FaShoppingCart className="mr-2 w-4 h-4" />
                    New Order
                  </button>
                  <button
                    onClick={() => router.push('/mass-orders')}
                    className="flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    <FaLayerGroup className="mr-2 w-4 h-4" />
                    Mass Orders
                  </button>
                </div>
              </div>
            )}

            {platformFromUrl && platformFromUrl !== 'Everything' && (
              <div className="flex items-center space-x-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">
                <FaFilter className="h-4 w-4 flex-shrink-0 text-purple-600" />
                <div>
                  <span>
                    Showing{' '}
                    <strong>
                      {platformFromUrl.replace('Traffic', ' Traffic')} services
                    </strong>{' '}
                    only
                  </span>
                  <span className="ml-2 text-purple-500">
                    ({categoriesWithServices.length} categor
                    {categoriesWithServices.length === 1 ? 'y' : 'ies'}{' '}
                    available)
                  </span>
                </div>
              </div>
            )}

            <div className="card card-padding w-full max-w-full">
              {isFormLoading ? (
                <div className="space-y-4 w-full max-w-full">
                  <div className="form-group w-full">
                    <div className="form-label">
                      <span className="inline-block h-4 w-32 gradient-shimmer rounded" />
                    </div>
                    <div className="relative w-full">
                      <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                    </div>
                  </div>
                  <div className="form-group">
                    <div className="form-label">
                      <span className="inline-block h-4 w-24 gradient-shimmer rounded" />
                    </div>
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="form-group">
                    <div className="form-label">
                      <span className="inline-block h-4 w-20 gradient-shimmer rounded" />
                    </div>
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="form-group">
                    <div className="form-label">
                      <span className="inline-block h-4 w-16 gradient-shimmer rounded" />
                    </div>
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="form-group">
                    <div className="form-label">
                      <span className="inline-block h-4 w-24 gradient-shimmer rounded" />
                    </div>
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                    <div className="h-3 w-32 gradient-shimmer rounded mt-1" />
                  </div>
                  <div className="form-group">
                    <div className="form-label">
                      <span className="inline-block h-4 w-20 gradient-shimmer rounded" />
                    </div>
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="h-10 w-full gradient-shimmer rounded-lg" />
                </div>
              ) : (
                <form
                  onSubmit={onSubmit}
                  className="space-y-4 w-full max-w-full"
                >
                  <div className="form-group w-full">
                    <label className="form-label">Search Services</label>
                    <div className="relative w-full" ref={searchRef}>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                        <FaSearch className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      </div>
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        className="form-field w-full pl-10 pr-4 py-3 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        placeholder="Search services..."
                        autoComplete="off"
                        style={{ width: '100%', minWidth: '0' }}
                      />
                      {showDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto left-0 right-0">
                          {isSearchLoading && (
                            <div className="p-3 text-sm text-gray-500 dark:text-gray-400">Searching...</div>
                          )}
                          {!isSearchLoading && servicesData.length === 0 && search.trim().length > 0 && (
                            <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No services found</div>
                          )}
                          {!isSearchLoading && servicesData.length > 0 && (
                            <>
                              {servicesData.map((service) => (
                                <div
                                  key={service.id}
                                  className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                  onClick={() =>
                                    handleSearchSelect(
                                      service.id,
                                      service.categoryId
                                    )
                                  }
                                >
                                  <div className="flex justify-between items-center w-full">
                                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate pr-2 flex-1">
                                      {service.name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                      <PriceDisplay amount={service.rate || 0} originalCurrency="USD" />
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="category">
                      Category
                    </label>
                    <select
                      id="category"
                      className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedService('');
                      }}
                    >
                      <option value="" disabled>
                        Select a category
                      </option>

                      {categoriesWithServices.some((cat) => cat.isFavorite) && (
                        <optgroup label="Favorites">
                          {categoriesWithServices
                            .filter((cat) => cat.isFavorite)
                            .map((favCat) => (
                              <option
                                key={`fav-${favCat.id}`}
                                value={String(favCat.id)}
                              >
                                {favCat.category_name}
                              </option>
                            ))}
                        </optgroup>
                      )}

                      <optgroup label="All Categories">
                        {categoriesWithServices
                          .filter((cat) => !cat.isFavorite)
                          .map((cat: any) => (
                            <option key={`reg-${cat.id}`} value={String(cat.id)}>
                              {cat.category_name}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="services">
                      Services
                    </label>
                    <select
                      id="services"
                      className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                      value={selectedService}
                      onChange={(e) => {
                        setSelectedService(e.target.value);
                        resetServiceTypeFields();
                      }}
                      disabled={!selectedCategory || services.length === 0}
                      required
                    >
                      <option value="" disabled>
                        {services.length === 0 ? 'No services available' : 'Select a service'}
                      </option>
                      {services?.map((service: any) => {
                        const servicePrice = Number(service.rate) || 0;
                        const formattedPrice = currentCurrencyData && currencySettings && availableCurrencies
                          ? formatCurrencyAmount(
                              convertCurrency(servicePrice, 'USD', currency, availableCurrencies),
                              currency,
                              availableCurrencies,
                              currencySettings
                            )
                          : `$${servicePrice.toFixed(2)}`;
                        return (
                          <option key={service.id} value={String(service.id)}>
                            {service.name} - {formattedPrice}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="link">
                      {selected?.orderLink === 'username' ? 'Username' : 'Link'}
                    </label>
                    <input
                      type={selected?.orderLink === 'username' ? 'text' : 'url'}
                      id="link"
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                      placeholder={
                        selected?.orderLink === 'username' 
                          ? 'Enter username' 
                          : 'https://example.com'
                      }
                      required
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      pattern={selected?.orderLink === 'username' ? undefined : "https?://.+"}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="qty">
                      Quantity
                    </label>
                    <input
                      type="number"
                      id="qty"
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Enter Quantity"
                      onChange={(e) =>
                        e.target.value
                          ? setQty(parseInt(e.target.value))
                          : setQty(0)
                      }
                      min={
                        toNumber(services?.find((s) => s.id === parseInt(selectedService) || s.id === selectedService)
                          ?.min_order) || 0
                      }
                      max={
                        toNumber(services?.find((s) => s.id === parseInt(selectedService) || s.id === selectedService)
                          ?.max_order) || 0
                      }
                      value={qty || ''}
                    />
                    <small className="text-xs text-gray-500 mt-1">
                      Min:{' '}
                      {toString(services?.find((s) => s.id === parseInt(selectedService) || s.id === selectedService)
                        ?.min_order) || '0'}{' '}
                      - Max:{' '}
                      {toString(services?.find((s) => s.id === parseInt(selectedService) || s.id === selectedService)
                        ?.max_order) || '0'}
                    </small>
                    {qty > 0 && qty < toNumber(selected?.min_order) && (
                      <div className="text-red-500 text-xs mt-1">
                        Quantity must be at least {toString(selected?.min_order) || '0'}
                      </div>
                    )}
                    {qty > toNumber(selected?.max_order || 999999) && (
                      <div className="text-red-500 text-xs mt-1">
                        Quantity cannot exceed {toString(selected?.max_order) || '0'}
                      </div>
                    )}
                  </div>
                  {selectedService && selected?.type && (
                    <ServiceTypeFields
                      serviceType={selected.type as number}
                      values={serviceTypeFields}
                      onChange={handleServiceTypeFieldChange}
                      errors={serviceTypeErrors}
                    />
                  )}
                  <div className="form-group">
                    <label className="form-label" htmlFor="price">
                      Charge (per 1000 = <PriceDisplay amount={price} originalCurrency="USD" />)
                    </label>
                    <input
                      type="text"
                      id="price"
                      readOnly
                      disabled
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={
                        currentCurrencyData && currencySettings && availableCurrencies
                          ? formatCurrencyAmount(
                              convertCurrency(baseUsdPrice, 'USD', currency, availableCurrencies),
                              currency,
                              availableCurrencies,
                              currencySettings
                            )
                          : currency === 'USD'
                          ? `$ ${totalPrice.toFixed(4)}`
                          : currency === 'BDT'
                          ? `৳ ${totalPrice.toFixed(2)}`
                          : `${currentCurrencyData?.symbol || '$'}${totalPrice.toFixed(2)}`
                      }
                      placeholder="Charge"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !selectedService ||
                      !link ||
                      qty < 1 ||
                      qty < toNumber(selected?.min_order) ||
                      qty > toNumber(selected?.max_order || 999999)
                    }
                    className="btn btn-primary w-full"
                  >
                    {isSubmitting ? (
                      <>
                        Creating Order...
                      </>
                    ) : qty > 0 && qty < toNumber(selected?.min_order) ? (
                      `Minimum ${toString(selected?.min_order) || '0'} required`
                    ) : qty > toNumber(selected?.max_order || 999999) ? (
                      `Maximum ${toString(selected?.max_order) || '0'} allowed`
                    ) : !selectedService ? (
                      'Select a service first'
                    ) : !link ? (
                      selected?.orderLink === 'username' ? 'Enter username' : 'Enter link'
                    ) : qty < 1 ? (
                      'Enter quantity'
                    ) : (
                      'Create Order'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <ServiceDetailsCard
              selectedService={selectedService}
              services={services}
              servicesData={servicesData}
              isLoading={isServiceDetailsLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  const { appName } = useAppNameWithFallback();

  const router = useRouter();

  useEffect(() => {
    setPageTitle('New Order', appName);
  }, [appName]);

  const platforms = [
    {
      name: 'Everything',
      icon: <FaBuffer size={24} />,
      color: 'bg-gradient-to-r from-purple-700 to-purple-500',
      solidColor: 'bg-purple-600',
      categoryKeyword: null,
    },
    {
      name: 'Instagram',
      icon: <FaInstagram size={24} />,
      color: 'bg-gradient-to-r from-pink-600 to-pink-400',
      solidColor: 'bg-pink-500',
      categoryKeyword: 'Instagram',
    },
    {
      name: 'Facebook',
      icon: <FaFacebook size={24} />,
      color: 'bg-gradient-to-r from-blue-600 to-blue-400',
      solidColor: 'bg-blue-500',
      categoryKeyword: 'Facebook',
    },
    {
      name: 'YouTube',
      icon: <FaYoutube size={24} />,
      color: 'bg-gradient-to-r from-red-600 to-red-400',
      solidColor: 'bg-red-500',
      categoryKeyword: 'YouTube',
    },
    {
      name: 'TikTok',
      icon: <FaTiktok size={24} />,
      color: 'bg-gradient-to-r from-gray-800 to-gray-600',
      solidColor: 'bg-gray-700',
      categoryKeyword: 'TikTok',
    },
    {
      name: 'Twitter',
      icon: <FaTwitter size={24} />,
      color: 'bg-gradient-to-r from-blue-400 to-blue-300',
      solidColor: 'bg-blue-400',
      categoryKeyword: 'Twitter',
    },
    {
      name: 'Telegram',
      icon: <FaTelegram size={24} />,
      color: 'bg-gradient-to-r from-blue-500 to-blue-300',
      solidColor: 'bg-blue-400',
      categoryKeyword: 'Telegram',
    },
    {
      name: 'Spotify',
      icon: <FaSpotify size={24} />,
      color: 'bg-gradient-to-r from-green-600 to-green-400',
      solidColor: 'bg-green-500',
      categoryKeyword: 'Spotify',
    },
    {
      name: 'LinkedIn',
      icon: <FaLinkedin size={24} />,
      color: 'bg-gradient-to-r from-blue-800 to-blue-600',
      solidColor: 'bg-blue-700',
      categoryKeyword: 'LinkedIn',
    },
    {
      name: 'Discord',
      icon: <FaDiscord size={24} />,
      color: 'bg-gradient-to-r from-indigo-600 to-indigo-400',
      solidColor: 'bg-indigo-500',
      categoryKeyword: 'Discord',
    },
    {
      name: 'Website Traffic',
      icon: <FaGlobe size={24} />,
      color: 'bg-gradient-to-r from-purple-500 to-purple-300',
      solidColor: 'bg-purple-400',
      categoryKeyword: 'Website',
    },
    {
      name: 'Others',
      icon: <FaBuffer size={24} />,
      color: 'bg-gradient-to-r from-gray-700 to-gray-500',
      solidColor: 'bg-gray-600',
      categoryKeyword: 'Others',
    },
  ];

  const handleCategoryClick = (categoryKeyword: string | null) => {
    if (categoryKeyword) {
      router.push(`/new-order?platform=${categoryKeyword}`);
    } else {
      router.push('/new-order');
    }
  };

  return (
    <div className="h-full">
      <div className="flex flex-col">
        <div className="card card-padding mb-6">
          <div className="card-header mb-4">
            <div className="card-icon">
              <FaBuffer className="w-5 h-5" />
            </div>
            <h3 className="card-title">Select Platform</h3>
            <span className="ml-auto bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-sm font-medium hidden sm:inline-block">
              Choose Your Service
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {platforms.map((platform, index) => {

              const mobileClass = platform.solidColor;
              const desktopClass = platform.color.replace('bg-gradient-to-r', 'sm:bg-gradient-to-r');

              return (
                <button
                     key={platform.name}
                     onClick={() => handleCategoryClick(platform.categoryKeyword)}
                     className={`${mobileClass} ${desktopClass} text-white px-2 py-0 sm:p-4 rounded-lg sm:rounded-xl flex flex-col items-center justify-center h-10 sm:h-24 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 border border-white/20`}
                   >
                   <div className="sm:mb-2 sm:p-2 sm:bg-white/20 sm:rounded-lg sm:backdrop-blur-sm">
                      <div className="scale-75 sm:scale-100">
                        {platform.icon}
                      </div>
                    </div>
                   <div className="text-xs font-semibold text-center leading-tight hidden sm:block">
                     {platform.name}
                   </div>
                 </button>
              );
            })}
          </div>
        </div>

        <NewOrder />
      </div>
    </div>
  );
}
