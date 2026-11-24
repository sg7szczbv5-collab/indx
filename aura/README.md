# AURA — Complete Mobility Ecosystem · منظومة أورا للتنقل الذكي

**تنقّل بثقة — Move with Confidence.** Saudi Smart Mobility, Global Standards.

Three products, one design system, one data model and one trip lifecycle:

| Route | Product | Character |
|---|---|---|
| `#/passenger` | **AURA Passenger** (rider app, mobile-first) | Light, calm, map-led |
| `#/driver` | **AURA Driver** (captain app, mobile-first) | Dark, high-contrast, large touch targets |
| `#/admin/overview` | **AURA Admin** (operations console, desktop-first) | Black sidebar, dense SaaS tables |
| `#/ecosystem` | All three side by side, driven by the same trip | |
| `#/design` | Design system reference | |

> **Demo build.** Every name, number, price, rating and statistic is generated demo data (marked "بيانات تجريبية / Demo data" in the UI). There are no real payments, calls, SMS, OTPs or dispatch. Integrations that need contracts or keys (payment gateways, Apple/Google sign-in, maps, ZATCA e-invoicing, masked calling) are shown as "not connected", never faked.

## Run

```bash
cd aura
npm install
npm run dev        # http://localhost:5180
npm test           # core unit tests (state machine, pricing, lifecycle, RBAC audit)
npm run build      # typecheck + production build → dist/
npm run build:share  # single self-contained HTML → dist-share/index.html
```

### Demo accounts
| App | Login |
|---|---|
| Passenger | `55 765 4321`, code `2468` (any other number → new account) |
| Driver | `55 123 4567`, code `1357` (any other number → new captain application) |
| Admin | `admin@aura.demo` / `Aura@2026`, 2FA `246810`. Other roles: `ops@`, `finance@`, `support@`, `captains@`, `marketing@` (same password) |

### Try the full cycle
1. Open `#/ecosystem` (or the three apps in separate browser tabs; they sync through `localStorage`).
2. Driver: **Go online**. Passenger: request an **Aura Go/Comfort** ride.
3. The offer appears in the Driver app with a countdown → accept → navigate → **I've arrived** → enter the rider's 4-digit code (shown in the Passenger app) → end trip.
4. Watch the status, fare, commission and captain net in Admin → Trips. If no captain accepts, a simulated captain takes it (toggle in Admin → Settings → App).
5. Register a new captain in the Driver app, then approve it in Admin → Captains → Applications: the Driver app updates instantly.

## Structure

```
src/
  core/                 shared by all three apps (framework-agnostic TypeScript)
    types.ts            domain model: Trip, Driver, Customer, Vehicle, Zone, Ticket, Promo, roles…
    trip.ts             unified states + allowed transitions per actor
    pricing.ts          vehicle classes, tariffs per city/class, VAT, commission, promos (halalas)
    geo.ts              Riyadh places/roads/districts (real lat/lng), routing, distance
    fleet.ts            deterministic simulated fleet (time-based, same in every tab)
    seed.ts             generated demo data + role permission defaults
    store.ts            persistent cross-tab store, actions, dispatcher (Web Locks leader)
  ds/                   design system: tokens, Logo (traced from brand book), UI primitives, Device frame, vehicles
  map/CityMap.tsx       offline vector map in the brand map language (swap for Mapbox/Google later)
  i18n/                 Arabic RTL / English LTR
  apps/passenger/       12 screens + tabs (Trips, Wallet, Account) and sub-pages
  apps/driver/          onboarding, home, offer, navigation, verification, summary, earnings, performance, account
  apps/admin/           15 modules, role-based access, data tables, drawers, charts
  app/                  router, launcher, ecosystem view, design-system page
tests/core.test.ts
public/                 aura-wordmark-*.svg, aura-app-icon.svg (exact vectors from the brand book)
```

### Unified trip states
`searching → driver_assigned → driver_arriving → driver_arrived → in_progress → completed`, plus `cancelled`. Transitions and who may perform them live in `src/core/trip.ts` and are enforced by every action.

### Roles
Super Admin, Operations Manager, Finance Manager, Customer Support, Driver Manager, Marketing Manager. Each has its own permission set (editable by Super Admin in **Users & roles**); navigation, pages and actions are gated, and every admin action is written to the **Audit log**.

## Going to production
- **Backend:** replace `actions` in `core/store.ts` with API/WebSocket calls; the UI depends only on their signatures. Move OTP, auth, 2FA and sessions server-side.
- **Maps:** replace `map/CityMap.tsx` with a commercial SDK; all data is already lat/lng.
- **Payments:** licensed gateway (mada, Apple Pay, STC Pay); ZATCA e-invoicing for VAT.
- **Mobile:** the passenger/driver apps are responsive web; `core/` can be shared with a React Native build (see `../masra-rider` for an Expo setup).
- **Regulatory:** TGA licensing and integration before launch. Tariffs here are placeholders.

Previous projects in this repository (`masra/`, `masra-rider/`, …) are untouched.
