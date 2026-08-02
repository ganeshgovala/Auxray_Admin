# Redux Toolkit Global Store — Design

Date: 2026-07-30

## Problem

1. **Sidebar shows false/inconsistent data.** Count badges are passed per-page as
   props with different semantics (Dashboard passes `openLeads`/`pendingQuotes`,
   list pages pass totals, most pages pass nothing → `0`). Registrations and
   Installations badges are hardcoded to `0` in `Sidebar.js`.
2. **Duplicate API calls.** Dashboard fetches leads/quotes/reminders/registrations/
   team members; each list page then re-fetches the same data. The sessionStorage
   `cacheManager` caches per-section but the same dataset is stored under different
   keys, so no real sharing.

## Solution

Introduce a Redux Toolkit store as the single source of truth for shared datasets.
The sidebar reads consistent totals from the store on every page; pages read from
the store and only hit the API when data is missing or stale.

### Store layout (`src/store/`)
- `store.js` — `configureStore` with all slice reducers.
- `constants.js` — `CACHE_TTL` (5 min) + `isStale(lastFetched)`.
- Slices (one per domain): `leads`, `quotes`, `reminders`, `registrations`,
  `installations`, `teamMembers`, `products`.

Each slice state: `{ items, status, error, lastFetched }` (products also holds
`categories` and `grouped`). Each exposes an async thunk `fetch<Domain>` wrapping
the existing axios call + `getAuthHeaders()`, with a `condition` that skips the
request when already loading or fetched within `CACHE_TTL`, unless dispatched with
`{ force: true }`. A root `resetStore` action clears all slices on logout.

### Sidebar
Reads counts via `useSelector` (totals). No count props. Registrations and
Installations badges wired to real totals. Logout dispatches `resetStore()`.

### Component refactors
- Dashboard, Leads, Quotes, Reminders, Registrations, Installations, TeamMembers,
  Inventory: read from store, dispatch fetch on mount (deduped by TTL), Refresh
  dispatches `{ force: true }`.
- Detail pages (LeadDetails, QuoteDetails, RegistrationDetails): select the record
  from the store's loaded list; fetch only if the list is empty.
- Mutations dispatch the relevant `fetch...({ force: true })` after success.

### Removed
`src/utils/cacheManager.js` and its imports (superseded by store TTL).

## Out of scope
Auth/token architecture, new single-record backend endpoints, converting
fetch-all-then-find endpoints (store reuse mitigates the call volume).

## Freshness note
Badges/totals reflect the last fetch; within the 5-min TTL a value may lag until
Refresh or TTL expiry — acceptable for an admin panel.
