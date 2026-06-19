import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionsPage, getSessionsCount } from '../firebase/firestore';

const SESSION_TYPES = ['Paintball', 'Paintball Kids', 'Laser Tag', 'Laser Tag Kids', 'Gel Blast', 'Bubble Football'];

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

// Reusable text input with + ENTER hint and clear button
const TextFilter = ({ label, value, onCommit, onClear, outerStyle }) => (
  <div className="form-group" style={{ margin: 0, flex: '1 1 160px', ...outerStyle }}>
    <label>{label}</label>
    <div style={{ position: 'relative' }}>
      <input
        type="search"
        placeholder="—"
        value={value.draft}
        onChange={(e) => value.set(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onCommit(value.draft); }}
        style={{ width: '100%', paddingRight: value.draft ? '6rem' : undefined }}
      />
      {value.draft && (
        <div style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', pointerEvents: 'none', letterSpacing: '0.03em' }}>+ ENTER</span>
          <button
            type="button"
            onClick={() => { value.set(''); onClear(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1, display: 'flex', alignItems: 'center' }}
            aria-label={`Limpar ${label}`}
          >✕</button>
        </div>
      )}
    </div>
  </div>
);

const AdminSessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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

  const applyText = (field, value, setDraft) => {
    setDraft(value);
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      saveFilters(next);
      return next;
    });
  };

  const toggleChip = (field, value) => {
    setFilters((prev) => {
      const arr = prev[field];
      const next = { ...prev, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
      saveFilters(next);
      return next;
    });
  };

  const serverFilters = useMemo(() => ({
    typeOfSession: filters.typeOfSession,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  }), [filters.typeOfSession, filters.status, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    setLoading(true);
    setSessions([]);
    setLastDoc(null);
    setSort({ field: null, dir: null });
    Promise.all([getSessionsPage(30, null, serverFilters), getSessionsCount(serverFilters)])
      .then(([{ sessions: s, lastDoc: ld, hasMore: hm }, total]) => {
        setSessions(s);
        setLastDoc(ld);
        setHasMore(hm);
        setTotalCount(total);
      }).finally(() => setLoading(false));
  }, [serverFilters]);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    setSort({ field: null, dir: null });
    try {
      const { sessions: more, lastDoc: ld, hasMore: hm } = await getSessionsPage(30, lastDoc, serverFilters);
      setSessions((prev) => [...prev, ...more]);
      setLastDoc(ld);
      setHasMore(hm);
    } finally {
      setLoadingMore(false);
    }
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
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Text + date row */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <TextFilter
              label="Nome"
              value={{ draft: nameDraft, set: setNameDraft }}
              onCommit={(v) => applyText('name', v, setNameDraft)}
              onClear={() => applyText('name', '', setNameDraft)}
              outerStyle={{ flex: 'none' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <button
                type="button"
                className={showAdvanced ? 'btn-primary' : 'btn-secondary'}
                style={{ width: 'auto', whiteSpace: 'nowrap', fontSize: '0.875rem', padding: '0.5rem 1rem', position: 'relative', marginTop: 0 }}
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? '- Filtros' : '+ Filtros'}
                {(filters.typeOfSession.length > 0 || filters.status.length > 0) && (
                  <span style={{ marginLeft: '0.4rem', background: 'var(--primary)', color: '#fff', borderRadius: '999px', fontSize: '0.65rem', padding: '0.05rem 0.4rem', fontWeight: 700 }}>
                    {filters.typeOfSession.length + filters.status.length}
                  </span>
                )}
              </button>
              <button
                className="btn-secondary"
                style={{ width: 'auto', whiteSpace: 'nowrap', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                onClick={clearAll}
                disabled={!hasFilters}
              >
                Limpar filtros
              </button>
            </div>
          </div>
          <TextFilter
            label="Email"
            value={{ draft: emailDraft, set: setEmailDraft }}
            onCommit={(v) => applyText('email', v, setEmailDraft)}
            onClear={() => applyText('email', '', setEmailDraft)}
          />
          <TextFilter
            label="Telemóvel"
            value={{ draft: phoneDraft, set: setPhoneDraft }}
            onCommit={(v) => applyText('phoneNumber', v, setPhoneDraft)}
            onClear={() => applyText('phoneNumber', '', setPhoneDraft)}
          />
          <div className="form-group" style={{ margin: 0, flex: '1 1 130px' }}>
            <label>De</label>
            <input type="date" value={filters.dateFrom} onChange={(e) => {
              const next = { ...filters, dateFrom: e.target.value };
              setFilters(next); saveFilters(next);
            }} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 130px' }}>
            <label>Até</label>
            <input type="date" value={filters.dateTo} onChange={(e) => {
              const next = { ...filters, dateTo: e.target.value };
              setFilters(next); saveFilters(next);
            }} />
          </div>
        </div>

        {/* Advanced: type + status chips */}
        {showAdvanced && (
          <div style={{ display: 'flex', gap: '2rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Tipo de Sessão</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {SESSION_TYPES.map((t) => {
                  const sel = filters.typeOfSession.includes(t);
                  return (
                    <button key={t} type="button" onClick={() => toggleChip('typeOfSession', t)} style={{
                      padding: '0.4rem 0.9rem', fontSize: '0.82rem', borderRadius: '999px', cursor: 'pointer',
                      border: `1.5px solid ${sel ? 'var(--green-500)' : 'var(--border)'}`,
                      background: sel ? 'var(--green-500)' : 'var(--surface)',
                      color: sel ? '#fff' : 'var(--text-muted)',
                      fontWeight: sel ? 600 : 400, transition: 'all 0.15s',
                    }}>{t}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Estado</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {STATUS_OPTIONS.map((s) => {
                  const sel = filters.status.includes(s.value);
                  const palette = {
                    done:            { idle: { bg: 'var(--green-100)', color: 'var(--green-700)', border: 'var(--green-200)' }, sel: { bg: 'var(--green-500)', color: '#fff', border: 'var(--green-500)' } },
                    active:          { idle: { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' }, sel: { bg: '#1d4ed8', color: '#fff', border: '#1d4ed8' } },
                    pending_payment: { idle: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' }, sel: { bg: '#d97706', color: '#fff', border: '#d97706' } },
                    no_show:         { idle: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }, sel: { bg: '#dc2626', color: '#fff', border: '#dc2626' } },
                    cancelled:       { idle: { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' }, sel: { bg: '#6b7280', color: '#fff', border: '#6b7280' } },
                  };
                  const c = (palette[s.value] ?? palette.cancelled)[sel ? 'sel' : 'idle'];
                  return (
                    <button key={s.value} type="button" onClick={() => toggleChip('status', s.value)} style={{
                      padding: '0.4rem 0.9rem', fontSize: '0.82rem', borderRadius: '999px', cursor: 'pointer',
                      border: `1.5px solid ${c.border}`,
                      background: c.bg, color: c.color,
                      fontWeight: sel ? 600 : 500, transition: 'all 0.15s',
                    }}>{s.label}</button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

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
