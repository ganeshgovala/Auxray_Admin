import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../utils/apiConfig';
import { isStale } from './constants';
import { resetStore } from './resetStore';

// Brand categories as defined by the backend Brands API. `key` is the exact
// category string the API expects/returns; `label` is what we display.
export const BRAND_TYPES = [
  { key: 'Panel brand', label: 'Panels' },
  { key: 'Invertor brand', label: 'Inverters' },
  { key: 'Cables brand', label: 'Cables' },
];

const initialState = {
  items: [],
  categories: [],
  grouped: [],
  status: 'idle',
  error: null,
  lastFetched: null,
};

// Fetches all brands, categories and grouped brands together (the Brands page
// needs all three). Deduped by TTL against the brands slice's lastFetched.
export const fetchBrands = createAsyncThunk(
  'brands/fetch',
  async (_arg, { rejectWithValue }) => {
    try {
      const headers = getAuthHeaders();
      const [brandsRes, categoriesRes, groupedRes] = await Promise.all([
        axios.get(buildApiUrl(API_ENDPOINTS.BRANDS), { headers }),
        axios.get(buildApiUrl(API_ENDPOINTS.BRANDS_CATEGORIES), { headers }),
        axios.get(buildApiUrl(API_ENDPOINTS.BRANDS_GROUPED), { headers }),
      ]);
      return {
        items: brandsRes.data?.brands || [],
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
      const slice = getState().brands;
      if (!slice) return true;
      if (slice.status === 'loading') return false;
      if (!arg?.force && !isStale(slice.lastFetched)) return false;
      return true;
    },
  }
);

const brandsSlice = createSlice({
  name: 'brands',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.categories = action.payload.categories;
        state.grouped = action.payload.grouped;
        state.lastFetched = Date.now();
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Request failed';
      })
      .addCase(resetStore, () => initialState);
  },
});

export default brandsSlice.reducer;
