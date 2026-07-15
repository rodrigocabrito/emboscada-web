import { describe, it, expect } from 'vitest';
import { computeStockFromHistory, computeAmmoDeltas } from './stockMath';

describe('computeStockFromHistory', () => {
  it('sums restocks/removals with no count entry', () => {
    expect(computeStockFromHistory([
      { amount: 10000 },
      { amount: -2000, type: 'removal' },
    ])).toBe(8000);
  });

  it('uses the most recent count as absolute base', () => {
    expect(computeStockFromHistory([
      { amount: 10000 },
      { amount: 50000, type: 'count' },
      { amount: 3000 },
    ])).toBe(53000);
  });

  it('ignores everything before the last count', () => {
    expect(computeStockFromHistory([
      { amount: 99999 },
      { amount: 20000, type: 'count' },
      { amount: 1000 },
      { amount: 5000, type: 'count' },
      { amount: -500, type: 'removal' },
    ])).toBe(4500);
  });

  it('empty history = zero stock', () => {
    expect(computeStockFromHistory([])).toBe(0);
  });
});

describe('computeAmmoDeltas', () => {
  it('same caliber, more bullets spent → stock decreases', () => {
    expect(computeAmmoDeltas(
      { caliber: '.50', bulletsSpent: 1000 },
      { caliber: '.50', bulletsSpent: 1500 }
    )).toEqual({ '.50': -500 });
  });

  it('same caliber, fewer bullets → stock returns', () => {
    expect(computeAmmoDeltas(
      { caliber: '.50', bulletsSpent: 1000 },
      { caliber: '.50', bulletsSpent: 400 }
    )).toEqual({ '.50': 600 });
  });

  it('no change → no deltas', () => {
    expect(computeAmmoDeltas(
      { caliber: '.50', bulletsSpent: 1000 },
      { caliber: '.50', bulletsSpent: 1000 }
    )).toEqual({});
  });

  it('caliber switch returns old stock and deducts from new', () => {
    expect(computeAmmoDeltas(
      { caliber: '.50', bulletsSpent: 1000 },
      { caliber: '.68', bulletsSpent: 800 }
    )).toEqual({ '.50': 1000, '.68': -800 });
  });

  it('undefined payload fields mean "unchanged" (non-admin saves)', () => {
    expect(computeAmmoDeltas(
      { caliber: '.50', bulletsSpent: 1000 },
      { total: 250 }
    )).toEqual({});
  });

  it('clearing bullets (null) returns the stock', () => {
    expect(computeAmmoDeltas(
      { caliber: '.50', bulletsSpent: 1000 },
      { caliber: '.50', bulletsSpent: null }
    )).toEqual({ '.50': 1000 });
  });

  it('first-time fill on a session with no previous caliber', () => {
    expect(computeAmmoDeltas(
      {},
      { caliber: '.68', bulletsSpent: 2000 }
    )).toEqual({ '.68': -2000 });
  });
});
