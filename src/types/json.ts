export interface FormattingOptions {
  indentSize?: number;
  sortMode?: 'none' | 'asc' | 'desc';
  sortArrays?: boolean;
  fixLooseJson?: boolean;
  escapeMode?: 'none' | 'escape' | 'unescape' | 'unicode_escape' | 'unicode_unescape';
  filterKey?: string;
}
