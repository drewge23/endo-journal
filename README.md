# Endo Journal

Log endometriosis symptoms by cycle day, track medications, methods and habits, and see whether what you're trying helps — with a printable report for your doctor.

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
