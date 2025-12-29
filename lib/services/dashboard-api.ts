import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_URL }),
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