// Pure financial totals for a session form (string-typed inputs from the UI).
export const computeFinancials = (form) => {
  if (!form) return {};
  const packsTotal = (parseFloat(form.numPacks) || 0) * (parseFloat(form.packPrice) || 0);
  const extrasTotal = (form.extras || []).reduce(
    (sum, e) => sum + (parseFloat(e.quantity) || 0) * (parseFloat(e.unitPrice) || 0), 0
  );
  const othersTotal = (form.others || []).reduce(
    (sum, o) => sum + (parseFloat(o.quantity) || 0) * (parseFloat(o.unitPrice) || 0), 0
  );
  const signalAmount = parseFloat(form.signal) || 0;
  const total = packsTotal + extrasTotal + othersTotal - signalAmount;
  return { packsTotal, extrasTotal, othersTotal, signalAmount, total };
};
