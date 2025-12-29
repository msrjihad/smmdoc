import { fetcher } from '@/lib/utils';
import useSWR from 'swr';

export const useGetServices = (page = 1, limit = '500', search = '') => {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/services?page=${page}&limit=${limit}&search=${search}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
    }
  );
  return {
    data,
    error,
    isLoading,
    mutate,
  };
};
