# 🤖 AGENT INSTRUCTIONS: REPOSITORY STANDARDS

This document serves as the ground truth for any AI Coding Assistant (Agent) working on this repository. Follow these instructions strictly to maintain the architectural integrity of the "Data Terminal" portfolio.

---

## 🏛️ CORE ARCHITECTURE

This repository uses a **Subdirectory-based Clean URL** architecture. All projects must reside in dedicated folders to support extension-less URLs on GitHub Pages.

### 1. File Location Standards
- **Projects:** Every project MUST have its own directory containing an `index.html`.
  - ✅ Correct: `/my-new-project/index.html`
  - ❌ Incorrect: `/my-new-project.html`
- **Data:** All datasets (JSON, DSV, CSV) MUST be stored in the centralized `/data/` directory, organized by Year and Semester.
  - ✅ Correct: `/data/2026/genap/my-project/db.json`
  - ❌ Incorrect: `/data/my-project/db.json`
- **Assets:** Global assets go to `/data/etc/`.

### 2. Pathing & Fetching
Agents must use **Relative Paths** for internal data fetching to ensure local testing and production deployment work identically.
- Inside a project (e.g., `/surveillance/index.html`), call data using:
  ```javascript
  const API_BASE = '../data/living-jungle';
  ```
- **NEVER** use absolute paths like `/home/user/...` or root-absolute paths `/data/...` if the project might be hosted on a sub-path.

### 3. Legacy Redirect Shells
The `.html` files at the root (e.g., `surveillance.html`, `galaxy.html`) are **Redirect Shells**.
- **DO NOT EDIT** these files unless specifically asked to change a redirect destination.
- **DO NOT** move them into subfolders; they must stay at the root to prevent breaking external shared links.

---

## 🧩 MODULAR ECOSYSTEM GOAL (`/dev/`)

The ultimate goal of this repository is to transition from monolithic, "vibecoded" HTML files into a **Super Modular ES6 Architecture** located in the `/dev/` directory.

### 1. Data Switchability
- The system must support easy switching of datasets (e.g., changing from `2026/genap` to `2026/ganjil`).
- This should be managed centrally via a config file (e.g., `dev/js/config.js`) so that developers/agents only need to change a single configuration variable to load an entirely different dataset for the whole ecosystem.

### 2. Extensibility
- New features, UI components, and API handlers must be built as independent ES6 modules (`api.js`, `utils.js`, `main.js`, etc.).
- Avoid dumping all logic into a single HTML file. Keep the HTML strictly for structure and Tailwind classes, while all state and logic are handled by Javascript modules.

### 3. Static Server Compatibility
- All infrastructure and data fetching MUST be fully compatible with standard static HTTP servers (e.g., GitHub Pages). Do not introduce server-side dependencies (like Node.js routes or SSR) for the core applications.

---

## 🔍 PROJECT-SPECIFIC CONTEXT

### 🏝️ Course Island (`/course-island/`)
- **Tech:** Vanilla JS, Custom CSS for fluid wave effects.
- **Data:** Loads multiple `db_matkul_N.json` files from `../data/course-island/`.
- **Note:** Uses a "page-based" loading system for performance.

### 🌿 Living Jungle (`/surveillance/`)
- **Tech:** Chart.js, Phosphor Icons, Custom Radar Canvas.
- **Data:** Fetches `global_index.json` and `stats.json` from `../data/living-jungle/`.
- **Note:** Heavily reliant on CSS variables for theme switching (Dark/Light).

### 🌌 Uni Galaxy (`/galaxy/`)
- **Tech:** Sigma.js, Graphology.
- **Data:** Fetches DSV files from `../data/uni-galaxy/`.
- **Note:** High-memory usage; ensure efficient data processing when modifying graph logic.

---

## 🛠️ WORKFLOW FOR ADDING NEW PROJECTS

When asked to add a new project "X":
1.  **Create Folder:** `mkdir X`
2.  **Initialize index.html:** Create `X/index.html`.
3.  **Setup Data:** Create `data/X/` and move all relevant datasets there.
4.  **Update Links:** Update the Main Terminal (`/index.html`) to point to `X/` (not `X/index.html`).
5.  **Create Redirect (Optional):** If the user wants a legacy-style link, create `X.html` at the root with a meta-refresh redirect to `/X/`.

---

## 📂 DOCUMENTATION & ROADMAP

- **`/docs/file_descriptions.md`**: Detailed mapping of every file's purpose in the new `/dev/` ecosystem.

---

## ⚠️ PROHIBITED ACTIONS
- **NEVER** perform an automatic `git push` under ANY circumstances. The user will handle all github pushes manually.
- **DO NOT** use TailwindCSS classes unless explicitly requested.
- **DO NOT** change the logic of existing visualizations without creating a backup/branch first.
- **DO NOT** delete files in `/data/` without verifying if other projects depend on them.
- **DO NOT** add `.html` extensions to links in the main navigation.

---
*Last Updated: 2026-05-09*
