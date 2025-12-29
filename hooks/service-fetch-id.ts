import { fetcher } from '@/lib/utils';
import useSWR from 'swr';

export const useGetServicesId = (id: string | number) => {
  const { data, error, isLoading } = useSWR(
    `/api/admin/services/update-services?id=${id}`,
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
  };
};
