# ScrollGenius (MVP)

A minimal, production-minded **GTM JSON generator** for **accurate GA4 scroll depth**, with optional **AJAX form tracking**.

- No database, no keys required.
- **Premium** demo unlock: use code `DEMO-PRO` (stored in `localStorage`) – replace with Stripe/PayPal later.
- Ships with a **Custom HTML scroll listener** that pushes `scrollGeniusThreshold` to `dataLayer`, and a GA4 Event tag that forwards `percent_scrolled`.

## Run locally

```bash
npm i
npm run dev
```

## Import into Google Tag Manager

1. In GTM, create a new container (or version).
2. Click **Admin → Import Container**.
3. Choose the exported JSON from ScrollGenius.
4. Select **Merge** and "Overwrite conflicting tags" to replace previous scroll tracking.
5. Publish the workspace.

## API

The `/api/generate` endpoint accepts:

```json
{
  "ga4MeasurementId": "G-XXXXXXX",
  "eventName": "scroll_depth_custom",
  "thresholds": "25,50,75,100",
  "selectors": "#footer, .cookie",
  "spaFix": true,
  "ajaxForms": false,
  "premium": true
}
```

It returns a GTM [exportFormatVersion=2] JSON. Thresholds and selectors are only honored when `premium=true`.

## Notes

- MVP uses in-browser localStorage to persist unlock state. Replace with a real billing/auth flow later.
- Built with Next.js App Router (`app/` directory) and a small GTM builder library in `lib/`.
- Styling is hand-crafted (no Tailwind) to mimic GTM aesthetics.
