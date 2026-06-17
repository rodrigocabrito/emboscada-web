import { useState, useEffect, useCallback } from 'react';
import { addSession, getSessions, getUsers, updateSession } from '../firebase/firestore';
import { getUserColor } from '../utils/avatarColors';

const VIEWS = [
  { key: 'day', label: 'Dia' },
  { key: 'week', label: 'Semana' },
];

const EMPTY_FORM = {
  spoc: '',
  numberOfPlayers: '',
  sessionDay: '',
  sessionTime: '',
  additionalComments: '',
  monitors: [],
};

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => [
  `${String(i).padStart(2, '0')}:00`,
  `${String(i).padStart(2, '0')}:30`,
]).flat().filter((t) => t >= '08:00' && t <= '19:30');

// Parse a session into a plain JS Date, timezone-free.
// New sessions have sessionDatetime "YYYY-MM-DDTHH:MM" (no tz suffix).
// Legacy sessions have a Firestore Timestamp in sessionDate.
const toDate = (session) => {
  if (session?.sessionDatetime) {
    // No timezone suffix → parsed as local time by the browser, always correct
    return new Date(session.sessionDatetime);
  }
  // Legacy: Firestore Timestamp or ISO string
  const ts = session?.sessionDate ?? session;
  if (!ts) return new Date();
  if (ts?.toDate) return ts.toDate();
  return new Date(ts);
};

