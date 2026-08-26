import React, { useState, useCallback, useMemo } from 'react';
import { Copy, Search, X, ChevronDown, ChevronRight, ChevronsDown, ChevronsUp } from 'lucide-react';

interface TreeViewerProps {
  data: any;
  showToast: (msg: string) => void;
}

interface TreeNodeProps {
  value: any;
  keyName?: string | number;
  depth: number;
  path: string;
  searchQuery: string;
  forceExpandAll: boolean | null;
  showToast: (msg: string) => void;
}

const MAX_PREVIEW_ITEMS = 5;

// Helper to evaluate JSONPath and keyword queries
function evaluateTreeFilter(data: any, query: string): { filteredData: any; matchCount: number } {
  const q = query.trim();
  if (!q || !data || typeof data !== 'object') {
    return { filteredData: data, matchCount: 0 };
  }

  if (q === '$') {
    return { filteredData: data, matchCount: Array.isArray(data) ? data.length : 1 };
  }

  // 1. Try JSONPath evaluation
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
      let cur: any = data;
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
        return { filteredData: cur, matchCount: count };
      }
    }
  } catch {}

  // 2. Keyword Search Fallback
  try {
    const searchLower = q.toLowerCase();
    let matches: any = Array.isArray(data) ? [] : {};
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

    searchRecursive(data);

    const hasMatches = Array.isArray(matches) ? matches.length > 0 : Object.keys(matches).length > 0;
    if (hasMatches) {
      return { filteredData: matches, matchCount: count || 1 };
    }
  } catch {}

  return { filteredData: null, matchCount: 0 };
}

const ValueDisplay: React.FC<{ value: any; searchQuery: string }> = ({ value, searchQuery }) => {
  if (value === null) return <span className="tree-type-null">null</span>;
  if (typeof value === 'string') {
    const str = value.length > 80 ? value.slice(0, 80) + '…' : value;
    const isMatch = searchQuery && str.toLowerCase().includes(searchQuery.toLowerCase());
    return (
      <span className="tree-type-string" style={{ background: isMatch ? 'rgba(234, 179, 8, 0.25)' : 'transparent', borderRadius: 2, padding: '0 2px' }}>
        "{str}"
      </span>
    );
  }
  if (typeof value === 'number') return <span className="tree-type-number">{value}</span>;
  if (typeof value === 'boolean') return <span className="tree-type-boolean">{String(value)}</span>;
  return null;
};

