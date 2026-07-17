// Minimal CSV builder.
// Delimiter is ';' on purpose: Excel in pt-PT uses the semicolon as list
// separator, so a comma-delimited file opens with every row in one column.
const DELIMITER = ';';

export const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Quote when the value contains the delimiter, a quote, or a line break
  if (s.includes(DELIMITER) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

// columns: [{ label, value: (row) => any }]
export const buildCsv = (columns, rows) => {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(DELIMITER);
  const body = rows.map((row) => columns.map((c) => escapeCsvValue(c.value(row))).join(DELIMITER));
  return [header, ...body].join('\r\n');
};

// Formats a number with the pt-PT decimal comma so Excel reads it as a number
export const csvNumber = (n) =>
  n === null || n === undefined || n === '' ? '' : String(n).replace('.', ',');

// Forces spreadsheets to treat the value as text. Quoting alone isn't enough —
// Excel still coerces "00351912345678" into a number (dropping the leading
// zeros / "+"). The ="..." wrapper is the portable way to keep it verbatim.
export const csvText = (v) => {
  if (v === null || v === undefined || v === '') return '';
  // Drop any quotes so they can't break out of the ="..." wrapper
  return `="${String(v).replace(/"/g, '')}"`;
};

const BOM = '\uFEFF'; // Makes Excel read the file as UTF-8 (accented characters)

export const downloadCsv = (filename, csv) => {
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
