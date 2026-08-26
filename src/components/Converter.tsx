import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Download, RefreshCw, AlertCircle, FileSpreadsheet, FileCode, Braces, Code2, FileCode2 } from 'lucide-react';

interface ConverterProps {
  theme: 'dark' | 'light';
  showToast: (msg: string) => void;
  targetSubOption?: string;
}

export type ConversionMode = 'json-to-yaml' | 'yaml-to-json' | 'json-to-csv' | 'json-to-xml' | 'xml-to-json';

// ─── Converters ────────────────────────────────────────────

function jsonToYaml(obj: any, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (obj === null) return 'null';
  if (typeof obj === 'boolean' || typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    if (/[\n:#\[\]{},&*?|>'"@`%]/.test(obj) || /^\s|\s$/.test(obj) || obj === '') return JSON.stringify(obj);
    return obj;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map((item) => {
      const val = jsonToYaml(item, indent + 1);
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        return `${pad}- ${val.trim().split('\n').join('\n' + pad + '  ')}`;
      }
      return `${pad}- ${val}`;
    }).join('\n');
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    return keys.map((k) => {
      const v = obj[k];
      if (v !== null && typeof v === 'object') {
        return `${pad}${k}:\n${jsonToYaml(v, indent + 1)}`;
      }
      return `${pad}${k}: ${jsonToYaml(v, indent)}`;
    }).join('\n');
  }
  return String(obj);
}

function jsonToCsv(arr: any[]): string {
  if (!Array.isArray(arr) || arr.length === 0) throw new Error('JSON must be an array of objects for CSV conversion (e.g. [{"id":1, "name":"Alice"}]).');
  const headers = Array.from(new Set(arr.flatMap((row) => typeof row === 'object' && row !== null ? Object.keys(row) : [])));
  if (headers.length === 0) throw new Error('No valid object keys found for CSV headers.');
  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = arr.map((row) =>
    headers.map((h) => (typeof row === 'object' && row !== null ? escape(row[h]) : '')).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function jsonToXml(obj: any, tag = 'root', indent = 0): string {
  const pad = '  '.repeat(indent);
  if (obj === null || obj === undefined) return `${pad}<${tag}/>`;
  if (typeof obj !== 'object') return `${pad}<${tag}>${String(obj).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</${tag}>`;
  if (Array.isArray(obj)) {
    return obj.map((item) => jsonToXml(item, 'item', indent)).join('\n');
  }
  const children = Object.entries(obj).map(([k, v]) => {
    const cleanKey = k.replace(/[^a-zA-Z0-9_-]/g, '_');
    return jsonToXml(v, cleanKey, indent + 1);
  }).join('\n');
  return `${pad}<${tag}>\n${children}\n${pad}</${tag}>`;
}

function xmlToJson(xmlStr: string): any {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error(parseError[0].textContent || 'Invalid XML syntax');
  }

  const nodeToObject = (node: Node): any => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue?.trim() || null;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const obj: any = {};

      const childNodes = Array.from(element.childNodes).filter(
        (n) => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.nodeValue?.trim())
      );

      if (childNodes.length === 1 && childNodes[0].nodeType === Node.TEXT_NODE) {
        const val = childNodes[0].nodeValue?.trim();
        if (val === 'true') return true;
        if (val === 'false') return false;
        if (val === 'null') return null;
        if (val !== undefined && !isNaN(Number(val)) && val !== '') return Number(val);
        return val;
      }

      for (const child of childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const childEl = child as Element;
          const childObj = nodeToObject(childEl);
          const key = childEl.nodeName;
          if (obj[key] !== undefined) {
            if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
            obj[key].push(childObj);
          } else {
            obj[key] = childObj;
          }
        }
      }
      return obj;
    }
    return null;
  };

  return { [xmlDoc.documentElement.nodeName]: nodeToObject(xmlDoc.documentElement) };
}

