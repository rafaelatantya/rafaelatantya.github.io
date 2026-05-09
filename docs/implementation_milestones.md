# Implementation Milestones: Super Modular Ecosystem (`/dev/`)

> **Note:** Delete this file once all milestones are successfully completed.

This document serves as the shared roadmap for multiple AI Agents to collaborate on refactoring the Data Terminal portfolio into a highly scalable and modular ES6 architecture.

## 🎯 Goal
Transition from a monolithic "vibecoded" architecture into a scalable, modular framework inside `/dev/`. Ensure that swapping datasets (e.g., from `2026/genap` to `2026/ganjil`) only requires changing a single config variable. All infrastructure MUST remain fully compatible with standard static HTTP servers (e.g., GitHub Pages).

## 🗺️ Milestones

### Phase 1: Core Foundation & Configuration (In Progress)
- [x] Establish the `/dev/` directory structure (`css/`, `js/`, `assets/`).
- [x] Create a centralized configuration file (`dev/js/config.js`) to manage global states like `YEAR`, `SEMESTER`, and API endpoints.
- [x] Migrate `Course Island` logic into modular ES6 files (`main.js`, `api.js`, `utils.js`).
- [x] Ensure all API fetches and data path generations strictly adhere to the central `CONFIG` object via relative paths.

### Phase 2: Refactoring Existing Projects
- [x] Refactor **Living Jungle** (`surveillance/index.html`) to use the modular `/dev/` architecture.
    - [x] Extract Chart/ApexCharts logic into a separate `analytics.js` module.
    - [x] Extract data fetching logic into `api.js`.
- [ ] Refactor **Uni Galaxy** (`galaxy/index.html`) to use the modular `/dev/` architecture.
    - Move Sigma.js and Graphology logic into a `graph.js` module.
    - Handle `.dsv` parsing in a dedicated `parser.js` module.

### Phase 3: Static Server & Data Testing
- [ ] Verify that changing `YEAR` and `SEMESTER` in `dev/js/config.js` properly updates the dataset targets across all visualizations without breaking.
- [ ] Test the entire `/dev/` ecosystem using a standard local static server (e.g., `python -m http.server` or `npx serve`) to guarantee zero backend dependencies.
- [ ] Implement robust error handling for missing datasets (e.g., gracefully handling a 404 if a specific semester's data hasn't been uploaded yet).

### Phase 4: Final Polish & Migration
- [ ] Optimize load performance across all modules using dynamic imports where appropriate.
- [ ] Document the new module structures in `AGENTS.md` (or a dedicated docs file).
- [ ] Remove monolithic `.html` files from root/subdirectories if they are fully superseded by the new architecture.

### Phase 5: Historical Data Architecture (Time Machine)
- [ ] **Data Registry**: Create a centralized `data/manifest.json` listing all available Year/Semester periods in the repository.
- [ ] **Runtime State Migration**: Refactor `dev/js/config.js` to support reactive state changes.
    - Move `YEAR` and `SEMESTER` from constants to a state object.
    - Implement a `updateConfig(newYear, newSem)` function that triggers re-initialization.
- [ ] **Universal Navigation Widget**: Build a "Time Machine" UI component in `/dev/js/utils.js` (dropdown or timeline) that can be injected into any modular app.
- [ ] **Persistence Layer**: Implement URL Parameter synchronization (e.g., `index.html?y=2024&s=ganjil`) so that historical views can be bookmarked and shared.
- [ ] **Cross-Period Comparison**: Update `api.js` to allow passing explicit `year` and `semester` arguments, enabling comparisons between different historical snapshots.

- [ ] Delete this `implementation_milestones.md` file.
