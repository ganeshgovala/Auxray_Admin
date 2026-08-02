// Shared caching constants for the Redux store.
export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// A slice's data is stale if it has never been fetched or the TTL has elapsed.
export const isStale = (lastFetched) => {
  if (!lastFetched) return true;
  return Date.now() - lastFetched >= CACHE_TTL;
};
