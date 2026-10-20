# Endo Journal

Log endometriosis symptoms by cycle day, track medications, methods and habits, and see whether what you're trying helps — with a printable report for your doctor.

Live at **https://drewge23.github.io/endo-journal/**

All data stays in the browser (localStorage). Use Settings → Export backup to keep a copy or move devices.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # cycle + stats unit tests
npm run build    # static site in dist/
```

## Structure

- `src/lib/` — data model (`types.ts`), cycle detection and phases (`cycle.ts`), monthly stats and before/after comparisons (`stats.ts`), method library content (`library.ts`), sample data
- `src/screens/` — Today, My plan, Insights, Library, Doctor report, Settings

## Install on a phone

Open the link, then:
- **iPhone (Safari):** Share → Add to Home Screen
- **Android (Chrome):** ⋮ menu → Install app

It then opens full screen and works offline. Each browser/device keeps its own data — use Settings → Export / Import backup to move it.

## Deploy

Every push to `main` runs the tests, builds with `BASE_PATH=/endo-journal/` and publishes to GitHub Pages (`.github/workflows/deploy.yml`).
