import { describe, it, expect } from 'vitest';
import { escapeCsvValue, buildCsv, csvNumber, csvText } from './csv';

describe('escapeCsvValue', () => {
  it('passes plain values through', () => {
    expect(escapeCsvValue('Paintball')).toBe('Paintball');
    expect(escapeCsvValue(42)).toBe('42');
  });

  it('renders null/undefined as empty', () => {
    expect(escapeCsvValue(null)).toBe('');
    expect(escapeCsvValue(undefined)).toBe('');
  });

  it('quotes values containing the delimiter', () => {
    expect(escapeCsvValue('Silva; João')).toBe('"Silva; João"');
  });

  it('escapes embedded quotes by doubling them', () => {
    expect(escapeCsvValue('Grupo "VIP"')).toBe('"Grupo ""VIP"""');
  });

  it('quotes values containing newlines', () => {
    expect(escapeCsvValue('linha1\nlinha2')).toBe('"linha1\nlinha2"');
  });
});

describe('csvNumber', () => {
  it('uses a comma as decimal separator (pt-PT Excel)', () => {
    expect(csvNumber(12.5)).toBe('12,5');
    expect(csvNumber(100)).toBe('100');
  });

  it('renders empty values as empty', () => {
    expect(csvNumber(null)).toBe('');
    expect(csvNumber(undefined)).toBe('');
    expect(csvNumber('')).toBe('');
  });

  it('keeps zero (does not treat it as empty)', () => {
    expect(csvNumber(0)).toBe('0');
  });
});

describe('csvText', () => {
  it('wraps values so spreadsheets keep them as text', () => {
    expect(csvText('+351 912 345 678')).toBe('="+351 912 345 678"');
  });

  it('preserves leading zeros', () => {
    expect(csvText('00351912345678')).toBe('="00351912345678"');
  });

  it('renders empty values as empty (not ="")', () => {
    expect(csvText('')).toBe('');
    expect(csvText(null)).toBe('');
    expect(csvText(undefined)).toBe('');
  });

  it('strips quotes so they cannot break out of the wrapper', () => {
    expect(csvText('91"2')).toBe('="912"');
  });

  it('survives CSV escaping intact', () => {
    // The field is quoted and inner quotes doubled — Excel unescapes back to ="..."
    expect(escapeCsvValue(csvText('+351 912'))).toBe('"=""+351 912"""');
  });
});

describe('buildCsv', () => {
  const columns = [
    { label: 'Nome', value: (r) => r.name },
    { label: 'Total', value: (r) => csvNumber(r.total) },
  ];

  it('builds a header plus one line per row', () => {
    const csv = buildCsv(columns, [
      { name: 'João', total: 12.5 },
      { name: 'Maria', total: 8 },
    ]);
    expect(csv).toBe('Nome;Total\r\nJoão;12,5\r\nMaria;8');
  });

  it('emits just the header for an empty list', () => {
    expect(buildCsv(columns, [])).toBe('Nome;Total');
  });

  it('escapes values that would break the row structure', () => {
    const csv = buildCsv(columns, [{ name: 'A; "B"', total: 1 }]);
    expect(csv).toBe('Nome;Total\r\n"A; ""B""";1');
  });
});
