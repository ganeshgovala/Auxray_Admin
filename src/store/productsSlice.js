import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../utils/apiConfig';
import { isStale } from './constants';
import { resetStore } from './resetStore';

const initialState = {
  items: [],
  categories: [],
  grouped: [],
  status: 'idle',
  error: null,
  lastFetched: null,
};

// Fetches products, categories and grouped products together (the Inventory page
// needs all three). Deduped by TTL against the products slice's lastFetched.
export const fetchProducts = createAsyncThunk(
  'products/fetch',
  async (_arg, { rejectWithValue }) => {
    try {
      const headers = getAuthHeaders();
      const [productsRes, categoriesRes, groupedRes] = await Promise.all([
        axios.get(buildApiUrl(API_ENDPOINTS.PRODUCTS), { headers }),
        axios.get(buildApiUrl(API_ENDPOINTS.PRODUCTS_CATEGORIES), { headers }),
        axios.get(buildApiUrl(API_ENDPOINTS.PRODUCTS_GROUPED), { headers }),
      ]);
      return {
        items: productsRes.data?.products || [],
        categories: categoriesRes.data?.categories || [],
        grouped: groupedRes.data?.data || [],
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Request failed'
      );
    }
  },
  {
    condition: (arg, { getState }) => {
      const slice = getState().products;
      if (!slice) return true;
      if (slice.status === 'loading') return false;
      if (!arg?.force && !isStale(slice.lastFetched)) return false;
      return true;
    },
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts(state, action) {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.categories = action.payload.categories;
        state.grouped = action.payload.grouped;
        state.lastFetched = Date.now();
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Request failed';
      })
      .addCase(resetStore, () => initialState);
  },
});

export const { setProducts } = productsSlice.actions;
export default productsSlice.reducer;
