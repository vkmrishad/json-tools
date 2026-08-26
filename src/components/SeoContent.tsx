import React, { useState } from 'react';
import { Braces, GitCompare, Shield, Zap, Eye, RefreshCw, ChevronDown, Table } from 'lucide-react';
import type { ToolTab } from './Header';

interface SeoContentProps {
  activeTab?: ToolTab;
}

const GLOBAL_FEATURES = [
  {
    icon: <Braces size={18} />,
    title: 'Dual-Pane JSON Formatter & Beautifier',
    desc: 'Beautify raw or minified JSON strings into structured code with 2-space or 4-space indentation. Auto-detects line and column syntax errors with precise Monaco cursor jumps.',
  },
  {
    icon: <GitCompare size={18} />,
    title: 'Visual JSON Diff Checker',
    desc: 'Compare two JSON payloads side-by-side (Split) or unified (Inline). Features key normalization before comparison to eliminate false diffs caused by reordered object keys.',
  },
  {
    icon: <Eye size={18} />,
    title: 'Interactive JSON Tree Visualizer',
    desc: 'Traverse and explore deeply nested hierarchies with collapsible nodes, color-coded datatypes, item count badges, and live JSONPath query extraction.',
  },
  {
    icon: <RefreshCw size={18} />,
    title: 'Client-Side Schema Converter',
    desc: 'Convert JSON to YAML, YAML to JSON, JSON to CSV spreadsheet arrays, and JSON to hierarchical XML documents in your browser with zero data loss.',
  },
  {
    icon: <Shield size={18} />,
    title: '100% Client-Side Privacy Guarantee',
    desc: 'All formatting, diffing, tree visualization, and conversions run locally on your device in Web Workers. Zero server uploads, zero logs, and no account required.',
  },
  {
    icon: <Zap size={18} />,
    title: 'Rust WebAssembly Performance',
    desc: 'High-speed parsing, formatting, and key sorting compiled from Rust into WebAssembly for instantaneous sub-millisecond execution even on multi-megabyte payloads.',
  },
];

interface HowToStep {
  title: string;
  desc: string;
}

interface TableData {
  title: string;
  headers: string[];
  rows: string[][];
}

interface TabSeoData {
  title: string;
  subtitle: string;
  steps: HowToStep[];
  table: TableData;
  faqs: { q: string; a: string }[];
}

