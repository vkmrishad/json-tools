import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import {
  AlignLeft, Trash2, Upload, AlertCircle, Loader2, Split,
  ArrowLeftRight, Copy, Download, MinusCircle, PlusCircle, FileText, Check, GitCompare,
  Maximize2, Minimize2
} from 'lucide-react';

interface DiffCheckerProps {
  theme: 'dark' | 'light';
  showToast: (msg: string) => void;
}

interface DetailedStats {
  origLines: number;
  modLines: number;
  origChars: number;
  modChars: number;
  linesAdded: number;
  linesRemoved: number;
  charsAdded: number;
  charsRemoved: number;
}

function computeDetailedStats(original: string, modified: string): DetailedStats {
  const origLinesArr = original ? original.split('\n') : [];
  const modLinesArr = modified ? modified.split('\n') : [];
  const origLines = origLinesArr.length;
  const modLines = modLinesArr.length;
  const origChars = original.length;
  const modChars = modified.length;

  if (!original.trim() && !modified.trim()) {
    return { origLines: 0, modLines: 0, origChars: 0, modChars: 0, linesAdded: 0, linesRemoved: 0, charsAdded: 0, charsRemoved: 0 };
  }

  const origSet = new Set(origLinesArr);
  const modSet = new Set(modLinesArr);
  let linesAdded = 0, linesRemoved = 0;
  modLinesArr.forEach((l) => { if (!origSet.has(l)) linesAdded++; });
  origLinesArr.forEach((l) => { if (!modSet.has(l)) linesRemoved++; });

  const charDiff = modChars - origChars;
  const charsAdded = charDiff > 0 ? charDiff : Math.max(0, modChars - (origChars - Math.abs(charDiff)));
  const charsRemoved = charDiff < 0 ? Math.abs(charDiff) : 0;

  return {
    origLines,
    modLines,
    origChars,
    modChars,
    linesAdded,
    linesRemoved,
    charsAdded: linesAdded > 0 ? Math.max(linesAdded * 8, charsAdded || 12) : 0,
    charsRemoved: linesRemoved > 0 ? Math.max(linesRemoved * 8, charsRemoved || 12) : 0
  };
}

const SAMPLE_ORIGINAL = JSON.stringify({
  id: "usr_001",
  name: "Jane Doe",
  role: "engineer",
  skills: ["typescript", "rust"],
  active: true,
  joinedAt: "2025-01-01"
}, null, 2);

const SAMPLE_MODIFIED = JSON.stringify({
  id: "usr_001",
  name: "Jane Smith",
  role: "senior engineer",
  skills: ["typescript", "rust", "wasm"],
  active: true,
  joinedAt: "2025-01-01",
  updatedAt: "2026-06-15"
}, null, 2);

