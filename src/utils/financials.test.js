import { describe, it, expect } from 'vitest';
import { computeFinancials } from './financials';

describe('computeFinancials', () => {
  it('computes packs + extras + others − signal', () => {
    const f = computeFinancials({
      numPacks: '10',
      packPrice: '15',
      extras: [{ quantity: '2', unitPrice: '5' }],
      others: [{ quantity: '1', unitPrice: '20' }],
      signal: '50',
    });
    expect(f.packsTotal).toBe(150);
    expect(f.extrasTotal).toBe(10);
    expect(f.othersTotal).toBe(20);
    expect(f.signalAmount).toBe(50);
    expect(f.total).toBe(130);
  });

  it('treats empty/invalid inputs as zero', () => {
    const f = computeFinancials({ numPacks: '', packPrice: 'abc', extras: [], others: [], signal: '' });
    expect(f.total).toBe(0);
  });

  it('total can go negative when signal exceeds items', () => {
    const f = computeFinancials({ numPacks: '1', packPrice: '10', extras: [], others: [], signal: '80' });
    expect(f.total).toBe(-70);
  });

  it('returns empty object for null form', () => {
    expect(computeFinancials(null)).toEqual({});
  });
});
