import init, { format_json, minify_json, validate_json } from '../wasm-pkg/wasm_json.js';
import wasmUrl from '../wasm-pkg/wasm_json_bg.wasm?url';
import type { FormattingOptions } from '../types/json';

interface WorkerRequest {
  type: 'format' | 'minify' | 'sort' | 'validate' | 'escape' | 'unescape' | 'fix' | 'custom';
  jsonStr: string;
  options?: FormattingOptions;
  indentSize?: number;
  descending?: boolean;
}

let wasmInitialized = false;

const initWasm = async () => {
  if (!wasmInitialized) {
    await init(wasmUrl);
    wasmInitialized = true;
  }
};

// Strip comments (// and /* */)
const stripComments = (str: string): string => {
  return str.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
};

// Repair / Fix loose JSON (Python dicts, single quotes, unquoted keys, trailing commas, True/False/None)
const repairLooseJson = (str: string): string => {
  let cleaned = stripComments(str).trim();

  // 1. Replace Python boolean / null literals (True, False, None)
  cleaned = cleaned.replace(/:\s*True\b/g, ': true');
  cleaned = cleaned.replace(/:\s*False\b/g, ': false');
  cleaned = cleaned.replace(/:\s*None\b/g, ': null');
  cleaned = cleaned.replace(/:\s*undefined\b/g, ': null');
  cleaned = cleaned.replace(/\[\s*True\b/g, '[true');
  cleaned = cleaned.replace(/\[\s*False\b/g, '[false');
  cleaned = cleaned.replace(/\[\s*None\b/g, '[null');
  cleaned = cleaned.replace(/,\s*True\b/g, ', true');
  cleaned = cleaned.replace(/,\s*False\b/g, ', false');
  cleaned = cleaned.replace(/,\s*None\b/g, ', null');

  // 2. Replace single quoted strings with double quotes
  cleaned = cleaned.replace(/'((?:\\.|[^'])*)'/g, (_m, content) => {
    return `"${content.replace(/"/g, '\\"').replace(/\\'/g, "'")}"`;
  });

  // 3. Quote unquoted object keys: { foo: "bar" } or , foo: "bar"
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');

  // 4. Remove trailing commas in objects and arrays
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // Check if valid JSON now
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // Fallback: evaluate JS object literal safely
    try {
      const jsCleaned = str
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null');
      const fn = new Function(`"use strict"; return (${jsCleaned});`);
      const evaluated = fn();
      return JSON.stringify(evaluated);
    } catch {
      return cleaned;
    }
  }
};

// Deterministic recursive JSON pretty-printer that strictly preserves custom/descending key order
const formatWithCustomSort = (val: any, desc: boolean, indent: number, sortArrays = false, depth = 0): string => {
  if (val === null) return 'null';
  if (typeof val === 'boolean' || typeof val === 'number') return String(val);
  if (typeof val === 'string') return JSON.stringify(val);

  const pad = ' '.repeat(indent * depth);
  const padInner = ' '.repeat(indent * (depth + 1));

  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    let arr = val;
    if (sortArrays && val.every((item) => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')) {
      arr = [...val].sort((a, b) => {
        const sA = String(a), sB = String(b);
        return desc ? sB.localeCompare(sA) : sA.localeCompare(sB);
      });
    }
    const items = arr.map((item) => `${padInner}${formatWithCustomSort(item, desc, indent, sortArrays, depth + 1)}`);
    return `[\n${items.join(',\n')}\n${pad}]`;
  }

  if (typeof val === 'object') {
    const keys = Object.keys(val).sort((a, b) => {
      return desc ? b.localeCompare(a) : a.localeCompare(b);
    });
    if (keys.length === 0) return '{}';
    const lines = keys.map((k) => {
      const formattedVal = formatWithCustomSort(val[k], desc, indent, sortArrays, depth + 1);
      return `${padInner}${JSON.stringify(k)}: ${formattedVal}`;
    });
    return `{\n${lines.join(',\n')}\n${pad}}`;
  }

  return JSON.stringify(val);
};

