import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getUpcomingSessions, getUsers } from '../firebase/firestore';
import { getUserColor } from '../utils/avatarColors';
import { TYPE_BADGE, CALIBER_TYPES } from '../constants/sessions';

// Day (YYYY-MM-DD) of a session — falls back to sessionDatetime when sessionDate is missing
const dateOf = (s) => {
  if (s.sessionDate) return s.sessionDate;
  if (s.sessionDatetime) return String(s.sessionDatetime).slice(0, 10);
  return null;
};

// Full datetime (YYYY-MM-DDTHH:MM) of a session, for chronological comparison against now
const datetimeOf = (s) => {
  if (s.sessionDatetime) return String(s.sessionDatetime);
  const d = dateOf(s);
  return d ? `${d}T${s.sessionTime ?? '00:00'}` : null;
};

// Current local time as YYYY-MM-DDTHH:MM
const nowStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const daysUntil = (dateStr) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d - today) / 86400000);
};

const relLabel = (n) => (n <= 0 ? 'Hoje' : n === 1 ? 'Amanhã' : `Em ${n} dias`);

const fmtDayLabel = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
    <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
      {label}
    </span>
    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {children}
    </span>
  </div>
);

const monitorName = (u) => u.nickname || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();

const SessionRow = ({ session, usersById, highlight, onClick }) => {
  const badge = TYPE_BADGE[session.typeOfSession] ?? { bg: '#f3f4f6', color: '#6b7280' };
  const players = session.actualNumberOfPlayers || session.expectedNumberOfPlayers || session.numberOfPlayers;
  const hasCaliber = CALIBER_TYPES.includes(session.typeOfSession) && session.caliber;
  const monitors = (session.monitors ?? [])
    .map((uid) => usersById[uid])
    .filter(Boolean);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '3.4rem 1fr 12rem 6rem 8.5rem 4.5rem 11rem 1rem',
        alignItems: 'center', gap: '1.25rem', width: '100%', textAlign: 'left',
        padding: highlight ? '0.9rem 1.1rem' : '0.75rem 1rem',
        background: 'var(--surface)',
        border: `1.5px solid ${highlight ? 'var(--green-500, #22c55e)' : 'var(--border)'}`,
        borderRadius: '0.6rem', cursor: 'pointer', fontFamily: 'var(--font-body)',
      }}
    >
      <span style={{ fontSize: highlight ? '1.4rem' : '1.15rem', fontWeight: 800, lineHeight: 1, color: 'var(--text)', justifySelf: 'center' }}>
        {session.sessionTime}
      </span>

      <span />

      <Field label="Cliente">{session.spocName || session.spoc || '—'}</Field>

      <Field label="Jogadores">👥 {players || '—'}</Field>

      <Field label="Tipo">
        {session.typeOfSession ? (
          <span style={{ background: badge.bg, color: badge.color, borderRadius: '0.4rem', padding: '0.15rem 0.55rem', fontSize: '0.75rem', fontWeight: 700 }}>
            {session.typeOfSession}
          </span>
        ) : '—'}
      </Field>

      <Field label="Calibre">{hasCaliber ? session.caliber : '—'}</Field>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          {monitors.length > 1 ? 'Monitores' : 'Monitor'}
        </span>
        {monitors.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {monitors.map((m) => (
              <span key={m.uuid} className="grid-monitor-dot" style={{ backgroundColor: getUserColor(m.uuid) }} title={`${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()}>
                {monitorName(m)}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>—</span>
        )}
      </div>

      <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem', justifySelf: 'end' }}>›</span>
    </button>
  );
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  // Bounded query: only sessions from today onward, shared via the query cache
  const { data: allSessions = [], isLoading: loading } = useQuery({
    queryKey: ['upcomingSessions'],
    queryFn: getUpcomingSessions,
    staleTime: 60_000,
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 5 * 60_000,
  });
  const usersById = useMemo(() => Object.fromEntries(users.map((u) => [u.uuid, u])), [users]);

  // My upcoming assigned sessions, sorted chronologically
  const myUpcoming = useMemo(() => {
    const now = nowStr();
    return allSessions
      .filter((s) => {
        const dt = datetimeOf(s);
        return s.monitors?.includes(user.uid) && dt && dt >= now && (s.status === 'active' || s.status === 'pending_payment');
      })
      .sort((a, b) => {
        const da = a.sessionDatetime ?? `${dateOf(a)}T${a.sessionTime ?? ''}`;
        const db = b.sessionDatetime ?? `${dateOf(b)}T${b.sessionTime ?? ''}`;
        return da.localeCompare(db);
      });
  }, [allSessions, user.uid]);

  const nextDate = myUpcoming[0] ? dateOf(myUpcoming[0]) : null;
  const highlightSessions = nextDate ? myUpcoming.filter((s) => dateOf(s) === nextDate) : [];

  // Group the sessions after the highlighted day by day
  const laterGroups = useMemo(() => {
    const map = new Map();
    for (const s of myUpcoming) {
      const d = dateOf(s);
      if (d === nextDate) continue;
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(s);
    }
    return [...map.entries()];
  }, [myUpcoming, nextDate]);

  const goToSession = (id) => navigate(`/sessions/${id}`, { state: { from: '/home' } });

  return (
    <div className="page">
      <div className="welcome-banner">
        <h1>Olá, {profile?.firstName}! 👋</h1>
        <p>Aqui tens as tuas próximas sessões.</p>
      </div>

      {/* My upcoming sessions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="section-title" style={{ marginBottom: '1rem' }}>As minhas próximas sessões</h2>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>A carregar…</div>
        ) : myUpcoming.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 1rem' }}>
            Não tens sessões atribuídas nos próximos dias.
          </div>
        ) : (
          <>
            {/* Highlighted next day */}
            <div
              className="card"
              style={{
                borderColor: 'var(--green-500, #22c55e)', borderWidth: '2px',
                boxShadow: '0 4px 20px rgba(34,197,94,0.12)', marginBottom: laterGroups.length ? '1.5rem' : 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--green-700, #15803d)', background: 'var(--green-100, #dcfce7)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                    {relLabel(daysUntil(nextDate))}
                  </span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, textTransform: 'capitalize' }}>{fmtDayLabel(nextDate)}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {highlightSessions.length} {highlightSessions.length === 1 ? 'sessão' : 'sessões'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {highlightSessions.map((s) => (
                  <SessionRow key={s.id} session={s} usersById={usersById} highlight onClick={() => goToSession(s.id)} />
                ))}
              </div>
            </div>

            {/* Later days */}
            {laterGroups.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {laterGroups.map(([date, list]) => (
                  <div key={date}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'capitalize' }}>{fmtDayLabel(date)}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>· {relLabel(daysUntil(date))}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {list.map((s) => (
                        <SessionRow key={s.id} session={s} usersById={usersById} onClick={() => goToSession(s.id)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
