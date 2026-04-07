// API Configuration
export const API_BASE_URL = 'http://13.233.124.12:5000';

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  CREATE_USER: '/api/auth/create-user',
  
  // Users and Team Members
  USERS_BY_ROLE: '/api/users/by-role/all',
  USER_DELETE: '/api/users',
  
  // Leads
  LEADS_ALL: '/api/leads/all',
  LEADS_INSTALLATIONS: '/api/leads/installations',
  LEADS_UPCOMING_REMINDERS: '/api/leads/upcoming-reminders',
  
  // Quotes
  QUOTES_ALL: '/api/quotes/all',
  
  // Registrations
  REGISTRATIONS_PENDING: '/api/registrations/second-level-registrations-pending',
  REGISTRATIONS_ASSIGN: '/api/registrations/assign',
  REGISTRATIONS_UPDATE_TIMELINE: '/api/registrations/update-timeline-to-next-stage',
  REGISTRATIONS_STAFF_ACTIVE: '/api/registrations/staff',
  REGISTRATION_DETAILS: '/api/registration',
  
  // Products and Inventory
  PRODUCTS: '/api/products',
  PRODUCTS_CREATE: '/api/products/create-product',
  PRODUCTS_DELETE: '/api/products',
  PRODUCTS_CATEGORIES: '/api/products/categories',
  PRODUCTS_GROUPED: '/api/products/grouped',
  
  // Installations
  INSTALLATIONS: '/api/installations'
};

// Helper function to build complete API URL
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Common axios configuration
export const getAuthHeaders = (token = null) => {
  const authToken = token || localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    'accept': 'application/json'
  };
};