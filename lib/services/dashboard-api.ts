import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const getBaseUrl = () =>
  typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_API_URL || '');

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({ baseUrl: getBaseUrl() }),
  tagTypes: ['AdminStats', 'UserStats'],
  endpoints: (builder) => ({
    getAdminStats: builder.query({
      query: () => ({
        url: `/api/admin/dashboard/stats`,
        method: 'GET',
      }),
      providesTags: ['AdminStats'],
    }),

    getUserStats: builder.query({
      query: () => ({
        url: `/api/user/dashboard/stats`,
        method: 'GET',
      }),
      providesTags: ['UserStats'],
    }),
  }),
});

export const { 
  useGetAdminStatsQuery,
  useGetUserStatsQuery
} = dashboardApi; 