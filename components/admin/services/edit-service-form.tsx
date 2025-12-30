'use client';
import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import {
  FaExclamationTriangle,
  FaSave,
  FaTimes,
} from 'react-icons/fa';
import useSWR from 'swr';
import { useGetCategories } from '@/hooks/categories-fetch';
import { useGetServicesId } from '@/hooks/service-fetch-id';
import axiosInstance from '@/lib/axios-instance';
import {
  createServiceDefaultValues,
  CreateServiceSchema,
} from '@/lib/validators/admin/services/services.validator';

const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

const FormItem = ({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => <div className={`space-y-2 ${className}`}>{children}</div>;

const FormLabel = ({
  className = '',
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) => (
  <label className={`block text-sm font-medium ${className}`} style={style}>
    {children}
  </label>
);

const FormControl = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

const FormMessage = ({
  className = '',
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) =>
  children ? (
    <div className={`text-xs text-red-500 mt-1 ${className}`}>{children}</div>
  ) : null;

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white"></div>
    </div>
  </div>
);

export const EditServiceForm = ({
  serviceId,
  onClose,
  showToast,
  refreshAllData,
}: {
  serviceId: number;
  onClose: () => void;
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'pending'
  ) => void;
  refreshAllData?: () => Promise<void>;
}) => {
  const {
    data: categoriesData,
    error: categoriesError,
    isLoading: categoriesLoading,
  } = useGetCategories();
  const {
    data: serviceTypesData,
    error: serviceTypesError,
    isLoading: serviceTypesLoading,
  } = useSWR('/api/admin/service-types', fetcher);
  const {
    data: serviceData,
    error: serviceError,
    isLoading: serviceLoading,
  } = useGetServicesId(serviceId);
  const {
    data: providersData,
    error: providersError,
    isLoading: providersLoading,
  } = useSWR('/api/admin/providers?filter=active', fetcher);
  const [isPending, startTransition] = useTransition();
  const [orderLinkType, setOrderLinkType] = useState<'link' | 'username'>('link');

  const detectOrderLinkType = useCallback((serviceName: string, serviceType?: string): 'link' | 'username' => {
    const name = serviceName.toLowerCase();
    const type = serviceType?.toLowerCase() || '';

    const usernameKeywords = ['comment', 'mention', 'reply', 'custom', 'dm', 'message', 'tag'];

    const linkKeywords = ['follower', 'like', 'view', 'subscriber', 'share', 'watch', 'impression'];

    if (usernameKeywords.some(keyword => name.includes(keyword) || type.includes(keyword))) {
      return 'username';
    }

    if (linkKeywords.some(keyword => name.includes(keyword) || type.includes(keyword))) {
      return 'link';
    }

    return 'link';
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateServiceSchema>({
    mode: 'onChange',

    defaultValues: {
      ...createServiceDefaultValues,
      mode: 'manual',
    },
  });

  const refillValue = watch('refill');

  const modeValue = watch('mode');

  const providerIdValue = watch('providerId');

  const {
    data: apiServicesData,
    error: apiServicesError,
    isLoading: apiServicesLoading,
  } = useSWR(
    modeValue === 'auto' && providerIdValue ? `/api/admin/providers/${providerIdValue}/services` : null,
    fetcher
  );

  const providerServiceIdValue = watch('providerServiceId');

  const mapApiServiceTypeToInternalType = (apiServiceType: string): string | null => {
    if (!apiServiceType || !serviceTypesData?.data) return null;

    const normalizedApiType = apiServiceType.toLowerCase().trim();

    const typeMapping: { [key: string]: string[] } = {
      '1': ['default', 'standard', 'normal', 'regular', 'basic'],
      '2': ['package', 'pack', 'bundle', 'fixed'],
      '3': ['special comments', 'custom comments', 'comments', 'special comment'],
      '4': ['package comments', 'pack comments', 'bundle comments', 'package comment'],
      '11': ['auto likes', 'auto like', 'subscription likes', 'auto-likes'],
      '12': ['auto views', 'auto view', 'subscription views', 'auto-views'],
      '13': ['auto comments', 'auto comment', 'subscription comments', 'auto-comments'],
      '14': ['limited auto likes', 'limited likes', 'limited auto like'],
      '15': ['limited auto views', 'limited views', 'limited auto view'],
    };

    for (const [internalTypeId, apiTypeVariants] of Object.entries(typeMapping)) {
      if (apiTypeVariants.some(variant => normalizedApiType.includes(variant))) {

        const serviceTypeExists = serviceTypesData.data.find(
          (type: any) => type.id.toString() === internalTypeId
        );
        if (serviceTypeExists) {
          return internalTypeId;
        }
      }
    }

    for (const serviceType of serviceTypesData.data) {
      const normalizedInternalName = serviceType.name.toLowerCase();
      if (normalizedApiType.includes(normalizedInternalName) || 
          normalizedInternalName.includes(normalizedApiType)) {
        return serviceType.id.toString();
      }
    }

    return null;
  };

  useEffect(() => {
    if (providerServiceIdValue && apiServicesData?.data?.services) {
      const selectedService = apiServicesData.data.services.find(
        (service: any) => service.id.toString() === providerServiceIdValue
      );

      if (selectedService) {
        setValue('name', selectedService.name || '');
        setValue('description', selectedService.description || '');
        setValue('rate', selectedService.rate?.toString() || '');
        setValue('min_order', selectedService.min?.toString() || '');
        setValue('max_order', selectedService.max?.toString() || '');
        setValue('perqty', '1000');

        if (selectedService.type && serviceTypesData?.data) {
          const mappedServiceTypeId = mapApiServiceTypeToInternalType(selectedService.type);
          if (mappedServiceTypeId) {
            setValue('serviceTypeId', mappedServiceTypeId);
            console.log(`🎯 Auto-filled service type: ${selectedService.type} → ID ${mappedServiceTypeId}`);
          } else {
            console.log(`⚠️ No mapping found for service type: ${selectedService.type}`);
          }
        }

        let refillBoolValue = false;
        if (selectedService.refill !== undefined && selectedService.refill !== null) {
          if (typeof selectedService.refill === 'boolean') {
            refillBoolValue = selectedService.refill;
          } else if (typeof selectedService.refill === 'string') {
            const refillStr = selectedService.refill.toLowerCase();
            refillBoolValue = (refillStr === 'true' || refillStr === '1' || refillStr === 'on' || refillStr === 'yes');
          } else if (typeof selectedService.refill === 'number') {
            refillBoolValue = selectedService.refill > 0;
          }
        }

        let cancelBoolValue = false;
        if (selectedService.cancel !== undefined && selectedService.cancel !== null) {
          if (typeof selectedService.cancel === 'boolean') {
            cancelBoolValue = selectedService.cancel;
          } else if (typeof selectedService.cancel === 'string') {
            const cancelStr = selectedService.cancel.toLowerCase();
            cancelBoolValue = (cancelStr === 'true' || cancelStr === '1' || cancelStr === 'on' || cancelStr === 'yes');
          } else if (typeof selectedService.cancel === 'number') {
            cancelBoolValue = selectedService.cancel > 0;
          }
        }

        setValue('refill', refillBoolValue);
        setValue('cancel', cancelBoolValue);

        if (refillBoolValue) {
          const refillDays = selectedService.refillDays || selectedService.refill_days || 30;
          const refillDisplay = selectedService.refillDisplay || selectedService.refill_display || 24;

          setValue('refillDays', Number(refillDays) as any);
          setValue('refillDisplay', Number(refillDisplay) as any);
        } else {
          setValue('refillDays', undefined as any);
          setValue('refillDisplay', undefined as any);
        }

        const detectedType = detectOrderLinkType(selectedService.name, selectedService.type);
        setValue('orderLink', detectedType);
        setOrderLinkType(detectedType);
      }
    } else if (!providerServiceIdValue) {
      setValue('orderLink', 'link');
      setOrderLinkType('link');
    }
  }, [providerServiceIdValue, apiServicesData, serviceTypesData, detectOrderLinkType, setValue]);

  useEffect(() => {
    console.log('Refill value changed:', refillValue, typeof refillValue);
  }, [refillValue]);

  useEffect(() => {
    if (serviceData?.data && categoriesData?.data && serviceTypesData?.data) {
      console.log('=== EDIT SERVICE FORM DEBUG ===');
      console.log('Raw serviceTypeId from database:', serviceData.data.serviceTypeId, typeof serviceData.data.serviceTypeId);
      console.log('Available service types:', serviceTypesData.data);
      console.log('Service types IDs:', serviceTypesData.data?.map((st: any) => ({ id: st.id, name: st.name, type: typeof st.id })));

      const serviceTypeIdValue = serviceData.data.serviceTypeId ? String(serviceData.data.serviceTypeId) : '';
      console.log('Converted serviceTypeIdValue:', serviceTypeIdValue, typeof serviceTypeIdValue);

      const matchingServiceType = serviceTypesData.data?.find((st: any) => String(st.id) === serviceTypeIdValue);
      console.log('Matching service type found:', matchingServiceType);

      let serviceSpeedValue = serviceData.data.serviceSpeed || createServiceDefaultValues.serviceSpeed;
      if (serviceSpeedValue === 'medium') {
        serviceSpeedValue = 'normal';
      }

      const validSpeeds = ['slow', 'sometimes_slow', 'normal', 'fast'];
      if (!validSpeeds.includes(serviceSpeedValue)) {
        serviceSpeedValue = 'normal';
      }

      const providerIdValue = serviceData.data.providerId ? String(serviceData.data.providerId) : '';

      const orderLinkValue = serviceData.data.orderLink || createServiceDefaultValues.orderLink;
      setOrderLinkType(orderLinkValue as 'link' | 'username');

      const resetData = {
        categoryId: serviceData.data.categoryId ? String(serviceData.data.categoryId) : '',
        name: serviceData.data.name || '',
        description: serviceData.data.description || '',
        rate: String(serviceData.data.rate) || '',
        min_order: String(serviceData.data.min_order) || createServiceDefaultValues.min_order,
        max_order: String(serviceData.data.max_order) || createServiceDefaultValues.max_order,
        perqty: String(serviceData.data.perqty) || createServiceDefaultValues.perqty,
        updateText: serviceData.data.updateText || '',
        serviceTypeId: serviceTypeIdValue,
        mode: serviceData.data.mode || createServiceDefaultValues.mode,
        refill: Boolean(serviceData.data.refill),
        refillDays: serviceData.data.refillDays || createServiceDefaultValues.refillDays,
        refillDisplay: serviceData.data.refillDisplay || createServiceDefaultValues.refillDisplay,
        cancel: Boolean(serviceData.data.cancel),
        serviceSpeed: serviceSpeedValue,
        exampleLink: serviceData.data.exampleLink || createServiceDefaultValues.exampleLink,
        orderLink: orderLinkValue,
        providerId: providerIdValue,
        providerServiceId: serviceData.data.providerServiceId || createServiceDefaultValues.providerServiceId,
      };

      console.log('Reset data being passed to form:', resetData);
      console.log('serviceTypeId in reset data:', resetData.serviceTypeId);

      reset(resetData);

      setTimeout(() => {
        console.log('Form values after reset:', watch());
        console.log('serviceTypeId field value after reset:', watch('serviceTypeId'));
      }, 50);

      setTimeout(() => {
        setValue('refill', Boolean(serviceData.data.refill));
      }, 100);
    }
  }, [categoriesData, reset, serviceData, serviceTypesData, watch, setValue]);

  const onSubmit: SubmitHandler<CreateServiceSchema> = async (values) => {
    console.log('Edit form submitted with values:', values);
    console.log('Service ID:', serviceId);

    if (!values.categoryId || values.categoryId === '') {
      showToast('Please select a service category', 'error');
      return;
    }

    if (!values.serviceTypeId || values.serviceTypeId === '') {
      showToast('Please select a service type', 'error');
      return;
    }

    if (values.mode === 'auto' && (!values.providerId || values.providerId === '')) {
      showToast('Please select an API provider when mode is Auto (API)', 'error');
      return;
    }

    const filteredValues = Object.fromEntries(
      Object.entries(values).filter(([key, value]) => {
        if (value === '' || value === null || value === undefined) return false;
        return true;
      })
    );

    console.log('Filtered values to send:', filteredValues);

    startTransition(async () => {
      try {
        console.log('Sending edit request to API...');
        const response = await axiosInstance.put(
          `/api/admin/services/update-services?id=${serviceId}`,
          filteredValues
        );
        console.log('Edit API response:', response.data);
        if (response.data.success) {
          showToast(
            response.data.message || 'Service updated successfully',
            'success'
          );

          if (refreshAllData) {
            await refreshAllData();
          }
          onClose();
        } else {
          showToast(response.data.error || 'Failed to update service', 'error');
        }
      } catch (error: any) {
        console.error('Edit API Error:', error);
        console.error('Error response:', error.response?.data);
        
        const errorMessage = error.response?.data?.error || error.message || 'Something went wrong';
        showToast(`Error: ${errorMessage}`, 'error');
      }
    });
  };

  if (categoriesLoading || serviceLoading || !serviceData?.data) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center flex flex-col items-center">
            <GradientSpinner size="w-12 h-12" className="mb-3" />
            <div className="text-base font-medium">Loading service data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (categoriesError || serviceError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FaExclamationTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Error loading service data</p>
          <p className="text-gray-500 text-sm mt-1">
            {categoriesError || serviceError}
          </p>
          <div className="flex justify-center mt-4">
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!categoriesData || !serviceData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FaExclamationTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No service data available</p>
          <p className="text-gray-500 text-sm mt-1">
            Service not found or data unavailable
          </p>
          <div className="flex justify-center mt-4">
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="flex items-center justify-between p-6">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Edit Service
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Close"
        >
          <FaTimes className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 pb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormItem className="md:col-span-2">
              <FormLabel
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Service Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <input
                  type="text"
                  placeholder="Enter service name"
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  {...register('name')}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage>{errors.name?.message}</FormMessage>
            </FormItem>
            <FormItem className="md:col-span-1">
              <FormLabel
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Service Category <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <select
                  className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  {...register('categoryId')}
                  disabled={isPending}
                  required
                >
                  <option value={''} hidden>
                    Select Service Category
                  </option>
                  {categoriesData?.data?.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category?.category_name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage>{errors.categoryId?.message}</FormMessage>
            </FormItem>
            <FormItem className="md:col-span-1">
              <FormLabel
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Service Type <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <select
                  className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  {...register('serviceTypeId')}
                  disabled={isPending || serviceTypesLoading}
                  required
                >
                  <option value="">Select Service Type</option>
                  {serviceTypesData?.data?.map((serviceType: any) => (
                    <option key={serviceType.id} value={serviceType.id}>
                      {serviceType.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage>{errors.serviceTypeId?.message}</FormMessage>
            </FormItem>
            <FormItem className="md:col-span-2">
              <FormLabel
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Mode
              </FormLabel>
              <FormControl>
                <select
                  className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  {...register('mode')}
                  disabled={isPending}
                >
                  <option value="manual">Manual</option>
                  <option value="auto">Auto (API)</option>
                </select>
              </FormControl>
              <FormMessage>{errors.mode?.message}</FormMessage>
            </FormItem>
            {modeValue === 'auto' && (
              <FormItem className="md:col-span-2">
                <FormLabel
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  API Provider <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <select
                    className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                    {...register('providerId')}
                    disabled={isPending || providersLoading}
                    required={modeValue === 'auto'}
                  >
                    <option value="">Select API Provider</option>
                    {providersData?.data?.providers?.map((provider: any) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage>{errors.providerId?.message}</FormMessage>
              </FormItem>
            )}
            {modeValue === 'auto' && providerIdValue && (
              <FormItem className="md:col-span-2">
                <FormLabel
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  API Service <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <select
                    className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                    {...register('providerServiceId')}
                    disabled={isPending || apiServicesLoading}
                    required={modeValue === 'auto' && !!providerIdValue}
                  >
                    <option value="">
                      {apiServicesLoading ? 'Loading services...' : 'Select API Service'}
                    </option>
                    {apiServicesData?.data?.services?.map((service: any) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage>{errors.providerServiceId?.message}</FormMessage>
                {apiServicesError && (
                  <p className="text-sm text-red-500 mt-1">
                    Failed to load services. Please try again.
                  </p>
                )}
              </FormItem>
            )}
            <div className="md:col-span-2 grid grid-cols-3 gap-6">
              <FormItem className="col-span-1">
                <FormLabel
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Service Price (Always USD Price) <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter service price"
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('rate')}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage>{errors.rate?.message}</FormMessage>
              </FormItem>
              <FormItem className="col-span-1">
                <FormLabel
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Minimum Order <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <input
                    type="number"
                    min={0}
                    placeholder="Enter minimum order"
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('min_order')}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage>{errors.min_order?.message}</FormMessage>
              </FormItem>
              <FormItem className="col-span-1">
                <FormLabel
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Maximum Order <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <input
                    type="number"
                    min={0}
                    placeholder="Enter maximum order"
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('max_order')}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage>{errors.max_order?.message}</FormMessage>
              </FormItem>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormItem className="col-span-1">
                <FormLabel
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Per Quantity (Default: 1000){' '}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <input
                    type="number"
                    min={1}
                    placeholder="Enter per quantity (default: 1000)"
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('perqty')}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage>{errors.perqty?.message}</FormMessage>
              </FormItem>
              <FormItem className="col-span-1">
                <FormLabel
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Refill <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <select
                    className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                    {...register('refill', {
                      setValueAs: (value) => value === 'true',
                    })}
                    disabled={isPending}
                    required
                  >
                    <option value="false">Off</option>
                    <option value="true">On</option>
                  </select>
                </FormControl>
                <FormMessage>{errors.refill?.message}</FormMessage>
              </FormItem>
            </div>
            {refillValue === true && (
              <FormItem className="md:col-span-1">
                <FormLabel
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Refill Days <span className="text-gray-500 text-xs">(Leave blank for Lifetime)</span>
                </FormLabel>
                <FormControl>
                  <input
                    type="number"
                    min={0}
                    placeholder="Leave blank for Lifetime"
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('refillDays')}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage>{errors.refillDays?.message}</FormMessage>
              </FormItem>
            )}
            {refillValue === true && (
              <FormItem className="md:col-span-1">
                <FormLabel
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Refill Display (in hours){' '}
                </FormLabel>
                <FormControl>
                  <input
                    type="number"
                    min={0}
                    placeholder="Leave blank for Lifetime"
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('refillDisplay')}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage>{errors.refillDisplay?.message}</FormMessage>
              </FormItem>
            )}
            <FormItem className="md:col-span-1">
              <FormLabel
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Cancel <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <select
                  className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  {...register('cancel', {
                    setValueAs: (value) => value === 'true',
                  })}
                  disabled={isPending}
                  required
                >
                  <option value="false">Off</option>
                  <option value="true">On</option>
                </select>
              </FormControl>
              <FormMessage>{errors.cancel?.message}</FormMessage>
            </FormItem>
            <FormItem className="md:col-span-1">
              <FormLabel
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Order Link <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <select
                  className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  {...register('orderLink')}
                  disabled={isPending}
                  required
                >
                  <option value="link">Link</option>
                  <option value="username">Username</option>
                </select>
              </FormControl>
              <FormMessage>{errors.orderLink?.message}</FormMessage>
            </FormItem>
            <FormItem className="md:col-span-2">
              <FormLabel
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Service Speed <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <select
                  className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  {...register('serviceSpeed')}
                  disabled={isPending}
                  required
                >
                  <option value="">Select Service Speed</option>
                  <option value="slow">Slow</option>
                  <option value="sometimes_slow">Sometimes Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </FormControl>
              <FormMessage>{errors.serviceSpeed?.message}</FormMessage>
            </FormItem>
            <FormItem className="md:col-span-2">
              <FormLabel
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Example Link
              </FormLabel>
              <FormControl>
                <input
                  type="url"
                  placeholder="Enter example link (optional)"
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  {...register('exampleLink')}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage>{errors.exampleLink?.message}</FormMessage>
            </FormItem>
          </div>
          <FormItem>
            <FormLabel
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Service Description <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <textarea
                placeholder="Enter service description"
                className="form-field w-full min-h-[120px] resize-y px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                {...register('description')}
                disabled={isPending}
                required
              />
            </FormControl>
            <FormMessage>{errors.description?.message}</FormMessage>
          </FormItem>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="btn btn-secondary px-8 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary flex items-center gap-2 px-8 py-3"
            >
              {isPending ? (
                <>
                  Updating...
                </>
              ) : (
                <>
                  <FaSave className="h-4 w-4" />
                  Update Service
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
