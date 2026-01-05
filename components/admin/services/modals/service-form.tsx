'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import {
  FaExclamationTriangle,
  FaPlus,
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
import { SERVICE_TYPE_CONFIGS } from '@/lib/service-types';

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

const SkeletonField = ({ className = '' }: { className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
  </div>
);

const SkeletonTextarea = ({ className = '' }: { className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
  </div>
);

export const CreateServiceForm: React.FC<{
  serviceId?: number;
  onClose: () => void;
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'pending'
  ) => void;
  onRefresh?: () => void;
  refreshAllData?: () => Promise<void>;
  refreshAllDataWithServices?: () => Promise<void>;
  isOpen?: boolean;
  isClosing?: boolean;
}> = ({ 
  serviceId, 
  onClose, 
  showToast, 
  onRefresh, 
  refreshAllData,
  refreshAllDataWithServices,
  isOpen,
  isClosing
}) => {
  const isEditMode = !!serviceId;

  const {
    data: categoriesData,
    error: categoriesError,
    isLoading: categoriesLoading,
  } = useGetCategories();
  const packageTypeToServiceTypeId: Record<number, number> = useMemo(() => ({
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    11: 5,
    12: 6,
    13: 7,
    14: 8,
    15: 9,
  }), []);

  const serviceTypeIdToPackageType: Record<number, number> = useMemo(() => 
    Object.fromEntries(
      Object.entries(packageTypeToServiceTypeId).map(([pkgType, svcTypeId]) => [svcTypeId, Number(pkgType)])
    ), [packageTypeToServiceTypeId]
  );

  const serviceTypesData = useMemo(() => {
    const serviceTypes = Object.values(SERVICE_TYPE_CONFIGS).map(config => ({
      id: packageTypeToServiceTypeId[config.id] || config.id,
      packageType: config.id,
      name: config.name,
      description: config.description,
    }));
    return { data: serviceTypes };
  }, [packageTypeToServiceTypeId]);

  const serviceTypesLoading = false;

  const {
    data: providersData,
    error: providersError,
    isLoading: providersLoading,
  } = useSWR('/api/admin/providers?filter=active', fetcher);

  const {
    data: serviceData,
    error: serviceError,
    isLoading: serviceLoading,
  } = useSWR(
    isEditMode && serviceId ? `/api/admin/services/update-services?id=${serviceId}` : null,
    fetcher
  );

  const [isPending, startTransition] = useTransition();
  const [orderLinkType, setOrderLinkType] = useState<'link' | 'username'>('link');
  const formPopulatedRef = useRef(false);

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
      orderLink: 'link',
    },
  });

  useEffect(() => {
    return () => {
      reset({
        ...createServiceDefaultValues,
        mode: 'manual',
        orderLink: 'link',
      });
    };
  }, [reset]);

  useEffect(() => {
    if (!isEditMode && serviceTypesData?.data && !watch('serviceTypeId')) {
      const defaultServiceType = serviceTypesData.data.find(
        (serviceType: any) => serviceType.name === 'Default'
      );
      if (defaultServiceType) {
        setValue('serviceTypeId', defaultServiceType.id.toString());
      }
    }
  }, [isEditMode, serviceTypesData, setValue, watch]);

  const refillValue = watch('refill');
  const modeValue = watch('mode');
  const providerIdValue = watch('providerId');
  
  const providerPrice = useMemo(() => {
    if (isEditMode && serviceData?.data) {
      if (serviceData.data.providerId) {
        const price = serviceData.data.providerPrice || 
                     serviceData.data.provider_price || 
                     serviceData.data.originalRate || 
                     null;
        
        if (!price && serviceData.data.updateText) {
          try {
            const updateData = JSON.parse(serviceData.data.updateText);
            if (updateData.originalRate) {
              return parseFloat(updateData.originalRate);
            }
          } catch (e) {
          }
        }
        
        return price ? parseFloat(price.toString()) : null;
      }
    }
    return null;
  }, [isEditMode, serviceData?.data]);

  const providerMinOrder = useMemo(() => {
    if (isEditMode && serviceData?.data) {
      if (serviceData.data.providerId) {
        const minOrder = serviceData.data.min_order;
        return minOrder ? BigInt(minOrder).toString() : null;
      }
    }
    return null;
  }, [isEditMode, serviceData?.data]);

  const providerMaxOrder = useMemo(() => {
    if (isEditMode && serviceData?.data) {
      if (serviceData.data.providerId) {
        const maxOrder = serviceData.data.max_order;
        return maxOrder ? BigInt(maxOrder).toString() : null;
      }
    }
    return null;
  }, [isEditMode, serviceData?.data]);

  const providerRefillCancelStatus = useMemo(() => {
    let providerAllowsRefill = true;
    let providerAllowsCancel = true;
    
    if (isEditMode && serviceData?.data?.providerId) {
      try {
        const updateText = serviceData.data.updateText;
        if (updateText) {
          const providerData = JSON.parse(updateText);
          
          if (providerData.providerRefill !== undefined) {
            providerAllowsRefill = providerData.providerRefill === true || 
                                   providerData.providerRefill === 1 || 
                                   providerData.providerRefill === '1' || 
                                   providerData.providerRefill === 'true';
          }
          
          if (providerData.providerCancel !== undefined) {
            providerAllowsCancel = providerData.providerCancel === true || 
                                   providerData.providerCancel === 1 || 
                                   providerData.providerCancel === '1' || 
                                   providerData.providerCancel === 'true';
          }
          
          if (providerData.providerRefill === undefined) {
            if (providerData.refill === false || providerData.refill === 0 || providerData.refill === '0' || 
                providerData.refillable === false || providerData.can_refill === false) {
              providerAllowsRefill = false;
            } else if (providerData.refill === true || providerData.refill === 1 || providerData.refill === '1' ||
                       providerData.refillable === true || providerData.can_refill === true) {
              providerAllowsRefill = true;
            }
          }
          
          if (providerData.providerCancel === undefined) {
            if (providerData.cancel === false || providerData.cancel === 0 || providerData.cancel === '0' || 
                providerData.cancelable === false || providerData.can_cancel === false) {
              providerAllowsCancel = false;
            } else if (providerData.cancel === true || providerData.cancel === 1 || providerData.cancel === '1' ||
                       providerData.cancelable === true || providerData.can_cancel === true) {
              providerAllowsCancel = true;
            }
          }
        }
      } catch (error) {
      }
    }
    
    return { providerAllowsRefill, providerAllowsCancel };
  }, [isEditMode, serviceData?.data]);

  const shouldFetchApiServices = (modeValue === 'auto' && providerIdValue) || 
    (isEditMode && serviceData?.data?.providerId && serviceData.data.mode === 'auto');
  
  const effectiveProviderId = modeValue === 'auto' && providerIdValue 
    ? providerIdValue 
    : (isEditMode && serviceData?.data?.providerId && serviceData.data.mode === 'auto' 
        ? String(serviceData.data.providerId) 
        : null);

  const {
    data: apiServicesData,
    error: apiServicesError,
    isLoading: apiServicesLoading,
  } = useSWR(
    shouldFetchApiServices && effectiveProviderId ? `/api/admin/providers/${effectiveProviderId}/services` : null,
    fetcher
  );

  const providerServiceIdValue = watch('providerServiceId');

  const mapApiServiceTypeToInternalType = (apiServiceType: string): string | null => {
    if (!apiServiceType || !serviceTypesData?.data) return null;

    const normalizedApiType = apiServiceType.toLowerCase().trim();

    const typeNameToPackageType: Record<string, number> = {
      'default': 1,
      'standard': 1,
      'normal': 1,
      'regular': 1,
      'basic': 1,
      'package': 2,
      'pack': 2,
      'bundle': 2,
      'fixed': 2,
      'special comments': 3,
      'custom comments': 3,
      'comments': 3,
      'special comment': 3,
      'package comments': 4,
      'pack comments': 4,
      'bundle comments': 4,
      'package comment': 4,
      'auto likes': 11,
      'auto like': 11,
      'subscription likes': 11,
      'auto-likes': 11,
      'auto views': 12,
      'auto view': 12,
      'subscription views': 12,
      'auto-views': 12,
      'auto comments': 13,
      'auto comment': 13,
      'subscription comments': 13,
      'auto-comments': 13,
      'limited auto likes': 15,
      'limited likes': 15,
      'limited auto like': 15,
      'limited auto views': 15,
      'limited views': 15,
      'limited auto view': 15,
    };

    for (const [name, packageType] of Object.entries(typeNameToPackageType)) {
      if (normalizedApiType.includes(name)) {
        const serviceTypeId = packageTypeToServiceTypeId[packageType];
        const serviceTypeExists = serviceTypesData.data.find(
          (type: any) => type.id === serviceTypeId
        );
        if (serviceTypeExists) {
          return serviceTypeId.toString();
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
        if (!isEditMode) {
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
            const refillDays = selectedService.refillDays !== undefined && selectedService.refillDays !== null 
              ? selectedService.refillDays 
              : (selectedService.refill_days !== undefined && selectedService.refill_days !== null 
                  ? selectedService.refill_days 
                  : undefined);
            const refillDisplay = selectedService.refillDisplay !== undefined && selectedService.refillDisplay !== null 
              ? selectedService.refillDisplay 
              : (selectedService.refill_display !== undefined && selectedService.refill_display !== null 
                  ? selectedService.refill_display 
                  : undefined);

            setValue('refillDays', refillDays !== undefined ? Number(refillDays) : undefined as any);
            setValue('refillDisplay', refillDisplay !== undefined ? Number(refillDisplay) : undefined as any);
          } else {
            setValue('refillDays', undefined as any);
            setValue('refillDisplay', undefined as any);
          }

          const detectedType = detectOrderLinkType(selectedService.name, selectedService.type);
          setValue('orderLink', detectedType);
          setOrderLinkType(detectedType);
        }
      }
    } else if (!providerServiceIdValue) {
      const currentOrderLink = watch('orderLink');
      if (currentOrderLink !== 'link') {
        setValue('orderLink', 'link');
        setOrderLinkType('link');
      }
      if (!isEditMode) {
        const currentRefill = watch('refill');
        const currentCancel = watch('cancel');
        if (currentRefill !== false) {
          setValue('refill', false);
        }
        if (currentCancel !== false) {
          setValue('cancel', false);
        }
        setValue('refillDays', undefined as any);
        setValue('refillDisplay', undefined as any);
      }
    }
  }, [providerServiceIdValue, apiServicesData, detectOrderLinkType, setValue, isEditMode, watch]);

  useEffect(() => {
    if (isEditMode && serviceData?.data && categoriesData?.data && serviceTypesData?.data && !formPopulatedRef.current) {
      console.log('=== EDIT SERVICE FORM DEBUG ===');
      console.log('Raw serviceTypeId from database:', serviceData.data.serviceTypeId, typeof serviceData.data.serviceTypeId);
      console.log('Available service types:', serviceTypesData.data);

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
        refillDays: serviceData.data.refillDays !== undefined && serviceData.data.refillDays !== null 
          ? serviceData.data.refillDays 
          : createServiceDefaultValues.refillDays,
        refillDisplay: serviceData.data.refillDisplay !== undefined && serviceData.data.refillDisplay !== null 
          ? serviceData.data.refillDisplay 
          : createServiceDefaultValues.refillDisplay,
        cancel: Boolean(serviceData.data.cancel),
        serviceSpeed: serviceSpeedValue,
        exampleLink: serviceData.data.exampleLink || createServiceDefaultValues.exampleLink,
        orderLink: orderLinkValue,
        providerId: providerIdValue,
        providerServiceId: serviceData.data.providerServiceId ? String(serviceData.data.providerServiceId) : createServiceDefaultValues.providerServiceId,
      };

      console.log('Reset data being passed to form:', resetData);
      reset(resetData);
      formPopulatedRef.current = true;
    }
  }, [isEditMode, serviceData?.data?.id, categoriesData?.data, reset, setValue, setOrderLinkType]);

  const handleClose = () => {
    reset({
      ...createServiceDefaultValues,
      mode: 'manual',
      orderLink: 'link',
    });
    formPopulatedRef.current = false;
    onClose();
  };

  const onSubmit: SubmitHandler<CreateServiceSchema> = async (values) => {
    console.log(`${isEditMode ? 'Edit' : 'Create'} form submitted with values:`, values);

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

    if (providerPrice !== null && values.rate) {
      const rateValue = parseFloat(values.rate.toString());
      if (isNaN(rateValue) || rateValue < providerPrice) {
        showToast(`Service price must be at least $${providerPrice.toFixed(2)} (provider price)`, 'error');
        return;
      }
    }

    if (providerMinOrder !== null && values.min_order) {
      const minOrderValue = parseInt(values.min_order.toString());
      const providerMin = parseInt(providerMinOrder);
      if (isNaN(minOrderValue) || minOrderValue < providerMin) {
        showToast(`Minimum order must be at least ${providerMinOrder} (provider minimum)`, 'error');
        return;
      }
    }

    if (providerMaxOrder !== null && values.max_order) {
      const maxOrderValue = parseInt(values.max_order.toString());
      const providerMax = parseInt(providerMaxOrder);
      if (isNaN(maxOrderValue) || maxOrderValue < providerMax) {
        showToast(`Maximum order must be at least ${providerMaxOrder} (provider maximum)`, 'error');
        return;
      }
    }

    const serviceTypeId = values.serviceTypeId ? Number(values.serviceTypeId) : null;
    const packageType = serviceTypeId ? serviceTypeIdToPackageType[serviceTypeId] : null;

    const filteredValues = Object.fromEntries(
      Object.entries(values).filter(([key, value]) => {
        if (key === 'categoryId') {
          return value !== null && value !== undefined && value !== '';
        }
        if (key === 'serviceTypeId') {
          return false;
        }
        if (key === 'refillDays' || key === 'refillDisplay') {
          return true;
        }
        if (value === '' || value === null || value === undefined) return false;
        return true;
      })
    );

    if (values.refillDays === null || values.refillDays === undefined) {
      filteredValues.refillDays = null;
    }
    if (values.refillDisplay === null || values.refillDisplay === undefined) {
      filteredValues.refillDisplay = null;
    }

    if (packageType) {
      filteredValues.packageType = packageType;
    }

    console.log('Filtered values to send:', filteredValues);
    console.log('Converted serviceTypeId', serviceTypeId, 'to packageType', packageType);

    startTransition(async () => {
      try {
        let response;
        if (isEditMode) {
          console.log('Sending edit request to API...');
          response = await axiosInstance.put(
            `/api/admin/services/update-services?id=${serviceId}`,
            filteredValues
          );
          console.log('Edit API response:', response.data);
        } else {
          console.log('Sending create request to API...');
          response = await axiosInstance.post(
            '/api/admin/services',
            filteredValues
          );
          console.log('Create API response:', response.data);
        }

        if (response.data.success) {
          reset({
            ...createServiceDefaultValues,
            mode: 'manual',
            orderLink: 'link',
          });

          showToast(
            response.data.message || (isEditMode ? 'Service updated successfully' : 'Service created successfully'),
            'success'
          );

          if (isEditMode && refreshAllData) {
            await refreshAllData();
          } else if (!isEditMode) {
            if (refreshAllDataWithServices) {
              await refreshAllDataWithServices();
            }
            if (onRefresh) {
              onRefresh();
            }
          }

          onClose();
        } else {
          showToast(response.data.error || `Failed to ${isEditMode ? 'update' : 'create'} service`, 'error');
        }
      } catch (error: any) {
        console.error('API Error:', error);
        console.error('Error response:', error.response?.data);
        
        let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} service. Please try again.`;
        
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        console.error('Displaying error:', errorMessage);
        showToast(errorMessage, 'error');
      }
    });
  };

  if (categoriesLoading || (isEditMode && (serviceLoading || !serviceData?.data))) {
    return (
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between p-6">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        <div className="px-6 pb-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonField className="md:col-span-2" />
              <SkeletonField className="md:col-span-1" />
              <SkeletonField className="md:col-span-1" />
              <SkeletonField className="md:col-span-2" />
              <div className="md:col-span-2 grid grid-cols-3 gap-6">
                <SkeletonField className="col-span-1" />
                <SkeletonField className="col-span-1" />
                <SkeletonField className="col-span-1" />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkeletonField className="col-span-1" />
                <SkeletonField className="col-span-1" />
              </div>
              <SkeletonField className="md:col-span-1" />
              <SkeletonField className="md:col-span-1" />
              <SkeletonField className="md:col-span-2" />
              <SkeletonField className="md:col-span-2" />
            </div>
            <SkeletonTextarea />
            <div className="flex gap-2 justify-center">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (categoriesError || (isEditMode && serviceError)) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FaExclamationTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium">
            Error loading {isEditMode ? 'service' : 'categories'} data
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {categoriesError || serviceError}
          </p>
          <div className="flex justify-center mt-4">
            <button onClick={handleClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!categoriesData || (isEditMode && !serviceData)) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FaExclamationTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            {isEditMode ? 'No service data available' : 'No categories available'}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {isEditMode ? 'Service not found or data unavailable' : 'Please add categories first'}
          </p>
          <div className="flex justify-center mt-4">
            <button onClick={handleClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formContent = (
    <div className="w-full max-w-6xl">
      <div className="flex items-center justify-between p-6">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {isEditMode ? 'Edit Service' : 'Create New Service'}
        </h3>
        <button
          onClick={handleClose}
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
                  required
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
                  className={`form-field w-full pl-4 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 appearance-none ${
                    (isEditMode && serviceData?.data?.providerId) || isPending
                      ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-pointer'
                  }`}
                  {...register('categoryId')}
                  disabled={isPending || (isEditMode && serviceData?.data?.providerId)}
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
                  className={`form-field w-full pl-4 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 appearance-none ${
                    (isEditMode && serviceData?.data?.providerId) || isPending
                      ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-pointer'
                  }`}
                  {...register('serviceTypeId')}
                  disabled={isPending || (isEditMode && serviceData?.data?.providerId)}
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
                Mode {!isEditMode && <span className="text-red-500">*</span>}
              </FormLabel>
              <FormControl>
                <select
                  className={`form-field w-full pl-4 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 appearance-none ${
                    (isEditMode && serviceData?.data?.providerId) || isPending
                      ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-pointer'
                  }`}
                  {...register('mode')}
                  disabled={isPending || (isEditMode && serviceData?.data?.providerId)}
                  required={!isEditMode}
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
                    className={`form-field w-full pl-4 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 appearance-none ${
                      (isEditMode && serviceData?.data?.providerId) || isPending || providersLoading
                        ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-pointer'
                    }`}
                    {...register('providerId')}
                    disabled={isPending || providersLoading || (isEditMode && serviceData?.data?.providerId)}
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
            {((modeValue === 'auto' && providerIdValue) || (isEditMode && serviceData?.data?.mode === 'auto' && serviceData.data.providerId)) && (
              <FormItem className="md:col-span-2">
                <FormLabel
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  API Service <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <select
                    className={`form-field w-full pl-4 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 appearance-none ${
                      (isEditMode && serviceData?.data?.providerId) || isPending || apiServicesLoading
                        ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-pointer'
                    }`}
                    {...register('providerServiceId')}
                    disabled={isPending || apiServicesLoading || (isEditMode && serviceData?.data?.providerId)}
                    required={modeValue === 'auto' && !!providerIdValue}
                    value={watch('providerServiceId') || ''}
                  >
                    <option value="">
                      {apiServicesLoading ? 'Loading services...' : 'Select API Service'}
                    </option>
                    {apiServicesData?.data?.services?.map((service: any) => (
                      <option key={service.id} value={String(service.id)}>
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
                  Service Price{' '}
                  <span className="text-red-500">* (Always USD Price)</span>
                </FormLabel>
                <FormControl>
                  <input
                    type="number"
                    step="0.01"
                    min={providerPrice !== null ? providerPrice : 0}
                    placeholder="Enter service price"
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('rate', {
                      min: providerPrice !== null ? {
                        value: providerPrice,
                        message: `Must be at least $${providerPrice.toFixed(2)} (provider price)`
                      } : undefined
                    })}
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
                    min={providerMinOrder !== null ? parseInt(providerMinOrder) : 0}
                    placeholder="Enter minimum order"
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('min_order', {
                      min: providerMinOrder !== null ? {
                        value: parseInt(providerMinOrder),
                        message: `Must be at least ${providerMinOrder} (provider minimum)`
                      } : undefined
                    })}
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
                    min={providerMaxOrder !== null ? parseInt(providerMaxOrder) : 0}
                    placeholder="Enter maximum order"
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('max_order', {
                      min: providerMaxOrder !== null ? {
                        value: parseInt(providerMaxOrder),
                        message: `Must be at least ${providerMaxOrder} (provider maximum)`
                      } : undefined
                    })}
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
                  Per Quantity
                  {isEditMode && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <input
                    type="number"
                    min={1}
                    placeholder="Enter per quantity (default: 1000)"
                    className="form-field w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none shadow-sm text-gray-600 dark:text-gray-400 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-not-allowed"
                    {...register('perqty')}
                    readOnly
                    disabled={true}
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
                    className={`form-field w-full pl-4 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 appearance-none ${
                      !providerRefillCancelStatus.providerAllowsRefill || isPending
                        ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-pointer'
                    }`}
                    {...register('refill', {
                      setValueAs: (value) => value === 'true',
                    })}
                    disabled={isPending || !providerRefillCancelStatus.providerAllowsRefill}
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
                    className={`form-field w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      !providerRefillCancelStatus.providerAllowsRefill || isPending
                        ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                    }`}
                    {...register('refillDays')}
                    disabled={isPending || !providerRefillCancelStatus.providerAllowsRefill}
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
                    className={`form-field w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      !providerRefillCancelStatus.providerAllowsRefill || isPending
                        ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                    }`}
                    {...register('refillDisplay')}
                    disabled={isPending || !providerRefillCancelStatus.providerAllowsRefill}
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
                  className={`form-field w-full pl-4 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 appearance-none ${
                    !providerRefillCancelStatus.providerAllowsCancel || isPending
                      ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-pointer'
                  }`}
                  {...register('cancel', {
                    setValueAs: (value) => value === 'true',
                  })}
                  disabled={isPending || !providerRefillCancelStatus.providerAllowsCancel}
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
                {orderLinkType === 'username' ? 'Username' : 'Order Link'} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <select
                  className={`form-field w-full pl-4 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm transition-all duration-200 appearance-none ${
                    (isEditMode && serviceData?.data?.providerId) || isPending
                      ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-pointer'
                  }`}
                  {...register('orderLink')}
                  disabled={isPending || (isEditMode && serviceData?.data?.providerId)}
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
              onClick={handleClose}
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
                  {isEditMode ? 'Updating...' : 'Creating Service...'}
                </>
              ) : (
                <>
                  {isEditMode ? <FaSave className="h-4 w-4" /> : <FaPlus className="h-4 w-4" />}
                  {isEditMode ? 'Update Service' : 'Create Service'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // If modal props are provided, wrap with modal structure
  if (isOpen !== undefined) {
    return (
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
          isClosing
            ? 'modal-backdrop-exit'
            : 'modal-backdrop-enter'
        }`}
        onClick={onClose}
      >
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 ${
            isClosing
              ? 'modal-content-exit'
              : 'modal-content-enter'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {formContent}
        </div>
      </div>
    );
  }

  // Otherwise return form content directly
  return formContent;
};
