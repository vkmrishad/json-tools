import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { TreeViewer } from './TreeViewer';
import { Braces, Eye, Columns } from 'lucide-react';

interface TreeTabProps {
  theme: 'dark' | 'light';
  showToast: (msg: string) => void;
  targetSubOption?: string;
}

const SAMPLE_DATA = {
  appName: "DevJSON Suite",
  version: "2.0.0",
  features: ["formatter", "validator", "diff", "tree", "converter"],
  settings: {
    theme: "dark",
    indent: 2,
    clientOnly: true,
    wasmWorker: { enabled: true, threads: 1 }
  },
  stats: { usersToday: 1420, avgLatencyMs: 1.2 }
};

export const TreeTab: React.FC<TreeTabProps> = ({ theme, showToast }) => {
  const [input, setInput] = useState<string>(() => JSON.stringify(SAMPLE_DATA, null, 2));
  const [parsed, setParsed] = useState<any>(SAMPLE_DATA);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'tree'>('split');

  // Sync viewMode with URL hash (#tree-explorer or #split-tree)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
      if (hash.includes('tree-explorer') || hash === 'tree') {
        setViewMode('tree');
      } else if (hash.includes('split')) {
        setViewMode('split');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  const handleChange = (val: string) => {
    setInput(val);
    if (!val.trim()) { setParsed(null); setError(null); return; }
    try {
      const p = JSON.parse(val);
      setParsed(p);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLoadSample = () => {
    const s = JSON.stringify(SAMPLE_DATA, null, 2);
    setInput(s);
    setParsed(SAMPLE_DATA);
    setError(null);
    showToast('Sample dataset loaded!');
  };

  const statusClass = error ? 'status-invalid' : parsed ? 'status-valid' : 'status-empty';
  const statusLabel = error ? 'Invalid' : parsed ? 'Valid' : 'Empty';

  return (
    <div className="tab-content tree-layout">
      {/* Toolbar */}
      <div className="tool-toolbar">
        <div className="toolbar-left">
          <div className="mode-pills" aria-label="Tree Display Modes">
            <a
              href="/json-tree/#split-tree"
              className={`mode-pill ${viewMode === 'split' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setViewMode('split'); }}
              style={{ textDecoration: 'none' }}
            >
              <Columns size={13} /> Split (Code + Tree)
            </a>
            <a
              href="/json-tree/#tree-explorer"
              className={`mode-pill ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setViewMode('tree'); }}
              style={{ textDecoration: 'none' }}
            >
              <Eye size={13} /> Tree Only
            </a>
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-secondary btn-sm" onClick={handleLoadSample}>Sample</button>
          <button className="btn btn-danger btn-sm" onClick={() => { setInput(''); setParsed(null); setError(null); }} disabled={!input}>Clear</button>
        </div>
      </div>

      {error && (
        <div className="alert-banner error">
          <div className="alert-content"><strong>JSON Parse Error</strong><p>{error}</p></div>
        </div>
      )}

      {/* Editors */}
      {viewMode === 'split' ? (
        <div className="dual-editor-grid">
          {/* Left: JSON Input */}
          <div className="glass-panel dual-editor-pane">
            <div className="editor-card-header">
              <div className="editor-card-title"><Braces size={14} /> JSON Input</div>
              <span className={`status-badge ${statusClass}`}>
                {statusLabel}
              </span>
            </div>
            <div className="editor-body">
              <Editor
                height="100%" language="json"
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={input} onChange={(v) => handleChange(v || '')}
                options={{ fontSize: 13, fontFamily: 'var(--font-mono)', minimap: { enabled: false }, wordWrap: 'on', scrollbar: { verticalScrollbarSize: 7 } }}
                loading={<div className="monaco-loader"><div className="spinner" /></div>}
              />
            </div>
          </div>

          {/* Right: Tree */}
          <div className="glass-panel dual-editor-pane" style={{ overflow: 'hidden' }}>
            <div className="editor-card-header">
              <div className="editor-card-title"><Eye size={14} /> Tree Explorer</div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click nodes to expand · Hover to copy path</span>
            </div>
            <div className="editor-body" style={{ overflow: 'auto' }}>
              <TreeViewer data={parsed} showToast={showToast} />
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel editor-card" style={{ height: 'calc(100vh - 210px)', minHeight: 520 }}>
          <div className="editor-card-header">
            <div className="editor-card-title"><Eye size={14} /> Tree Explorer</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click nodes to expand · Hover to copy path</span>
          </div>
          <div className="editor-body" style={{ overflow: 'auto' }}>
            <TreeViewer data={parsed} showToast={showToast} />
          </div>
        </div>
      )}
    </div>
  );
};