const TreeNode: React.FC<TreeNodeProps> = ({ value, keyName, depth, path, searchQuery, forceExpandAll, showToast }) => {
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  // Determine default collapse: expand if searching or if forceExpandAll is true
  const [collapsed, setCollapsed] = useState(() => {
    if (searchQuery.trim()) return false;
    return depth > 2;
  });

  // Respond to force expand/collapse toggles
  React.useEffect(() => {
    if (forceExpandAll !== null) {
      setCollapsed(!forceExpandAll);
    } else if (searchQuery.trim()) {
      setCollapsed(false);
    }
  }, [forceExpandAll, searchQuery]);

  const copyPath = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    showToast(`Path copied: ${path}`);
  }, [path, showToast]);

  const indent = { paddingLeft: `${depth * 18}px` };

  const isKeyMatch = keyName !== undefined && searchQuery && String(keyName).toLowerCase().includes(searchQuery.toLowerCase());

  if (!isObject) {
    return (
      <div className="tree-node">
        <div className="tree-row" style={indent}>
          <span className="tree-toggle" />
          {keyName !== undefined && (
            <>
              <span className="tree-key" style={{ background: isKeyMatch ? 'rgba(234, 179, 8, 0.25)' : 'transparent', borderRadius: 2, padding: '0 2px' }}>
                "{keyName}"
              </span>
              <span className="tree-colon">:</span>
            </>
          )}
          <ValueDisplay value={value} searchQuery={searchQuery} />
          <button className="tree-path-copy" onClick={copyPath} title={`Copy JSONPath: ${path}`}>
            <Copy size={10} style={{ display: 'inline', marginRight: 2 }} />
            {path}
          </button>
        </div>
      </div>
    );
  }

  const keys = isArray ? value.map((_: any, i: number) => i) : Object.keys(value);
  const count = keys.length;
  const toggle = isArray ? '[]' : '{}';
  const badgeClass = isArray ? 'tree-badge tree-badge-arr' : 'tree-badge tree-badge-obj';
  const preview = collapsed
    ? keys.slice(0, MAX_PREVIEW_ITEMS).map((k: string | number) => isArray ? '' : `"${k}"`).filter(Boolean).join(', ')
    : null;

  return (
    <div className="tree-node">
      <div
        className="tree-row"
        style={indent}
        onClick={() => setCollapsed(!collapsed)}
        role="button"
        aria-expanded={!collapsed}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setCollapsed(!collapsed)}
      >
        <span className="tree-toggle">
          {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </span>
        {keyName !== undefined && (
          <>
            <span className="tree-key" style={{ background: isKeyMatch ? 'rgba(234, 179, 8, 0.25)' : 'transparent', borderRadius: 2, padding: '0 2px' }}>
              "{keyName}"
            </span>
            <span className="tree-colon">:</span>
          </>
        )}
        <span style={{ color: 'var(--text-muted)' }}>{toggle[0]}</span>
        {collapsed && (
          <>
            {preview && <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: 4 }}>{preview}{count > MAX_PREVIEW_ITEMS ? ', …' : ''}</span>}
            <span style={{ color: 'var(--text-muted)' }}>{toggle[1]}</span>
          </>
        )}
        <span className={badgeClass}>{isArray ? `[${count}]` : `{${count}}`}</span>
        <button className="tree-path-copy" onClick={copyPath} title={`Copy JSONPath: ${path}`}>
          <Copy size={10} style={{ display: 'inline', marginRight: 2 }} />
          {path}
        </button>
      </div>

      {!collapsed && (
        <div>
          {keys.map((k: string | number) => (
            <TreeNode
              key={String(k)}
              keyName={k}
              value={value[k]}
              depth={depth + 1}
              path={isArray ? `${path}[${k}]` : `${path}.${k}`}
              searchQuery={searchQuery}
              forceExpandAll={forceExpandAll}
              showToast={showToast}
            />
          ))}
          <div className="tree-row" style={{ ...indent }}>
            <span className="tree-toggle" />
            <span style={{ color: 'var(--text-muted)' }}>{toggle[1]}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const TreeViewer: React.FC<TreeViewerProps> = ({ data, showToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [forceExpandAll, setForceExpandAll] = useState<boolean | null>(null);

  const { filteredData, matchCount } = useMemo(() => {
    return evaluateTreeFilter(data, searchQuery);
  }, [data, searchQuery]);

  const handleExpandAll = () => {
    setForceExpandAll(true);
    showToast('Expanded all tree nodes');
  };

  const handleCollapseAll = () => {
    setForceExpandAll(false);
    showToast('Collapsed all tree nodes');
  };

  if (data === null || data === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', flexDirection: 'column', gap: 12 }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.4}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <p style={{ fontSize: 13 }}>Enter valid JSON to explore and search the interactive tree</p>
      </div>
    );
  }

  const activeDisplayData = searchQuery.trim() ? (filteredData ?? data) : data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tree Search & Control Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 200, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '3px 8px' }}>
          <Search size={13} style={{ color: 'var(--accent-hover)', flexShrink: 0 }} />
          <input
            style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }}
            placeholder="Search keys, values, or JSONPath (e.g. $.settings, role, 2.0)"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setForceExpandAll(null); }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setForceExpandAll(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {searchQuery.trim() && (
          <span className={`status-badge ${filteredData ? 'status-valid' : 'status-invalid'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
            {filteredData ? `Match (${matchCount})` : 'No match'}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn btn-secondary btn-xs" onClick={handleExpandAll} title="Expand all tree branches">
            <ChevronsDown size={11} /> Expand All
          </button>
          <button className="btn btn-secondary btn-xs" onClick={handleCollapseAll} title="Collapse all tree branches">
            <ChevronsUp size={11} /> Collapse All
          </button>
        </div>
      </div>

      {/* Interactive Tree Body */}
      <div className="tree-viewer" style={{ flex: 1, overflow: 'auto' }}>
        {filteredData === null && searchQuery.trim() ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No matching nodes or JSONPath found for <code>"{searchQuery}"</code>
          </div>
        ) : (
          <TreeNode
            value={activeDisplayData}
            depth={0}
            path="$"
            searchQuery={searchQuery}
            forceExpandAll={forceExpandAll}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
};
