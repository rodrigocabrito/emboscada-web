import { useState, useEffect, useMemo, useCallback } from 'react';
import { addSession, getSessions, getUsers, updateSessionStatus, updateSession } from '../firebase/firestore';
import { getUserColor } from '../utils/avatarColors';

const VIEWS = [
  { key: 'day', label: 'Dia' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
];

const EMPTY_FORM = {
  spoc: '',
  numberOfPlayers: '',
  sessionDate: '',
  additionalComments: '',
  monitors: [],
};

const toDate = (ts) => {
  if (!ts) return new Date();
  if (ts?.toDate) return ts.toDate();
  return new Date(ts);
};

const groupSessions = (sessions, view) => {
  const groups = {};
  sessions.forEach((s) => {
    const d = toDate(s.sessionDate);
    let key, label;

    if (view === 'day') {
      key = d.toISOString().split('T')[0];
      label = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else if (view === 'week') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      key = monday.toISOString().split('T')[0];
      label = `${monday.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      label = d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    }

    if (!groups[key]) groups[key] = { label, sessions: [] };
    groups[key].sessions.push(s);
  });
  return groups;
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'cancelled':
      return 'Cancelada';
    case 'no_show':
      return 'Não compareceu';
    case 'pending_payment':
      return 'Pendente';
    case 'active':
      return 'Ativa';
    case 'done':
      return 'Feita';
    default:
      return status;
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'cancelled':
    case 'no_show':
      return 'badge-danger';
    case 'pending_payment':
      return 'badge-pending';
    case 'active':
    case 'done':
      return 'badge-success';
    default:
      return 'badge-default';
  }
};

const SessionCard = ({ session, users, onEdit }) => {
  const date = toDate(session.sessionDate);
  const time = date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

  const monitors = (session.monitors || [])
    .map((uid) => users.find((u) => u.uuid === uid))
    .filter(Boolean);

  return (
    <div className="session-card" onClick={() => onEdit(session)} style={{ cursor: 'pointer' }}>
      <span className="session-time">{time}</span>
      <div className="session-info">
        <span className="session-spoc">{session.spoc}</span>
        <span className="session-meta">{session.numberOfPlayers} jogadores</span>
        {session.additionalComments && (
          <span className="session-comment">{session.additionalComments}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {monitors.length > 0 && (
          <div className="monitors-avatars">
            {monitors.map((m) => {
              const initials = `${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase();
              const color = getUserColor(m.uuid);
              return (
                <div
                  key={m.uuid}
                  className="monitor-avatar"
                  style={{ backgroundColor: color }}
                  title={`${m.firstName} ${m.lastName}`}
                >
                  {initials}
                </div>
              );
            })}
          </div>
        )}
        {session.numberOfPlayers < 10 && (
          <span className="warn-tooltip" data-tip="Esta sessão tem menos de 10 jogadores">⚠</span>
        )}
        <span className={`badge ${getStatusBadgeClass(session.status)}`}>
          {getStatusLabel(session.status)}
        </span>
      </div>
    </div>
  );
};

