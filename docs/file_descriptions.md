# 📁 Data Terminal: Ecosystem File Descriptions

This document outlines the purpose of each file in the modular Data Terminal ecosystem.

## 🗂️ Root Directory
- `index.html`: The Main Terminal entry point. A monolithic landing page acting as a portal to all data apps.
- `AGENTS.md`: Ground Truth instructions for AI Agents. Defines architecture standards and prohibited actions.
- `package.json` & `server.js`: Development utilities for running a local static HTTP server (Express) with Gzip compression and CORS enabled.

## 🔗 Legacy Redirect Shells
*These files exist to maintain legacy link compatibility and simply redirect to the actual directories.*
- `course-explorer.html`
- `surveillance.html`
- `galaxy.html`

## 📦 `/data/` (Centralized Data Storage)
Follows the architecture `data/{YEAR}/{SEMESTER}/{project}/...`
- Contains all raw static API JSON, CSV, and DSV files fetched by the applications.

## 🛠️ `/dev/` (Modular Development Architecture)
This is the core modular workspace where new features are built using modern ES6 modules.

### `/dev/course-island/`
- `index.html`: Development staging UI for Course Island.

### `/dev/surveillance/`
- `index.html`: Development staging UI for Living Jungle (Traffic Surveillance).

### `/dev/galaxy/`
- `index.html`: Development staging UI for Uni Galaxy (Network Graph).

### `/dev/js/` (Core Logic)
- `config.js`: The central "Brain" of the ecosystem. Holds the `YEAR` and `SEMESTER` variables. Uses `import.meta.url` to dynamically resolve paths to the `/data/` directory, making the app immune to routing depth issues.
- `api.js`: Handles all data fetching and parsing logic. Contains progress bar calculators and chunk decoders.
- `analytics.js`: Centralized visualization engine. Wraps ApexCharts logic for traffic heatmaps and bar charts.
- `utils.js`: Reusable UI/UX utilities (like the liquid ripple explosion effects, debouncers, etc.).
- `main.js`: Main logic entry point for **Course Island**. Handles the search state, UI DOM manipulation, and debouncing.
- `surveillance.js`: Main logic entry point for **Living Jungle**. Handles live traffic smart time calculation and matrix generation.
- `parser.js`: Specific data parser for Uni Galaxy's `.dsv` files (handles stream loading of graph structures).
- `graph.js` *(planned)*: Future logic for Sigma.js and Graphology integration.
- `galaxy.js` *(planned)*: Future main logic entry point for Uni Galaxy.
