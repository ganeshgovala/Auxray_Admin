import { configureStore } from '@reduxjs/toolkit';
import { reducers } from './slices';
import productsReducer from './productsSlice';
import brandsReducer from './brandsSlice';

export const store = configureStore({
  reducer: {
    ...reducers,
    products: productsReducer,
    brands: brandsReducer,
  },
});
