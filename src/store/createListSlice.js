import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { buildApiUrl, getAuthHeaders } from '../utils/apiConfig';
import { isStale } from './constants';
import { resetStore } from './resetStore';

const initialState = {
  items: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  lastFetched: null,
};

/**
 * Builds a standard "list" slice: one array of items fetched from a single
 * GET endpoint, with TTL-based dedup and a shared reset-on-logout handler.
 *
 * @param {string} name        slice name (also the state key)
 * @param {string} endpoint    API endpoint constant (from API_ENDPOINTS)
 * @param {function} selectItems  maps the raw axios response.data to an array
 */
export function createListSlice(name, endpoint, selectItems) {
  const fetchItems = createAsyncThunk(
    `${name}/fetch`,
    async (_arg, { rejectWithValue }) => {
      try {
        const res = await axios.get(buildApiUrl(endpoint), {
          headers: getAuthHeaders(),
        });
        return selectItems(res.data);
      } catch (err) {
        return rejectWithValue(
          err.response?.data?.message || err.message || 'Request failed'
        );
      }
    },
    {
      // Skip the network call when already loading, or when data is still
      // fresh — unless the caller explicitly forces a refetch.
      condition: (arg, { getState }) => {
        const slice = getState()[name];
        if (!slice) return true;
        if (slice.status === 'loading') return false;
        if (!arg?.force && !isStale(slice.lastFetched)) return false;
        return true;
      },
    }
  );

  const slice = createSlice({
    name,
    initialState,
    reducers: {
      // Optimistic/local replacement of the item list (used after mutations).
      setItems(state, action) {
        state.items = action.payload;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchItems.pending, (state) => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(fetchItems.fulfilled, (state, action) => {
          state.status = 'succeeded';
          state.items = action.payload || [];
          state.lastFetched = Date.now();
        })
        .addCase(fetchItems.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload || 'Request failed';
        })
        .addCase(resetStore, () => initialState);
    },
  });

  return { slice, fetchItems, actions: slice.actions };
}
