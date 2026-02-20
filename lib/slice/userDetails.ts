import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  id: '',
  name: '',
  email: '',
  role: '',
  emailVerified: '',
  currency: '',
  addFunds: '',
  balance: 0,
  total_deposit: 0,
  total_spent: 0,
  image: '',
  timeFormat: '24',
  timezone: '',
  language: '',
};

const userDetailsSlice = createSlice({
  name: 'userDetails',
  initialState,
  reducers: {
    setUserDetails: (state, action) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.emailVerified = action.payload.emailVerified;
      state.currency = action.payload.currency;
      state.addFunds = action.payload.addFunds;
      state.balance = action.payload.balance || 0;
      state.total_deposit = action.payload.total_deposit || 0;
      state.total_spent = action.payload.total_spent || 0;
      state.image = action.payload.image || '';
      state.timeFormat = action.payload.timeFormat || '24';
      state.timezone = action.payload.timezone || '';
      state.language = action.payload.language || '';
    },
  },
});

export const { setUserDetails } = userDetailsSlice.actions;
export default userDetailsSlice.reducer;
