// Pure scheduling logic for the Escala page — extracted so it can be unit-tested.

// "14:00" -> 840
export const sessionMinutes = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':');
  return parseInt(h, 10) * 60 + (parseInt(m, 10) || 0);
};

// "14h00" / "14h30" -> minutes
export const availMinutes = (s) => {
  if (!s) return null;
  const [h, m] = s.split('h');
  return parseInt(h, 10) * 60 + (parseInt(m, 10) || 0);
};

export const formatHour = (s) => (s ? (s.endsWith('h00') ? s.replace('h00', 'h') : s) : '');

// Returns availability info for a monitor on the day.
// status: 'full' | 'part' | 'unavailable' | 'none'.
// Both 'full' and 'part' may carry a begin/end limit.
export const monitorAvail = (uid, availByUser) => {
  const a = availByUser[uid];
  if (!a) return { status: 'none', label: 'Sem resposta', window: '' };
  if (!a.available) return { status: 'unavailable', label: 'Out', window: '' };
  const e = formatHour(a.earlierLimit);
  const l = formatHour(a.laterLimit);
  let window;
  if (e && l) window = `${e} – ${l}`;
  else if (e) window = `A partir das ${e}`;
  else if (l) window = `Até às ${l}`;
  else window = 'Dia inteiro';
  const isPart = a.typeOfAvailability === 'part';
  return {
    status: isPart ? 'part' : 'full',
    label: isPart ? 'Part' : 'Full',
    window,
    earlier: a.earlierLimit || '',
    later: a.laterLimit || '',
  };
};

// Scheduling rules
export const SESSION_LEN = 120;     // every session is 2h long
export const CHECKIN_BEFORE = 60;   // monitor checks in 1h before the start
export const GAP_BETWEEN = 60;      // 1h interval between one session's end and another's start
export const EXIT_BUFFER = 30;      // session must end at least 30min before the exit limit

// Returns an array of warning messages for assigning a monitor to a session.
// Empty array = no warning. Each rule maps to its own message.
export const monitorWarnings = (avail, session, monitorUid, daySessions) => {
  const warnings = [];
  const t = sessionMinutes(session.sessionTime);
  if (t === null) return warnings;
  const end = t + SESSION_LEN;

  if (avail.status === 'unavailable') {
    warnings.push('Indisponível neste dia');
    return warnings;
  }

  // Rules tied to the availability window — applies to any begin/end limit (full or part)
  if (avail.status === 'part' || avail.status === 'full') {
    const e = avail.earlier ? availMinutes(avail.earlier) : null;
    const l = avail.later ? availMinutes(avail.later) : null;
    // Rule 1 — needs to check in 1h before the start
    if (e !== null && t - CHECKIN_BEFORE < e) {
      warnings.push(`Sem margem para check-in 1h antes (disponível a partir das ${formatHour(avail.earlier)})`);
    }
    // Rule 3 — session must end 30min before the exit limit
    if (l !== null && end + EXIT_BUFFER > l) {
      warnings.push(`Sessão termina sem 30min de margem (disponível até às ${formatHour(avail.later)})`);
    }
  }

  // Rule 2 — 1h interval between this and any other session the monitor covers
  for (const o of daySessions) {
    if (o.id === session.id) continue;
    if (!(o.monitors ?? []).includes(monitorUid)) continue;
    const ot = sessionMinutes(o.sessionTime);
    if (ot === null) continue;
    const oEnd = ot + SESSION_LEN;
    const ok = ot >= end + GAP_BETWEEN || t >= oEnd + GAP_BETWEEN;
    if (!ok) {
      warnings.push(`Menos de 1h de intervalo com a sessão das ${o.sessionTime}`);
    }
  }

  return warnings;
};
