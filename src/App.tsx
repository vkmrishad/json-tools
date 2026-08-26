import React, { useState, useEffect, useCallback } from 'react';
import { Header, type ToolTab } from './components/Header';
import { Formatter } from './components/Formatter';
import { DiffChecker } from './components/DiffChecker';
import { TreeTab } from './components/TreeTab';
import { Converter } from './components/Converter';
import { AdUnit } from './components/AdUnit';
import { SeoContent } from './components/SeoContent';
import { Footer } from './components/Footer';
import { updatePageSeo, getSeoMetadata } from './utils/seo';
import { CheckCircle2 } from 'lucide-react';

export const parseRoute = (): { tab: ToolTab; hash: string } => {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');

  let tab: ToolTab = 'formatter';
  if (path.includes('diff') || hash.includes('diff') || hash.includes('compare')) tab = 'diff';
  else if (path.includes('tree') || hash.includes('tree') || hash.includes('viewer')) tab = 'tree';
  else if (path.includes('convert') || hash.includes('convert') || hash.includes('csv') || hash.includes('yaml') || hash.includes('xml')) tab = 'converter';
  else if (path.includes('formatter') || hash.includes('formatter')) tab = 'formatter';

  return { tab, hash };
};

export const App: React.FC = () => {
  const [route, setRoute] = useState(parseRoute);
  const activeTab = route.tab;
  const targetSubOption = route.hash;

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('devjson-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  // Update Document Title, OpenGraph, Twitter cards, and Meta tags on every page/route change
  useEffect(() => {
    updatePageSeo(activeTab, targetSubOption);
  }, [activeTab, targetSubOption]);

  // Handle browser back/forward and hash changes
  useEffect(() => {
    const handleNavigation = () => {
      const newRoute = parseRoute();
      setRoute(newRoute);
      updatePageSeo(newRoute.tab, newRoute.hash);
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  const navigateTo = useCallback((tab: ToolTab, innerHash?: string) => {
    const cleanHash = innerHash ? innerHash.replace(/^#/, '') : '';
    setRoute({ tab, hash: cleanHash });
    updatePageSeo(tab, cleanHash);
    
    const basePath = tab === 'formatter' ? '/json-formatter' : tab === 'diff' ? '/json-diff' : tab === 'tree' ? '/json-tree' : '/json-converter';
    const targetUrl = cleanHash ? `${basePath}/#${cleanHash}` : basePath;
    
    if (window.location.pathname + window.location.hash !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem('devjson-theme');
    if (saved) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('devjson-theme', next);
  };

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const currentMeta = getSeoMetadata(activeTab, targetSubOption);

  return (
    <div className="app-container">
      {/* Semantic and Dynamic SEO H1 tag for search engine crawlers & screen readers */}
      <h1 className="sr-only">{currentMeta.h1}</h1>

      <Header activeTab={activeTab} navigateTo={navigateTo} theme={theme} toggleTheme={toggleTheme} />

      {/* Top Header Ad (728x90) */}
      <AdUnit position="header" />

      <main id="workspace" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {/* Tool content with path and anchor identifiers */}
        {activeTab === 'formatter' && (
          <section id="json-formatter-tool" aria-label="JSON Formatter, Validator and Beautifier">
            <Formatter theme={theme} showToast={showToast} targetSubOption={targetSubOption} />
          </section>
        )}
        {activeTab === 'diff' && (
          <section id="json-diff-checker-tool" aria-label="JSON Diff Checker and Document Comparison">
            <DiffChecker theme={theme} showToast={showToast} />
          </section>
        )}
        {activeTab === 'tree' && (
          <section id="json-tree-visualizer-tool" aria-label="JSON Tree Hierarchy and JSONPath Visualizer">
            <TreeTab theme={theme} showToast={showToast} targetSubOption={targetSubOption} />
          </section>
        )}
        {activeTab === 'converter' && (
          <section id="json-converter-tool" aria-label="JSON, YAML, CSV and XML Schema Converter">
            <Converter theme={theme} showToast={showToast} targetSubOption={targetSubOption} />
          </section>
        )}
      </main>

      {/* Structured SEO, How-It-Works, and FAQ Sections */}
      <SeoContent activeTab={activeTab} />

      {/* Footer Ad (728x90) */}
      <div style={{ marginTop: 24, marginBottom: 12 }}>
        <AdUnit position="footer" />
      </div>

      {/* Comprehensive 5-Column SEO Links Footer */}
      <Footer navigateTo={navigateTo} />

      {/* Fixed-position Floating Toast Notification */}
      <div
        className={`toast-notification ${toast.visible ? 'visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />
        <span>{toast.message}</span>
      </div>
    </div>
  );
};

export default App;

