import { getUserColor } from '../../../utils/avatarColors';
import { getStatusLabel, getStatusBadgeClass } from '../../../constants/sessions';

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

// Colors live in global.css (.grid-legend-*--{key}) so they can adapt to dark mode
const STATUS_LEGEND = [
  { key: 'done',      label: 'Feita' },
  { key: 'active',    label: 'Ativa' },
  { key: 'pending',   label: 'Pendente' },
  { key: 'noshow',    label: 'Não compareceu' },
  { key: 'cancelled', label: 'Cancelada' },
];

export const GridLegend = () => (
  <div className="grid-legend">
    {STATUS_LEGEND.map(({ key, label }) => (
      <div key={key} className="grid-legend-item">
        <span className={`grid-legend-dot grid-legend-dot--${key}`} />
        <span className={`grid-legend-label grid-legend-label--${key}`}>{label}</span>
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
            <button aria-label="Dia anterior" onClick={() => onDateChange(new Date(currentDate.getTime() - 86400000))}>←<span className="grid-nav-label"> Anterior</span></button>
            <h3 style={{ margin: 0 }}>{currentDate.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            <button aria-label="Dia seguinte" onClick={() => onDateChange(new Date(currentDate.getTime() + 86400000))}><span className="grid-nav-label">Próximo </span>→</button>
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
                      width: `${Math.min(35, (1 / totalCols) * 100)}%`,
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
            <button aria-label="Semana anterior" onClick={() => onDateChange(new Date(currentDate.getTime() - 604800000))}>←<span className="grid-nav-label"> Semana Anterior</span></button>
            <h3 style={{ margin: 0 }}>
              {weekStart.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })} –{' '}
              {new Date(weekEnd.getTime() - 86400000).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
            </h3>
            <button aria-label="Próxima semana" onClick={() => onDateChange(new Date(currentDate.getTime() + 604800000))}><span className="grid-nav-label">Próxima Semana </span>→</button>
          </div>
        </div>
        <div className="grid-week">
          {days.map((day, idx) => {
            const dayEnd = new Date(day);
            dayEnd.setDate(dayEnd.getDate() + 1);
            const isToday = day.toDateString() === new Date().toDateString();

            const daySessions = sessions
              .filter((s) => {
                const sd = toDate(s);
                return sd >= day && sd < dayEnd && !(hideCancelled && s.status === 'cancelled');
              })
              .sort((a, b) => toDate(a).getTime() - toDate(b).getTime());

            return (
              <div key={idx} className="grid-day-column">
                {/* Label lives inside the column so days and headers can never
                    misalign, and mobile can stack the days as an agenda list */}
                <div className={`grid-week-day-label ${isToday ? 'grid-week-day-today' : ''}`}>
                  <span className="grid-week-weekday">{day.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '')}</span>
                  <span className="grid-week-daynum">{day.getDate()}</span>
                </div>
                <div className="grid-day-sessions">
                  {daySessions.map((s) => (
                    <GridSessionCard key={s.id} session={s} users={users} onEdit={onEdit} hideStatus hideSpoc />
                  ))}
                  {daySessions.length === 0 && <span className="grid-day-empty">Sem sessões</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

};

export default GridView;
