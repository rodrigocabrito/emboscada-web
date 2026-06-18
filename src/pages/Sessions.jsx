import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { addSession, getSessions, getUsers } from '../firebase/firestore';
import { getUserColor } from '../utils/avatarColors';
import useEscapeKey from '../hooks/useEscapeKey';
import useScrollLock from '../hooks/useScrollLock';

const VIEWS = [
  { key: 'day', label: 'Dia' },
  { key: 'week', label: 'Semana' },
];

const SESSION_TYPES = ['Paintball', 'Paintball Kids', 'Laser Tag', 'Laser Tag Kids', 'Gel Blast', 'Bubble Football'];

const EMPTY_FORM = {
  spocName: '',
  spocEmail: '',
  spocPhoneNumber: '',
  expectedNumberOfPlayers: '',
  sessionDay: '',
  sessionTime: '',
  typeOfSession: '',
  caliber: '',
  additionalComments: '',
};

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => [
  `${String(i).padStart(2, '0')}:00`,
  `${String(i).padStart(2, '0')}:30`,
]).flat().filter((t) => t >= '06:00' && t <= '23:30');

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
      return 'badge-default';
    case 'no_show':
      return 'badge-danger';
    case 'pending_payment':
      return 'badge-pending';
    case 'done':
      return 'badge-success';
    case 'active':
      return 'badge-active';
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

