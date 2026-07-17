// Client-side portion of the admin session filters.
// Shared by the table and the CSV export so both apply identical rules.

export const normalize = (s) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// `serverFilters` are the ones Firestore already applied; the text filters and
// (when both type+status are active) the status filter must be applied here.
export const applyClientFilters = (sessions, appliedFilters, serverFilters) => {
  const hasEqualityFilter = !!(serverFilters.typeOfSession?.length || serverFilters.status?.length);
  let result = sessions;

  if (appliedFilters.name) {
    const q = normalize(appliedFilters.name);
    result = result.filter((s) => normalize(s.spocName || s.spoc || '').includes(q));
  }
  if (appliedFilters.email) {
    const q = appliedFilters.email.toLowerCase();
    result = result.filter((s) => (s.spocEmail || '').toLowerCase().includes(q));
  }
  if (appliedFilters.phoneNumber) {
    const q = appliedFilters.phoneNumber.toLowerCase();
    result = result.filter((s) => (s.spocPhoneNumber || '').toLowerCase().includes(q));
  }
  // Firestore allows only one 'in' operator per query, so when both
  // typeOfSession and status are selected it applies type and we filter status here.
  if (serverFilters.status?.length > 0 && serverFilters.typeOfSession?.length > 0) {
    result = result.filter((s) => serverFilters.status.includes(s.status));
  }
  // Firestore skips orderBy when an equality filter is present (composite index),
  // so sort by date client-side in that case.
  if (hasEqualityFilter) {
    result = [...result].sort((a, b) => {
      const da = a.sessionDatetime || '';
      const db = b.sessionDatetime || '';
      return da < db ? -1 : da > db ? 1 : 0;
    });
  }
  return result;
};
