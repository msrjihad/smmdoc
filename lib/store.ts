import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { dashboardApi } from './services/dashboard-api';
import { newOrderApi } from './services/new-order-api';
import { userOrderApi } from './services/user-order-api';
import newOrderSlice from './slice/new-order-slice';
import userDetailsSlice from './slice/userDetails';

export const store = configureStore({
  reducer: {
    userDetails: userDetailsSlice,
    newOrder: newOrderSlice,
    [newOrderApi.reducerPath]: newOrderApi.reducer,
    [userOrderApi.reducerPath]: userOrderApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      newOrderApi.middleware,
      userOrderApi.middleware,
      dashboardApi.middleware
    ),
});
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
