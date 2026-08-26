# JSONTools ⚡

> **High-Performance, Privacy-First JSON Developer Suite** powered by **Monaco Editor** & **Rust WebAssembly**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/Built%20with-React%20%2B%20Vite-61dafb.svg)](https://react.dev/)
[![Powered by Rust Wasm](https://img.shields.io/badge/Wasm-Rust-orange.svg)](https://www.rust-lang.org/)

---

## 🚀 Key Features

- ⚡ **Dual-Pane JSON Formatter & Validator**: Monaco-powered beautifier with real-time error jumping, 2/4-space indentation, minification, and auto-repair for Python dicts & trailing commas.
- ⚖️ **Visual JSON Diff Checker**: Side-by-side (Split) and unified (Inline) diff views with live additions (⊕) & removals (⊖) counters, character breakdowns, and key-normalized sorting.
- 🌲 **Interactive JSON Tree Visualizer**: Collapsible nested hierarchy inspection with type-colored badges and real-time JSONPath query filtering.
- 🔄 **Schema Converter**: Fast, 100% in-browser conversions between **JSON ↔ YAML**, **JSON → CSV**, and **JSON ↔ XML**.
- 🔒 **100% Client-Side Privacy**: All processing runs locally in browser Web Workers. Zero telemetry, zero server uploads.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Code Editor**: `@monaco-editor/react`
- **Core Engine**: Rust WebAssembly compiled with `wasm-pack`
- **Styling**: Vanilla CSS with modern frosted glassmorphic UI design tokens

---

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Rust & Cargo](https://rustup.rs/) (for compiling WebAssembly)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

### Installation & Local Development

```bash
# Clone the repository
git clone git@github.com:vkmrishad/json-tools.git
cd json-tools

# Install dependencies
pnpm install

# Build the Rust WebAssembly module
pnpm run wasm-build

# Start the local development server
pnpm dev
```

### Production Build

```bash
pnpm run build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
