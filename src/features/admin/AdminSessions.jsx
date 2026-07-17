import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSessionsAll, getUsers } from '../../firebase/firestore';
import { useSessionsPage } from './hooks/useSessionsPage';
import SessionFilters from './components/SessionFilters';
import { getStatusLabel, getStatusBadgeClass } from '../../constants/sessions';
import { applyClientFilters } from '../../utils/sessionFilters';
import { buildCsv, downloadCsv } from '../../utils/csv';
import { sessionCsvColumns } from './sessionsCsv';
import { useToast } from '../../context/ToastContext';
import useEscapeKey from '../../hooks/useEscapeKey';

const fmt = (d) =>
  new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

const emptyFilters = () => ({
  name: '',
  email: '',
  phoneNumber: '',
  dateFrom: '',
  dateTo: '',
  typeOfSession: [],
  status: [],
});

const defaultFilters = () => ({
  ...emptyFilters(),
  dateFrom: new Date().toISOString().slice(0, 10),
});

const loadSaved = () => {
  try {
    const saved = sessionStorage.getItem('adminSessionsFilters');
    if (!saved) return defaultFilters();
    const parsed = JSON.parse(saved);
    return {
      ...defaultFilters(),
      ...parsed,
      typeOfSession: Array.isArray(parsed.typeOfSession) ? parsed.typeOfSession : [],
      status: Array.isArray(parsed.status) ? parsed.status : [],
    };
  } catch { return defaultFilters(); }
};

const saveFilters = (f) => sessionStorage.setItem('adminSessionsFilters', JSON.stringify(f));

