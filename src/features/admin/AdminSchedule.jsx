import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSessionsAll, getAvailabilityForDate, getUsers, updateSession } from '../../firebase/firestore';
import { getUserColor } from '../../utils/avatarColors';
import { isAssignableMonitor } from '../../utils/roles';
import { TYPE_BADGE } from '../../constants/sessions';
import { monitorAvail, monitorWarnings } from '../../utils/scheduleRules';
import useEscapeKey from '../../hooks/useEscapeKey';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const pad2 = (n) => String(n).padStart(2, '0');
const toDateStr = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const initialsOf = (u) => `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
const fullName = (u) => `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();

const AVAIL_COLOR = {
  full: { bg: '#dcfce7', color: '#166534', dot: '#16a34a' },
  part: { bg: '#fef3c7', color: '#92400e', dot: '#d97706' },
  unavailable: { bg: '#fee2e2', color: '#991b1b', dot: '#dc2626' },
  none: { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' },
};

const Avatar = ({ user, size = 28 }) => (
  <span
    style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: getUserColor(user.uuid), color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, letterSpacing: '0.02em',
    }}
  >
    {initialsOf(user)}
  </span>
);

const AvailPill = ({ avail }) => {
  const c = AVAIL_COLOR[avail.status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      background: c.bg, color: c.color, borderRadius: '999px',
      padding: '0.15rem 0.55rem', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
      {avail.window ? `${avail.label} · ${avail.window}` : avail.label}
    </span>
  );
};