// Deterministic minifier with sorting
const minifyWithCustomSort = (val: any, desc: boolean, sortArrays = false): string => {
  if (val === null || typeof val !== 'object') return JSON.stringify(val);
  if (Array.isArray(val)) {
    let arr = val;
    if (sortArrays && val.every((item) => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')) {
      arr = [...val].sort((a, b) => {
        const sA = String(a), sB = String(b);
        return desc ? sB.localeCompare(sA) : sA.localeCompare(sB);
      });
    }
    return `[${arr.map((item) => minifyWithCustomSort(item, desc, sortArrays)).join(',')}]`;
  }
  const keys = Object.keys(val).sort((a, b) => (desc ? b.localeCompare(a) : a.localeCompare(b)));
  const pairs = keys.map((k) => `${JSON.stringify(k)}:${minifyWithCustomSort(val[k], desc, sortArrays)}`);
  return `{${pairs.join(',')}}`;
};

// Helper function to unescape string literals
const unescapeJson = (str: string): string => {
  let val = str.trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'string') return parsed;
    } catch {
      try {
        const parsed = new Function(`return ${val}`)();
        if (typeof parsed === 'string') return parsed;
      } catch {}
    }
  } else {
    try {
      const normalized = val.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      const parsed = JSON.parse(`"${normalized}"`);
      if (typeof parsed === 'string') return parsed;
    } catch {}
  }
  return val;
};

// Escape / Unescape Unicode
const escapeUnicode = (str: string): string => {
  return str.replace(/[\u007F-\uFFFF]/g, (c) => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4));
};

const unescapeUnicode = (str: string): string => {
  return str.replace(/\\u([a-fA-F0-9]{4})/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)));
};

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { type, jsonStr, options, indentSize = 2, descending = false } = e.data;

  try {
    await initWasm();
    let workingStr = jsonStr;
    let result = '';

    if (type === 'fix' || options?.fixLooseJson) {
      workingStr = repairLooseJson(workingStr);
    }

    const isDesc = options?.sortMode === 'desc' || descending === true;

    switch (type) {
      case 'format':
      case 'custom': {
        const indent = options?.indentSize ?? indentSize;
        const sort = options?.sortMode ?? (isDesc ? 'desc' : 'none');

        if (options?.escapeMode === 'unescape') {
          workingStr = unescapeJson(workingStr);
        } else if (options?.escapeMode === 'unicode_unescape') {
          workingStr = unescapeUnicode(workingStr);
        }

        if (options?.fixLooseJson) {
          workingStr = repairLooseJson(workingStr);
        }

        let parsed = JSON.parse(workingStr);

        if (sort === 'asc') {
          result = formatWithCustomSort(parsed, false, indent === 0 ? 2 : indent, options?.sortArrays);
        } else if (sort === 'desc') {
          result = formatWithCustomSort(parsed, true, indent === 0 ? 2 : indent, options?.sortArrays);
        } else {
          const stringified = JSON.stringify(parsed);
          if (indent === 0) {
            result = minify_json(stringified);
          } else {
            result = format_json(stringified, indent);
          }
        }

        if (options?.escapeMode === 'escape') {
          result = JSON.stringify(result);
        } else if (options?.escapeMode === 'unicode_escape') {
          result = escapeUnicode(result);
        }
        break;
      }

      case 'minify': {
        const cleaned = repairLooseJson(workingStr);
        result = minify_json(cleaned);
        break;
      }

      case 'sort': {
        const cleaned = repairLooseJson(workingStr);
        const parsed = JSON.parse(cleaned);
        const indent = options?.indentSize ?? indentSize;
        if (indent === 0) {
          result = minifyWithCustomSort(parsed, isDesc, options?.sortArrays);
        } else {
          result = formatWithCustomSort(parsed, isDesc, indent, options?.sortArrays);
        }
        break;
      }

      case 'escape': {
        const cleaned = repairLooseJson(workingStr);
        const minified = minify_json(cleaned);
        result = JSON.stringify(minified);
        break;
      }

      case 'unescape': {
        const unescaped = unescapeJson(workingStr);
        const cleaned = repairLooseJson(unescaped);
        validate_json(cleaned);
        result = format_json(cleaned, indentSize);
        break;
      }

      case 'fix': {
        const repaired = repairLooseJson(workingStr);
        validate_json(repaired);
        result = format_json(repaired, indentSize);
        break;
      }

      case 'validate':
        result = validate_json(workingStr);
        break;

      default:
        throw new Error(`Unsupported action: ${type}`);
    }

    self.postMessage({
      type,
      success: true,
      result
    });
  } catch (err: any) {
    self.postMessage({
      type,
      success: false,
      error: err?.toString() || 'Unknown error during execution'
    });
  }
};