export const DiffChecker: React.FC<DiffCheckerProps> = ({ theme, showToast }) => {
  const [leftValue, setLeftValue] = useState<string>(() => localStorage.getItem('jsontools-diff-left') || '');
  const [rightValue, setRightValue] = useState<string>(() => localStorage.getItem('jsontools-diff-right') || '');
  const [diffOriginal, setDiffOriginal] = useState<string>(() => localStorage.getItem('jsontools-diff-left') || '');
  const [diffModified, setDiffModified] = useState<string>(() => localStorage.getItem('jsontools-diff-right') || '');

  const [leftError, setLeftError] = useState<string | null>(null);
  const [rightError, setRightError] = useState<string | null>(null);

  const [renderSideBySide, setRenderSideBySide] = useState(true);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [lineWrap, setLineWrap] = useState(false);

  const [leftLoading, setLeftLoading] = useState(false);
  const [rightLoading, setRightLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Popover state for Additions & Removals stat cards
  const [showRemovalPopover, setShowRemovalPopover] = useState(false);
  const [showAdditionPopover, setShowAdditionPopover] = useState(false);

  const [stats, setStats] = useState<DetailedStats>(() => {
    const l = localStorage.getItem('jsontools-diff-left') || '';
    const r = localStorage.getItem('jsontools-diff-right') || '';
    return computeDetailedStats(l, r);
  });

  const leftWorkerRef = useRef<Worker | null>(null);
  const rightWorkerRef = useRef<Worker | null>(null);
  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);
  const diffContainerRef = useRef<HTMLDivElement>(null);
  const [diffFullscreen, setDiffFullscreen] = useState(false);

  // Sync with inner URL hashes
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
      if (hash.includes('inline') || hash.includes('unified')) {
        setRenderSideBySide(false);
      } else if (hash.includes('split')) {
        setRenderSideBySide(true);
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

  useEffect(() => {
    leftWorkerRef.current = new Worker(new URL('../workers/json.worker.ts', import.meta.url), { type: 'module' });
    rightWorkerRef.current = new Worker(new URL('../workers/json.worker.ts', import.meta.url), { type: 'module' });

    leftWorkerRef.current.onmessage = (e) => {
      setLeftLoading(false);
      const { success, result, error } = e.data;
      if (success) { setLeftValue(result); setLeftError(null); showToast('Original JSON formatted.'); }
      else { setLeftError(error); }
    };
    rightWorkerRef.current.onmessage = (e) => {
      setRightLoading(false);
      const { success, result, error } = e.data;
      if (success) { setRightValue(result); setRightError(null); showToast('Modified JSON formatted.'); }
      else { setRightError(error); }
    };

    return () => {
      leftWorkerRef.current?.terminate();
      rightWorkerRef.current?.terminate();
    };
  }, [showToast]);

  // Compute stats on comparison text
  useEffect(() => {
    setStats(computeDetailedStats(diffOriginal, diffModified));
  }, [diffOriginal, diffModified]);

  // "Find difference" action (updates top diff viewer)
  const handleFindDifference = () => {
    setDiffOriginal(leftValue);
    setDiffModified(rightValue);
    localStorage.setItem('jsontools-diff-left', leftValue);
    localStorage.setItem('jsontools-diff-right', rightValue);
    showToast('Difference computed!');
    diffContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleFormat = (side: 'left' | 'right') => {
    const val = side === 'left' ? leftValue : rightValue;
    if (!val.trim()) return;
    if (side === 'left') setLeftLoading(true);
    else setRightLoading(true);
    const worker = side === 'left' ? leftWorkerRef.current : rightWorkerRef.current;
    worker?.postMessage({
      type: 'format',
      jsonStr: val,
      options: { indentSize: 2, sortMode: 'none', fixLooseJson: true }
    });
  };

  const handleSortAndDiff = useCallback(async () => {
    setGlobalLoading(true);
    const sortOne = (val: string): Promise<string> =>
      new Promise((resolve) => {
        if (!val.trim()) { resolve(val); return; }
        const w = new Worker(new URL('../workers/json.worker.ts', import.meta.url), { type: 'module' });
        w.onmessage = (e) => { w.terminate(); resolve(e.data.success ? e.data.result : val); };
        w.postMessage({ type: 'sort', jsonStr: val, options: { indentSize: 2, sortMode: 'asc', fixLooseJson: true } });
      });

    const [sortedLeft, sortedRight] = await Promise.all([sortOne(leftValue), sortOne(rightValue)]);
    setLeftValue(sortedLeft);
    setRightValue(sortedRight);
    setDiffOriginal(sortedLeft);
    setDiffModified(sortedRight);
    localStorage.setItem('jsontools-diff-left', sortedLeft);
    localStorage.setItem('jsontools-diff-right', sortedRight);
    setGlobalLoading(false);
    showToast('Keys sorted & diff computed!');
  }, [leftValue, rightValue, showToast]);

  const handleSwap = () => {
    const tmp = leftValue;
    setLeftValue(rightValue);
    setRightValue(tmp);
    setDiffOriginal(rightValue);
    setDiffModified(tmp);
    localStorage.setItem('jsontools-diff-left', rightValue);
    localStorage.setItem('jsontools-diff-right', tmp);
    showToast('Swapped Original and Changed text!');
  };

  const handleClear = () => {
    setLeftValue('');
    setRightValue('');
    setDiffOriginal('');
    setDiffModified('');
    setLeftError(null);
    setRightError(null);
    localStorage.setItem('jsontools-diff-left', '');
    localStorage.setItem('jsontools-diff-right', '');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (side === 'left') {
        setLeftValue(content);
        setDiffOriginal(content);
        localStorage.setItem('jsontools-diff-left', content);
        showToast(`Loaded to Original.`);
      } else {
        setRightValue(content);
        setDiffModified(content);
        localStorage.setItem('jsontools-diff-right', content);
        showToast(`Loaded to Changed.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportDiff = () => {
    const content = `--- Original\n+++ Changed\n\n${diffOriginal}\n\n=== MODIFIED ===\n\n${diffModified}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devjson-diff-${Date.now()}.diff`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Diff file exported!');
  };

  const hasDiffContent = Boolean(diffOriginal.trim() || diffModified.trim());
  const isIdentical = hasDiffContent && stats.linesRemoved === 0 && stats.linesAdded === 0;

  const lineAddPct = stats.modLines > 0 ? ((stats.linesAdded / stats.modLines) * 100).toFixed(1) : '0.0';
  const lineRemPct = stats.origLines > 0 ? ((stats.linesRemoved / stats.origLines) * 100).toFixed(1) : '0.0';
  const charAddPct = stats.modChars > 0 ? ((stats.charsAdded / stats.modChars) * 100).toFixed(1) : '0.0';
  const charRemPct = stats.origChars > 0 ? ((stats.charsRemoved / stats.origChars) * 100).toFixed(1) : '0.0';

  // Compute line count so diff editor takes full content height without inner scroll
  const maxDiffLines = Math.max(
    (diffOriginal.match(/\n/g) || []).length + 1,
    (diffModified.match(/\n/g) || []).length + 1
  );
  const autoDiffHeight = Math.max(maxDiffLines * 20 + 50, 320);

  return (
    <div className="tab-content diff-layout" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ════════════ TOP SECTION: DIFF VIEWER (SHOWN ONLY WHEN DIFF IS COMPUTED) ════════════ */}
      {hasDiffContent && (
        <div
          ref={diffContainerRef}
          className={`glass-panel ${diffFullscreen ? 'pane-fullscreen' : ''}`}
          style={{
            minHeight: diffFullscreen ? '100vh' : 'auto',
            height: diffFullscreen ? 'calc(100vh - 65px)' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
        {/* Diff Header Bar (matching diffchecker.com with interactive stats popover) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', fontSize: 12, flexWrap: 'wrap', gap: 8, flexShrink: 0 }}>
          {/* Left: Original Text or Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Original text</span>

            {hasDiffContent && (
              <>
                <div
                  onMouseEnter={() => setShowRemovalPopover(true)}
                  onMouseLeave={() => setShowRemovalPopover(false)}
                  style={{ position: 'relative', display: 'inline-block' }}
                >
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#dc2626',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer'
                    }}
                  >
                    <MinusCircle size={14} /> {stats.linesRemoved} removal{stats.linesRemoved === 1 ? '' : 's'}
                  </span>

                  {/* Removals Breakdown Popover */}
                  {showRemovalPopover && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        zIndex: 100,
                        width: 220,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        padding: '12px 14px',
                        fontSize: 12,
                        color: 'var(--text-primary)'
                      }}
                    >
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Lines</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Total</span>
                          <span style={{ fontWeight: 600 }}>{stats.origLines}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Removed</span>
                          <span style={{ color: '#dc2626', fontWeight: 600 }}>-{lineRemPct}% {stats.linesRemoved}</span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Characters</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Total</span>
                          <span style={{ fontWeight: 600 }}>{stats.origChars}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Removed</span>
                          <span style={{ color: '#dc2626', fontWeight: 600 }}>-{charRemPct}% {stats.charsRemoved}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <span style={{ color: 'var(--text-muted)' }}>{stats.origLines} lines</span>
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={() => { navigator.clipboard.writeText(diffOriginal); showToast('Original text copied!'); }}
                  style={{ padding: '2px 8px', fontSize: 11 }}
                >
                  Copy
                </button>
              </>
            )}
          </div>

          {/* Center Controls & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={handleSwap}
              className="icon-btn"
              title="Swap Original and Changed text"
              style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              <ArrowLeftRight size={13} />
            </button>

            {/* Layout Switcher (Split vs Unified) */}
            <div className="converter-mode-tabs" style={{ padding: 2 }}>
              <button
                type="button"
                className={`converter-tab-item ${renderSideBySide ? 'active' : ''}`}
                onClick={() => setRenderSideBySide(true)}
                style={{ padding: '3px 10px', fontSize: 11 }}
                title="Side-by-side split view"
              >
                Split
              </button>
              <button
                type="button"
                className={`converter-tab-item ${!renderSideBySide ? 'active' : ''}`}
                onClick={() => setRenderSideBySide(false)}
                style={{ padding: '3px 10px', fontSize: 11 }}
                title="Inline unified view"
              >
                Unified
              </button>
            </div>

            {/* Toggles */}
            <label className="checkbox-label" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={ignoreWhitespace}
                onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                className="checkbox-input"
              />
              Ignore Whitespace
            </label>

            <label className="checkbox-label" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={lineWrap}
                onChange={(e) => setLineWrap(e.target.checked)}
                className="checkbox-input"
              />
              Line Wrap
            </label>

            <button
              className="btn btn-secondary btn-xs"
              onClick={handleSortAndDiff}
              disabled={globalLoading || (!leftValue.trim() && !rightValue.trim())}
              title="Sort JSON keys alphabetically then compare"
              style={{ padding: '4px 8px' }}
            >
              {globalLoading ? <Loader2 size={12} className="spinner-sm" /> : <Split size={12} />}
              Sort Keys &amp; Compare
            </button>

            <button className="btn btn-secondary btn-xs" onClick={handleExportDiff} title="Export diff file" style={{ padding: '4px 8px' }}>
              <Download size={12} /> Export
            </button>

            <button className="btn btn-danger btn-xs" onClick={handleClear} disabled={!leftValue && !rightValue} style={{ padding: '4px 8px' }}>
              <Trash2 size={12} /> Clear
            </button>
          </div>

          {/* Right: Changed Text or Stats & Fullscreen toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
            {hasDiffContent && (
              <>
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={() => { navigator.clipboard.writeText(diffModified); showToast('Changed text copied!'); }}
                  style={{ padding: '2px 8px', fontSize: 11 }}
                >
                  Copy
                </button>
                <span style={{ color: 'var(--text-muted)' }}>{stats.modLines} lines</span>

                <div
                  onMouseEnter={() => setShowAdditionPopover(true)}
                  onMouseLeave={() => setShowAdditionPopover(false)}
                  style={{ position: 'relative', display: 'inline-block' }}
                >
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#059669',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer'
                    }}
                  >
                    <PlusCircle size={14} /> {stats.linesAdded} addition{stats.linesAdded === 1 ? '' : 's'}
                  </span>

                  {/* Additions Breakdown Popover */}
                  {showAdditionPopover && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        zIndex: 100,
                        width: 220,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        padding: '12px 14px',
                        fontSize: 12,
                        color: 'var(--text-primary)'
                      }}
                    >
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Lines</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Total</span>
                          <span style={{ fontWeight: 600 }}>{stats.modLines}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Added</span>
                          <span style={{ color: '#059669', fontWeight: 600 }}>+{lineAddPct}% {stats.linesAdded}</span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Characters</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Total</span>
                          <span style={{ fontWeight: 600 }}>{stats.modChars}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Added</span>
                          <span style={{ color: '#059669', fontWeight: 600 }}>+{charAddPct}% {stats.charsAdded}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Changed text</span>

            <button
              className="pane-icon-btn"
              onClick={() => setDiffFullscreen(!diffFullscreen)}
              title={diffFullscreen ? 'Exit Fullscreen' : 'Fullscreen / Expand Diff Viewer'}
              style={{ width: 28, height: 28, marginLeft: 2 }}
            >
              {diffFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        {/* Diff Status Message if identical */}
        {isIdentical && (
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', borderBottom: '1px solid rgba(34, 197, 94, 0.2)', padding: '6px 16px', color: '#22c55e', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <Check size={14} /> Documents are identical (No differences found).
          </div>
        )}

        {/* Monaco Diff Viewer - Expanded to full height */}
        <div style={{ height: diffFullscreen ? 'calc(100vh - 65px)' : autoDiffHeight, minHeight: 320, position: 'relative' }}>
          <DiffEditor
            height="100%"
            language="json"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            original={diffOriginal}
            modified={diffModified}
            options={{
              renderSideBySide,
              ignoreTrimWhitespace: ignoreWhitespace,
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              readOnly: true,
              diffWordWrap: lineWrap ? 'on' : 'off',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderOverviewRuler: false,
              minimap: { enabled: false },
              lineNumbersMinChars: 3,
              glyphMargin: false,
              enableSplitViewResizing: true,
              scrollbar: {
                vertical: 'hidden',
                horizontal: 'auto',
                verticalScrollbarSize: 0,
                horizontalScrollbarSize: 8,
                handleMouseWheel: false,
                alwaysConsumeMouseWheel: false
              }
            }}
            loading={<div className="monaco-loader"><div className="spinner" /><span>Computing diff…</span></div>}
          />
        </div>
      </div>
      )}

      {/* ════════════ BOTTOM SECTION: EDIT INPUT PANES ════════════ */}
      <div
        className="diff-editors-grid"
        style={{
          height: hasDiffContent ? 260 : 'calc(100vh - 210px)',
          minHeight: hasDiffContent ? 220 : 480
        }}
      >
        {/* Left: Original Text */}
        <div className="glass-panel dual-editor-pane">
          <div className="editor-card-header">
            <div className="editor-card-title">
              <FileText size={14} /> Original text
            </div>
            <div className="editor-card-actions">
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => {
                  setLeftValue(SAMPLE_ORIGINAL);
                  localStorage.setItem('jsontools-diff-left', SAMPLE_ORIGINAL);
                  showToast('Original sample loaded!');
                }}
                title="Load Original Sample JSON"
              >
                Sample
              </button>
              <button className="btn btn-secondary btn-xs" onClick={() => handleFormat('left')} disabled={leftLoading || !leftValue.trim()} title="Format JSON">
                {leftLoading ? <span className="spinner-sm" /> : <AlignLeft size={12} />} Format
              </button>
              <button className="btn btn-secondary btn-xs" onClick={() => { navigator.clipboard.writeText(leftValue); showToast('Original copied!'); }} disabled={!leftValue}>
                <Copy size={11} />
              </button>
              <button className="btn btn-secondary btn-xs" onClick={() => leftFileRef.current?.click()} title="Open File">
                <Upload size={12} /> Open file
              </button>
              <input type="file" ref={leftFileRef} onChange={(e) => handleFileUpload(e, 'left')} accept=".json,.txt,text/*" style={{ display: 'none' }} />
            </div>
          </div>
          <div className="editor-body" style={{ flex: 1, minHeight: 180, height: hasDiffContent ? 210 : 'calc(100vh - 270px)' }}>
            <Editor
              height="100%"
              language="json"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={leftValue}
              onChange={(v) => {
                const val = v || '';
                setLeftValue(val);
                localStorage.setItem('jsontools-diff-left', val);
              }}
              options={{ fontSize: 13, fontFamily: 'var(--font-mono)', minimap: { enabled: false }, wordWrap: lineWrap ? 'on' : 'off', scrollbar: { verticalScrollbarSize: 7 } }}
              loading={<div className="monaco-loader"><div className="spinner" /></div>}
            />
          </div>
        </div>

        {/* Right: Changed Text */}
        <div className="glass-panel dual-editor-pane">
          <div className="editor-card-header">
            <div className="editor-card-title">
              <FileText size={14} /> Changed text
            </div>
            <div className="editor-card-actions">
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => {
                  setRightValue(SAMPLE_MODIFIED);
                  localStorage.setItem('jsontools-diff-right', SAMPLE_MODIFIED);
                  showToast('Changed sample loaded!');
                }}
                title="Load Changed Sample JSON"
              >
                Sample
              </button>
              <button className="btn btn-secondary btn-xs" onClick={() => handleFormat('right')} disabled={rightLoading || !rightValue.trim()} title="Format JSON">
                {rightLoading ? <span className="spinner-sm" /> : <AlignLeft size={12} />} Format
              </button>
              <button className="btn btn-secondary btn-xs" onClick={() => { navigator.clipboard.writeText(rightValue); showToast('Changed copied!'); }} disabled={!rightValue}>
                <Copy size={11} />
              </button>
              <button className="btn btn-secondary btn-xs" onClick={() => rightFileRef.current?.click()} title="Open File">
                <Upload size={12} /> Open file
              </button>
              <input type="file" ref={rightFileRef} onChange={(e) => handleFileUpload(e, 'right')} accept=".json,.txt,text/*" style={{ display: 'none' }} />
            </div>
          </div>
          <div className="editor-body" style={{ flex: 1, minHeight: 180, height: hasDiffContent ? 210 : 'calc(100vh - 270px)' }}>
            <Editor
              height="100%"
              language="json"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={rightValue}
              onChange={(v) => {
                const val = v || '';
                setRightValue(val);
                localStorage.setItem('jsontools-diff-right', val);
              }}
              options={{ fontSize: 13, fontFamily: 'var(--font-mono)', minimap: { enabled: false }, wordWrap: lineWrap ? 'on' : 'off', scrollbar: { verticalScrollbarSize: 7 } }}
              loading={<div className="monaco-loader"><div className="spinner" /></div>}
            />
          </div>
        </div>
      </div>

      {/* Error Banners */}
      {(leftError || rightError) && (
        <div className="alert-banner error">
          <AlertCircle size={14} className="alert-icon" />
          <div className="alert-content">
            <strong>JSON Syntax Error</strong>
            {leftError && <p>Original: {leftError}</p>}
            {rightError && <p>Modified: {rightError}</p>}
          </div>
        </div>
      )}

      {/* ════════════ BOTTOM ACTION BAR: "FIND DIFFERENCE" & "CLEAR" ════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px 0 6px' }}>
        <button
          className="btn btn-primary"
          onClick={handleFindDifference}
          disabled={!leftValue.trim() && !rightValue.trim()}
          style={{
            padding: '11px 36px',
            fontSize: 14,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer'
          }}
          title="Compute differences between Original and Changed text"
        >
          <GitCompare size={16} /> Find difference
        </button>

        {Boolean(leftValue.trim() || rightValue.trim() || diffOriginal.trim() || diffModified.trim()) && (
          <button
            className="btn btn-danger"
            onClick={handleClear}
            style={{
              padding: '11px 24px',
              fontSize: 14,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
            title="Clear all diff inputs and comparison results"
          >
            <Trash2 size={15} /> Clear
          </button>
        )}
      </div>
    </div>
  );
};
