import { createListSlice } from './createListSlice';
import { API_ENDPOINTS } from '../utils/apiConfig';

// Response-shape extractors for each endpoint.
const pickLeads = (data) => data?.leads || [];
const pickQuotes = (data) => data?.quotes || [];
const pickInstallations = (data) => data?.data || [];
const pickUsers = (data) => data?.users || [];
const pickRegistrations = (data) =>
  Array.isArray(data) ? data : data?.data || data?.registrations || [];

const leads = createListSlice('leads', API_ENDPOINTS.LEADS_ALL, pickLeads);
const quotes = createListSlice('quotes', API_ENDPOINTS.QUOTES_ALL, pickQuotes);
const reminders = createListSlice(
  'reminders',
  API_ENDPOINTS.LEADS_UPCOMING_REMINDERS,
  pickLeads
);
const registrations = createListSlice(
  'registrations',
  API_ENDPOINTS.REGISTRATIONS_PENDING,
  pickRegistrations
);
const installations = createListSlice(
  'installations',
  API_ENDPOINTS.LEADS_INSTALLATIONS,
  pickInstallations
);
const teamMembers = createListSlice(
  'teamMembers',
  API_ENDPOINTS.USERS_BY_ROLE,
  pickUsers
);

export const fetchLeads = leads.fetchItems;
export const fetchQuotes = quotes.fetchItems;
export const fetchReminders = reminders.fetchItems;
export const fetchRegistrations = registrations.fetchItems;
export const fetchInstallations = installations.fetchItems;
export const fetchTeamMembers = teamMembers.fetchItems;

// setItems action creators (for optimistic updates after mutations).
export const setLeads = leads.actions.setItems;
export const setQuotes = quotes.actions.setItems;
export const setRegistrations = registrations.actions.setItems;
export const setTeamMembers = teamMembers.actions.setItems;

export const reducers = {
  leads: leads.slice.reducer,
  quotes: quotes.slice.reducer,
  reminders: reminders.slice.reducer,
  registrations: registrations.slice.reducer,
  installations: installations.slice.reducer,
  teamMembers: teamMembers.slice.reducer,
};