const TAB_SEO_MAP: Record<ToolTab, TabSeoData> = {
  formatter: {
    title: 'How to Format & Beautify JSON Online',
    subtitle: 'Transform unformatted or minified JSON into clean, valid, readable code in four simple steps:',
    steps: [
      { title: '1. Paste, Upload, or Fetch JSON', desc: 'Paste raw JSON into the Input editor, upload a local .json file from your computer, or load directly from a public REST API URL.' },
      { title: '2. Select Indentation & Sort Options', desc: 'Choose 2 Tab Spaces, 3 Tab Spaces, 4 Tab Spaces, or Compact Minify. Optionally toggle A-Z / Z-A key sorting to organize object properties.' },
      { title: '3. Format, Validate & Repair', desc: 'Click Format / Beautify (or press Ctrl+Enter). The engine validates RFC 8259 syntax and can automatically repair Python dicts, single quotes, and trailing commas.' },
      { title: '4. Copy, Print, or Download', desc: 'Copy formatted JSON to clipboard with one click, generate a clean print preview, or download a .json file directly to your device.' },
    ],
    table: {
      title: 'JSON Formatting & Indentation Standards Reference',
      headers: ['Indentation Style', 'Standard Usage', 'File Size Impact', 'Readability Score'],
      rows: [
        ['2 Spaces (Default)', 'Web APIs, Modern JavaScript / TypeScript, Node.js configs', 'Standard (+15-20% vs minified)', 'High (Compact & Clean)'],
        ['4 Spaces', 'Enterprise Python / Java backends, legacy configurations', 'Moderate (+25-35% vs minified)', 'Maximum (Deep nesting)'],
        ['Tab Space', 'Editor-agnostic indentation based on user tab-width preference', 'Compact (1 byte per indent level)', 'High'],
        ['Minified (0 Spaces)', 'Production HTTP payloads, database storage, CDN caching', 'Smallest (0% whitespace overhead)', 'Low (Machine readable)'],
      ],
    },
    faqs: [
      {
        q: 'What is JSON formatting and beautifying?',
        a: 'JSON formatting (or beautification) parses unformatted, minified, or disorganized JSON data and introduces standard indentation (usually 2 or 4 spaces) and newlines. This makes the data human-readable, easier to inspect, and simple to debug.'
      },
      {
        q: 'How does the JSON Auto-Repair tool fix Python dictionaries and broken JSON?',
        a: 'The repair engine automatically resolves syntax errors including single-quoted strings (\'key\': \'value\'), Python literals (True, False, None), unquoted keys ({ foo: 1 }), trailing commas ({ "a": 1, }), and stripped comments, converting them into standard RFC 8259 compliant JSON.'
      },
      {
        q: 'How does the Validate button help debug syntax errors?',
        a: 'When you click the Validate button (or when an error occurs), JSONTools identifies the exact line number, column, and error reason, instantly centering and moving your Monaco editor cursor to the exact error location.'
      },
      {
        q: 'Is my JSON data secure when using JSONTools?',
        a: 'Yes, 100%. JSONTools operates entirely inside your web browser using client-side JavaScript and Rust WebAssembly Web Workers. Your data is never sent to any remote server or third-party database.'
      },
    ],
  },
  diff: {
    title: 'How to Compare JSON Documents Online (Diff Checker)',
    subtitle: 'Inspect structural, semantic, and textual changes between two JSON payloads effortlessly:',
    steps: [
      { title: '1. Input Original & Changed Text', desc: 'Paste the baseline document in the Original Text pane and the new version in the Changed Text pane (or upload files).' },
      { title: '2. Sort Keys to Eliminate False Diffs', desc: 'Click Sort Keys & Compare to alphabetically normalize JSON keys on both sides, ensuring property order differences do not cause false positives.' },
      { title: '3. Choose Split vs. Unified Layout', desc: 'Toggle between Side-by-Side (Split) comparison view and Inline (Unified) single-column comparison.' },
      { title: '4. Inspect Removals & Additions', desc: 'Review color-coded red removals (⊖) and green additions (⊕), hover badges for line/character percentage breakdowns, or export a .diff file.' },
    ],
    table: {
      title: 'JSON Diff Comparison Modes & Features',
      headers: ['Comparison Mode', 'Visual Presentation', 'Best Use Case', 'Key Feature'],
      rows: [
        ['Split (Side-by-Side)', 'Dual-column visual comparison showing original on left and changed on right', 'Reviewing large payloads, schema migrations, and API payload updates', 'Independent scrolling & synchronized line alignment'],
        ['Unified (Inline)', 'Single-column unified diff highlighting additions and removals inline', 'Git-style patch reviews, small localized edits, and mobile screens', 'Compact vertical diff footprint'],
        ['Key-Normalized Diff', 'Alphabetical sorting of all keys prior to comparison algorithm execution', 'JSON REST APIs where object key order is non-deterministic', 'Prevents 100% of false differences from unordered keys'],
        ['Whitespace-Agnostic', 'Trims and ignores leading, trailing, and inter-line whitespace variations', 'Comparing minified JSON against pretty-printed formatted JSON', 'Focuses purely on data value and structure changes'],
      ],
    },
    faqs: [
      {
        q: 'How does JSON Diff Checker differ from standard text diff tools?',
        a: 'Standard text diff tools compare files line-by-line without understanding JSON semantics. JSONTools includes a "Sort Keys & Compare" feature that normalizes object keys recursively, preventing false differences caused by JSON key order variations.'
      },
      {
        q: 'What is the difference between Split and Unified diff modes?',
        a: 'Split view displays Original and Changed documents in two side-by-side synchronized panes with line-matching gutters. Unified view consolidates all changes into a single stream, highlighting deleted lines in red and added lines in green.'
      },
      {
        q: 'Can I export the diff comparison result?',
        a: 'Yes. Clicking the "Export" button generates and downloads a standard unified `.diff` patch file formatted with unified diff headers (`--- Original / +++ Changed`).'
      },
      {
        q: 'How are additions and removals percentages calculated?',
        a: 'Hovering over the additions (⊕) or removals (⊖) badge reveals an exact line and character breakdown showing total count, added/removed delta count, and percentage change relative to the document size.'
      },
    ],
  },
  tree: {
    title: 'How to Explore & Query JSON Trees Online',
    subtitle: 'Visualize deeply nested object structures and extract precise JSONPaths visually:',
    steps: [
      { title: '1. Load or Paste JSON Payload', desc: 'Enter any valid JSON structure into the editor or click Sample to load a pre-built nested dataset.' },
      { title: '2. Explore Collapsible Branches', desc: 'Click node toggles (▶ / ▼) to expand or collapse arrays and objects, with item count badges like [5] and {3}.' },
      { title: '3. Query with JSONPath or Search', desc: 'Use the top query bar to search by keyword or filter exact paths (e.g. $.settings.wasmWorker.enabled or $.features[0]).' },
      { title: '4. Copy Node Paths in One Click', desc: 'Hover over any key or value and click the path badge to copy its exact JSONPath expression to your clipboard.' },
    ],
    table: {
      title: 'JSONPath Expression Syntax Guide & Examples',
      headers: ['JSONPath Syntax', 'Meaning', 'Example Query', 'Example Result'],
      rows: [
        ['$', 'Root object or array', '$', 'The entire root JSON document'],
        ['.property or [\'property\']', 'Dot or bracket child property accessor', '$.settings.theme', '"dark"'],
        ['[n]', 'Array index accessor (0-indexed)', '$.features[0]', '"formatter"'],
        ['..property', 'Deep recursive property scan', 'version', 'Matches all "version" keys across all depths'],
        ['Keyword Substring', 'Fuzzy search across keys & primitive values', 'wasm', 'Highlights matching keys and auto-expands branches'],
      ],
    },
    faqs: [
      {
        q: 'What is a JSON Tree Viewer?',
        a: 'A JSON Tree Viewer is an interactive hierarchical visualizer that renders complex nested JSON payloads into collapsible tree nodes, making deeply nested APIs and data models simple to understand at a glance.'
      },
      {
        q: 'How does JSONPath query filtering work in JSONTools?',
        a: 'Type any standard JSONPath expression (such as `$.settings.theme` or `$.features[1]`) into the tree search bar. JSONTools evaluates the expression in real-time, auto-expands the matched node branch, and highlights matching keys.'
      },
      {
        q: 'Can I copy the path of a deeply nested node?',
        a: 'Yes. Every tree node displays its computed JSONPath on hover. Clicking the path badge instantly copies the exact JSONPath expression directly into your clipboard.'
      },
      {
        q: 'What do the color-coded node badges indicate?',
        a: 'JSONTools applies syntax color-coding: green for strings, orange/red for numbers, purple for booleans, grey for null, and dedicated pill badges for arrays (`[n]`) and objects (`{n}`) displaying their item count.'
      },
    ],
  },
  converter: {
    title: 'How to Convert JSON to YAML, CSV, and XML Online',
    subtitle: 'Serialize and convert datasets across industry-standard formats entirely in-browser:',
    steps: [
      { title: '1. Select Conversion Format', desc: 'Choose your desired format from the segmented bar: JSON → YAML, YAML → JSON, JSON → CSV, or JSON → XML.' },
      { title: '2. Paste Data or Load Sample', desc: 'Enter your source data into the Input editor (or click Sample to populate format-specific test data).' },
      { title: '3. Click "Convert Now"', desc: 'Click the Convert Now button to execute the conversion with schema validation and error detection.' },
      { title: '4. Copy or Download File', desc: 'Copy the converted output or download the file with its native extension (.yaml, .csv, .xml, .json).' },
    ],
    table: {
      title: 'Data Serialization Formats Comparison Matrix',
      headers: ['Format', 'Hierarchical Support', 'Typing System', 'Readability', 'Best Use Case'],
      rows: [
        ['JSON', 'Full (Objects & Arrays)', 'Primitives (String, Number, Boolean, Null)', 'High (Standard Web API format)', 'REST APIs, Web Development, NoSQL databases'],
        ['YAML', 'Full (Indentation-based)', 'Rich (Custom types, multi-line strings)', 'Maximum (Human-readable)', 'DevOps configurations, Docker Compose, Kubernetes, CI/CD pipelines'],
        ['CSV', 'Flat 2D Tables Only', 'Strings / Numbers (Comma-separated)', 'Tabular (Spreadsheet format)', 'Spreadsheets, Excel / Google Sheets, Business Analytics, SQL exports'],
        ['XML', 'Full (Tag-based hierarchy)', 'Text-based with Attribute extensions', 'Moderate (Verbose)', 'Enterprise architectures, SOAP APIs, RSS feeds, Android Layouts'],
      ],
    },
    faqs: [
      {
        q: 'How does JSON to CSV conversion handle nested data?',
        a: 'JSON to CSV requires a JSON array of objects (e.g. `[{"id": 1, "name": "Alice"}]`). JSONTools extracts all unique keys across objects to build the header row and maps object values into properly escaped comma-separated records.'
      },
      {
        q: 'Can I convert YAML back into JSON?',
        a: 'Yes. Selecting the YAML → JSON mode allows you to paste YAML configuration files (such as Kubernetes manifests or GitHub Actions workflows) and convert them into formatted JSON.'
      },
      {
        q: 'How are special XML characters escaped during JSON to XML conversion?',
        a: 'During JSON to XML conversion, special entities such as `&`, `<`, `>`, `"`, and `\'` are automatically converted into safe XML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`).'
      },
      {
        q: 'Are conversions performed on a server or locally?',
        a: 'All conversions are performed 100% client-side inside your browser. No files or text data are transmitted over the internet.'
      },
    ],
  },
};

