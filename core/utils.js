/**
 * CORE — Shared Utilities
 *
 * Pure helper functions used across layers.
 * No side effects; safe to import anywhere.
 */

/** Generate a compact unique ID */
export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Format a number as Philippine Peso */
export const php = n =>
  '₱' + Number(n || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Format a date string (YYYY-MM-DD) to "Apr 2, 2026" */
export const fmtDate = d =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  }) : '—';

/** Escape HTML special characters to prevent XSS */
export const escHtml = s =>
  String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

/** Debounce a function call */
export const debounce = (fn, ms = 300) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
};

/** Trigger a CSV download in the browser */
export const exportCsv = (filename, rows) => {
  const csv = rows.map(r =>
    r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const MONTHS_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];
