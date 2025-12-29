import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
export const newOrderApi = createApi({
  reducerPath: 'newOrderApi',
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_URL }),
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
