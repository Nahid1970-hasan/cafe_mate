import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { OrderApi, errorDetail } from '../services/api';

export const placeOrder = createAsyncThunk('orders/placeOrder', async (payload, { rejectWithValue }) => {
  try {
    const response = await OrderApi.create(payload);
    return response.data;
  } catch (error) {
    return rejectWithValue(errorDetail(error, 'Order could not be placed. Please try again.'));
  }
});

export const fetchOrders = createAsyncThunk('orders/fetchOrders', async (_, { rejectWithValue }) => {
  try {
    const response = await OrderApi.list();
    return response.data;
  } catch (_error) {
    return rejectWithValue('Unable to load data. Please try again.');
  }
});

export const fetchOrder = createAsyncThunk('orders/fetchOrder', async (orderId, { rejectWithValue }) => {
  try {
    const response = await OrderApi.detail(orderId);
    return response.data;
  } catch (_error) {
    return rejectWithValue('Unable to load data. Please try again.');
  }
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    list: [],
    current: null,
    loading: false,
    error: null,
    placing: false,
    placeError: null,
  },
  reducers: {
    clearPlaceError(state) {
      state.placeError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(placeOrder.pending, (state) => {
        state.placing = true;
        state.placeError = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.placing = false;
        state.current = action.payload;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.placing = false;
        state.placeError = action.payload;
      });
  },
});

export const { clearPlaceError } = ordersSlice.actions;
export default ordersSlice.reducer;
