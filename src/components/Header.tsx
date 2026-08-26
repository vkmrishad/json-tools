import React from 'react';
import { Braces, GitCompare, Sun, Moon, RefreshCw, Github } from 'lucide-react';

export type ToolTab = 'formatter' | 'diff' | 'tree' | 'converter';

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
  { id: 'diff',      label: 'JSON Diff Checker',           shortLabel: 'Diff',      icon: <GitCompare size={15} />, path: '/json-diff' },
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
          className="theme-toggle-btn"
          title="View Source on GitHub"
          aria-label="GitHub Repository"
        >
          <Github size={17} />
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