// Sortable table header — module-scoped so its identity is stable across renders
const SortTh = ({ field, children, sort, onSort }) => {
  const active = sort.field === field;
  const icon = active && sort.dir === 'asc' ? ' ↑' : active && sort.dir === 'desc' ? ' ↓' : '';
  return (
    <th onClick={() => onSort(field)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', color: active ? 'var(--primary)' : undefined }}>
      {children}{icon}
    </th>
  );
};

const AdminSessions = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const [sort, setSort] = useState({ field: null, dir: null });
  const [textPage, setTextPage] = useState(1);
  const [pendingFilters, setPendingFilters] = useState(loadSaved);
  const [appliedFilters, setAppliedFilters] = useState(loadSaved);
  const [showAdvanced, setShowAdvanced] = useState(() => {
    const saved = loadSaved();
    return saved.typeOfSession.length > 0 || saved.status.length > 0;
  });

  // Draft states for text inputs (flushed into pendingFilters on Enter or on Apply)
  const [nameDraft, setNameDraft] = useState(() => loadSaved().name);
  const [emailDraft, setEmailDraft] = useState(() => loadSaved().email);
  const [phoneDraft, setPhoneDraft] = useState(() => loadSaved().phoneNumber);

  const serverFilters = useMemo(() => ({
    typeOfSession: appliedFilters.typeOfSession,
    status: appliedFilters.status,
    dateFrom: appliedFilters.dateFrom,
    dateTo: appliedFilters.dateTo,
  }), [appliedFilters]);

  const hasTextFilter = !!(appliedFilters.name || appliedFilters.email || appliedFilters.phoneNumber);
  // Firestore only applies one 'in' filter server-side, so combining type+status
  // needs the fetch-all path — otherwise server pages get truncated client-side.
  const hasCombinedFilter = !!(appliedFilters.typeOfSession.length && appliedFilters.status.length);
  const fetchAll = hasTextFilter || hasCombinedFilter;

  const { sessions: pagedSessions, hasMore, totalCount, loading: pagedLoading, loadingMore, loadMore } = useSessionsPage(serverFilters, 30, !fetchAll);

  const { data: allSessions = [], isLoading: allLoading } = useQuery({
    queryKey: ['sessions-all', serverFilters],
    queryFn: () => getSessionsAll(serverFilters),
    enabled: fetchAll,
    staleTime: 60_000,
  });

  const sessions = fetchAll ? allSessions : pagedSessions;
  const loading = fetchAll ? allLoading : pagedLoading;

  // Sort is reset in handleApply (the only place filters change) and handleLoadMore.
  const handleLoadMore = () => {
    setSort({ field: null, dir: null });
    loadMore();
  };

  const filtered = useMemo(
    () => applyClientFilters(sessions, appliedFilters, serverFilters),
    [sessions, appliedFilters, serverFilters]
  );

  // ── CSV export ─────────────────────────────────────────────────────────────
  // Monitors are resolved to names; the ['users'] cache is shared with other pages
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: getUsers, staleTime: 5 * 60_000 });
  const usersById = useMemo(() => Object.fromEntries(users.map((u) => [u.uuid, u])), [users]);

  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  useEscapeKey(() => setShowExport(false), showExport);

  // Human-readable summary of the filters the export will use
  const exportSummary = useMemo(() => {
    const parts = [];
    if (appliedFilters.name) parts.push(['Nome', appliedFilters.name]);
    if (appliedFilters.email) parts.push(['Email', appliedFilters.email]);
    if (appliedFilters.phoneNumber) parts.push(['Telemóvel', appliedFilters.phoneNumber]);
    if (appliedFilters.dateFrom) parts.push(['De', appliedFilters.dateFrom]);
    if (appliedFilters.dateTo) parts.push(['Até', appliedFilters.dateTo]);
    if (appliedFilters.typeOfSession.length) parts.push(['Tipo', appliedFilters.typeOfSession.join(', ')]);
    if (appliedFilters.status.length) parts.push(['Estado', appliedFilters.status.map(getStatusLabel).join(', ')]);
    return parts;
  }, [appliedFilters]);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Re-fetch everything matching the filters — the table may only hold
      // the pages loaded so far, but the export must cover the full match.
      const all = await getSessionsAll(serverFilters);
      const rows = applyClientFilters(all, appliedFilters, serverFilters);
      if (!rows.length) {
        showToast('Nenhuma sessão corresponde ao filtro — nada para exportar.');
        return;
      }
      const csv = buildCsv(sessionCsvColumns(usersById), rows);
      downloadCsv(`sessoes-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      setShowExport(false);
    } catch {
      showToast('Erro ao exportar as sessões. Tenta novamente.');
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (field) => {
    setSort((prev) => {
      if (prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc') return { field, dir: 'desc' };
      return { field: null, dir: null };
    });
  };

  const sortedFiltered = useMemo(() => {
    if (!sort.field || !sort.dir) return filtered;
    return [...filtered].sort((a, b) => {
      let av, bv;
      switch (sort.field) {
        case 'date':
          av = (a.sessionDatetime || a.sessionDate || '').slice(0, 10);
          bv = (b.sessionDatetime || b.sessionDate || '').slice(0, 10);
          break;
        case 'time':
          av = a.sessionTime || (a.sessionDatetime || '').slice(11, 16) || '';
          bv = b.sessionTime || (b.sessionDatetime || '').slice(11, 16) || '';
          break;
        case 'name':
          av = (a.spocName || a.spoc || '').toLowerCase();
          bv = (b.spocName || b.spoc || '').toLowerCase();
          break;
        case 'type':
          av = (a.typeOfSession || '').toLowerCase();
          bv = (b.typeOfSession || '').toLowerCase();
          break;
        case 'players':
          av = a.actualNumberOfPlayers || a.expectedNumberOfPlayers || 0;
          bv = b.actualNumberOfPlayers || b.expectedNumberOfPlayers || 0;
          return sort.dir === 'asc' ? av - bv : bv - av;
        case 'status':
          av = (a.status || '').toLowerCase();
          bv = (b.status || '').toLowerCase();
          break;
        default: return 0;
      }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sort]);

  const TEXT_PAGE_SIZE = 30;
  const visibleSessions = fetchAll ? sortedFiltered.slice(0, textPage * TEXT_PAGE_SIZE) : sortedFiltered;
  const hasMoreText = fetchAll && sortedFiltered.length > textPage * TEXT_PAGE_SIZE;

  const hasFilters = !!(
    appliedFilters.name || appliedFilters.email || appliedFilters.phoneNumber ||
    appliedFilters.dateFrom || appliedFilters.dateTo ||
    appliedFilters.typeOfSession.length || appliedFilters.status.length
  );

  const hasPendingFilters = !!(
    nameDraft || emailDraft || phoneDraft ||
    pendingFilters.dateFrom || pendingFilters.dateTo ||
    pendingFilters.typeOfSession.length || pendingFilters.status.length
  );

  const handleApply = () => {
    const toApply = { ...pendingFilters, name: nameDraft, email: emailDraft, phoneNumber: phoneDraft };
    setPendingFilters(toApply);
    setAppliedFilters(toApply);
    saveFilters(toApply);
    setSort({ field: null, dir: null });
    setTextPage(1);
  };

  const clearAll = () => {
    sessionStorage.removeItem('adminSessionsFilters');
    setPendingFilters(emptyFilters());
    setNameDraft('');
    setEmailDraft('');
    setPhoneDraft('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-secondary" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate('/admin')}>
          ← Voltar
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1>Sessões</h1>
            <p>Consulta e filtra todas as sessões registadas.</p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: 'auto', marginTop: 0 }}
            onClick={() => setShowExport(true)}
          >
            ⭳ Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <SessionFilters
        filters={pendingFilters}
        setFilters={setPendingFilters}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        nameDraft={nameDraft}
        setNameDraft={setNameDraft}
        emailDraft={emailDraft}
        setEmailDraft={setEmailDraft}
        phoneDraft={phoneDraft}
        setPhoneDraft={setPhoneDraft}
        hasFilters={hasPendingFilters}
        onClearAll={clearAll}
        onApply={handleApply}
      />

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>A carregar...</p>
        ) : sortedFiltered.length === 0 ? (
          <p style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {hasFilters ? 'Nenhuma sessão encontrada para os filtros aplicados.' : 'Nenhuma sessão registada.'}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <SortTh field="date" sort={sort} onSort={handleSort}>Data</SortTh>
                <SortTh field="name" sort={sort} onSort={handleSort}>Nome</SortTh>
                <th>Email</th>
                <th>Telefone</th>
                <SortTh field="type" sort={sort} onSort={handleSort}>Tipo</SortTh>
                <SortTh field="status" sort={sort} onSort={handleSort}>Estado</SortTh>
              </tr>
            </thead>
            <tbody>
              {visibleSessions.map((s) => {
                const date = (s.sessionDatetime || s.sessionDate || '').slice(0, 10);
                return (
                  <tr key={s.id} onClick={() => navigate(`/sessions/${s.id}`, { state: { from: '/admin/sessions' } })} style={{ cursor: 'pointer' }}>
                    <td>{date ? fmt(date) : '—'}</td>
                    <td className="td-name">{s.spocName || s.spoc || '—'}</td>
                    <td className="td-muted">{s.spocEmail || '—'}</td>
                    <td className="td-muted">{s.spocPhoneNumber || '—'}</td>
                    <td className="td-muted">{s.typeOfSession || '—'}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(s.status)}`} style={{ fontSize: '0.75rem' }}>
                        {getStatusLabel(s.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          {hasMoreText && (
            <button className="btn-secondary" style={{ width: 'auto' }} onClick={() => setTextPage((p) => p + 1)}>
              Carregar Mais
            </button>
          )}
          {!fetchAll && hasMore && (
            <button className="btn-secondary" style={{ width: 'auto' }} onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? 'A carregar...' : 'Carregar Mais'}
            </button>
          )}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            {fetchAll
              ? `A mostrar ${visibleSessions.length} de ${sortedFiltered.length} resultados`
              : `A mostrar ${sessions.length} de ${totalCount ?? '...'}`}
          </p>
        </div>
      )}

      {/* ── Confirm CSV export ── */}
      {showExport && (
        <div className="modal-overlay" onClick={() => !exporting && setShowExport(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Exportar sessões</h2>
              <button className="modal-close" onClick={() => setShowExport(false)} disabled={exporting} aria-label="Fechar">✕</button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0 1rem' }}>
              Serão exportadas <strong style={{ color: 'var(--text)' }}>todas as sessões que correspondem ao filtro atual</strong> — não apenas as visíveis na tabela.
            </p>

            <div style={{ background: 'var(--surface-alt, var(--surface))', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem 0.9rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Filtro aplicado
              </div>
              {exportSummary.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>
                  Sem filtros — serão exportadas <strong>todas</strong> as sessões.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {exportSummary.map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
                      <span style={{ color: 'var(--text)', textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowExport(false)} disabled={exporting}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" style={{ marginTop: 0 }} onClick={handleExport} disabled={exporting}>
                {exporting ? 'A exportar...' : 'Exportar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSessions;
