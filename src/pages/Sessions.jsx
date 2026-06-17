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

const groupSessions = (sessions, view) => {
  const groups = {};
  sessions.forEach((s) => {
    const d = toDate(s);
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
  const time = formatTime(session);

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
              const displayName = m.nickname || `${m.firstName} ${m.lastName}`;
              const color = getUserColor(m.uuid);
              return (
                <div
                  key={m.uuid}
                  className="monitor-avatar"
                  style={{ backgroundColor: color }}
                  title={`${m.firstName} ${m.lastName}`}
                >
                  {displayName}
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

const GridSessionCard = ({ session, users, onEdit }) => {
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
      <span className={`badge ${getStatusBadgeClass(session.status)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>
        {getStatusLabel(session.status)}
      </span>
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

    // Calculate display time slots (30-minute intervals) based on sessions
    let startHour = 8;
    let endHour = 18;

    if (daySessions.length > 0) {
      const firstSessionTime = toDate(daySessions[0]);
      const lastSessionTime = toDate(daySessions[daySessions.length - 1]);
      const firstSessionHour = firstSessionTime.getHours();
      const lastSessionHour = lastSessionTime.getHours();
      // Start 1 hour before first session, end 1 hour after last session (which lasts 2 hours)
      startHour = Math.max(0, firstSessionHour - 1);
      endHour = Math.min(24, lastSessionHour + 2 + 1);
    }

    // Create 30-minute time slots
    const timeSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      timeSlots.push({ hour, minute: 0 });
      timeSlots.push({ hour, minute: 30 });
    }

    const slotDuration = 2 * 60; // 2 hours in minutes

    // Find sessions that start at each slot and calculate overlaps
    const sessionsByStartSlot = {};
    timeSlots.forEach((slot, idx) => {
      sessionsByStartSlot[idx] = [];
    });

    daySessions.forEach((session) => {
      const sd = toDate(session);
      const sessionHour = sd.getHours();
      const sessionMinute = sd.getMinutes();

      // Find the slot this session starts in
      const startSlotIdx = timeSlots.findIndex(
        (slot) => slot.hour === sessionHour && slot.minute === sessionMinute
      );

      if (startSlotIdx !== -1) {
        sessionsByStartSlot[startSlotIdx].push(session);
      }
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
            {timeSlots.map((slot, idx) => {
              const sessionsStartingHere = sessionsByStartSlot[idx];
              const numOverlappingSessions = Math.min(sessionsStartingHere.length, 10);

              return (
                <div key={idx} className="grid-time-slot">
                  <div className="grid-slot-label" style={{ gridRow: `${idx + 1} / span 1` }}>
                    {slot.hour.toString().padStart(2, '0')}:{slot.minute.toString().padStart(2, '0')}
                  </div>
                  {sessionsStartingHere.length > 0 && (
                    <div
                      className="grid-session-row"
                      style={{ gridRow: `${idx + 1} / span 4`, '--overlap-count': numOverlappingSessions }}
                    >
                      {sessionsStartingHere.slice(0, 10).map((session, colIdx) => (
                        <div
                          key={session.id}
                          className="grid-session-card-wrapper"
                          style={{ '--column-index': colIdx, '--total-columns': numOverlappingSessions }}
                        >
                          <GridSessionCard session={session} users={users} onEdit={onEdit} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
                <div className="grid-day-header">
                  {day.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric' })}
                </div>
                <div className="grid-day-sessions">
                  {daySessions.map((s) => (
                    <GridSessionCard key={s.id} session={s} users={users} onEdit={onEdit} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === 'month') {
    const monthStart = new Date(currentDate);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const firstDayOfWeek = monthStart.getDay();
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));

    const days = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="grid-view grid-view-month">
        <div className="grid-header">
          <button onClick={() => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>← Mês Anterior</button>
          <h3>{currentDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}</h3>
          <button onClick={() => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>Próximo Mês →</button>
        </div>
        <div className="grid-weekdays">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((d) => (
            <div key={d} className="grid-weekday-label">{d}</div>
          ))}
        </div>
        <div className="grid-month">
          {days.map((day, idx) => {
            const dayEnd = new Date(day);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const daySessions = sessions
              .filter((s) => {
                const sd = toDate(s);
                return sd >= day && sd < dayEnd;
              })
              .sort((a, b) => toDate(a).getTime() - toDate(b).getTime());

            const isCurrentMonth = day.getMonth() === monthStart.getMonth();

            return (
              <div key={idx} className={`grid-month-day ${!isCurrentMonth ? 'other-month' : ''}`}>
                <div className="grid-month-day-header">{day.getDate()}</div>
                <div className="grid-month-day-sessions">
                  {daySessions.slice(0, 3).map((s) => (
                    <div key={s.id} className="grid-month-session" onClick={() => onEdit(s)}>
                      <span className="grid-month-time">{formatTime(s)}</span>
                      <span className="grid-month-spoc">{s.spoc.substring(0, 8)}</span>
                    </div>
                  ))}
                  {daySessions.length > 3 && (
                    <div className="grid-month-more">+{daySessions.length - 3}</div>
                  )}
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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
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

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filteredSessions = useMemo(() => {
    const filtered = sessions.filter((s) => {
      const sessionDate = toDate(s);
      const isPast = sessionDate < now;
      const pastFilter = showPast || !isPast;
      const statusFilterMatch = statusFilter ? s.status === statusFilter : true;
      return pastFilter && statusFilterMatch;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dateA = toDate(a).getTime();
      const dateB = toDate(b).getTime();
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
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              Lista
            </button>
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              Calendário
            </button>
          </div>
          {viewMode === 'grid' && (
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
          )}
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
      ) : viewMode === 'grid' ? (
        <GridView
          sessions={filteredSessions}
          users={users}
          view={view}
          currentDate={currentDate}
          onEdit={setSelectedSession}
          onDateChange={setCurrentDate}
        />
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
