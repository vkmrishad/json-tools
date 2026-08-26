import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import {
  Check, AlertCircle, Search, X, Code2, Eye, Globe
} from 'lucide-react';
import { TreeViewer } from './TreeViewer';
import { AdUnit } from './AdUnit';
import {
  FormatIndentIcon,
  MinifyLinesIcon,
  SortLinesDownIcon,
  FilterFunnelIcon,
  RepairWrenchIcon,
  UndoIcon,
  RedoIcon,
  FolderOpenIcon,
  SaveDiskIcon,
  CheckmarkIcon,
  PrintDocIcon,
  ClearXIcon,
  CopyPagesIcon,
  FullscreenExpandIcon,
  FullscreenCollapseIcon
} from './FormatterIcons';
import type { FormattingOptions } from '../types/json';

interface FormatterProps {
  theme: 'dark' | 'light';
  showToast: (msg: string) => void;
  targetSubOption?: string;
}

interface Insights {
  size: string;
  lines: number;
  chars: number;
  depth: string;
  keys: string;
  objects: string;
  arrays: string;
  status: 'valid' | 'invalid' | 'empty';
}

type ViewMode = 'code' | 'tree';

interface FilterEvaluation {
  result: string;
  count: number;
}

// Robust JSONPath & Deep Search Filter Engine
function evaluateJsonFilter(rawJson: string, query: string): FilterEvaluation | null {
  const q = query.trim();
  if (!q || !rawJson.trim()) return null;

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return null;
  }

  if (q === '$') {
    return {
      result: JSON.stringify(parsed, null, 2),
      count: Array.isArray(parsed) ? parsed.length : 1
    };
  }

  // 1. JSONPath Evaluation
  try {
    let cleanQ = q.startsWith('$.') ? q.slice(2) : q.startsWith('$') ? q.slice(1) : q;
    cleanQ = cleanQ.replace(/^\[['"]?([^'"\]]+)['"]?\]/, '$1');

    const tokens: string[] = [];
    const tokenRegex = /([^.\[\]]+)|\[(\d+)\]|\[['"]([^'"]+)['"]\]/g;
    let match;
    while ((match = tokenRegex.exec(cleanQ)) !== null) {
      tokens.push(match[1] || match[2] || match[3]);
    }

    if (tokens.length > 0) {
      let cur: any = parsed;
      let matched = true;

      for (const token of tokens) {
        if (cur === undefined || cur === null) {
          matched = false;
          break;
        }
        if (Array.isArray(cur) && /^\d+$/.test(token)) {
          cur = cur[parseInt(token, 10)];
        } else if (typeof cur === 'object' && token in cur) {
          cur = cur[token];
        } else {
          matched = false;
          break;
        }
      }

      if (matched && cur !== undefined) {
        const count = Array.isArray(cur) ? cur.length : (typeof cur === 'object' && cur !== null ? Object.keys(cur).length : 1);
        return { result: JSON.stringify(cur, null, 2), count };
      }
    }
  } catch {}

  // 2. Deep Substring / Keyword Search Fallback
  try {
    const searchLower = q.toLowerCase();
    let matches: any = Array.isArray(parsed) ? [] : {};
    let count = 0;

    const searchRecursive = (obj: any) => {
      if (obj === null || obj === undefined) return;
      if (Array.isArray(obj)) {
        obj.forEach((item) => {
          if (typeof item === 'object') {
            searchRecursive(item);
          } else if (String(item).toLowerCase().includes(searchLower)) {
            if (Array.isArray(matches)) matches.push(item);
            count++;
          }
        });
      } else if (typeof obj === 'object') {
        for (const k in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, k)) {
            const val = obj[k];
            if (k.toLowerCase().includes(searchLower) || (typeof val !== 'object' && String(val).toLowerCase().includes(searchLower))) {
              if (Array.isArray(matches)) {
                matches.push({ [k]: val });
              } else {
                matches[k] = val;
              }
              count++;
            } else if (typeof val === 'object') {
              searchRecursive(val);
            }
          }
        }
      }
    };

    searchRecursive(parsed);

    const hasMatches = Array.isArray(matches) ? matches.length > 0 : Object.keys(matches).length > 0;
    if (hasMatches) {
      return { result: JSON.stringify(matches, null, 2), count: count || 1 };
    }
  } catch {}

  return null;
}

