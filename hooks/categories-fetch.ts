import { fetcher } from '@/lib/utils';
import useSWR from 'swr';

export const useGetCategories = () => {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/admin/categories/get-categories',
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