const SessionDetailModal = ({ session, users, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    spoc: session.spoc || '',
    numberOfPlayers: session.numberOfPlayers || '',
    sessionDate: session.sessionDate ? new Date(session.sessionDate.toDate()).toISOString().slice(0, 16) : '',
    status: session.status || 'active',
    additionalComments: session.additionalComments || '',
    monitors: session.monitors || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'monitors') {
      setFormData((prev) => ({
        ...prev,
        monitors: checked
          ? [...prev.monitors, value]
          : prev.monitors.filter((uid) => uid !== value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(session.id, {
        spoc: formData.spoc,
        numberOfPlayers: parseInt(formData.numberOfPlayers, 10),
        sessionDate: formData.sessionDate,
        status: formData.status,
        additionalComments: formData.additionalComments,
        monitors: formData.monitors,
      });
      onClose();
    } catch {
      setError('Erro ao guardar sessão. Tenta novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '530px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Editar Sessão</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="spoc">Responsável</label>
              <input
                id="spoc"
                name="spoc"
                type="text"
                value={formData.spoc}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="numberOfPlayers">Nº de Jogadores</label>
              <input
                id="numberOfPlayers"
                name="numberOfPlayers"
                type="number"
                min="1"
                value={formData.numberOfPlayers}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="sessionDate">Data e Hora</label>
            <input
              id="sessionDate"
              name="sessionDate"
              type="datetime-local"
              value={formData.sessionDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="additionalComments">Comentários adicionais</label>
            <textarea
              id="additionalComments"
              name="additionalComments"
              value={formData.additionalComments}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Notas, requisitos especiais..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="monitorSearch">Monitores</label>
            <div className="monitors-checklist">
              {users
                .filter((u) => u.role === 'monitor' || u.role === 'admin')
                .map((user) => {
                  const nickname = user.nickname ? `(${user.nickname}) ` : '';
                  return (
                    <div key={user.uuid} className="form-checkbox-item">
                      <input
                        id={`monitor-${user.uuid}`}
                        name="monitors"
                        type="checkbox"
                        value={user.uuid}
                        checked={formData.monitors.includes(user.uuid)}
                        onChange={handleChange}
                      />
                      <label htmlFor={`monitor-${user.uuid}`}>
                        {nickname}{user.firstName} {user.lastName}
                      </label>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="form-group">
            <label>Estado da Sessão</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap', marginTop: '0.5rem' }}>
              {[
                { value: 'done', label: 'Feita' },
                { value: 'active', label: 'Ativa' },
                { value: 'pending_payment', label: 'Pendente' },
                { value: 'no_show', label: 'Não compareceu' },
                { value: 'cancelled', label: 'Cancelada' },
              ].map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, status: status.value }))}
                  className={`badge ${getStatusBadgeClass(status.value)}`}
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    whiteSpace: 'nowrap',
                    flex: '0 0 auto',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    opacity: formData.status === status.value ? 1 : 0.6,
                    boxShadow: formData.status === status.value ? '0 0 0 2px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.3)' : 'none',
                    transform: formData.status === status.value ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {formData.status === status.value ? '✓ ' : ''}{status.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="error-msg"><span>⚠</span> {error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'A guardar...' : 'Guardar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Sessions = () => {
  const [view, setView] = useState('day');
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [showPast, setShowPast] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [monitorSearch, setMonitorSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(30);
  const [selectedSession, setSelectedSession] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  const fetchSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      // silently fail on list fetch
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      // silently fail on user fetch
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchUsers();
  }, []);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setError('');
    setSuccess('');
    setMonitorSearch('');
    setModalOpen(true);
  };

  const closeModal = useCallback(() => {
    if (loading) return;
    setModalOpen(false);
  }, [loading]);

  // Close on Escape key
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen, closeModal]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filteredSessions = useMemo(() => {
    const filtered = sessions.filter((s) => {
      const sessionDate = toDate(s.sessionDate);
      const isPast = sessionDate < now;
      const pastFilter = showPast || !isPast;
      const statusFilterMatch = statusFilter ? s.status === statusFilter : true;
      return pastFilter && statusFilterMatch;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dateA = toDate(a.sessionDate).getTime();
      const dateB = toDate(b.sessionDate).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

    return sorted;
  }, [sessions, showPast, sortAsc, statusFilter]);

  const displayedSessions = useMemo(() => filteredSessions.slice(0, displayCount), [filteredSessions, displayCount]);
  const grouped = useMemo(() => groupSessions(displayedSessions, view), [displayedSessions, view]);
  const sortedKeys = useMemo(() => {
    const keys = Object.keys(grouped);
    return sortAsc ? keys.sort() : keys.sort().reverse();
  }, [grouped, sortAsc]);

  const hasMoreSessions = filteredSessions.length > displayCount;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'monitors') {
      setForm((prev) => ({
        ...prev,
        monitors: checked
          ? [...prev.monitors, value]
          : prev.monitors.filter((uid) => uid !== value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await addSession({
        spoc: form.spoc,
        numberOfPlayers: parseInt(form.numberOfPlayers, 10),
        sessionDate: form.sessionDate,
        additionalComments: form.additionalComments,
        monitors: form.monitors,
      });
      setForm(EMPTY_FORM);
      await fetchSessions();
      setModalOpen(false);
    } catch {
      setError('Erro ao criar sessão. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSession = async (sessionId, data) => {
    try {
      await updateSession(sessionId, data);
      await fetchSessions();
    } catch {
      throw new Error('Erro ao guardar sessão');
    }
  };

  const countLabel = sessions.length === 0
    ? 'Sem sessões'
    : sessions.length === 1
    ? '1 sessão'
    : `${sessions.length} sessões`;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Sessões</h1>
        <p>Gestão de sessões e reservas do parque.</p>
      </div>

      <div className="sessions-toolbar">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn-primary"
            onClick={() => setShowPast(!showPast)}
            style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', marginTop: 0, width: 'fit-content', opacity: showPast ? 1 : 0.6 }}
          >
            {showPast ? '✓ Sessões Passadas' : '○ Sessões Passadas'}
          </button>
          <button
            className="btn-primary"
            onClick={() => setSortAsc(!sortAsc)}
            style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', marginTop: 0, width: 'fit-content' }}
          >
            {sortAsc ? '↑ Data' : '↓ Data'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {[
              { value: 'done', label: 'Feita' },
              { value: 'active', label: 'Ativa' },
              { value: 'pending_payment', label: 'Pendente' },
              { value: 'no_show', label: 'Não compareceu' },
              { value: 'cancelled', label: 'Cancelada' },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(statusFilter === status.value ? null : status.value)}
                className={`badge ${getStatusBadgeClass(status.value)}`}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  whiteSpace: 'nowrap',
                  flex: '0 0 auto',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  opacity: statusFilter === status.value ? 1 : 0.6,
                  boxShadow: statusFilter === status.value ? '0 0 0 2px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.3)' : 'none',
                  transform: statusFilter === status.value ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                }}
              >
                {statusFilter === status.value ? '✓ ' : ''}{status.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="view-toggle">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                className={view === v.key ? 'active' : ''}
                onClick={() => setView(v.key)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button className="btn-primary btn-new-session" onClick={openModal}>
            + Nova Sessão
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '2rem' }}>
          Nenhuma sessão criada ainda.
        </p>
      ) : filteredSessions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '2rem' }}>
          {showPast ? 'Nenhuma sessão passada.' : 'Nenhuma sessão futura.'}
        </p>
      ) : (
        <>
          {sortedKeys.map((key) => {
            const count = grouped[key].sessions.length;
            return (
              <div key={key} className="session-group">
                <div className="session-group-label">
                  {grouped[key].label} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>({count})</span>
                </div>
                <div className="session-list">
                  {grouped[key].sessions.map((session) => (
                    <SessionCard key={session.id} session={session} users={users} onEdit={setSelectedSession} />
                  ))}
                </div>
              </div>
            );
          })}
          {hasMoreSessions && (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2rem', paddingBottom: '2rem' }}>
              <button
                className="btn-primary"
                onClick={() => setDisplayCount((prev) => prev + 30)}
                style={{ width: 'fit-content', padding: '0.75rem 1.5rem' }}
              >
                Mostrar mais
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nova Sessão</h2>
              <button className="modal-close" onClick={closeModal} aria-label="Fechar">✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="spoc">Responsável</label>
                  <input
                    id="spoc"
                    name="spoc"
                    type="text"
                    value={form.spoc}
                    onChange={handleChange}
                    placeholder="Nome do responsável"
                    autoFocus
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="numberOfPlayers">Nº de Jogadores</label>
                  <input
                    id="numberOfPlayers"
                    name="numberOfPlayers"
                    type="number"
                    min="1"
                    value={form.numberOfPlayers}
                    onChange={handleChange}
                    placeholder="Ex: 10"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sessionDate">Data e Hora</label>
                <input
                  id="sessionDate"
                  name="sessionDate"
                  type="datetime-local"
                  value={form.sessionDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="additionalComments">Comentários adicionais</label>
                <textarea
                  id="additionalComments"
                  name="additionalComments"
                  value={form.additionalComments}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Notas, requisitos especiais..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="monitorSearch">Monitores</label>
                <input
                  id="monitorSearch"
                  type="text"
                  value={monitorSearch}
                  onChange={(e) => setMonitorSearch(e.target.value)}
                  placeholder="Pesquisa por nome ou alcunha..."
                  style={{ marginBottom: '0.5rem' }}
                />
                <div className="monitors-checklist">
                  {users
                    .filter((user) => {
                      const searchLower = monitorSearch.toLowerCase();
                      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
                      const nickname = (user.nickname || '').toLowerCase();
                      return fullName.includes(searchLower) || nickname.includes(searchLower);
                    })
                    .map((user) => {
                      const nickname = user.nickname ? `(${user.nickname}) ` : '';
                      return (
                        <div key={user.uuid} className="form-checkbox-item">
                          <input
                            id={`monitor-${user.uuid}`}
                            name="monitors"
                            type="checkbox"
                            value={user.uuid}
                            checked={form.monitors.includes(user.uuid)}
                            onChange={handleChange}
                          />
                          <label htmlFor={`monitor-${user.uuid}`}>
                            {nickname}{user.firstName} {user.lastName}
                          </label>
                        </div>
                      );
                    })}
                </div>
              </div>

              {error && <div className="error-msg"><span>⚠</span> {error}</div>}
              {success && <div className="success-msg"><span>✓</span> {success}</div>}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'A criar...' : 'Criar Sessão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          users={users}
          onClose={() => setSelectedSession(null)}
          onSave={handleSaveSession}
        />
      )}
    </div>
  );
};

export default Sessions;
