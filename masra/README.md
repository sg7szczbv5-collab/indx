# مَسْرى | MASRA — Interactive Investor Experience

An interactive investor presentation and working prototype for a Saudi ride-hailing platform. It is fully RTL and works on desktop and mobile.

> All data is illustrative (demo). There is no real sign-in, payment, or trip dispatch, and no paid services or API keys are used.

## Running

```bash
cd masra
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # preview the build at http://localhost:4173
```

## Structure

```
src/
  App.tsx                 # presentation shell: navigation, keyboard, fullscreen, side menu, progress bar
  index.css               # visual identity (Tailwind v4 @theme)
  components/
    Logo.tsx              # MASRA mark (road + direction)
    PhoneFrame.tsx        # realistic phone frame that scales to the screen
    MapCanvas.tsx         # offline SVG city map with route and car movement
    EasternMap.tsx        # illustrative map of Dammam, Khobar and Dhahran
    Summary.tsx           # investment summary (printable)
    ui.tsx                # shared UI pieces
  apps/rider/RiderApp.tsx   # rider app: 9 interactive screens
  apps/driver/DriverApp.tsx # driver app: 15 interactive steps
  slides/                   # the 14 slides
  data/                     # planning data (pricing, budget, roadmap, sources)
  hooks/useProgress.ts      # timed animation for the trip simulation
```

## Keyboard shortcuts
`←` next · `→` previous · `Space`/`PageDown` · `Home`/`End` · `F` fullscreen · `M` menu · `S` summary · `Esc` close

Direct link to any slide: `#rider`, `#driver`, `#admin`, `#revenue` …

## Market data sources
- TGA annual report 2024 (via Argaam): 80.5 million trips, SAR 2.3 billion, 63.9 million trips in 2023.
- GASTAT 2022 census: 32.18 million people.
- Dammam and Khobar populations come from secondary sources quoting the 2022 census. Confirm them against portal.saudicensus.sa before official use.
