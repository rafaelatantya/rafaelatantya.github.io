# RAFAEL ATANTYA • DATA TERMINAL
[![Status](https://img.shields.io/badge/System-Online-33ff00?style=flat-square&logo=git&logoColor=white)](https://rafaelatantya.github.io)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

> **High-performance interactive data visualizations and creative development playground.**

Welcome to the central terminal of my digital portfolio. This repository hosts a collection of specialized data visualization projects, each designed to explore different facets of information architecture and interactive storytelling.

---

## 🚀 Featured Projects

### 🏝️ [Course Island](https://rafaelatantya.github.io/course-island/)
**Project ID:** `001` | **Status:** `Active`
Interactive IPB course database visualization. This project maps academic data into a fluid, archipelago-inspired interface, allowing users to navigate through curriculum structures like explorers navigating a digital sea.

### 🌿 [Living Jungle](https://rafaelatantya.github.io/surveillance/)
**Project ID:** `002` | **Status:** `Active`
A real-time traffic monitoring and surveillance system embedded in a bio-digital ecosystem. It visualizes data flow and activity patterns within a simulated forest environment, merging industrial monitoring with organic aesthetics.

### 🌌 [Uni Galaxy](https://rafaelatantya.github.io/galaxy/)
**Project ID:** `003` | **Status:** `Active`
A massive 2D Network Graph mapping student relationships. Utilizing shortest-path algorithms and graph theory (Sigma.js), it visualizes the social and academic connectivity within a university-scale dataset.

---

## 🛠️ System Architecture

### 1. Clean URLs (Subdirectory-based)
The repository implements a modern directory structure to support "Clean URLs" on GitHub Pages. Instead of accessing projects via `.html` extensions, each project lives in its own directory:
- `/surveillance/` (served from `/surveillance/index.html`)
- `/course-island/` (served from `/course-island/index.html`)

### 2. Legacy Redirect Support
To maintain 100% compatibility with legacy links shared across social media (e.g., `by.atantya.com/surveillance.html`), the root directory contains **Redirect Shells**. These are lightweight HTML files that automatically route users to the new directory structure without breaking existing traffic.

### 3. Consolidated Data Layer (`/data/`)
All datasets, JSON objects, and DSV files are consolidated into a centralized `/data/` directory. This ensures a clean separation between application logic and raw data, facilitating easier updates and better cache management.

---

## 📁 Repository Map

```text
.
├── course-island/      # Project 1: Course Database Visualization
├── surveillance/       # Project 2: Traffic & Surveillance System
├── galaxy/             # Project 3: Social Network Graph
├── data/               # Centralized Datasets
│   ├── course-island/  # JSON assets for Course Island
│   ├── living-jungle/  # Real-time traffic datasets
│   ├── uni-galaxy/     # DSV files for Graph visualizations
│   └── etc/            # Shared assets (thumbnails, icons)
├── surveillance.html   # Redirect Shell (Legacy)
├── galaxy.html         # Redirect Shell (Legacy)
├── course-explorer.html # Redirect Shell (Legacy)
└── index.html          # Main Terminal Entry Point
```

---

## 💻 Technical Specification

- **Core Engine:** Vanilla HTML5, CSS3 (Neon-Glassmorphism), JavaScript (ES6+)
- **Visualization Libraries:** D3.js, Sigma.js, Graphology, Canvas API
- **Typography:** JetBrains Mono, Syncopate, Space Grotesk
- **Deployment:** GitHub Pages (Automated Deployment via `main`)

---

## 🛡️ Maintenance
If you are contributing or modifying this repository:
1.  **Project Standard:** Each new project must be placed in its own subdirectory with an `index.html`.
2.  **Data Standard:** Never hardcode data within projects. Use `fetch()` to call assets from the `/data/` directory using relative paths (`../data/...`).
3.  **Clean URLs:** Ensure navigation links always point to the directory name (trailing slash) rather than the filename.

---
*Developed by **Rafael Atantya** • © 2026*
