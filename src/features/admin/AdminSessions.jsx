import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSessionsAll } from '../../firebase/firestore';
import { useSessionsPage } from './hooks/useSessionsPage';
import SessionFilters from './components/SessionFilters';
import { getStatusLabel, getStatusBadgeClass } from '../../constants/sessions';

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

const normalize = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

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

  const filtered = useMemo(() => {
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
    // When both typeOfSession and status are selected, Firestore only applies typeOfSession
    // (one 'in' limit), so filter status client-side.
    if (serverFilters.status?.length > 0 && serverFilters.typeOfSession?.length > 0) {
      result = result.filter((s) => serverFilters.status.includes(s.status));
    }
    // Default date sort when Firestore skips orderBy to avoid composite index
    if (hasEqualityFilter) {
      result = [...result].sort((a, b) => {
        const da = a.sessionDatetime || '';
        const db = b.sessionDatetime || '';
        return da < db ? -1 : da > db ? 1 : 0;
      });
    }
    return result;
  }, [sessions, appliedFilters, serverFilters]);

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
        <h1>Sessões</h1>
        <p>Consulta e filtra todas as sessões registadas.</p>
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
    </div>
  );
};

export default AdminSessions;