const formatTime = (session) => {
  if (session?.sessionTime) return session.sessionTime;
  // Legacy fallback
  const d = toDate(session);
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
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


const STATUS_LEGEND = [
  { label: 'Feita',            color: '#15803d', bg: '#dcfce7' },
  { label: 'Ativa',            color: '#1e40af', bg: '#dbeafe' },
  { label: 'Pendente',         color: '#854d0e', bg: '#fef9c3' },
  { label: 'Não compareceu',   color: '#7f1d1d', bg: '#fee2e2' },
  { label: 'Cancelada',        color: '#374151', bg: '#f3f4f6' },
];

const GridLegend = () => (
  <div className="grid-legend">
    {STATUS_LEGEND.map(({ label, color, bg }) => (
      <div key={label} className="grid-legend-item">
        <span className="grid-legend-dot" style={{ background: bg, border: `2px solid ${color}` }} />
        <span className="grid-legend-label" style={{ color }}>{label}</span>
      </div>
    ))}
  </div>
);

const GridSessionCard = ({ session, users, onEdit, hideStatus = false }) => {
  const time = formatTime(session);
  const monitors = (session.monitors || [])
    .map((uid) => users.find((u) => u.uuid === uid))
    .filter(Boolean);

  const statusColorClass = {
    'done': 'grid-session-done',
    'active': 'grid-session-active',
    'pending_payment': 'grid-session-pending',
    'no_show': 'grid-session-noshow',
    'cancelled': 'grid-session-cancelled'
  }[session.status] || 'grid-session-active';

  return (
    <div
      className={`grid-session-card ${statusColorClass}`}
      onClick={() => onEdit(session)}
      style={{ cursor: 'pointer' }}
    >
      <span className="grid-session-time">{time}</span>
      <span className="grid-session-spoc">{session.spoc}</span>
      <span className="grid-session-players">👥 {session.numberOfPlayers} jogadores</span>
      {monitors.length > 0 && (
        <div className="grid-monitors-mini">
          {monitors.map((m) => {
            const displayName = m.nickname || `${m.firstName[0]}${m.lastName[0]}`.toUpperCase();
            const color = getUserColor(m.uuid);
            return (
              <div
                key={m.uuid}
                className="grid-monitor-dot"
                style={{ backgroundColor: color }}
                title={`${m.firstName} ${m.lastName}`}
              >
                {displayName}
              </div>
            );
          })}
        </div>
      )}
      {!hideStatus && (
        <span className={`badge ${getStatusBadgeClass(session.status)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>
          {getStatusLabel(session.status)}
        </span>
      )}
    </div>
  );
};

const GridView = ({ sessions, users, view, currentDate, onEdit, onDateChange }) => {
  if (view === 'day') {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const daySessions = sessions
      .filter((s) => {
        const sd = toDate(s);
        return sd >= dayStart && sd < dayEnd;
      })
      .sort((a, b) => toDate(a).getTime() - toDate(b).getTime());

    let startHour = 8;
    let endHour = 20;

    if (daySessions.length > 0) {
      const firstSessionHour = toDate(daySessions[0]).getHours();
      const lastSessionHour = toDate(daySessions[daySessions.length - 1]).getHours();
      startHour = Math.max(0, firstSessionHour - 1);
      endHour = Math.min(24, lastSessionHour + 3);
    }

    const timeSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      timeSlots.push({ hour, minute: 0 });
      timeSlots.push({ hour, minute: 30 });
    }

    const ROW_HEIGHT = 30; // px — must match grid-auto-rows in CSS
    const SESSION_SLOTS = 4; // 2 hours = 4 × 30-min slots

    // Map each session to its start slot index
    const sessionsWithSlot = daySessions
      .map((session) => {
        const sd = toDate(session);
        const startSlotIdx = timeSlots.findIndex(
          (slot) => slot.hour === sd.getHours() && slot.minute === sd.getMinutes()
        );
        return { session, startSlotIdx };
      })
      .filter((s) => s.startSlotIdx !== -1);

    // Greedy column assignment: assign each session the lowest column not
    // occupied by any overlapping session (sessions last SESSION_SLOTS rows)
    const columnAssignment = {};
    const columnFreeAt = []; // columnFreeAt[col] = first slot index where col is free again

    sessionsWithSlot.forEach(({ session, startSlotIdx }) => {
      let col = 0;
      while (col < 10 && columnFreeAt[col] !== undefined && columnFreeAt[col] > startSlotIdx) {
        col++;
      }
      columnAssignment[session.id] = col;
      columnFreeAt[col] = startSlotIdx + SESSION_SLOTS;
    });

    // Group sessions into conflict clusters via union-find so every session in
    // a chain (A overlaps B, B overlaps C) shares the same total column count.
    const parent = {};
    sessionsWithSlot.forEach(({ session }) => { parent[session.id] = session.id; });
    const find = (id) => {
      if (parent[id] !== id) parent[id] = find(parent[id]);
      return parent[id];
    };
    sessionsWithSlot.forEach(({ session: s1, startSlotIdx: st1 }, i) => {
      const end1 = st1 + SESSION_SLOTS;
      sessionsWithSlot.slice(i + 1).forEach(({ session: s2, startSlotIdx: st2 }) => {
        if (st1 < st2 + SESSION_SLOTS && end1 > st2) {
          parent[find(s1.id)] = find(s2.id);
        }
      });
    });
    const clusterMaxCol = {};
    sessionsWithSlot.forEach(({ session }) => {
      const root = find(session.id);
      clusterMaxCol[root] = Math.max(clusterMaxCol[root] ?? 0, columnAssignment[session.id]);
    });
    const totalColumnsFor = {};
    sessionsWithSlot.forEach(({ session }) => {
      totalColumnsFor[session.id] = Math.min(clusterMaxCol[find(session.id)] + 1, 10);
    });

    return (
      <div className="grid-view grid-view-day">
        <div className="grid-header">
          <button onClick={() => onDateChange(new Date(currentDate.getTime() - 86400000))}>← Anterior</button>
          <h3>{currentDate.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
          <button onClick={() => onDateChange(new Date(currentDate.getTime() + 86400000))}>Próximo →</button>
        </div>
        {daySessions.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhuma sessão neste dia
          </div>
        ) : (
          <div className="grid-timeline-30min">
            {timeSlots.map((slot, idx) => (
              <div key={idx} className="grid-slot-label" style={{ gridRow: `${idx + 1} / span 1` }}>
                {slot.hour.toString().padStart(2, '0')}:{slot.minute.toString().padStart(2, '0')}
              </div>
            ))}
            <div
              className="grid-sessions-container"
              style={{
                gridColumn: 2,
                gridRow: `1 / span ${timeSlots.length + SESSION_SLOTS}`,
                position: 'relative',
                height: timeSlots.length * ROW_HEIGHT,
              }}
            >
              {sessionsWithSlot.map(({ session, startSlotIdx }) => {
                const col = columnAssignment[session.id];
                const totalCols = totalColumnsFor[session.id];
                return (
                  <div
                    key={session.id}
                    className="grid-session-card-wrapper"
                    style={{
                      position: 'absolute',
                      top: startSlotIdx * ROW_HEIGHT,
                      height: SESSION_SLOTS * ROW_HEIGHT,
                      left: `${(col / totalCols) * 100}%`,
                      width: `${(1 / totalCols) * 100}%`,
                      padding: '0 2px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <GridSessionCard session={session} users={users} onEdit={onEdit} hideStatus />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'week') {
    const weekStart = new Date(currentDate);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="grid-view grid-view-week">
        <div className="grid-header">
          <button onClick={() => onDateChange(new Date(currentDate.getTime() - 604800000))}>← Semana Anterior</button>
          <h3>
            {weekStart.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })} –{' '}
            {new Date(weekEnd.getTime() - 86400000).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
          </h3>
          <button onClick={() => onDateChange(new Date(currentDate.getTime() + 604800000))}>Próxima Semana →</button>
        </div>
        <div className="grid-week-header-row">
          {days.map((day, idx) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={idx} className={`grid-week-day-label ${isToday ? 'grid-week-day-today' : ''}`}>
                <span className="grid-week-weekday">{day.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '')}</span>
                <span className="grid-week-daynum">{day.getDate()}</span>
              </div>
            );
          })}
        </div>
        <div className="grid-week">
          {days.map((day, idx) => {
            const dayEnd = new Date(day);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const daySessions = sessions
              .filter((s) => {
                const sd = toDate(s);
                return sd >= day && sd < dayEnd;
              })
              .sort((a, b) => toDate(a).getTime() - toDate(b).getTime());

            return (
              <div key={idx} className="grid-day-column">
                <div className="grid-day-sessions">
                  {daySessions.map((s) => (
                    <GridSessionCard key={s.id} session={s} users={users} onEdit={onEdit} hideStatus />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

};

const SessionDetailModal = ({ session, users, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    spoc: session.spoc || '',
    numberOfPlayers: session.numberOfPlayers || '',
    sessionDate: session.sessionDate || '',
    sessionTime: session.sessionTime || '',
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
        sessionTime: formData.sessionTime,
        sessionDatetime: `${formData.sessionDate}T${formData.sessionTime}`,
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sessionDate">Data</label>
              <input
                id="sessionDate"
                name="sessionDate"
                type="date"
                value={formData.sessionDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="sessionTime">Hora</label>
              <select
                id="sessionTime"
                name="sessionTime"
                value={formData.sessionTime}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">-- Selecionar hora --</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
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
              Voltar
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
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [monitorSearch, setMonitorSearch] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

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
        sessionDate: form.sessionDay,
        sessionTime: form.sessionTime,
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Sessões</h1>
        <p>Gestão de sessões e reservas do parque.</p>
      </div>

      <div className="sessions-toolbar">
        <GridLegend />
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
      ) : (
        <GridView
          sessions={sessions}
          users={users}
          view={view}
          currentDate={currentDate}
          onEdit={setSelectedSession}
          onDateChange={setCurrentDate}
        />
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sessionDay">Data</label>
                  <input
                    id="sessionDay"
                    name="sessionDay"
                    type="date"
                    value={form.sessionDay}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sessionTime">Hora</label>
                  <select
                    id="sessionTime"
                    name="sessionTime"
                    value={form.sessionTime}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">-- Selecionar hora --</option>
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
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
                  Voltar
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
