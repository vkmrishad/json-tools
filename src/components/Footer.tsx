import React from 'react';
import { Braces, ShieldCheck, Github } from 'lucide-react';
import type { ToolTab } from './Header';

interface FooterProps {
  activeTab?: ToolTab;
  navigateTo: (tab: ToolTab, innerHash?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigateTo }) => {
  const handleNav = (tab: ToolTab, innerHash: string | undefined, e: React.MouseEvent) => {
    e.preventDefault();
    navigateTo(tab, innerHash);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="footer" className="footer-container" aria-label="JSONTools Navigation and Resource Footer">
      {/* 5 Categorized SEO Link Columns */}
      <div className="footer-links-grid">
        {/* Column 1: JSON Tools & Operations */}
        <div className="footer-col">
          <h3 className="footer-col-title">JSON Formatter</h3>
          <ul className="footer-col-list">
            <li>
              <a href="/json-formatter/#json-beautifier" className="footer-link-btn" onClick={(e) => handleNav('formatter', 'json-beautifier', e)}>
                JSON Beautifier &amp; Pretty Print
              </a>
            </li>
            <li>
              <a href="/json-formatter/#json-validator" className="footer-link-btn" onClick={(e) => handleNav('formatter', 'json-validator', e)}>
                JSON Validator &amp; Linter
              </a>
            </li>
            <li>
              <a href="/json-formatter/#json-minifier" className="footer-link-btn" onClick={(e) => handleNav('formatter', 'json-minifier', e)}>
                JSON Minifier &amp; Compressor
              </a>
            </li>
            <li>
              <a href="/json-formatter/#json-sorter" className="footer-link-btn" onClick={(e) => handleNav('formatter', 'json-sorter', e)}>
                JSON Key Sorter (A-Z / Z-A)
              </a>
            </li>
            <li>
              <a href="/json-formatter/#json-repair" className="footer-link-btn" onClick={(e) => handleNav('formatter', 'json-repair', e)}>
                Python Dict to JSON Auto-Repair
              </a>
            </li>
          </ul>
        </div>

        {/* Column 2: Data Converters */}
        <div className="footer-col">
          <h3 className="footer-col-title">Converters</h3>
          <ul className="footer-col-list">
            <li>
              <a href="/json-converter/#json-to-yaml" className="footer-link-btn" onClick={(e) => handleNav('converter', 'json-to-yaml', e)}>
                JSON to YAML Converter
              </a>
            </li>
            <li>
              <a href="/json-converter/#yaml-to-json" className="footer-link-btn" onClick={(e) => handleNav('converter', 'yaml-to-json', e)}>
                YAML to JSON Converter
              </a>
            </li>
            <li>
              <a href="/json-converter/#json-to-csv" className="footer-link-btn" onClick={(e) => handleNav('converter', 'json-to-csv', e)}>
                JSON to CSV Spreadsheet Export
              </a>
            </li>
            <li>
              <a href="/json-converter/#json-to-xml" className="footer-link-btn" onClick={(e) => handleNav('converter', 'json-to-xml', e)}>
                JSON to XML Hierarchy Converter
              </a>
            </li>
            <li>
              <a href="/json-converter/#xml-to-json" className="footer-link-btn" onClick={(e) => handleNav('converter', 'xml-to-json', e)}>
                XML to JSON Parser
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: Diff Checker & Comparator */}
        <div className="footer-col">
          <h3 className="footer-col-title">Diff Checker</h3>
          <ul className="footer-col-list">
            <li>
              <a href="/json-diff/#split-diff" className="footer-link-btn" onClick={(e) => handleNav('diff', 'split-diff', e)}>
                Side-by-Side JSON Diff (Split)
              </a>
            </li>
            <li>
              <a href="/json-diff/#inline-diff" className="footer-link-btn" onClick={(e) => handleNav('diff', 'inline-diff', e)}>
                Unified Inline JSON Diff
              </a>
            </li>
            <li>
              <a href="/json-diff/#key-sorted-diff" className="footer-link-btn" onClick={(e) => handleNav('diff', 'key-sorted-diff', e)}>
                Key-Sorted JSON Compare
              </a>
            </li>
            <li>
              <a href="/json-diff/#whitespace-diff" className="footer-link-btn" onClick={(e) => handleNav('diff', 'whitespace-diff', e)}>
                Whitespace-Agnostic Diffing
              </a>
            </li>
            <li>
              <a href="/json-diff/#export-diff" className="footer-link-btn" onClick={(e) => handleNav('diff', 'export-diff', e)}>
                Export Unified .diff Patch
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Tree Visualizer */}
        <div className="footer-col">
          <h3 className="footer-col-title">Tree Visualizer</h3>
          <ul className="footer-col-list">
            <li>
              <a href="/json-tree/#tree-explorer" className="footer-link-btn" onClick={(e) => handleNav('tree', 'tree-explorer', e)}>
                Interactive Hierarchy Tree
              </a>
            </li>
            <li>
              <a href="/json-tree/#jsonpath-query" className="footer-link-btn" onClick={(e) => handleNav('tree', 'jsonpath-query', e)}>
                JSONPath Expression Evaluator
              </a>
            </li>
            <li>
              <a href="/json-tree/#type-badges" className="footer-link-btn" onClick={(e) => handleNav('tree', 'type-badges', e)}>
                Color-Coded Type Inspector
              </a>
            </li>
            <li>
              <a href="/json-tree/#path-copy" className="footer-link-btn" onClick={(e) => handleNav('tree', 'path-copy', e)}>
                1-Click Node Path Extractor
              </a>
            </li>
            <li>
              <a href="/json-tree/#split-tree" className="footer-link-btn" onClick={(e) => handleNav('tree', 'split-tree', e)}>
                Code &amp; Tree Synchronized Split
              </a>
            </li>
          </ul>
        </div>

        {/* Column 5: Guides & Resources */}
        <div className="footer-col">
          <h3 className="footer-col-title">Guides &amp; Resources</h3>
          <ul className="footer-col-list">
            <li>
              <a href="#how-to" className="footer-link-btn" onClick={(e) => { e.preventDefault(); document.getElementById('how-to')?.scrollIntoView({ behavior: 'smooth' }); }}>
                How to Format JSON Online
              </a>
            </li>
            <li>
              <a href="#how-to" className="footer-link-btn" onClick={(e) => { e.preventDefault(); document.getElementById('how-to')?.scrollIntoView({ behavior: 'smooth' }); }}>
                How to Compare JSON Payloads
              </a>
            </li>
            <li>
              <a href="#features" className="footer-link-btn" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>
                Rust WebAssembly Engine Specs
              </a>
            </li>
            <li>
              <a href="#features" className="footer-link-btn" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>
                JSON vs YAML vs CSV vs XML
              </a>
            </li>
            <li>
              <a href="#faqs" className="footer-link-btn" onClick={(e) => { e.preventDefault(); document.getElementById('faqs')?.scrollIntoView({ behavior: 'smooth' }); }}>
                Frequently Asked Questions
              </a>
            </li>
            <li>
              <a
                href="https://github.com/vkmrishad/json-tools"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, fontWeight: 600 }}
              >
                <Github size={13} /> GitHub Repository
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar with Brand & Security Guarantee */}
      <div className="footer-bottom-bar">
        <div className="footer-brand-info">
          <div className="logo-container" style={{ width: 26, height: 26 }}>
            <Braces size={15} />
          </div>
          <div>
            <span className="footer-brand-name">
              JSON<span className="text-gradient">Tools</span>
            </span>
            <span className="footer-tagline">
              Free Privacy-First Client-Side Developer Suite
            </span>
          </div>
        </div>

        <div className="footer-security-badge">
          <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
          <span>100% Client-Side In-Browser Execution · Zero Server Uploads</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="https://github.com/vkmrishad/json-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}
            title="Star on GitHub"
          >
            <Github size={14} /> <span>GitHub</span>
          </a>

          <div className="footer-copyright">
            <span>© {new Date().getFullYear()} JSONTools.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
