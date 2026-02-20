import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const getBaseUrl = () =>
  typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_API_URL || '');

export const newOrderApi = createApi({
  reducerPath: 'newOrderApi',
  baseQuery: fetchBaseQuery({ baseUrl: getBaseUrl() }),
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/user/create-orders',
        method: 'POST',
        body: orderData,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),
  }),
});
export const { useCreateOrderMutation } = newOrderApi;
