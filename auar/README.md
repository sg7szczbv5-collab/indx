# AUAR: ride-hailing platform (rider, driver, admin)

A complete ride-hailing system in three apps that share one live state:

| App | Route | Purpose |
|---|---|---|
| Rider app | `#/rider` | Book rides and deliveries, track live, pay, rate |
| Driver app | `#/driver` | Receive requests, navigate, earnings, sign-up |
| Admin dashboard | `#/admin` | Live operations, approvals, pricing, offers, support |
| Live demo | `#/demo` | All three together on one screen |

The interface is Arabic (RTL), with currency in SAR and a simulated map of Riyadh. The map is offline SVG and needs no API keys.

## Features

**Rider:** phone + OTP sign-in · "Where to?" search with saved places and pick-on-map · 7 services (Go, Comfort, XL, Black, Her for women, Moto, parcel delivery) with price and ETA for each · fare breakdown · peak pricing · promo codes · scheduled rides with a driver note · payment by card, Apple Pay, wallet or cash · driver search → driver details (car, plate, rating) → live tracking on the map · PIN verification · in-app chat and masked calling · trip sharing · safety tools and an SOS button · cancellation with reasons and a late-cancellation fee · rating with tags and a tip · detailed receipt · trip history (past/upcoming) · wallet top-up · support tickets · notifications · settings and emergency contact.

**Driver:** sign-up in 3 steps (personal details, vehicle, documents) → pending until admin approval · go online/offline · request card with an acceptance countdown, net earnings, distances and rider rating · accept/decline (falls to the next driver on timeout) · turn-by-turn navigation · "Arrived" with a waiting timer · start the trip only with the correct PIN · end trip, cash collection, net earnings after commission · rate the rider · weekly earnings chart · instant cash-out (negative balance = commission owed on cash trips) · inbox · profile, documents, support.

**Admin:** live KPIs (bookings, commission, trips, online drivers, cancellation rate, ratings) · 24-hour bookings chart · service and payment-method breakdowns · live operations map (available / on-trip drivers, demand points) · trips table with filters and search, plus trip details (map, timeline, fare breakdown, chat, cancel, refund) · approve, reject or suspend drivers and review documents · block riders · edit per-service pricing live, enable/disable services, peak multiplier · create and manage promo codes · support ticket inbox with replies · push notifications to riders/drivers · platform settings (commission, cancellation fee, acceptance window, simulation) · activity log · SOS alert banner.

## How it works

- `src/store/store.ts`: one shared store. It is saved to `localStorage` and synced between open windows via `BroadcastChannel`, so you can open the rider in one window and the driver in another and watch them update live.
- Dispatch offers each request to the nearest available driver in turn, respecting service and gender (for AUAR Her). The demo driver account gets priority when online, so the full flow can be tried by hand. Otherwise simulated drivers accept and complete trips automatically.
- Time is compressed for the demo (`speed` in the admin settings).
- `src/lib/geo.ts`: city grid, street-following routing, distances and ETAs. `src/lib/pricing.ts`: fare formula, discounts, commission.

## Running

```bash
cd auar
npm install
npm run dev          # http://localhost:5174
npm run build        # dist/
npm run build:share  # dist-share/index.html: a single self-contained file
```

> Prototype with demo data: no real backend, payments or SMS. To go to production, replace `store.ts` with an API (e.g. Node/Postgres + WebSocket), real maps (Mapbox/Google), payments (Moyasar/HyperPay), SMS for OTP, and build native apps (React Native/Expo) from the same screens.