export const SeoContent: React.FC<SeoContentProps> = ({ activeTab = 'formatter' }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const currentSeo = TAB_SEO_MAP[activeTab] || TAB_SEO_MAP.formatter;

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="seo-section" aria-label="JSONTools Developer Features and Technical Guides">
      {/* ── 1. Dynamic "How It Works" Section ── */}
      <div id="how-to" className="how-it-works-box">
        <h2 className="how-it-works-title">{currentSeo.title}</h2>
        <p className="how-it-works-subtitle">{currentSeo.subtitle}</p>

        <div className="how-it-works-grid">
          {currentSeo.steps.map((step, idx) => (
            <div key={idx} className="how-step-card">
              <div className="how-step-badge">{idx + 1}</div>
              <h3 className="how-step-title">{step.title}</h3>
              <p className="how-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Comprehensive Comparison Table ── */}
      <div className="seo-table-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Table size={18} style={{ color: 'var(--accent-hover)' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{currentSeo.table.title}</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="comparison-table">
            <thead>
              <tr>
                {currentSeo.table.headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentSeo.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={j === 0 ? { fontWeight: 600, color: 'var(--text-primary)' } : {}}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. 3-Column Feature Cards: "Everything you need for JSON" ── */}
      <div id="features" style={{ marginTop: 28, marginBottom: 28 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
            Everything you need for JSON, in one place
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Zero setup, zero server uploads, 100% privacy-first in your browser.
          </p>
        </div>

        <div className="features-grid">
          {GLOBAL_FEATURES.map((f, i) => (
            <div key={i} className="glass-panel feature-card">
              <div className="feature-icon-box">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Feature-Specific FAQ Accordion ── */}
      <div id="faqs" className="faq-card">
        <h3 className="faq-section-title">Frequently Asked Questions</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Common technical questions about {activeTab === 'formatter' ? 'JSON formatting, validation, and repair' : activeTab === 'diff' ? 'JSON diffing and comparison algorithms' : activeTab === 'tree' ? 'JSON tree visualization and JSONPath queries' : 'JSON, YAML, CSV, and XML conversions'}.
        </p>

        <div className="faq-list">
          {currentSeo.faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  className="faq-question-btn"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-text">{faq.q}</span>
                  <ChevronDown size={16} className={`faq-chevron ${isOpen ? 'rotated' : ''}`} />
                </button>
                {isOpen && (
                  <div className="faq-answer-panel">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
