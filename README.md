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
- 🔄 **Schema Converter**: Fast, 100% in-browser conversions across **JSON ↔ YAML**, **JSON → CSV**, and **JSON ↔ XML**.
- 🔒 **100% Client-Side Privacy**: All processing runs locally in browser Web Workers. Zero telemetry, zero server uploads.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Code Editor**: `@monaco-editor/react`
- **Core Engine**: Rust WebAssembly compiled with `wasm-pack`
- **Styling**: Vanilla CSS with modern frosted glassmorphic UI design tokens

---

## 📦 Prerequisites

Ensure you have the following installed on your machine:

1. **[Node.js](https://nodejs.org/)** (v18+)
2. **[pnpm](https://pnpm.io/)** (or `npm` / `yarn`)
3. **[Rust & Cargo](https://rustup.rs/)** (to compile the WebAssembly engine)
4. **[wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)**:
   ```bash
   cargo install wasm-pack
   # or via npm
   npm install -g wasm-pack
   ```

---

## 💻 Running Locally

Follow these steps to clone, build, and run the project locally:

### 1. Clone the repository
```bash
git clone git@github.com:vkmrishad/json-tools.git
cd json-tools
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Compile the Rust WebAssembly module
```bash
pnpm run wasm-build
```

### 4. Start the local development server
```bash
pnpm dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 🏗️ Production Build

To compile the Rust WebAssembly module, typecheck TypeScript, and bundle optimized production assets into the `dist/` directory:

```bash
pnpm run build
```

To preview the built production bundle locally:
```bash
pnpm run preview
```

---

## 🚀 Deploying to GitHub Pages (`gh-pages` branch)

You can publish the compiled `dist/` output to the `gh-pages` branch on GitHub using either method below:

### Option A: Automatic 1-Command Deployment (Recommended)
This runs the full build and pushes the `dist/` directory directly to the `gh-pages` branch on GitHub:

```bash
pnpm run deploy
# or using npm
npm run deploy
```

---

### Option B: Manual Git Subtree Push
If you prefer deploying manually via standard git commands:

```bash
# 1. Build the production bundle into dist/
pnpm run build

# 2. Add dist directory temporarily (forcing past .gitignore for deployment commit)
git add -f dist

# 3. Create a temporary release commit
git commit -m "chore: release production build to gh-pages"

# 4. Push only the dist/ folder to the gh-pages branch
git subtree push --prefix dist origin gh-pages

# 5. Clean up the local release commit
git reset --soft HEAD~1
git reset HEAD dist
```

---

## ⚙️ Enabling GitHub Pages in Your Repository

1. Go to your repository on GitHub: `https://github.com/vkmrishad/json-tools/settings/pages`
2. Under **Build and deployment** $\rightarrow$ **Source**, select **Deploy from a branch**.
3. Under **Branch**, select **`gh-pages`** and folder **`/(root)`**.
4. Click **Save**. Your site will be live at `https://vkmrishad.github.io/json-tools/` in 1–2 minutes!

---

## 📁 Project Structure

```text
json-tools/
├── wasm-json/              # Rust WebAssembly workspace
│   ├── Cargo.toml          # Rust dependencies (wasm-bindgen, serde_json)
│   └── src/lib.rs          # High-performance formatting & sorting in Rust
├── src/
│   ├── components/         # UI Components
│   │   ├── Header.tsx      # Frosted glass navbar & tool switcher
│   │   ├── Formatter.tsx   # Dual-pane JSON Formatter & Beautifier
│   │   ├── DiffChecker.tsx # Minimal Diffchecker-style comparison tool
│   │   ├── TreeViewer.tsx  # Interactive collapsible JSON Tree & JSONPath
│   │   ├── TreeTab.tsx     # Tree Visualizer split layout
│   │   ├── Converter.tsx   # JSON ↔ YAML, CSV, XML schema converter
│   │   ├── SeoContent.tsx  # Dynamic How-To, tables, 3-col cards, and FAQs
│   │   └── Footer.tsx      # 5-Column semantic SEO links footer
│   ├── workers/            # Web Worker threads for non-blocking execution
│   ├── utils/seo.ts        # Dynamic document title & meta tags controller
│   ├── index.css           # Design tokens, frosted glass, and responsive CSS
│   ├── App.tsx             # Root component & URL router
│   └── main.tsx            # Application entry point
├── public/
│   └── favicon.svg         # Crisp gradient { } SVG favicon
├── package.json
└── README.md
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