const GridSessionCard = ({ session, users, onEdit, hideStatus = false, hideSpoc = false }) => {
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
      {!hideSpoc && <span className="grid-session-spoc">{session.spocName || session.spoc || ''}</span>}
      <span className="grid-session-players">👥 {session.expectedNumberOfPlayers ?? session.numberOfPlayers} jogadores</span>
      {session.typeOfSession && (() => {
        const typeIcons = {
          'Paintball': '/paintball.png',
          'Laser Tag': '/laser-tag-icon.png',
          'Gel Blast': '/gel-blast.png',
          'Bubble Football': '/bubble-football.png',
        };
        const icon = typeIcons[session.typeOfSession];
        return (
          <span className="grid-session-type">
            {icon && <img src={icon} alt="" aria-hidden="true" style={{ width: '12px', height: '12px', objectFit: 'contain', verticalAlign: 'middle' }} />}
            {' '}{session.typeOfSession}
          </span>
        );
      })()}
      {session.caliber && <span className="grid-session-caliber"><img src="/caliber.png" alt="" aria-hidden="true" style={{ width: '12px', height: '12px', objectFit: 'contain', verticalAlign: 'middle' }} /> {session.caliber}</span>}
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

const GridView = ({ sessions, users, view, currentDate, onEdit, onDateChange, hideCancelled }) => {

  if (view === 'day') {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const daySessions = sessions
      .filter((s) => {
        const sd = toDate(s);
        return sd >= dayStart && sd < dayEnd && !(hideCancelled && s.status === 'cancelled');
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

    const ROW_HEIGHT = 35; // px — must match grid-auto-rows in CSS
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = currentDate.toDateString() === today.toDateString();

    return (
      <div className="grid-view grid-view-day">
        <div className="grid-header" style={{ flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button style={{ visibility: isToday ? 'hidden' : 'visible' }} onClick={() => onDateChange(today)}>
              Hoje
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
            <button onClick={() => onDateChange(new Date(currentDate.getTime() - 86400000))}>← Anterior</button>
            <h3 style={{ margin: 0 }}>{currentDate.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => onDateChange(new Date(currentDate.getTime() + 86400000))}>Próximo →</button>
          </div>
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
                      width: `${Math.min(70, (1 / totalCols) * 100)}%`,
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

    const todayWeekStart = new Date();
    const todayDay = todayWeekStart.getDay();
    const todayDiff = todayWeekStart.getDate() - todayDay + (todayDay === 0 ? -6 : 1);
    todayWeekStart.setDate(todayDiff);
    todayWeekStart.setHours(0, 0, 0, 0);
    const isCurrentWeek = weekStart.toDateString() === todayWeekStart.toDateString();

    return (
      <div className="grid-view grid-view-week">
        <div className="grid-header" style={{ flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button style={{ visibility: isCurrentWeek ? 'hidden' : 'visible' }} onClick={() => onDateChange(new Date())}>
              Esta Semana
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
            <button onClick={() => onDateChange(new Date(currentDate.getTime() - 604800000))}>← Semana Anterior</button>
            <h3 style={{ margin: 0 }}>
              {weekStart.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })} –{' '}
              {new Date(weekEnd.getTime() - 86400000).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
            </h3>
            <button onClick={() => onDateChange(new Date(currentDate.getTime() + 604800000))}>Próxima Semana →</button>
          </div>
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
                return sd >= day && sd < dayEnd && !(hideCancelled && s.status === 'cancelled');
              })
              .sort((a, b) => toDate(a).getTime() - toDate(b).getTime());

            return (
              <div key={idx} className="grid-day-column">
                <div className="grid-day-sessions">
                  {daySessions.map((s) => (
                    <GridSessionCard key={s.id} session={s} users={users} onEdit={onEdit} hideStatus hideSpoc />
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

const SessionViewModal = ({ session, users, onClose, onEdit }) => {
  useEscapeKey(onClose);

  const monitors = (session.monitors || [])
    .map((uid) => users.find((u) => u.uuid === uid))
    .filter(Boolean);

  const dateFormatted = session.sessionDate
    ? new Date(session.sessionDate + 'T00:00').toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Sessão</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="session-view-body">
          <div className="session-view-row">
            <span className="session-view-label">Responsável</span>
            <span className="session-view-value">{session.spocName || session.spoc || '—'}</span>
          </div>
          <div className="session-view-row">
            <span className="session-view-label">Nº de Jogadores</span>
            <span className="session-view-value">{session.expectedNumberOfPlayers ?? session.numberOfPlayers ?? '—'}</span>
          </div>
          <div className="session-view-row">
            <span className="session-view-label">Data</span>
            <span className="session-view-value" style={{ textTransform: 'capitalize' }}>{dateFormatted}</span>
          </div>
          <div className="session-view-row">
            <span className="session-view-label">Hora</span>
            <span className="session-view-value">{session.sessionTime || '—'}</span>
          </div>
          {session.spocEmail && (
            <div className="session-view-row">
              <span className="session-view-label">Email</span>
              <span className="session-view-value">{session.spocEmail}</span>
            </div>
          )}
          {session.spocPhoneNumber && (
            <div className="session-view-row">
              <span className="session-view-label">Telemóvel</span>
              <span className="session-view-value">{session.spocPhoneNumber}</span>
            </div>
          )}
          {session.typeOfSession && (
            <div className="session-view-row">
              <span className="session-view-label">Tipo de Sessão</span>
              <span className="session-view-value">{session.typeOfSession}</span>
            </div>
          )}
          {session.caliber && (
            <div className="session-view-row">
              <span className="session-view-label">Calibre</span>
              <span className="session-view-value">{session.caliber}</span>
            </div>
          )}
          <div className="session-view-row">
            <span className="session-view-label">Estado</span>
            <span className={`badge ${getStatusBadgeClass(session.status)}`} style={{ fontSize: '0.78rem' }}>
              {getStatusLabel(session.status)}
            </span>
          </div>
          {monitors.length > 0 && (
            <div className="session-view-row">
              <span className="session-view-label">Monitor(es)</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {monitors.map((m) => {
                  const color = getUserColor(m.uuid);
                  return (
                    <span key={m.uuid} className="grid-monitor-dot" style={{ backgroundColor: color }}>
                      {m.nickname || `${m.firstName} ${m.lastName}`}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {session.additionalComments && (
            <div className="session-view-row session-view-comments">
              <span className="session-view-label">Comentários</span>
              <span className="session-view-value">{session.additionalComments}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={() => onEdit(session.id)}>
            Editar
          </button>
        </div>
      </div>
    </div>
  );
};

const Sessions = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [currentDate, setCurrentDate] = useState(() => {
    const ret = location.state?.returnDate;
    if (ret) { const [y, m, d] = ret.split('-'); return new Date(+y, +m - 1, +d); }
    return new Date();
  });
  const [hideCancelled, setHideCancelled] = useState(false);

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
  useEscapeKey(closeModal, modalOpen);
  useScrollLock(modalOpen);
  useScrollLock(!!selectedSession);

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
        spocName: form.spocName,
        spocEmail: form.spocEmail,
        spocPhoneNumber: form.spocPhoneNumber,
        expectedNumberOfPlayers: parseInt(form.expectedNumberOfPlayers, 10),
        sessionDate: form.sessionDay,
        sessionTime: form.sessionTime,
        typeOfSession: form.typeOfSession,
        caliber: form.typeOfSession === 'Paintball' ? form.caliber : '',
        additionalComments: form.additionalComments,
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

  return (
    <div className="page page-sessions">
      <div className="page-header">
        <h1>Sessões</h1>
        <p>Gestão de sessões e reservas do parque.</p>
      </div>

      <div className="sessions-toolbar">
        <GridLegend />
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn-primary"
            onClick={() => setHideCancelled((prev) => !prev)}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', marginTop: 0, width: 'fit-content', opacity: hideCancelled ? 1 : 0.6, visibility: (view === 'day' || view === 'week') ? 'visible' : 'hidden' }}
          >
            {hideCancelled ? '✓ Canceladas ocultas' : 'Ocultar Canceladas'}
          </button>
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
          hideCancelled={hideCancelled}
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
                  <label htmlFor="spocName">Responsável (Cliente)</label>
                  <input
                    id="spocName"
                    name="spocName"
                    type="text"
                    value={form.spocName}
                    onChange={handleChange}
                    placeholder="Nome do responsável"
                    autoFocus
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="expectedNumberOfPlayers">Nº de Jogadores</label>
                  <input
                    id="expectedNumberOfPlayers"
                    name="expectedNumberOfPlayers"
                    type="number"
                    min="1"
                    value={form.expectedNumberOfPlayers}
                    onChange={handleChange}
                    placeholder="Ex: 10"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="spocEmail">Email</label>
                  <input
                    id="spocEmail"
                    name="spocEmail"
                    type="email"
                    value={form.spocEmail}
                    onChange={handleChange}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="spocPhoneNumber">Telemóvel</label>
                  <input
                    id="spocPhoneNumber"
                    name="spocPhoneNumber"
                    type="tel"
                    value={form.spocPhoneNumber}
                    onChange={handleChange}
                    placeholder="9XX XXX XXX"
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
                <label htmlFor="typeOfSession">Tipo de Sessão</label>
                <select
                  id="typeOfSession"
                  name="typeOfSession"
                  value={form.typeOfSession}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">-- Selecionar tipo --</option>
                  {SESSION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {form.typeOfSession === 'Paintball' && (
                <div className="form-group">
                  <label>Calibre</label>
                  <div className="caliber-toggle">
                    {['.50', '.68'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`caliber-btn${form.caliber === c ? ' active' : ''}`}
                        onClick={() => setForm((prev) => ({ ...prev, caliber: c }))}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
        <SessionViewModal
          session={selectedSession}
          users={users}
          onClose={() => setSelectedSession(null)}
          onEdit={(id) => navigate(`/sessions/${id}`)}
        />
      )}
    </div>
  );
};

export default Sessions;