function yamlToJson(yamlStr: string): any {
  const lines = yamlStr.split('\n');
  const root: any = {};
  const stack: { obj: any; indent: number }[] = [{ obj: root, indent: -1 }];
  let currentArrKey = '';

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.trimStart().startsWith('#')) continue;
    const indentLen = line.length - line.trimStart().length;

    while (stack.length > 1 && stack[stack.length - 1].indent >= indentLen) stack.pop();
    const parent = stack[stack.length - 1].obj;

    if (line.trimStart().startsWith('- ')) {
      const val = line.trimStart().slice(2).trim();
      const parsed = val === 'null' ? null : val === 'true' ? true : val === 'false' ? false : isNaN(Number(val)) ? val : Number(val);
      if (!Array.isArray(parent[currentArrKey])) parent[currentArrKey] = [];
      parent[currentArrKey].push(parsed);
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const rawVal = line.slice(colonIdx + 1).trim();

    currentArrKey = key;
    if (rawVal === '' || rawVal === '|' || rawVal === '>') {
      parent[key] = {};
      stack.push({ obj: parent[key], indent: indentLen });
    } else {
      const val = rawVal === 'null' ? null : rawVal === 'true' ? true : rawVal === 'false' ? false : isNaN(Number(rawVal)) ? rawVal.replace(/^["']|["']$/g, '') : Number(rawVal);
      parent[key] = val;
    }
  }
  return root;
}

const MODES: {
  id: ConversionMode;
  label: string;
  icon: React.ReactNode;
  inputLang: string;
  outputLang: string;
  inputLabel: string;
  outputLabel: string;
  url: string;
}[] = [
  { id: 'json-to-yaml', label: 'JSON → YAML', icon: <FileCode size={13} />,        inputLang: 'json', outputLang: 'yaml',      inputLabel: 'JSON Input', outputLabel: 'YAML Output', url: '/json-converter/#json-to-yaml' },
  { id: 'yaml-to-json', label: 'YAML → JSON', icon: <Braces size={13} />,          inputLang: 'yaml', outputLang: 'json',      inputLabel: 'YAML Input', outputLabel: 'JSON Output', url: '/json-converter/#yaml-to-json' },
  { id: 'json-to-csv',  label: 'JSON → CSV',  icon: <FileSpreadsheet size={13} />, inputLang: 'json', outputLang: 'plaintext', inputLabel: 'JSON Array Input', outputLabel: 'CSV Output', url: '/json-converter/#json-to-csv' },
  { id: 'json-to-xml',  label: 'JSON → XML',  icon: <Code2 size={13} />,           inputLang: 'json', outputLang: 'xml',       inputLabel: 'JSON Input', outputLabel: 'XML Output', url: '/json-converter/#json-to-xml' },
  { id: 'xml-to-json',  label: 'XML → JSON',  icon: <FileCode2 size={13} />,       inputLang: 'xml',  outputLang: 'json',      inputLabel: 'XML Input',  outputLabel: 'JSON Output', url: '/json-converter/#xml-to-json' },
];

const SAMPLES: Record<ConversionMode, string> = {
  'json-to-yaml': JSON.stringify({ name: "DevJSON", version: 2, tools: ["formatter", "diff", "tree", "converter"], config: { dark: true, wasm: true } }, null, 2),
  'yaml-to-json': `name: DevJSON\nversion: 2\ntools:\n  - formatter\n  - diff\n  - tree\nconfig:\n  dark: true\n  wasm: true`,
  'json-to-csv':  JSON.stringify([{ id: 1, name: "Alice", role: "Engineer", active: true }, { id: 2, name: "Bob", role: "Designer", active: false }, { id: 3, name: "Carol", role: "PM", active: true }], null, 2),
  'json-to-xml':  JSON.stringify({ user: { id: 1, name: "Alice", tags: ["admin", "dev"] } }, null, 2),
  'xml-to-json':  `<?xml version="1.0" encoding="UTF-8"?>\n<user>\n  <id>1</id>\n  <name>Alice</name>\n  <tags>admin</tags>\n  <tags>dev</tags>\n</user>`,
};

const resolveModeFromKey = (rawStr: string): ConversionMode => {
  const s = rawStr.toLowerCase().replace(/^#\/?/, '');
  if (s.includes('xml-to-json')) return 'xml-to-json';
  if (s.includes('yaml-to-json')) return 'yaml-to-json';
  if (s.includes('csv')) return 'json-to-csv';
  if (s.includes('json-to-xml') || s.includes('xml')) return 'json-to-xml';
  if (s.includes('yaml')) return 'json-to-yaml';
  return 'json-to-yaml';
};

export const Converter: React.FC<ConverterProps> = ({ theme, showToast, targetSubOption }) => {
  const initialMode = resolveModeFromKey(targetSubOption || window.location.hash || '');
  const [mode, setModeState] = useState<ConversionMode>(initialMode);
  const [input, setInput] = useState<string>(() => {
    const saved = localStorage.getItem(`jsontools-conv-input-${initialMode}`);
    return saved !== null ? saved : SAMPLES[initialMode];
  });
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Sync mode whenever targetSubOption changes (e.g. from footer click or direct link)
  useEffect(() => {
    if (targetSubOption) {
      const parsed = resolveModeFromKey(targetSubOption);
      setModeState(parsed);
      const saved = localStorage.getItem(`jsontools-conv-input-${parsed}`);
      setInput(saved !== null ? saved : SAMPLES[parsed]);
      setOutput('');
      setError(null);
    }
  }, [targetSubOption]);

  // Sync mode with native browser back/forward and hash changes
  useEffect(() => {
    const handleHash = () => {
      const parsed = resolveModeFromKey(window.location.hash);
      setModeState(parsed);
      const saved = localStorage.getItem(`jsontools-conv-input-${parsed}`);
      setInput(saved !== null ? saved : SAMPLES[parsed]);
      setOutput('');
      setError(null);
    };
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  // Switching mode only selects the option and loads sample/saved state
  const setMode = (newMode: ConversionMode) => {
    setModeState(newMode);
    const saved = localStorage.getItem(`jsontools-conv-input-${newMode}`);
    setInput(saved !== null ? saved : SAMPLES[newMode]);
    setOutput('');
    setError(null);
    const targetUrl = `/json-converter/#${newMode}`;
    if (window.location.pathname + window.location.hash !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    localStorage.setItem(`jsontools-conv-input-${mode}`, val);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    localStorage.setItem(`jsontools-conv-input-${mode}`, '');
  };

  const handleSample = () => {
    const s = SAMPLES[mode];
    setInput(s);
    setOutput('');
    setError(null);
    localStorage.setItem(`jsontools-conv-input-${mode}`, s);
    showToast('Sample dataset loaded!');
  };

  const currentMode = MODES.find((m) => m.id === mode) || MODES[0];

  // Conversion ONLY runs when user clicks the "Convert Now" button
  const handleConvertClick = () => {
    if (!input.trim()) {
      showToast('Please enter data in the input editor first.');
      return;
    }
    setError(null);
    try {
      let result = '';
      if (mode === 'json-to-yaml') {
        const parsed = JSON.parse(input);
        result = jsonToYaml(parsed);
      } else if (mode === 'yaml-to-json') {
        const parsed = yamlToJson(input);
        result = JSON.stringify(parsed, null, 2);
      } else if (mode === 'json-to-csv') {
        const parsed = JSON.parse(input);
        result = jsonToCsv(parsed);
      } else if (mode === 'json-to-xml') {
        const parsed = JSON.parse(input);
        result = `<?xml version="1.0" encoding="UTF-8"?>\n${jsonToXml(parsed)}`;
      } else if (mode === 'xml-to-json') {
        const parsed = xmlToJson(input);
        result = JSON.stringify(parsed, null, 2);
      }
      setOutput(result);
      showToast('Converted successfully!');
    } catch (err: any) {
      setError(err.message || 'Conversion failed. Please verify syntax.');
      showToast(`Conversion failed: ${err.message}`);
    }
  };

  const handleCopyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast('Converted output copied to clipboard!');
  };

  const handleDownload = () => {
    if (!output) return;
    const ext = mode === 'json-to-yaml' ? 'yaml' : mode === 'yaml-to-json' || mode === 'xml-to-json' ? 'json' : mode === 'json-to-csv' ? 'csv' : 'xml';
    const mime = ext === 'json' ? 'application/json' : ext === 'yaml' ? 'text/yaml' : ext === 'csv' ? 'text/csv' : 'application/xml';
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devjson-converted.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tab-content converter-layout">
      {/* Modern Segmented Conversion Modes Bar */}
      <div className="tool-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Segmented Mode Tabs */}
          <div className="converter-mode-tabs" aria-label="Conversion Formats">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`converter-tab-item ${mode === m.id ? 'active' : ''}`}
                onClick={() => setMode(m.id)}
                title={`Select ${m.label} conversion mode`}
              >
                <span className="converter-tab-icon">{m.icon}</span>
                <span className="converter-tab-label">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Prominent Action Button */}
          <button
            className="btn btn-primary"
            onClick={handleConvertClick}
            disabled={!input.trim()}
            title="Execute conversion from input to output"
            style={{ padding: '6px 14px', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} /> Convert Now
          </button>
        </div>

        <div className="toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleSample}>
            Sample
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleClear} disabled={!input}>
            Clear
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleCopyOutput} disabled={!output}>
            <Copy size={13} /> Copy
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleDownload} disabled={!output}>
            <Download size={13} /> Download
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-banner error">
          <AlertCircle size={14} className="alert-icon" />
          <div className="alert-content"><strong>Conversion Error</strong><p>{error}</p></div>
        </div>
      )}

      {/* Editor Grid */}
      <div className="converter-editors-grid">
        {/* Input */}
        <div className="glass-panel dual-editor-pane">
          <div className="editor-card-header">
            <div className="editor-card-title">{currentMode.inputLabel}</div>
            <button className="btn btn-secondary btn-xs" onClick={handleClear} disabled={!input}>
              Clear
            </button>
          </div>
          <div className="editor-body">
            <Editor
              height="100%"
              language={currentMode.inputLang}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={input}
              onChange={(val) => handleInputChange(val || '')}
              options={{ fontSize: 13, fontFamily: 'var(--font-mono)', minimap: { enabled: false }, wordWrap: 'on', scrollbar: { verticalScrollbarSize: 7 } }}
              loading={<div className="monaco-loader"><div className="spinner" /></div>}
            />
          </div>
        </div>

        {/* Output */}
        <div className="glass-panel dual-editor-pane">
          <div className="editor-card-header">
            <div className="editor-card-title">{currentMode.outputLabel}</div>
            {output && <span className="status-badge status-valid">Ready</span>}
          </div>
          <div className="editor-body">
            <Editor
              height="100%"
              language={currentMode.outputLang}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={output}
              options={{ fontSize: 13, fontFamily: 'var(--font-mono)', minimap: { enabled: false }, wordWrap: 'on', readOnly: true, scrollbar: { verticalScrollbarSize: 7 } }}
              loading={<div className="monaco-loader"><div className="spinner" /></div>}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
