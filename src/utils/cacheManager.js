// Cache Manager Utility
// Use this to manage caching across different sections

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Generic cache functions
export const getCache = (key) => {
  const cachedData = sessionStorage.getItem(key);
  const cacheTimestamp = sessionStorage.getItem(`${key}_timestamp`);
  
  if (!cachedData || !cacheTimestamp) {
    return null;
  }

  const age = Date.now() - parseInt(cacheTimestamp);
  
  if (age >= CACHE_DURATION) {
    clearCache(key);
    return null;
  }

  return JSON.parse(cachedData);
};

export const setCache = (key, data) => {
  sessionStorage.setItem(key, JSON.stringify(data));
  sessionStorage.setItem(`${key}_timestamp`, Date.now().toString());
};

export const clearCache = (key) => {
  sessionStorage.removeItem(key);
  sessionStorage.removeItem(`${key}_timestamp`);
};

export const clearAllCache = () => {
  sessionStorage.clear();
};

// Specific cache functions for each section
export const getCachedDashboardData = () => getCache('dashboardData');
export const setCachedDashboardData = (data) => setCache('dashboardData', data);
export const clearDashboardCache = () => clearCache('dashboardData');

export const getCachedLeadsData = () => getCache('leadsData');
export const setCachedLeadsData = (data) => setCache('leadsData', data);
export const clearLeadsCache = () => clearCache('leadsData');

export const getCachedQuotesData = () => getCache('quotesData');
export const setCachedQuotesData = (data) => setCache('quotesData', data);
export const clearQuotesCache = () => clearCache('quotesData');

export const getCachedRemindersData = () => getCache('remindersData');
export const setCachedRemindersData = (data) => setCache('remindersData', data);
export const clearRemindersCache = () => clearCache('remindersData');

export const getCachedRegistrationsData = () => getCache('registrationsData');
export const setCachedRegistrationsData = (data) => setCache('registrationsData', data);
export const clearRegistrationsCache = () => clearCache('registrationsData');

export const getCachedTeamMembersData = () => getCache('teamMembersData');
export const setCachedTeamMembersData = (data) => setCache('teamMembersData', data);
export const clearTeamMembersCache = () => clearCache('teamMembersData');

export const getCachedInventoryData = () => getCache('inventoryData');
export const setCachedInventoryData = (data) => setCache('inventoryData', data);
export const clearInventoryCache = () => clearCache('inventoryData');

export const getCachedInstallationsData = () => getCache('installationsData');
export const setCachedInstallationsData = (data) => setCache('installationsData', data);
export const clearInstallationsCache = () => clearCache('installationsData');

