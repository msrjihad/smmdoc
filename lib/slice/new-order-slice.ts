import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orderId: null,
  orderDetails: null,
  loading: false,
  error: null,
  success: false,
};

const newOrderSlice = createSlice({
  name: 'newOrder',
  initialState: initialState,
  reducers: {
    createOrderRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    createOrderSuccess: (state, action) => {
      state.loading = false;
      state.success = true;
      state.orderId = action.payload.orderId;
      state.orderDetails = action.payload.orderDetails;
    },
    createOrderFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetNewOrder: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.orderId = null;
      state.orderDetails = null;
    },
  },
});

export const {
  createOrderRequest,
  createOrderSuccess,
  createOrderFail,
  resetNewOrder,
} = newOrderSlice.actions;
export default newOrderSlice.reducer;