export const Formatter: React.FC<FormatterProps> = ({ theme, showToast }) => {
  const initialLeft = () => localStorage.getItem('devjson-current-val') || '';
  const [leftValue, setLeftValue] = useState<string>(initialLeft);
  const [rightValue, setRightValue] = useState<string>('');

  // ── Standard Global History Stack for Left Pane ──
  const [leftHistory, setLeftHistory] = useState<string[]>([initialLeft()]);
  const [leftHistoryIdx, setLeftHistoryIdx] = useState<number>(0);

  // ── Standard Global History Stack for Right Pane ──
  const [rightHistory, setRightHistory] = useState<string[]>(['']);
  const [rightHistoryIdx, setRightHistoryIdx] = useState<number>(0);

  const canUndoLeft = leftHistoryIdx > 0;
  const canRedoLeft = leftHistoryIdx < leftHistory.length - 1;

  const canUndoRight = rightHistoryIdx > 0;
  const canRedoRight = rightHistoryIdx < rightHistory.length - 1;

  const pushLeftChange = useCallback((newVal: string) => {
    setLeftValue(newVal);
    setLeftHistory((prev) => {
      const upToCurrent = prev.slice(0, leftHistoryIdx + 1);
      if (upToCurrent[upToCurrent.length - 1] === newVal) return prev;
      const nextStack = [...upToCurrent, newVal];
      if (nextStack.length > 50) nextStack.shift();
      return nextStack;
    });
    setLeftHistoryIdx((prev) => Math.min(prev + 1, 49));
  }, [leftHistoryIdx]);

  const pushRightChange = useCallback((newVal: string) => {
    setRightValue(newVal);
    setRightHistory((prev) => {
      const upToCurrent = prev.slice(0, rightHistoryIdx + 1);
      if (upToCurrent[upToCurrent.length - 1] === newVal) return prev;
      const nextStack = [...upToCurrent, newVal];
      if (nextStack.length > 50) nextStack.shift();
      return nextStack;
    });
    setRightHistoryIdx((prev) => Math.min(prev + 1, 49));
  }, [rightHistoryIdx]);

  const handleUndoLeft = () => {
    if (!canUndoLeft) return;
    const newIdx = leftHistoryIdx - 1;
    const prevVal = leftHistory[newIdx] ?? '';
    setLeftHistoryIdx(newIdx);
    setLeftValue(prevVal);
  };

  const handleRedoLeft = () => {
    if (!canRedoLeft) return;
    const newIdx = leftHistoryIdx + 1;
    const nextVal = leftHistory[newIdx] ?? '';
    setLeftHistoryIdx(newIdx);
    setLeftValue(nextVal);
  };

  const handleUndoRight = () => {
    if (!canUndoRight) return;
    const newIdx = rightHistoryIdx - 1;
    const prevVal = rightHistory[newIdx] ?? '';
    setRightHistoryIdx(newIdx);
    setRightValue(prevVal);
  };

  const handleRedoRight = () => {
    if (!canRedoRight) return;
    const newIdx = rightHistoryIdx + 1;
    const nextVal = rightHistory[newIdx] ?? '';
    setRightHistoryIdx(newIdx);
    setRightValue(nextVal);
  };

  const [leftSortDir, setLeftSortDir] = useState<'asc' | 'desc'>('asc');
  const [rightSortDir, setRightSortDir] = useState<'asc' | 'desc'>('asc');

  const [leftError, setLeftError] = useState<string | null>(null);
  const [rightError, setRightError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [rightViewMode, setRightViewMode] = useState<ViewMode>('code');
  const [rightParsedData, setRightParsedData] = useState<any>(null);

  const [leftFullscreen, setLeftFullscreen] = useState(false);
  const [rightFullscreen, setRightFullscreen] = useState(false);

  // Filter state for Left
  const [showLeftFilter, setShowLeftFilter] = useState(false);
  const [leftFilterQuery, setLeftFilterQuery] = useState('');
  const [leftFilterResult, setLeftFilterResult] = useState<string | null>(null);
  const [leftFilterCount, setLeftFilterCount] = useState<number>(0);

  // Filter state for Right
  const [showRightFilter, setShowRightFilter] = useState(false);
  const [rightFilterQuery, setRightFilterQuery] = useState('');
  const [rightFilterResult, setRightFilterResult] = useState<string | null>(null);
  const [rightFilterCount, setRightFilterCount] = useState<number>(0);

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [fetchUrl, setFetchUrl] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [indentSize, setIndentSize] = useState<number>(2);

  const [leftInsights, setLeftInsights] = useState<Insights>({
    size: '0 B', lines: 1, chars: 0, depth: '-', keys: '-', objects: '-', arrays: '-', status: 'empty'
  });

  const [rightInsights, setRightInsights] = useState<Insights>({
    size: '0 B', lines: 1, chars: 0, depth: '-', keys: '-', objects: '-', arrays: '-', status: 'empty'
  });

  const workerRef = useRef<Worker | null>(null);
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);
  const leftEditorRef = useRef<any>(null);
  const rightEditorRef = useRef<any>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/json.worker.ts', import.meta.url), { type: 'module' });
    return () => workerRef.current?.terminate();
  }, []);

  useEffect(() => { localStorage.setItem('devjson-current-val', leftValue); }, [leftValue]);

  // Compute insights & validation strictly for Left Pane
  useEffect(() => {
    if (!leftValue.trim()) {
      setLeftError(null);
      setLeftInsights({ size: '0 B', lines: 1, chars: 0, depth: '-', keys: '-', objects: '-', arrays: '-', status: 'empty' });
      return;
    }
    const chars = leftValue.length;
    const lines = leftValue.split('\n').length;
    const bytes = new Blob([leftValue]).size;
    const sizeStr = bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(2)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

    try {
      const parsed = JSON.parse(leftValue);
      setLeftError(null);
      if (bytes < 2 * 1024 * 1024) {
        let depth = 0, keysCount = 0, objectsCount = 0, arraysCount = 0;
        const traverse = (o: any, d: number) => {
          if (d > depth) depth = d;
          if (o && typeof o === 'object') {
            if (Array.isArray(o)) { arraysCount++; o.forEach((item) => traverse(item, d + 1)); }
            else { objectsCount++; for (const k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) { keysCount++; traverse(o[k], d + 1); } } }
          }
        };
        traverse(parsed, 1);
        setLeftInsights({ size: sizeStr, lines, chars, depth: depth.toString(), keys: keysCount.toString(), objects: objectsCount.toString(), arrays: arraysCount.toString(), status: 'valid' });
      } else {
        setLeftInsights({ size: sizeStr, lines, chars, depth: 'N/A', keys: 'N/A', objects: 'N/A', arrays: 'N/A', status: 'valid' });
      }
    } catch (err: any) {
      setLeftError(err.message);
      setLeftInsights((prev) => ({ ...prev, size: sizeStr, lines, chars, status: 'invalid' }));
    }
  }, [leftValue]);

  // Compute insights & validation strictly for Right Pane
  useEffect(() => {
    if (!rightValue.trim()) {
      setRightError(null);
      setRightParsedData(null);
      setRightInsights({ size: '0 B', lines: 1, chars: 0, depth: '-', keys: '-', objects: '-', arrays: '-', status: 'empty' });
      return;
    }
    const chars = rightValue.length;
    const lines = rightValue.split('\n').length;
    const bytes = new Blob([rightValue]).size;
    const sizeStr = bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(2)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

    try {
      const parsed = JSON.parse(rightValue);
      setRightParsedData(parsed);
      setRightError(null);
      if (bytes < 2 * 1024 * 1024) {
        let depth = 0, keysCount = 0, objectsCount = 0, arraysCount = 0;
        const traverse = (o: any, d: number) => {
          if (d > depth) depth = d;
          if (o && typeof o === 'object') {
            if (Array.isArray(o)) { arraysCount++; o.forEach((item) => traverse(item, d + 1)); }
            else { objectsCount++; for (const k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) { keysCount++; traverse(o[k], d + 1); } } }
          }
        };
        traverse(parsed, 1);
        setRightInsights({ size: sizeStr, lines, chars, depth: depth.toString(), keys: keysCount.toString(), objects: objectsCount.toString(), arrays: arraysCount.toString(), status: 'valid' });
      } else {
        setRightInsights({ size: sizeStr, lines, chars, depth: 'N/A', keys: 'N/A', objects: 'N/A', arrays: 'N/A', status: 'valid' });
      }
    } catch (err: any) {
      setRightParsedData(null);
      setRightError(err.message);
      setRightInsights((prev) => ({ ...prev, size: sizeStr, lines, chars, status: 'invalid' }));
    }
  }, [rightValue]);

  // Left Filter Live Evaluation
  useEffect(() => {
    if (!leftFilterQuery.trim() || !leftValue.trim()) {
      setLeftFilterResult(null);
      setLeftFilterCount(0);
      return;
    }
    const evaluation = evaluateJsonFilter(leftValue, leftFilterQuery);
    if (evaluation) {
      setLeftFilterResult(evaluation.result);
      setLeftFilterCount(evaluation.count);
    } else {
      setLeftFilterResult(null);
      setLeftFilterCount(0);
    }
  }, [leftFilterQuery, leftValue]);

  // Right Filter Live Evaluation
  useEffect(() => {
    if (!rightFilterQuery.trim() || !rightValue.trim()) {
      setRightFilterResult(null);
      setRightFilterCount(0);
      return;
    }
    const evaluation = evaluateJsonFilter(rightValue, rightFilterQuery);
    if (evaluation) {
      setRightFilterResult(evaluation.result);
      setRightFilterCount(evaluation.count);
    } else {
      setRightFilterResult(null);
      setRightFilterCount(0);
    }
  }, [rightFilterQuery, rightValue]);

  // ISOLATED ACTION HANDLER
  const handlePaneAction = useCallback((
    side: 'left' | 'right',
    type: 'format' | 'minify' | 'sort' | 'escape' | 'unescape' | 'fix',
    indent = 2,
    descending?: boolean
  ) => {
    const srcVal = side === 'left' ? leftValue : rightValue;
    if (!srcVal.trim()) {
      showToast(`Please enter JSON in the ${side === 'left' ? 'Input' : 'Output'} editor first.`);
      return;
    }

    let isDesc = false;
    if (type === 'sort') {
      if (descending !== undefined) {
        isDesc = descending;
      } else {
        const cur = side === 'left' ? leftSortDir : rightSortDir;
        isDesc = cur === 'asc';
        if (side === 'left') setLeftSortDir(isDesc ? 'desc' : 'asc');
        else setRightSortDir(isDesc ? 'desc' : 'asc');
      }
    }

    setLoading(true);
    const options: FormattingOptions = {
      indentSize: indent,
      sortMode: type === 'sort' ? (isDesc ? 'desc' : 'asc') : 'none',
      fixLooseJson: true
    };

    const worker = workerRef.current;
    if (!worker) return;

    const originalOnMessage = worker.onmessage;
    worker.onmessage = (e) => {
      worker.onmessage = originalOnMessage;
      setLoading(false);
      const { success, result, error: errMsg } = e.data;
      if (success) {
        if (side === 'left') {
          pushLeftChange(result);
          setLeftError(null);
        } else {
          pushRightChange(result);
          setRightError(null);
        }
        const word = {
          format: `Formatted (2 Spaces)`,
          minify: 'Minified',
          sort: `Sorted (${isDesc ? 'Descending Z-A' : 'Ascending A-Z'})`,
          escape: 'Escaped Quotes',
          unescape: 'Unescaped String',
          fix: 'Repaired JSON'
        }[type] || 'Processed';
        showToast(`${side === 'left' ? 'Input' : 'Output'} ${word}!`);
      } else {
        if (side === 'left') setLeftError(errMsg);
        else setRightError(errMsg);
        showToast(`Error: ${errMsg}`);
      }
    };

    worker.postMessage({
      type,
      jsonStr: srcVal,
      options,
      indentSize: indent,
      descending: isDesc
    });
  }, [leftValue, rightValue, leftSortDir, rightSortDir, pushLeftChange, pushRightChange, showToast]);

  // CENTER BRIDGE ACTION (Transforms Left -> Right)
  const handleCenterTransform = useCallback((
    type: 'format' | 'minify' | 'sort' | 'fix',
    indent = indentSize
  ) => {
    if (!leftValue.trim()) {
      showToast('Please enter JSON in the Input editor first.');
      return;
    }
    setLoading(true);
    const options: FormattingOptions = {
      indentSize: indent,
      fixLooseJson: true
    };

    const worker = workerRef.current;
    if (!worker) return;

    const originalOnMessage = worker.onmessage;
    worker.onmessage = (e) => {
      worker.onmessage = originalOnMessage;
      setLoading(false);
      const { success, result, error: errMsg } = e.data;
      if (success) {
        pushRightChange(result);
        setRightError(null);
        showToast('Transformed to Output editor!');
      } else {
        setRightError(errMsg);
        showToast(`Error: ${errMsg}`);
      }
    };

    worker.postMessage({
      type,
      jsonStr: leftValue,
      options,
      indentSize: indent,
      descending: false
    });
  }, [leftValue, indentSize, pushRightChange, showToast]);

  // Enhanced Validation: jumps to exact error line and column
  const handleValidateSide = useCallback((side: 'left' | 'right') => {
    const val = side === 'left' ? leftValue : rightValue;
    const editor = side === 'left' ? leftEditorRef.current : rightEditorRef.current;

    if (!val.trim()) {
      showToast(`Please enter JSON in the ${side === 'left' ? 'Input' : 'Output'} editor to validate.`);
      return;
    }

    try {
      JSON.parse(val);
      if (side === 'left') setLeftError(null);
      else setRightError(null);
      showToast(`✓ ${side === 'left' ? 'Input' : 'Output'} JSON is Valid!`);
    } catch (err: any) {
      const msg = err.message || 'Syntax Error';
      if (side === 'left') setLeftError(msg);
      else setRightError(msg);

      const lineMatch = msg.match(/line (\d+)/i);
      const colMatch = msg.match(/column (\d+)/i);
      const posMatch = msg.match(/position (\d+)/i);

      let line = lineMatch ? parseInt(lineMatch[1], 10) : 1;
      let col = colMatch ? parseInt(colMatch[1], 10) : 1;

      if (!lineMatch && posMatch) {
        const pos = parseInt(posMatch[1], 10);
        const upToPos = val.slice(0, pos);
        const lines = upToPos.split('\n');
        line = lines.length;
        col = lines[lines.length - 1].length + 1;
      }

      if (editor) {
        editor.revealLineInCenter(line);
        editor.setPosition({ lineNumber: line, column: col });
        editor.focus();
      }

      const cleanMsg = msg.replace(/^JSON\.parse:\s*/i, '');
      showToast(`Line ${line}, Col ${col}: ${cleanMsg}`);
    }
  }, [leftValue, rightValue, showToast]);

  // Handle inner hashes on initial load or navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
      if (hash.includes('json-validator') || hash.includes('validate')) {
        handleValidateSide('left');
      } else if (hash.includes('json-minifier') || hash.includes('minify')) {
        handlePaneAction('left', 'minify');
      } else if (hash.includes('json-beautifier') || hash.includes('beautify')) {
        handleCenterTransform('format', 2);
      } else if (hash.includes('json-sorter') || hash.includes('sort')) {
        handlePaneAction('left', 'sort', 2);
      } else if (hash.includes('json-repair') || hash.includes('repair')) {
        handlePaneAction('left', 'fix');
      }
    };
    if (window.location.hash) {
      setTimeout(handleHash, 150);
    }
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [handleValidateSide, handlePaneAction, handleCenterTransform]);

  // Global Keyboard Shortcuts (Ctrl+Enter to Beautify, Ctrl+S to Download)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCenterTransform('format', indentSize);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleDownloadSide('left');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCenterTransform, indentSize, leftValue]);

  const handleCopy = (side: 'left' | 'right') => {
    const text = side === 'left' ? (leftFilterResult || leftValue) : (rightFilterResult || rightValue);
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`Copied ${side === 'left' ? 'Input' : 'Output'} to clipboard!`);
  };

  const handleClearSide = (side: 'left' | 'right') => {
    if (side === 'left') {
      pushLeftChange('');
      setLeftError(null);
      setLeftFilterQuery('');
      setLeftFilterResult(null);
    } else {
      pushRightChange('');
      setRightError(null);
      setRightFilterQuery('');
      setRightFilterResult(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (side === 'left') {
        pushLeftChange(content);
      } else {
        pushRightChange(content);
      }
      showToast(`Loaded ${file.name} to ${side === 'left' ? 'Input' : 'Output'}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadSide = (side: 'left' | 'right') => {
    const content = side === 'left' ? leftValue : rightValue;
    if (!content) return;
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devjson-${side}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = (side: 'left' | 'right') => {
    const content = side === 'left' ? leftValue : rightValue;
    if (!content.trim()) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>DevJSON Print Preview - ${side}</title>
            <style>
              body { font-family: monospace; padding: 20px; white-space: pre-wrap; font-size: 13px; line-height: 1.5; color: #111; }
            </style>
          </head>
          <body>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleFetchUrl = async () => {
    if (!fetchUrl.trim()) return;
    setLoading(true);
    setFetchError(null);

    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const data = await res.text();
      JSON.parse(data);
      pushLeftChange(data);
      setShowUrlInput(false);
      setFetchUrl('');
      showToast('Loaded JSON from URL into Input!');
    } catch (err: any) {
      setFetchError(err.message || 'Network error. Ensure CORS is supported.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    const sample = {
      project: "DevJSON Online Suite",
      version: "2.0",
      description: "Dual-Pane JSON Formatter matching jsonformatter.org toolbars",
      settings: {
        indentation: "2 Spaces",
        repairLooseJson: "Fixes trailing commas, single quotes, unquoted keys & comments",
        wasmPerformance: "Rust WebAssembly Web Worker execution",
        zeroUploads: true
      },
      stats: { keysCount: 12, maxDepth: 3 }
    };
    const jsonStr = JSON.stringify(sample, null, 2);
    pushLeftChange(jsonStr);
    showToast('Loaded Sample JSON into Input!');
  };

  const leftStatusClass = leftInsights.status === 'valid' ? 'status-valid' : leftInsights.status === 'invalid' ? 'status-invalid' : 'status-empty';
  const leftStatusText  = leftInsights.status === 'valid' ? 'Valid' : leftInsights.status === 'invalid' ? 'Invalid' : 'Empty';

  const rightStatusClass = rightInsights.status === 'valid' ? 'status-valid' : rightInsights.status === 'invalid' ? 'status-invalid' : 'status-empty';
  const rightStatusText  = rightInsights.status === 'valid' ? 'Valid' : rightInsights.status === 'invalid' ? 'Invalid' : 'Empty';

  return (
    <div className="tab-content formatter-layout">
      {/* URL Fetcher modal/bar */}
      {showUrlInput && (
        <div className="url-row">
          <Globe size={14} style={{ color: 'var(--accent-hover)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Enter public API URL (e.g. https://jsonplaceholder.typicode.com/todos/1)"
            value={fetchUrl}
            onChange={(e) => setFetchUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
          />
          <button className="btn btn-primary btn-sm" onClick={handleFetchUrl} disabled={loading || !fetchUrl.trim()} title="Fetch and load JSON">
            {loading ? 'Fetching…' : 'Load URL'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setShowUrlInput(false); setFetchUrl(''); setFetchError(null); }} title="Cancel URL input">
            <X size={13} /> Cancel
          </button>
          {fetchError && (
            <span style={{ color: 'var(--error)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={13} /> {fetchError}
            </span>
          )}
        </div>
      )}

      {/* ── 3-Column Workspace ── */}
      <div className="formatter-3col-container">
        {/* ════════════ LEFT PANE (INPUT) ════════════ */}
        <div className={`glass-panel dual-editor-pane ${leftFullscreen ? 'pane-fullscreen' : ''}`}>
          {/* Left Toolbar */}
          <div className="pane-toolbar">
            <div className="pane-toolbar-group">
              {/* 1. Format (2 Spaces) */}
              <button
                className="pane-icon-btn"
                onClick={() => handlePaneAction('left', 'format', 2)}
                disabled={!leftValue.trim()}
                title="Format / Beautify: Indent JSON with 2 spaces (Ctrl+Enter)"
              >
                <FormatIndentIcon size={16} />
              </button>

              {/* 2. Minify (Compact) */}
              <button
                className="pane-icon-btn"
                onClick={() => handlePaneAction('left', 'minify')}
                disabled={!leftValue.trim()}
                title="Minify: Compress JSON into a single line without whitespace"
              >
                <MinifyLinesIcon size={16} />
              </button>

              {/* 3. Sort Keys */}
              <button
                className="pane-icon-btn"
                onClick={() => handlePaneAction('left', 'sort', 2)}
                disabled={!leftValue.trim()}
                title={`Sort Keys: Toggle alphabetical key order (${leftSortDir === 'asc' ? 'A→Z' : 'Z→A'})`}
              >
                <SortLinesDownIcon size={16} />
              </button>

              {/* 4. Filter Funnel */}
              <button
                className={`pane-icon-btn ${showLeftFilter ? 'active' : ''}`}
                onClick={() => setShowLeftFilter(!showLeftFilter)}
                title="Filter: Search and extract data using JSONPath expressions or keywords"
              >
                <FilterFunnelIcon size={15} />
              </button>

              {/* 5. Repair Wrench */}
              <button
                className="pane-icon-btn"
                onClick={() => handlePaneAction('left', 'fix')}
                disabled={!leftValue.trim()}
                title="Repair JSON: Fix quotes, trailing commas, comments, and Python dictionaries"
              >
                <RepairWrenchIcon size={15} />
              </button>

              {/* 6. Undo */}
              <button
                className="pane-icon-btn"
                onClick={handleUndoLeft}
                disabled={!canUndoLeft}
                style={{
                  opacity: canUndoLeft ? 1 : 0.25,
                  pointerEvents: canUndoLeft ? 'auto' : 'none',
                  cursor: canUndoLeft ? 'pointer' : 'default',
                  transition: 'opacity var(--transition-fast)'
                }}
                title={canUndoLeft ? "Undo: Revert previous change (Ctrl+Z)" : "Nothing to undo"}
              >
                <UndoIcon size={15} />
              </button>

              {/* 7. Redo */}
              <button
                className="pane-icon-btn"
                onClick={handleRedoLeft}
                disabled={!canRedoLeft}
                style={{
                  opacity: canRedoLeft ? 1 : 0.25,
                  pointerEvents: canRedoLeft ? 'auto' : 'none',
                  cursor: canRedoLeft ? 'pointer' : 'default',
                  transition: 'opacity var(--transition-fast)'
                }}
                title={canRedoLeft ? "Redo: Reapply reverted change (Ctrl+Y)" : "Nothing to redo"}
              >
                <RedoIcon size={15} />
              </button>
            </div>

            <div className="pane-toolbar-group">
              {/* 8. Sample */}
              <button
                className="btn btn-secondary btn-xs"
                onClick={handleLoadSample}
                style={{ padding: '2px 8px', fontSize: 11 }}
                title="Load Sample: Populate editor with sample dataset"
              >
                Sample
              </button>

              {/* 9. Open / Upload File */}
              <button
                className="pane-icon-btn"
                onClick={() => leftFileInputRef.current?.click()}
                title="Upload File: Load a local .json file into Input editor"
              >
                <FolderOpenIcon size={15} />
              </button>
              <input type="file" ref={leftFileInputRef} onChange={(e) => handleFileUpload(e, 'left')} accept=".json,application/json" className="file-upload-input" />

              {/* 10. Download / Save */}
              <button
                className="pane-icon-btn"
                onClick={() => handleDownloadSide('left')}
                disabled={!leftValue.trim()}
                title="Download: Save Input JSON as a .json file (Ctrl+S)"
              >
                <SaveDiskIcon size={15} />
              </button>

              {/* 11. Validate */}
              <button
                className="pane-icon-btn"
                onClick={() => handleValidateSide('left')}
                disabled={!leftValue.trim()}
                title="Validate: Check JSON syntax and jump to error line"
              >
                <CheckmarkIcon size={15} />
              </button>

              {/* 12. Print */}
              <button
                className="pane-icon-btn"
                onClick={() => handlePrint('left')}
                disabled={!leftValue.trim()}
                title="Print: Open print preview for Input JSON"
              >
                <PrintDocIcon size={15} />
              </button>

              {/* 13. Clear (X) */}
              <button
                className="pane-icon-btn"
                onClick={() => handleClearSide('left')}
                disabled={!leftValue.trim()}
                title="Clear: Empty the Input editor"
              >
                <ClearXIcon size={15} />
              </button>

              {/* 14. Copy */}
              <button
                className="pane-icon-btn"
                onClick={() => handleCopy('left')}
                disabled={!leftValue.trim()}
                title="Copy: Copy Input JSON to clipboard"
              >
                <CopyPagesIcon size={15} />
              </button>

              {/* 15. Fullscreen Toggle */}
              <button
                className={`pane-icon-btn ${leftFullscreen ? 'active' : ''}`}
                onClick={() => setLeftFullscreen(!leftFullscreen)}
                title={leftFullscreen ? "Exit Fullscreen" : "Fullscreen: Expand editor"}
              >
                {leftFullscreen ? <FullscreenCollapseIcon size={15} /> : <FullscreenExpandIcon size={15} />}
              </button>
            </div>
          </div>

          {/* Optional Left Filter Bar with Apply & Match Status */}
          {showLeftFilter && (
            <div className="jsonpath-row" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <Search size={13} style={{ color: 'var(--accent-hover)', flexShrink: 0 }} />
              <input
                style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }}
                placeholder="JSONPath or keyword (e.g. $.settings, $.stats, keysCount)"
                value={leftFilterQuery}
                onChange={(e) => setLeftFilterQuery(e.target.value)}
                autoFocus
              />
              {leftFilterResult ? (
                <>
                  <span className="status-badge status-valid" style={{ fontSize: 10, padding: '2px 6px' }}>
                    Match ({leftFilterCount})
                  </span>
                  <button
                    className="btn btn-primary btn-xs"
                    onClick={() => { pushLeftChange(leftFilterResult); showToast('Filtered JSON applied to Input editor!'); }}
                    title="Apply filtered result directly into editor"
                  >
                    Apply
                  </button>
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => { navigator.clipboard.writeText(leftFilterResult); showToast('Filtered result copied!'); }}
                    title="Copy filtered result"
                  >
                    <CopyPagesIcon size={12} /> Copy
                  </button>
                </>
              ) : leftFilterQuery.trim() ? (
                <span className="status-badge status-invalid" style={{ fontSize: 10, padding: '2px 6px' }}>
                  No match
                </span>
              ) : null}
              <button
                className="icon-btn"
                onClick={() => { setLeftFilterQuery(''); setLeftFilterResult(null); setShowLeftFilter(false); }}
                title="Close filter"
                style={{ width: 22, height: 22 }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Left Monaco Editor */}
          <div className="editor-body">
            <Editor
              height="100%"
              language="json"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={leftValue}
              onChange={(val) => pushLeftChange(val || '')}
              onMount={(editor) => { leftEditorRef.current = editor; }}
              options={{
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                minimap: { enabled: false },
                wordWrap: 'on',
                formatOnPaste: true,
                cursorBlinking: 'smooth',
                padding: { top: 8, bottom: 8 },
                scrollbar: { verticalScrollbarSize: 7 }
              }}
              loading={<div className="monaco-loader"><div className="spinner" /><span>Loading editor…</span></div>}
            />
          </div>

          {/* Left Pane Footer */}
          <div className="pane-footer">
            <span className={`status-badge ${leftStatusClass}`} style={{ fontSize: 10 }}>
              {leftInsights.status === 'valid' && <Check size={10} />}
              {leftInsights.status === 'invalid' && <AlertCircle size={10} />}
              {leftStatusText}
            </span>
            <span>{leftInsights.lines} lines &nbsp;|&nbsp; {leftInsights.size}</span>
          </div>
        </div>

        {/* ════════════ CENTER COLUMN ════════════ */}
        <div className="formatter-center-col">
          {/* 1. Upload Data */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => leftFileInputRef.current?.click()}
            disabled={loading}
            title="Upload Data: Select and load a local .json file"
          >
            <FolderOpenIcon size={14} /> Upload Data
          </button>

          {/* 2. Load from URL */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowUrlInput(!showUrlInput)}
            disabled={loading}
            title="Load URL: Fetch JSON directly from a public API endpoint"
          >
            <Globe size={14} /> Load URL
          </button>

          {/* 3. Validate */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleValidateSide('left')}
            disabled={!leftValue.trim()}
            title="Validate: Test syntax and jump to error line"
          >
            <CheckmarkIcon size={14} /> Validate
          </button>

          {/* 4. Indent style dropdown */}
          <select
            className="select-input"
            value={indentSize}
            onChange={(e) => setIndentSize(Number(e.target.value))}
            title="Indentation Width: Select number of tab spaces"
          >
            <option value={2}>2 Tab Space</option>
            <option value={3}>3 Tab Space</option>
            <option value={4}>4 Tab Space</option>
            <option value={0}>Tab Space</option>
          </select>

          {/* 5. Format / Beautify (Primary Action) */}
          <button
            className="btn btn-primary"
            onClick={() => handleCenterTransform('format', indentSize)}
            disabled={loading || !leftValue.trim()}
            title="Format / Beautify: Format Left Input into Right Output (Ctrl+Enter)"
          >
            {loading ? <span className="spinner-sm" /> : <FormatIndentIcon size={15} />}
            Format / Beautify
          </button>

          {/* 6. Clean Center Ad Slot (160x160) */}
          <AdUnit position="middle" />

          {/* 7. Minify / Compact */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleCenterTransform('minify')}
            disabled={loading || !leftValue.trim()}
            title="Minify: Remove whitespace into Right Output"
          >
            <MinifyLinesIcon size={14} /> Minify / Compact
          </button>

          {/* 8. Download Output */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleDownloadSide('right')}
            disabled={!rightValue.trim() && !leftValue.trim()}
            title="Download: Save Right Output JSON as file"
          >
            <SaveDiskIcon size={14} /> Download
          </button>
        </div>

        {/* ════════════ RIGHT PANE (OUTPUT / VISUALIZER) ════════════ */}
        <div className={`glass-panel dual-editor-pane ${rightFullscreen ? 'pane-fullscreen' : ''}`}>
          {/* Right Toolbar */}
          <div className="pane-toolbar">
            <div className="pane-toolbar-group">
              {/* 1. Format (2 Spaces) */}
              <button
                className="pane-icon-btn"
                onClick={() => handlePaneAction('right', 'format', 2)}
                disabled={!rightValue.trim()}
                title="Format / Beautify: Indent Output JSON with 2 spaces"
              >
                <FormatIndentIcon size={16} />
              </button>

              {/* 2. Minify */}
              <button
                className="pane-icon-btn"
                onClick={() => handlePaneAction('right', 'minify')}
                disabled={!rightValue.trim()}
                title="Minify: Compress Output JSON into single line"
              >
                <MinifyLinesIcon size={16} />
              </button>

              {/* 3. Sort Keys */}
              <button
                className="pane-icon-btn"
                onClick={() => handlePaneAction('right', 'sort', 2)}
                disabled={!rightValue.trim()}
                title={`Sort Keys: Toggle alphabetical key order (${rightSortDir === 'asc' ? 'A→Z' : 'Z→A'})`}
              >
                <SortLinesDownIcon size={16} />
              </button>

              {/* 4. Filter */}
              <button
                className={`pane-icon-btn ${showRightFilter ? 'active' : ''}`}
                onClick={() => setShowRightFilter(!showRightFilter)}
                title="Filter: Search Output JSON with JSONPath expressions or keywords"
              >
                <FilterFunnelIcon size={15} />
              </button>

              {/* 5. Repair */}
              <button
                className="pane-icon-btn"
                onClick={() => handlePaneAction('right', 'fix')}
                disabled={!rightValue.trim()}
                title="Repair Output: Fix quotes, trailing commas, comments, and Python dicts"
              >
                <RepairWrenchIcon size={15} />
              </button>

              {/* 6. Undo (Right) */}
              <button
                className="pane-icon-btn"
                onClick={handleUndoRight}
                disabled={!canUndoRight}
                style={{
                  opacity: canUndoRight ? 1 : 0.25,
                  pointerEvents: canUndoRight ? 'auto' : 'none',
                  cursor: canUndoRight ? 'pointer' : 'default',
                  transition: 'opacity var(--transition-fast)'
                }}
                title={canUndoRight ? "Undo: Revert previous output change (Ctrl+Z)" : "Nothing to undo"}
              >
                <UndoIcon size={15} />
              </button>

              {/* 7. Redo (Right) */}
              <button
                className="pane-icon-btn"
                onClick={handleRedoRight}
                disabled={!canRedoRight}
                style={{
                  opacity: canRedoRight ? 1 : 0.25,
                  pointerEvents: canRedoRight ? 'auto' : 'none',
                  cursor: canRedoRight ? 'pointer' : 'default',
                  transition: 'opacity var(--transition-fast)'
                }}
                title={canRedoRight ? "Redo: Reapply reverted output change (Ctrl+Y)" : "Nothing to redo"}
              >
                <RedoIcon size={15} />
              </button>
            </div>

            <div className="pane-toolbar-group">
              {/* 8. View Mode Switcher */}
              <div className="mode-pills" style={{ padding: 2 }}>
                <button
                  className={`mode-pill ${rightViewMode === 'code' ? 'active' : ''}`}
                  onClick={() => setRightViewMode('code')}
                  style={{ padding: '3px 8px', fontSize: 11 }}
                  title="Switch to Code Editor view"
                >
                  <Code2 size={11} /> Code
                </button>
                <button
                  className={`mode-pill ${rightViewMode === 'tree' ? 'active' : ''}`}
                  onClick={() => setRightViewMode('tree')}
                  disabled={!rightParsedData}
                  style={{ padding: '3px 8px', fontSize: 11 }}
                  title="Switch to Interactive JSON Tree view"
                >
                  <Eye size={11} /> Tree
                </button>
              </div>

              {/* 9. Validate */}
              <button
                className="pane-icon-btn"
                onClick={() => handleValidateSide('right')}
                disabled={!rightValue.trim()}
                title="Validate: Check Output JSON syntax and jump to error line"
              >
                <CheckmarkIcon size={15} />
              </button>

              {/* 10. Open / Load into Right */}
              <button
                className="pane-icon-btn"
                onClick={() => rightFileInputRef.current?.click()}
                title="Upload File: Load a local .json file into Output editor"
              >
                <FolderOpenIcon size={15} />
              </button>
              <input type="file" ref={rightFileInputRef} onChange={(e) => handleFileUpload(e, 'right')} accept=".json,application/json" className="file-upload-input" />

              {/* 11. Download */}
              <button
                className="pane-icon-btn"
                onClick={() => handleDownloadSide('right')}
                disabled={!rightValue.trim()}
                title="Download: Save Output JSON as a .json file"
              >
                <SaveDiskIcon size={15} />
              </button>

              {/* 12. Clear (X) */}
              <button
                className="pane-icon-btn"
                onClick={() => handleClearSide('right')}
                disabled={!rightValue.trim()}
                title="Clear: Empty the Output editor"
              >
                <ClearXIcon size={15} />
              </button>

              {/* 13. Copy */}
              <button
                className="pane-icon-btn"
                onClick={() => handleCopy('right')}
                disabled={!rightValue.trim()}
                title="Copy: Copy Output JSON to clipboard"
              >
                <CopyPagesIcon size={15} />
              </button>

              {/* 14. Fullscreen Toggle */}
              <button
                className={`pane-icon-btn ${rightFullscreen ? 'active' : ''}`}
                onClick={() => setRightFullscreen(!rightFullscreen)}
                title={rightFullscreen ? "Exit Fullscreen" : "Fullscreen: Expand editor"}
              >
                {rightFullscreen ? <FullscreenCollapseIcon size={15} /> : <FullscreenExpandIcon size={15} />}
              </button>
            </div>
          </div>

          {/* Optional Right Filter Bar with Apply & Match Status */}
          {showRightFilter && (
            <div className="jsonpath-row" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <Search size={13} style={{ color: 'var(--accent-hover)', flexShrink: 0 }} />
              <input
                style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }}
                placeholder="JSONPath or keyword on output (e.g. $.settings, $.features)"
                value={rightFilterQuery}
                onChange={(e) => setRightFilterQuery(e.target.value)}
                autoFocus
              />
              {rightFilterResult ? (
                <>
                  <span className="status-badge status-valid" style={{ fontSize: 10, padding: '2px 6px' }}>
                    Match ({rightFilterCount})
                  </span>
                  <button
                    className="btn btn-primary btn-xs"
                    onClick={() => { pushRightChange(rightFilterResult); showToast('Filtered JSON applied to Output editor!'); }}
                    title="Apply filtered result directly into Output editor"
                  >
                    Apply
                  </button>
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => { navigator.clipboard.writeText(rightFilterResult); showToast('Filtered result copied!'); }}
                    title="Copy filtered result"
                  >
                    <CopyPagesIcon size={12} /> Copy
                  </button>
                </>
              ) : rightFilterQuery.trim() ? (
                <span className="status-badge status-invalid" style={{ fontSize: 10, padding: '2px 6px' }}>
                  No match
                </span>
              ) : null}
              <button
                className="icon-btn"
                onClick={() => { setRightFilterQuery(''); setRightFilterResult(null); setShowRightFilter(false); }}
                title="Close filter"
                style={{ width: 22, height: 22 }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Right Body */}
          <div className="editor-body">
            {rightViewMode === 'code' ? (
              <Editor
                height="100%"
                language="json"
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={rightValue}
                onChange={(val) => pushRightChange(val || '')}
                onMount={(editor) => { rightEditorRef.current = editor; }}
                options={{
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  minimap: { enabled: true },
                  wordWrap: 'on',
                  cursorBlinking: 'smooth',
                  padding: { top: 8, bottom: 8 },
                  scrollbar: { verticalScrollbarSize: 7 }
                }}
                loading={<div className="monaco-loader"><div className="spinner" /><span>Formatting…</span></div>}
              />
            ) : (
              <TreeViewer data={rightParsedData} showToast={showToast} />
            )}
          </div>

          {/* Right Footer */}
          <div className="pane-footer">
            <span className={`status-badge ${rightStatusClass}`} style={{ fontSize: 10 }}>
              {rightInsights.status === 'valid' && <Check size={10} />}
              {rightInsights.status === 'invalid' && <AlertCircle size={10} />}
              {rightStatusText}
            </span>
            <span>{rightInsights.lines} lines &nbsp;|&nbsp; {rightInsights.size}</span>
          </div>
        </div>
      </div>

      {/* Global Syntax Error banner if any */}
      {(leftError || rightError) && (
        <div className="alert-banner error">
          <AlertCircle size={14} className="alert-icon" />
          <div className="alert-content">
            <strong>Syntax Error</strong>
            <p>{leftError || rightError}</p>
          </div>
        </div>
      )}
    </div>
  );
};
