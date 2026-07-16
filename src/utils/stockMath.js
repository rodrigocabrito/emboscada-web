// Pure ammo-stock math — no Firebase imports, so it's trivially unit-testable.

// Derives the current stock from an already-ordered (oldest→newest) history.
// Base = most recent count entry; adds every restock/removal after it.
export const computeStockFromHistory = (entries) => {
  let baseAmount = 0;
  let baseIdx = -1;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].type === 'count') {
      baseAmount = entries[i].amount;
      baseIdx = i;
      break;
    }
  }
  const delta = entries
    .slice(baseIdx + 1)
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);
  return baseAmount + delta;
};

// Per-caliber stock deltas for a session save (positive = bullets returned to
// stock). Fields absent from the payload mean "unchanged" (e.g. non-admin
// saves don't send caliber/bullets).
export const computeAmmoDeltas = (old, data) => {
  const oldCaliber = old.caliber || '';
  const oldBullets = old.bulletsSpent ?? 0;
  const newCaliber = data.caliber !== undefined ? (data.caliber || '') : oldCaliber;
  const newBullets = data.bulletsSpent !== undefined ? (data.bulletsSpent ?? 0) : oldBullets;

  const deltas = {};
  if (newCaliber === oldCaliber) {
    if (newCaliber && newBullets !== oldBullets) deltas[newCaliber] = -(newBullets - oldBullets);
  } else {
    if (oldCaliber && oldBullets !== 0) deltas[oldCaliber] = (deltas[oldCaliber] ?? 0) + oldBullets;
    if (newCaliber && newBullets !== 0) deltas[newCaliber] = (deltas[newCaliber] ?? 0) - newBullets;
  }
  return deltas;
};
