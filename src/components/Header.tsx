import React from 'react';
import { Braces, GitCompare, Sun, Moon, RefreshCw, Star } from 'lucide-react';

export type ToolTab = 'formatter' | 'diff' | 'tree' | 'converter';

const GithubIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface HeaderProps {
  activeTab: ToolTab;
  navigateTo: (tab: ToolTab, innerHash?: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const TreeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const TABS: { id: ToolTab; label: string; icon: React.ReactNode; shortLabel: string; path: string }[] = [
  { id: 'formatter', label: 'JSON Formatter & Beautifier', shortLabel: 'Formatter', icon: <Braces size={15} />, path: '/json-formatter' },
  { id: 'diff',      label: 'JSON Diff Checker',           shortLabel: 'Diff',      icon: <GitCompare size={15} />, path: '/json-diff-checker' },
  { id: 'tree',      label: 'JSON Tree Visualizer',         shortLabel: 'Tree',      icon: <TreeIcon />,             path: '/json-tree' },
  { id: 'converter', label: 'JSON Converter',               shortLabel: 'Convert',   icon: <RefreshCw size={15} />,  path: '/json-converter' },
];

export const Header: React.FC<HeaderProps> = ({ activeTab, navigateTo, theme, toggleTheme }) => {
  const handleTabClick = (tabId: ToolTab, e: React.MouseEvent) => {
    e.preventDefault();
    navigateTo(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="navbar">
      <div className="nav-left">
        <a
          href="/json-formatter"
          className="brand"
          onClick={(e) => handleTabClick('formatter', e)}
          aria-label="JSONTools - Online JSON Formatter"
        >
          <div className="logo-container">
            <Braces size={18} />
          </div>
          <div>
            <span className="brand-name" style={{ margin: 0, display: 'inline', fontWeight: 800 }}>
              JSON<span className="text-gradient">Tools</span>
            </span>
            <span className="brand-tag">Free</span>
          </div>
        </a>

        {/* Semantic SEO Navigation Links with smooth scroll to top */}
        <nav className="tabs-container" aria-label="Tool navigation">
          {TABS.map((tab) => (
            <a
              key={tab.id}
              href={tab.path}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={(e) => handleTabClick(tab.id, e)}
              title={tab.label}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.icon}
              <span>{tab.shortLabel}</span>
            </a>
          ))}
        </nav>
      </div>

      <div className="nav-actions">
        <a
          href="https://github.com/vkmrishad/json-tools"
          target="_blank"
          rel="noopener noreferrer"
          className="github-star-btn"
          title="Star JSONTools on GitHub"
          aria-label="Star JSONTools on GitHub"
        >
          <GithubIcon size={15} />
          <span className="github-star-text">Star</span>
          <Star size={13} className="star-icon" fill="currentColor" />
        </a>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};
