# Brands Section — Design (frontend-only)

Date: 2026-07-30

## Goal
Add a "Brands" section (its own page) alongside Inventory. It shows three fixed
cards — Panels, Inverters, Cables. Clicking a card opens that type's brand list
with add and delete actions. No backend; brands persist in the browser.

## Placement & routing
- New sidebar item "Brands" (Main Menu, after Inventory) → navigates to `/brands`.
- New page `src/components/Brands.js`, guarded to roles 4 & 5, renders
  `<Sidebar activeMenu="Brands" />`.
- New route `/brands` in `App.js`.

## Data model & storage
- Fixed types: `panels`, `inverters`, `cables` (labels: Panels, Inverters, Cables).
- Brand shape: `{ id, name }` — id generated client-side.
- Persisted in `localStorage` key `brands`:
  `{ panels: [...], inverters: [...], cables: [...] }`. Starts empty. Survives
  reload and logout (catalog config, not session data).

## Redux `brandsSlice`
- Added to the store, hydrated from `localStorage` at startup.
- Reducers: `addBrand({ type, name })`, `deleteBrand({ type, id })`.
- Persistence: a `store.subscribe` writes the `brands` slice to `localStorage`
  on change. Not cleared by `resetStore` (logout).

## UI
- Cards view: three cards with per-type brand counts (styled like Inventory cards).
- Detail view (per type): "← Back", an Add Brand input + button, and a list where
  each row has a Delete button. Empty state when no brands for that type.
- Local-only dispatches; no network calls or loading states.

## Scope
Name-only, 3 fixed types, add/delete only (no edit, no images). Per-browser data.
Swapping to a real backend later means changing only the slice's add/delete plus a
fetch; the UI is unaffected.
