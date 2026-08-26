import type { ToolTab } from '../components/Header';

export interface SeoMeta {
  title: string;
  description: string;
  keywords: string;
  h1: string;
  canonical: string;
}

const BASE_URL = 'https://jsontools.mohammedrishad.com';

export function getSeoMetadata(tab: ToolTab, hash = ''): SeoMeta {
  const cleanHash = hash.toLowerCase().replace(/^#\/?/, '');

  // Sub-option specific metadata
  if (cleanHash === 'json-to-yaml') {
    return {
      title: 'JSON to YAML Converter Online — Free & Fast | JSONTools',
      description: 'Convert JSON objects and arrays into clean YAML format online instantly. Perfect for Kubernetes, Docker Compose, and CI/CD configs.',
      keywords: 'json to yaml, convert json to yaml, online json to yaml converter, yaml generator, json2yaml',
      h1: 'Online JSON to YAML Converter',
      canonical: `${BASE_URL}/json-converter/#json-to-yaml`,
    };
  }
  if (cleanHash === 'yaml-to-json') {
    return {
      title: 'YAML to JSON Converter Online — Free & Fast | JSONTools',
      description: 'Convert YAML configuration files into valid formatted JSON in your browser. 100% private with instant syntax error validation.',
      keywords: 'yaml to json, convert yaml to json, yaml2json, online yaml parser, yaml json converter',
      h1: 'Online YAML to JSON Converter',
      canonical: `${BASE_URL}/json-converter/#yaml-to-json`,
    };
  }
  if (cleanHash === 'json-to-csv') {
    return {
      title: 'JSON to CSV Converter — Export JSON to Spreadsheet | JSONTools',
      description: 'Convert JSON arrays into CSV spreadsheets online. Automatic header detection, quoted string handling, and one-click file download.',
      keywords: 'json to csv, convert json to csv, json to excel, json spreadsheet export, json2csv online',
      h1: 'Online JSON to CSV Spreadsheet Converter',
      canonical: `${BASE_URL}/json-converter/#json-to-csv`,
    };
  }
  if (cleanHash === 'json-to-xml') {
    return {
      title: 'JSON to XML Converter — Free Online XML Generator | JSONTools',
      description: 'Transform JSON data structures into well-formed hierarchical XML documents online. Handles nested arrays, objects, and entity escaping.',
      keywords: 'json to xml, convert json to xml, json2xml, json xml generator, online xml converter',
      h1: 'Online JSON to XML Hierarchy Converter',
      canonical: `${BASE_URL}/json-converter/#json-to-xml`,
    };
  }
  if (cleanHash === 'xml-to-json') {
    return {
      title: 'XML to JSON Converter — Free Online XML Parser | JSONTools',
      description: 'Parse XML documents into clean formatted JSON payloads in your browser. Extracts XML attributes, elements, and data arrays effortlessly.',
      keywords: 'xml to json, parse xml to json, xml2json, online xml parser, xml to json converter',
      h1: 'Online XML to JSON Parser & Converter',
      canonical: `${BASE_URL}/json-converter/#xml-to-json`,
    };
  }
  if (cleanHash === 'split-diff') {
    return {
      title: 'Side-by-Side JSON Diff Checker — Split Compare Online | JSONTools',
      description: 'Compare two JSON payloads side-by-side with synchronized line scrolling, red removals, and green additions breakdown.',
      keywords: 'side by side json diff, split json diff, compare json files, visual json diffchecker',
      h1: 'Side-by-Side (Split) JSON Diff Checker',
      canonical: `${BASE_URL}/json-diff/#split-diff`,
    };
  }
  if (cleanHash === 'inline-diff') {
    return {
      title: 'Unified Inline JSON Diff Checker — Compare JSON Online | JSONTools',
      description: 'Review JSON differences in a unified single-column Git-style patch stream with inline additions and removals.',
      keywords: 'inline json diff, unified json diff, git diff json, compare json online',
      h1: 'Unified Inline JSON Diff Checker',
      canonical: `${BASE_URL}/json-diff/#inline-diff`,
    };
  }
  if (cleanHash === 'json-validator') {
    return {
      title: 'JSON Validator — Free RFC 8259 Syntax Checker Online | JSONTools',
      description: 'Validate JSON syntax online with instant line and column error pointers. Highlights invalid characters and unclosed brackets.',
      keywords: 'json validator, validate json, json syntax checker, rfc 8259 validator, check json online',
      h1: 'Online JSON Validator & Syntax Checker',
      canonical: `${BASE_URL}/json-formatter/#json-validator`,
    };
  }
  if (cleanHash === 'json-minifier') {
    return {
      title: 'JSON Minifier — Compact & Compress JSON Online | JSONTools',
      description: 'Minify and compress JSON strings by removing extra whitespace, newlines, and indentation for production payloads.',
      keywords: 'json minifier, minify json, compress json, compact json online, json compressor',
      h1: 'Online JSON Minifier & Compressor',
      canonical: `${BASE_URL}/json-formatter/#json-minifier`,
    };
  }
  if (cleanHash === 'json-repair') {
    return {
      title: 'JSON Repair Tool — Fix Python Dicts & Broken JSON | JSONTools',
      description: 'Automatically fix invalid JSON syntax: repairs single quotes, Python True/False/None literals, unquoted keys, and trailing commas.',
      keywords: 'json repair, fix invalid json, convert python dict to json, fix json trailing commas, repair broken json',
      h1: 'Online JSON Syntax Auto-Repair Tool',
      canonical: `${BASE_URL}/json-formatter/#json-repair`,
    };
  }

  // Primary Tab Metadata
  switch (tab) {
    case 'diff':
      return {
        title: 'JSON Diff Checker — Compare JSON Online | Best Free Diff Tool',
        description: 'Compare two JSON files or strings online with Diffchecker-style side-by-side & unified views. Real-time visual comparison with additions, removals, line stats, and key-normalized sorting.',
        keywords: 'json diff, json compare, json diff checker, compare json online, diffchecker json, json comparison tool, visual json diff, side by side json compare',
        h1: 'Online JSON Diff Checker & Comparison Tool',
        canonical: `${BASE_URL}/json-diff`,
      };
    case 'tree':
      return {
        title: 'JSON Tree Viewer — Interactive JSON Hierarchy Visualizer & JSONPath Query',
        description: 'Explore, traverse, and query nested JSON structures with an interactive collapsible tree viewer. Search with JSONPath expressions, type badges, and one-click path extraction.',
        keywords: 'json tree viewer, json visualizer, json tree view, jsonpath query, explore json online, json hierarchy visualizer, inspect json tree',
        h1: 'Interactive JSON Tree Visualizer & JSONPath Query Tool',
        canonical: `${BASE_URL}/json-tree`,
      };
    case 'converter':
      return {
        title: 'JSON Converter — Convert JSON to YAML, CSV & XML Online',
        description: 'Free online JSON converter to transform JSON to YAML, YAML to JSON, JSON to CSV spreadsheet, JSON to XML, and XML to JSON with zero server uploads.',
        keywords: 'json converter, json to yaml, yaml to json, json to csv, json to xml, xml to json, convert json online, json parser, schema converter',
        h1: 'Online JSON to YAML, CSV & XML Converter',
        canonical: `${BASE_URL}/json-converter`,
      };
    case 'formatter':
    default:
      return {
        title: 'JSON Formatter & Validator — Best Free Online JSON Beautifier & Viewer',
        description: 'Format, beautify, validate, minify, sort, and repair JSON online. Dual-pane Monaco editor with real-time error detection, 2/4-space indentation, and 100% browser-based security.',
        keywords: 'json formatter, json beautifier, json validator, format json online, json viewer, minify json, repair json, json editor, pretty print json, online json tool',
        h1: 'Best Online JSON Formatter, Beautifier & Validator',
        canonical: `${BASE_URL}/json-formatter`,
      };
  }
}

export function updatePageSeo(tab: ToolTab, hash = ''): SeoMeta {
  const meta = getSeoMetadata(tab, hash);

  // 1. Update Document Title
  document.title = meta.title;

  // 2. Helper to set/create meta tag
  const setMeta = (name: string, content: string, isProperty = false) => {
    const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    let el = document.querySelector(selector) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      if (isProperty) el.setAttribute('property', name);
      else el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 3. Update Standard & Social Meta Tags
  setMeta('description', meta.description);
  setMeta('keywords', meta.keywords);
  setMeta('og:title', meta.title, true);
  setMeta('og:description', meta.description, true);
  setMeta('og:url', meta.canonical, true);
  setMeta('twitter:title', meta.title);
  setMeta('twitter:description', meta.description);

  // 4. Update Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', meta.canonical);

  return meta;
}
