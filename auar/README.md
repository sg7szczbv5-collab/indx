# AUAR: ride-hailing platform (rider, driver, admin)

A complete ride-hailing system in three apps that share one live state:

| App | Route | Purpose |
|---|---|---|
| Rider app | `#rider` | Book rides and deliveries, track live, pay, rate |
| Driver app | `#driver` | Receive requests, navigate, earnings, sign-up |
| Admin dashboard | `#admin` | Live operations, approvals, pricing, offers, support |
| Live demo | `#demo` | All three together on one screen |

The interface is Arabic (RTL), with currency in SAR and a simulated map of Riyadh. The map is offline SVG and needs no API keys.

## Features

**Rider:** phone + OTP sign-in · "Where to?" search with saved places and pick-on-map · 7 services (Go, Comfort, XL, Black, Her for women, Moto, parcel delivery) with price and ETA for each · fare breakdown · peak pricing · promo codes · scheduled rides with a driver note · payment by card, Apple Pay, wallet or cash · driver search → driver details (car, plate, rating) → live tracking on the map · PIN verification · in-app chat and masked calling · trip sharing · safety tools and an SOS button · cancellation with reasons and a late-cancellation fee · rating with tags and a tip · detailed receipt · trip history (past/upcoming) · wallet top-up · support tickets · notifications · settings and emergency contact.

**Driver:** sign-up in 3 steps (personal details, vehicle, documents) → pending until admin approval · go online/offline · request card with an acceptance countdown, net earnings, distances and rider rating · accept/decline (falls to the next driver on timeout) · turn-by-turn navigation · "Arrived" with a waiting timer · start the trip only with the correct PIN · end trip, cash collection, net earnings after commission · rate the rider · weekly earnings chart · instant cash-out (negative balance = commission owed on cash trips) · inbox · profile, documents, support.

**Admin:** live KPIs (bookings, commission, trips, online drivers, cancellation rate, ratings) · 24-hour bookings chart · service and payment-method breakdowns · live operations map (available / on-trip drivers, demand points) · trips table with filters and search, plus trip details (map, timeline, fare breakdown, chat, cancel, refund) · approve, reject or suspend drivers and review documents · block riders · edit per-service pricing live, enable/disable services, peak multiplier · create and manage promo codes · support ticket inbox with replies · push notifications to riders/drivers · platform settings (commission, cancellation fee, acceptance window, simulation) · activity log · SOS alert banner.

## Two ways to run

**1. Demo mode (browser only):** with no server, the whole platform runs in the browser: data in `localStorage`, windows synced via `BroadcastChannel`. This is what the shareable single-file build uses.

**2. Server mode (real backend):** when the page finds an AUAR server at `/api/health`, it switches automatically:

- **Database:** SQLite (Node's built-in `node:sqlite`), file `data/auar.db`. Only changed rows are written.
- **Real-time:** WebSocket (`/ws`). Each user receives only their own data: riders don't see other riders, drivers never see the trip PIN, and only admins see the log and finances.
- **Real sign-in:** a 6-digit SMS code (expires in 5 minutes, max 5 attempts, 30 s between sends) for riders and drivers; email and password for admins; HMAC-signed tokens.
- **Permissions:** every action is checked on the server: the role, ownership of the trip, account status (suspended/pending).
- **Driver sign-up:** phone verification → details → stays `pending` until approved in the dashboard.
- **SMS:** `console` (development), Unifonic, or Twilio.
- **Payments:** a ledger for all transactions (fares, tips, top-ups, refunds, payouts, cancellation fees) plus a "Payments" page in the dashboard. Wallet top-up goes through **Moyasar**: a hosted payment page, and the wallet is credited only after the server re-checks the invoice with Moyasar.
- **Dispatch:** runs on the server every 0.7 s.

```bash
cd auar
npm install
npm run build
npm run server         # development: http://localhost:8080 (demo data, codes shown in the log)
```

For production:

```bash
cp .env.example .env   # set ADMIN_*, SMS_PROVIDER, PAYMENTS_PROVIDER, AUAR_DEMO=0
npm run build && npm start
# or with Docker:
docker build -t auar . && docker run -p 8080:8080 -v auar-data:/data --env-file .env auar
```

Development with live reload: `npm run server` in one window and `VITE_API_URL=http://localhost:8080 npm run dev` in another.

## Structure

- `src/store/engine.ts`: all business logic (pricing, dispatch, trips, payments, data filtering). It is shared, the same code in the browser and on the server.
- `src/store/store.ts`: the client store (demo mode or server connection), plus sign-in.
- `server/`: `index.ts` (API + WebSocket + static files), `db.ts` (SQLite), `auth.ts` (tokens and codes), `sms.ts`, `payments.ts`.
- `src/lib/geo.ts`: map, routes and ETAs. `src/lib/pricing.ts`: fares.

## Still left before launch

- **Real maps:** the map and routes are currently a simulated city (`geo.ts`), and the driver's position is computed from the route rather than from the phone's GPS. Next: Mapbox/Google, real routing, and GPS location updates from the driver app.
- **Native apps** (React Native / Expo) for the App Store and Google Play, with push notifications.
- **Saved-card payments:** charging fares to the card automatically. Currently "card" trips are recorded in the ledger without a real charge; wallet top-ups are the real charge.
- Uploading document images (currently a checklist), PostgreSQL for large scale, and monitoring and backups.

> The Moyasar, Unifonic and Twilio integrations are written against each provider's public documentation and were not tested against live accounts. Test them in each provider's sandbox before launch.
