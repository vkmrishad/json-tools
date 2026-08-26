import React from 'react';
import { Braces, ShieldCheck } from 'lucide-react';
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
    <footer id="footer" className="footer-container" aria-label="DevJSON Navigation and Resource Footer">
      {/* Top 5-Column SEO Links Grid */}
      <div className="footer-links-grid">
        {/* Column 1: JSON Tools */}
        <div className="footer-col">
          <h3 className="footer-col-title">JSON Tools</h3>
          <ul className="footer-col-list">
            <li>
              <a href="/json-formatter" className="footer-link-btn" onClick={(e) => handleNav('formatter', undefined, e)}>
                JSON Formatter
              </a>
            </li>
            <li>
              <a href="/json-formatter/#json-validator" className="footer-link-btn" onClick={(e) => handleNav('formatter', 'json-validator', e)}>
                JSON Validator &amp; Syntax Checker
              </a>
            </li>
            <li>
              <a href="/json-formatter/#json-minifier" className="footer-link-btn" onClick={(e) => handleNav('formatter', 'json-minifier', e)}>
                JSON Minifier &amp; Compressor
              </a>
            </li>
            <li>
              <a href="/json-formatter/#json-beautifier" className="footer-link-btn" onClick={(e) => handleNav('formatter', 'json-beautifier', e)}>
                JSON Beautifier (2 &amp; 4 Spaces)
              </a>
            </li>
            <li>
              <a href="/json-formatter/#json-sorter" className="footer-link-btn" onClick={(e) => handleNav('formatter', 'json-sorter', e)}>
                JSON Key Sorter (A-Z / Z-A)
              </a>
            </li>
            <li>
              <a href="/json-formatter/#json-repair" className="footer-link-btn" onClick={(e) => handleNav('formatter', 'json-repair', e)}>
                JSON Auto-Repair (Python Dicts &amp; Loose JSON)
              </a>
            </li>
            <li>
              <a href="/json-formatter/#json-escape" className="footer-link-btn" onClick={(e) => handleNav('formatter', 'json-escape', e)}>
                JSON Escape &amp; Unescape Strings
              </a>
            </li>
          </ul>
        </div>

        {/* Column 2: Converters */}
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
            <li>
              <a href="/json-converter" className="footer-link-btn" onClick={(e) => handleNav('converter', undefined, e)}>
                Client-Side Schema Converter
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: JSON Diff */}
        <div className="footer-col">
          <h3 className="footer-col-title">JSON Diff</h3>
          <ul className="footer-col-list">
            <li>
              <a href="/json-diff" className="footer-link-btn" onClick={(e) => handleNav('diff', undefined, e)}>
                JSON Diff Checker
              </a>
            </li>
            <li>
              <a href="/json-diff/#split-diff" className="footer-link-btn" onClick={(e) => handleNav('diff', 'split-diff', e)}>
                Side-by-Side Split Diff Compare
              </a>
            </li>
            <li>
              <a href="/json-diff/#inline-diff" className="footer-link-btn" onClick={(e) => handleNav('diff', 'inline-diff', e)}>
                Inline Unified Diff View
              </a>
            </li>
            <li>
              <a href="/json-diff/#sort-diff" className="footer-link-btn" onClick={(e) => handleNav('diff', 'sort-diff', e)}>
                Sort Keys Before Diff
              </a>
            </li>
            <li>
              <a href="/json-diff/#diff-counters" className="footer-link-btn" onClick={(e) => handleNav('diff', 'diff-counters', e)}>
                Real-Time Diff Change Counters
              </a>
            </li>
            <li>
              <a href="/json-diff/#swap-diff" className="footer-link-btn" onClick={(e) => handleNav('diff', 'swap-diff', e)}>
                Swap Comparison Editors
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Tree Visualizer */}
        <div className="footer-col">
          <h3 className="footer-col-title">Tree Visualizer</h3>
          <ul className="footer-col-list">
            <li>
              <a href="/json-tree" className="footer-link-btn" onClick={(e) => handleNav('tree', undefined, e)}>
                JSON Tree Viewer
              </a>
            </li>
            <li>
              <a href="/json-tree/#tree-explorer" className="footer-link-btn" onClick={(e) => handleNav('tree', 'tree-explorer', e)}>
                Collapsible Hierarchy Explorer
              </a>
            </li>
            <li>
              <a href="/json-tree/#jsonpath-filter" className="footer-link-btn" onClick={(e) => handleNav('tree', 'jsonpath-filter', e)}>
                JSONPath Search &amp; Filter
              </a>
            </li>
            <li>
              <a href="/json-tree/#node-path-extractor" className="footer-link-btn" onClick={(e) => handleNav('tree', 'node-path-extractor', e)}>
                One-Click Node Path Extractor
              </a>
            </li>
            <li>
              <a href="/json-tree/#type-inspector" className="footer-link-btn" onClick={(e) => handleNav('tree', 'type-inspector', e)}>
                Color-Coded Type Inspector
              </a>
            </li>
            <li>
              <a href="/json-tree/#split-tree" className="footer-link-btn" onClick={(e) => handleNav('tree', 'split-tree', e)}>
                Dual Code &amp; Tree Split View
              </a>
            </li>
          </ul>
        </div>

        {/* Column 5: Guides & FAQs */}
        <div className="footer-col">
          <h3 className="footer-col-title">Guides &amp; Overview</h3>
          <ul className="footer-col-list">
            <li>
              <a href="#how-to" className="footer-link-btn" onClick={(e) => { e.preventDefault(); document.getElementById('how-to')?.scrollIntoView({ behavior: 'smooth' }); }}>
                How to Format JSON Online
              </a>
            </li>
            <li>
              <a href="#how-to" className="footer-link-btn" onClick={(e) => { e.preventDefault(); navigateTo('diff'); document.getElementById('how-to')?.scrollIntoView({ behavior: 'smooth' }); }}>
                How to Compare JSON Payloads
              </a>
            </li>
            <li>
              <a href="#how-to" className="footer-link-btn" onClick={(e) => { e.preventDefault(); navigateTo('tree'); document.getElementById('how-to')?.scrollIntoView({ behavior: 'smooth' }); }}>
                How to Query JSON with JSONPath
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

        <div className="footer-copyright">
          <span>© {new Date().getFullYear()} JSONTools. All processing happens locally in your browser.</span>
        </div>
      </div>
    </footer>
  );
};