const RosterGroup = ({ label, items, status }) => {
  if (items.length === 0) return null;
  const c = AVAIL_COLOR[status];
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
          {label} · {items.length}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {items.map(({ user, avail, count }) => (
          <div key={user.uuid} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Avatar user={user} size={26} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.nickname || fullName(user)}
              </div>
              {avail.window && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{avail.window}</div>
              )}
            </div>
            {count > 0 && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                {count}×
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Monitor assignment picker ────────────────────────────────────────────────
const AssignPicker = ({ session, monitors, availByUser, assignCounts, daySessions, onCommit, onClose }) => {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState(() => session.monitors ?? []);
  const [saving, setSaving] = useState(false);
  useEscapeKey(onClose);

  const toggleDraft = (uid) =>
    setDraft((cur) => (cur.includes(uid) ? cur.filter((m) => m !== uid) : [...cur, uid]));

  const handleDone = async () => {
    setSaving(true);
    try {
      await onCommit(session, draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const rows = useMemo(() => {
    const assigned = draft;
    const q = search.trim().toLowerCase();
    return monitors
      .filter((u) => {
        if (!q) return true;
        return fullName(u).toLowerCase().includes(q) || (u.nickname ?? '').toLowerCase().includes(q);
      })
      .map((u) => {
        const avail = monitorAvail(u.uuid, availByUser);
        const warnings = monitorWarnings(avail, session, u.uuid, daySessions);
        let rank;
        if (avail.status === 'unavailable') rank = 3;
        else if (warnings.length) rank = 2;
        else if (avail.status === 'none') rank = 1;
        else rank = 0;
        return { user: u, avail, warnings, rank, isAssigned: assigned.includes(u.uuid), count: assignCounts[u.uuid] ?? 0 };
      })
      .sort((a, b) => {
        // assigned first, then by warning rank, then by current load, then name
        if (a.isAssigned !== b.isAssigned) return a.isAssigned ? -1 : 1;
        if (a.rank !== b.rank) return a.rank - b.rank;
        if (a.count !== b.count) return a.count - b.count;
        return fullName(a.user).localeCompare(fullName(b.user));
      });
  }, [monitors, availByUser, assignCounts, daySessions, search, session, draft]);

  const badge = TYPE_BADGE[session.typeOfSession] ?? { bg: '#f3f4f6', color: '#6b7280' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Atribuir monitores</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{session.sessionTime}</span>
          {session.typeOfSession && (
            <span style={{ background: badge.bg, color: badge.color, borderRadius: '0.4rem', padding: '0.15rem 0.55rem', fontSize: '0.75rem', fontWeight: 600 }}>
              {session.typeOfSession}
            </span>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{session.spocName}</span>
        </div>

        <input
          type="search"
          className="input-field"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar..."
          style={{ marginBottom: '0.5rem' }}
        />

        <div style={{ maxHeight: '46vh', overflowY: 'auto', margin: '0 -0.25rem' }}>
          {rows.map(({ user, avail, warnings, isAssigned, count }) => {
            return (
              <div
                key={user.uuid}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.7rem',
                  padding: '0.55rem 0.5rem', borderRadius: '0.5rem',
                  background: isAssigned ? 'var(--green-100, #dcfce7)' : 'transparent',
                }}
              >
                <Avatar user={user} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.nickname || fullName(user)}{user.nickname ? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({fullName(user)})</span> : null}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                    <AvailPill avail={avail} />
                    {count > 0 && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {count} {count === 1 ? 'sessão' : 'sessões'}
                      </span>
                    )}
                  </div>
                  {warnings.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.25rem' }}>
                      {warnings.map((w, i) => (
                        <span key={i} style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 600, lineHeight: 1.25 }}>
                          ⚠ {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => toggleDraft(user.uuid)}
                  className={isAssigned ? 'btn-secondary' : 'btn-primary'}
                  style={{ marginTop: 0, width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  {isAssigned ? 'Remover' : 'Adicionar'}
                </button>
              </div>
            );
          })}
          {rows.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.5rem' }}>
              Sem monitores.
            </p>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving} style={{ marginTop: 0 }}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={handleDone} disabled={saving} style={{ marginTop: 0 }}>
            {saving ? 'A guardar…' : 'Concluído'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Session card ─────────────────────────────────────────────────────────────
const SessionCard = ({ session, usersById, availByUser, daySessions, busy, onOpenPicker, onRemove }) => {
  const badge = TYPE_BADGE[session.typeOfSession] ?? { bg: '#f3f4f6', color: '#6b7280' };
  const assigned = session.monitors ?? [];

  return (
    <div className="card" style={{ padding: '1rem 1.1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>{session.sessionTime}</span>
          {session.typeOfSession && (
            <span style={{ background: badge.bg, color: badge.color, borderRadius: '0.4rem', padding: '0.2rem 0.6rem', fontSize: '0.78rem', fontWeight: 600 }}>
              {session.typeOfSession}
            </span>
          )}
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            👥 {session.expectedNumberOfPlayers || session.actualNumberOfPlayers || session.numberOfPlayers || '—'}
          </span>
        </div>
      </div>

      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
        {session.spocName || session.spoc || '—'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
        {assigned.map((uid) => {
          const u = usersById[uid];
          if (!u) return null;
          const avail = monitorAvail(uid, availByUser);
          const warnings = monitorWarnings(avail, session, uid, daySessions);
          const warn = warnings.length > 0;
          return (
            <span
              key={uid}
              title={warn ? warnings.join('\n') : avail.window ? `${avail.label} · ${avail.window}` : avail.label}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'var(--surface)', border: `1.5px solid ${warn ? '#f59e0b' : 'var(--border)'}`,
                borderRadius: '999px', padding: '0.2rem 0.5rem 0.2rem 0.2rem',
              }}
            >
              <Avatar user={u} size={22} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{u.nickname || `${u.firstName} ${u.lastName?.[0] ? u.lastName[0] + '.' : ''}`.trim()}</span>
              {warn && <span style={{ fontSize: '0.72rem' }}>⚠</span>}
              <button
                type="button"
                disabled={busy}
                onClick={() => onRemove(session, uid)}
                aria-label="Remover monitor"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0 0.15rem', lineHeight: 1 }}
              >
                ✕
              </button>
            </span>
          );
        })}
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={() => onOpenPicker(session)}
          style={{ marginTop: 0, width: 'auto', padding: '0.3rem 0.7rem', fontSize: '0.8rem', borderRadius: '999px' }}
        >
          + Monitor
        </button>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const AdminSchedule = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [pickerSession, setPickerSession] = useState(null);
  const [busy, setBusy] = useState(false);

  const dateStr = toDateStr(currentDate);
  const today = new Date();
  const isToday = toDateStr(today) === dateStr;

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 5 * 60_000,
  });
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['scheduleSessions', dateStr],
    queryFn: () => getSessionsAll({ dateFrom: dateStr, dateTo: dateStr }),
    staleTime: 30_000,
  });
  const { data: availability = [] } = useQuery({
    queryKey: ['availabilityForDate', dateStr],
    queryFn: () => getAvailabilityForDate(dateStr),
    staleTime: 30_000,
  });

  const monitors = useMemo(
    () => users.filter((u) => isAssignableMonitor(u.role)),
    [users]
  );
  const usersById = useMemo(() => Object.fromEntries(users.map((u) => [u.uuid, u])), [users]);
  const availByUser = useMemo(() => Object.fromEntries(availability.map((a) => [a.userId, a])), [availability]);

  // How many sessions each monitor is assigned to on this day
  const assignCounts = useMemo(() => {
    const counts = {};
    for (const s of sessions) for (const uid of s.monitors ?? []) counts[uid] = (counts[uid] ?? 0) + 1;
    return counts;
  }, [sessions]);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => (a.sessionTime ?? '').localeCompare(b.sessionTime ?? '')),
    [sessions]
  );

  // Roster groups
  const roster = useMemo(() => {
    const groups = { full: [], part: [], unavailable: [], none: [] };
    for (const u of monitors) {
      const avail = monitorAvail(u.uuid, availByUser);
      groups[avail.status].push({ user: u, avail, count: assignCounts[u.uuid] ?? 0 });
    }
    for (const k of Object.keys(groups)) {
      groups[k].sort((a, b) => fullName(a.user).localeCompare(fullName(b.user)));
    }
    return groups;
  }, [monitors, availByUser, assignCounts]);

  const shiftDay = (delta) => {
    setCurrentDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + delta);
      return next;
    });
  };

  const saveMonitors = async (session, next) => {
    setBusy(true);
    try {
      await updateSession(session.id, { monitors: next });
      await queryClient.invalidateQueries({ queryKey: ['scheduleSessions', dateStr] });
    } finally {
      setBusy(false);
    }
  };

  // Immediate toggle — used by the chip ✕ on each session card
  const toggleMonitor = (session, uid) => {
    const current = session.monitors ?? [];
    const next = current.includes(uid) ? current.filter((m) => m !== uid) : [...current, uid];
    return saveMonitors(session, next);
  };

  // Keep the open picker in sync with refreshed session data
  const livePickerSession = pickerSession
    ? sortedSessions.find((s) => s.id === pickerSession.id) ?? pickerSession
    : null;

  const titleLabel = `${WEEKDAYS[currentDate.getDay()]}, ${currentDate.getDate()} de ${currentDate.toLocaleDateString('pt-PT', { month: 'long' })} ${currentDate.getFullYear()}`;

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-secondary" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate('/admin')}>
          ← Voltar
        </button>
        <h1>Escala</h1>
        <p>Atribui monitores às sessões com base na disponibilidade de cada dia.</p>
      </div>

      {/* Day navigation */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', padding: '0.85rem 1.1rem', marginBottom: '1.25rem' }}>
        <button className="btn-secondary" style={{ width: 'auto', marginTop: 0 }} onClick={() => shiftDay(-1)}>← Dia anterior</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, textTransform: 'capitalize' }}>{titleLabel}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => { if (e.target.value) { const [y, m, d] = e.target.value.split('-'); setCurrentDate(new Date(+y, +m - 1, +d)); } }}
              style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
            />
            {!isToday && (
              <button className="btn-secondary" style={{ width: 'auto', marginTop: 0, padding: '0.25rem 0.6rem', fontSize: '0.78rem' }} onClick={() => setCurrentDate(new Date())}>
                Hoje
              </button>
            )}
          </div>
        </div>
        <button className="btn-secondary" style={{ width: 'auto', marginTop: 0 }} onClick={() => shiftDay(1)}>Dia seguinte →</button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Sessions */}
        <div style={{ flex: '2 1 420px', display: 'flex', flexDirection: 'column', gap: '0.85rem', minWidth: 0 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 0.1rem' }}>
            Sessões do dia {loadingSessions ? '' : `· ${sortedSessions.length}`}
          </p>
          {loadingSessions ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>A carregar…</div>
          ) : sortedSessions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 1rem' }}>
              Não há sessões agendadas para este dia.
            </div>
          ) : (
            sortedSessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                usersById={usersById}
                availByUser={availByUser}
                daySessions={sortedSessions}
                busy={busy}
                onOpenPicker={setPickerSession}
                onRemove={toggleMonitor}
              />
            ))
          )}
        </div>

        {/* Availability roster */}
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <div className="card" style={{ position: 'sticky', top: '1rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
              Disponibilidade
            </p>
            {monitors.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sem monitores.</p>
            ) : (
              <>
                <RosterGroup label="Full" items={roster.full} status="full" />
                <RosterGroup label="Part" items={roster.part} status="part" />
                <RosterGroup label="Out" items={roster.unavailable} status="unavailable" />
                <RosterGroup label="Sem resposta" items={roster.none} status="none" />
              </>
            )}
          </div>
        </div>
      </div>

      {livePickerSession && (
        <AssignPicker
          session={livePickerSession}
          monitors={monitors}
          availByUser={availByUser}
          assignCounts={assignCounts}
          daySessions={sortedSessions}
          onCommit={saveMonitors}
          onClose={() => setPickerSession(null)}
        />
      )}
    </div>
  );
};

export default AdminSchedule;
