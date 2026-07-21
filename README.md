# DeepFind — PowMr Solar Product Selection Tool

An interactive solar sizing wizard that helps homeowners find the right PowMr inverter, battery, and ESS system based on their power needs. Built on PowMr's official product lineup and documentation.

## Features

- **C-end Wizard** — Step-by-step appliance-based sizing for non-technical users
- **B-end Catalog** — Full PowMr product browsing with filtering by type, voltage, and specs
- **Auto Recommendation** — Matches your load profile to the optimal PowMr inverter + battery + ESS combo
- **Product Pages** — Quick links to official PowMr product pages and manuals
- **Collection Drawer** — Save and compare favorite PowMr products

## Tech Stack

ES Modules (ESM) with layered architecture plus a lightweight Python local server. No build step required.

## Project Structure

```text
.
├── app.py                  # Local entry point to run the project
├── index.html              # HTML shell and GA4 tag
├── css/
│   └── styles.css          # Frontend styles
├── assets/                 # Static images and media
└── js/
    ├── app.js              # Frontend bootstrap
    ├── data/               # Product and preset datasets
    ├── logic/              # Recommendation and sizing rules
    ├── ui/                 # Dynamic page rendering
    └── utils/              # Shared helpers
```

Key logic modules:

- `js/logic/recommendation.js` — inverter, battery, and ESS recommendation rules
- `js/logic/load-analysis.js` — load aggregation and power calculations
- `js/logic/calculator.js` — high-level facade used by the UI layer

## Getting Started

Run the local server:

```bash
python app.py
```

Then open `http://127.0.0.1:8000`.

You can also deploy the same files directly to any static host such as Cloudflare Pages, Netlify, or Vercel.
