import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionsPage } from './hooks/useSessionsPage';
import SessionFilters from './components/SessionFilters';

const STATUS_OPTIONS = [
  { value: 'done', label: 'Feita' },
  { value: 'active', label: 'Ativa' },
  { value: 'pending_payment', label: 'Pendente' },
  { value: 'no_show', label: 'Não compareceu' },
  { value: 'cancelled', label: 'Cancelada' },
];

const getStatusLabel = (status) => STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'cancelled': return 'badge-default';
    case 'no_show': return 'badge-danger';
    case 'pending_payment': return 'badge-pending';
    case 'done': return 'badge-success';
    case 'active': return 'badge-active';
    default: return 'badge-default';
  }
};

const fmt = (d) =>
  new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

const EMPTY_FILTERS = {
  name: '',
  email: '',
  phoneNumber: '',
  dateFrom: '',
  dateTo: '',
  typeOfSession: [],
  status: [],
};

const loadSaved = () => {
  try {
    const saved = sessionStorage.getItem('adminSessionsFilters');
    if (!saved) return EMPTY_FILTERS;
    const parsed = JSON.parse(saved);
    return {
      ...EMPTY_FILTERS,
      ...parsed,
      typeOfSession: Array.isArray(parsed.typeOfSession) ? parsed.typeOfSession : [],
      status: Array.isArray(parsed.status) ? parsed.status : [],
    };
  } catch { return EMPTY_FILTERS; }
};

const saveFilters = (f) => sessionStorage.setItem('adminSessionsFilters', JSON.stringify(f));

const AdminSessions = () => {
  const navigate = useNavigate();
  const [sort, setSort] = useState({ field: null, dir: null });
  const [filters, setFilters] = useState(loadSaved);
  const [showAdvanced, setShowAdvanced] = useState(() => {
    const saved = loadSaved();
    return saved.typeOfSession.length > 0 || saved.status.length > 0;
  });

  // Draft states for text inputs (applied only on Enter)
  const [nameDraft, setNameDraft] = useState(() => loadSaved().name);
  const [emailDraft, setEmailDraft] = useState(() => loadSaved().email);
  const [phoneDraft, setPhoneDraft] = useState(() => loadSaved().phoneNumber);

  const serverFilters = useMemo(() => ({
    typeOfSession: filters.typeOfSession,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  }), [filters.typeOfSession, filters.status, filters.dateFrom, filters.dateTo]);

  const { sessions, hasMore, totalCount, loading, loadingMore, loadMore } = useSessionsPage(serverFilters);

  useEffect(() => {
    setSort({ field: null, dir: null });
  }, [serverFilters]);

  const handleLoadMore = () => {
    setSort({ field: null, dir: null });
    loadMore();
  };

  const filtered = useMemo(() => {
    const hasEqualityFilter = !!(serverFilters.typeOfSession?.length || serverFilters.status?.length);
    let result = sessions;

    if (filters.name) {
      const q = filters.name.toLowerCase();
      result = result.filter((s) => (s.spocName || s.spoc || '').toLowerCase().includes(q));
    }
    if (filters.email) {
      const q = filters.email.toLowerCase();
      result = result.filter((s) => (s.spocEmail || '').toLowerCase().includes(q));
    }
    if (filters.phoneNumber) {
      const q = filters.phoneNumber.toLowerCase();
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
  }, [sessions, filters.name, filters.email, filters.phoneNumber, serverFilters]);

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

  const hasFilters = !!(
    filters.name || filters.email || filters.phoneNumber ||
    filters.dateFrom || filters.dateTo ||
    filters.typeOfSession.length || filters.status.length
  );

  const clearAll = () => {
    sessionStorage.removeItem('adminSessionsFilters');
    setFilters(EMPTY_FILTERS);
    setNameDraft('');
    setEmailDraft('');
    setPhoneDraft('');
    setSort({ field: null, dir: null });
  };

  const SortTh = ({ field, children }) => {
    const active = sort.field === field;
    const icon = active && sort.dir === 'asc' ? ' ↑' : active && sort.dir === 'desc' ? ' ↓' : '';
    return (
      <th onClick={() => handleSort(field)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', color: active ? 'var(--primary)' : undefined }}>
        {children}{icon}
      </th>
    );
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
        filters={filters}
        setFilters={setFilters}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        nameDraft={nameDraft}
        setNameDraft={setNameDraft}
        emailDraft={emailDraft}
        setEmailDraft={setEmailDraft}
        phoneDraft={phoneDraft}
        setPhoneDraft={setPhoneDraft}
        hasFilters={hasFilters}
        onClearAll={clearAll}
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
                <SortTh field="date">Data</SortTh>
                <SortTh field="name">Nome</SortTh>
                <th>Email</th>
                <th>Telefone</th>
                <SortTh field="type">Tipo</SortTh>
                <SortTh field="status">Estado</SortTh>
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.map((s) => {
                const date = (s.sessionDatetime || s.sessionDate || '').slice(0, 10);
                return (
                  <tr key={s.id} onClick={() => navigate(`/sessions/${s.id}`)} style={{ cursor: 'pointer' }}>
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
          {hasMore && (
            <button className="btn-secondary" style={{ width: 'auto' }} onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? 'A carregar...' : 'Carregar Mais'}
            </button>
          )}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            {hasFilters && sortedFiltered.length !== sessions.length
              ? `A mostrar ${sortedFiltered.length} de ${sessions.length} carregadas`
              : `A mostrar ${sessions.length} de ${totalCount ?? '...'}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminSessions;
