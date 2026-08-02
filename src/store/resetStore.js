import { createAction } from '@reduxjs/toolkit';

// Dispatched on logout. Every slice resets to its initial state in extraReducers.
export const resetStore = createAction('app/resetStore');
