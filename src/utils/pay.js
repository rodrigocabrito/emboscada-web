// Monitor pay model.
//
// Each user has a "rate" — junior or senior — that sets what they earn per
// session. Within a single day, a monitor's sessions alternate between the
// full "first" rate and a reduced "second" rate: the 1st session pays first,
// the 2nd pays the (lower) second rate, the 3rd pays first again, the 4th the
// second, and so on. Paid sessions are those the monitor showed up for: status
// 'done' (completed) and 'no_show' (client didn't show, but the monitor did).
//
//   Junior: 1→25€  2→40€  3→65€  4→80€   (first 25, second 15)
//   Senior: 1→35€  2→50€  3→85€  4→100€  (first 35, second 15)
//
// The rate can change over time (a promotion Junior→Senior). Each session is
// paid at the rate that was in effect at the moment the session happened, not
// the user's current rate — see `rateHistory` and `rateAt` below.

export const RATES = {
  junior: { first: 25, second: 15, label: 'Júnior' },
  senior: { first: 35, second: 15, label: 'Sénior' },
};

export const RATE_OPTIONS = [
  { value: 'junior', label: 'Júnior' },
  { value: 'senior', label: 'Sénior' },
];

// Anything that isn't an explicit 'senior' falls back to junior — this keeps
// existing users (created before the rate field existed) on the lower rate
// until an admin sets it.
export const normalizeRate = (rate) => (rate === 'senior' ? 'senior' : 'junior');

export const rateLabel = (rate) => RATES[normalizeRate(rate)].label;

// Euros earned for `n` sessions on a single day, at a single uniform rate.
export const dayEarnings = (rate, n) => {
  if (!n || n < 0) return 0;
  const { first, second } = RATES[normalizeRate(rate)];
  const baseCount = Math.ceil(n / 2);   // 1st, 3rd, 5th … pay the full rate
  const reducedCount = Math.floor(n / 2); // 2nd, 4th … pay the reduced rate
  return baseCount * first + reducedCount * second;
};

// Statuses that earn the monitor a payout — they attended the session.
const PAID_STATUSES = new Set(['done', 'no_show']);

// The calendar day a session belongs to ("YYYY-MM-DD").
const sessionDay = (s) => s.sessionDate || (s.sessionDatetime || '').slice(0, 10);

// The moment a session happened, as a "YYYY-MM-DDTHH:MM" local string — the same
// timezone-free format sessions store, so it compares lexically with history.
const sessionMoment = (s) => s.sessionDatetime || `${sessionDay(s)}T00:00`;

// ── Rate history ─────────────────────────────────────────────────────────────
// A user's rate over time is `rateHistory: [{ rate, from }]`, where `from` is a
// "YYYY-MM-DDTHH:MM" local timestamp marking when that rate took effect. The
// seed entry uses SEED_FROM so it covers every session before the first change.
export const SEED_FROM = '0000-01-01T00:00';

// Local "YYYY-MM-DDTHH:MM" stamp — matches how sessions record their datetime,
// so a promotion made now sits on the same timeline as the sessions.
export const localStamp = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Turn a subject (a user object, or a bare rate string) into a { rate, rateHistory }.
const asSubject = (subject) =>
  (typeof subject === 'string' || subject == null)
    ? { rate: subject, rateHistory: null }
    : subject;

// The rate in effect at `moment` for a user. Picks the latest history entry
// whose `from` is at or before the moment; before the first entry (or with no
// history) it falls back to the earliest entry, then the user's current rate.
export const rateAt = (subject, moment) => {
  const { rate, rateHistory } = asSubject(subject);
  if (Array.isArray(rateHistory) && rateHistory.length) {
    let chosen = null;
    let earliest = rateHistory[0];
    for (const e of rateHistory) {
      if (e.from < earliest.from) earliest = e;
      if (e.from <= moment && (!chosen || e.from > chosen.from)) chosen = e;
    }
    return normalizeRate((chosen || earliest).rate);
  }
  return normalizeRate(rate);
};

// Promote-only model: a monitor starts Junior and, once made Senior, stays
// Senior. What an admin controls is the date from which Senior applies.

// The effective date ("YYYY-MM-DD") a user became Senior, or null if they're
// Junior (or have simply always been Senior, i.e. seeded from the epoch).
export const seniorSinceDate = (user) => {
  const hist = user?.rateHistory;
  if (Array.isArray(hist)) {
    const senior = hist.find((e) => normalizeRate(e.rate) === 'senior');
    if (senior) return senior.from === SEED_FROM ? null : senior.from.slice(0, 10);
  }
  return null;
};

// Build the { rate, rateHistory } patch making a user count as Senior from
// `dateStr` ("YYYY-MM-DD") onward and Junior before it.
export const promoteToSenior = (dateStr) => ({
  rate: 'senior',
  rateHistory: [
    { rate: 'junior', from: SEED_FROM },
    { rate: 'senior', from: `${dateStr}T00:00` },
  ],
});

// ── Earnings ─────────────────────────────────────────────────────────────────
// Rolls a monitor's sessions up into earnings. Counts only paid statuses,
// groups them by day, and within each day (ordered by time) pays odd positions
// the full rate and even positions the reduced rate — each at the rate in
// effect when that session happened. Aggregates by month and year.
//
// `subject` is the user object ({ rate, rateHistory }); a bare rate string is
// also accepted and treated as a single uniform rate.
//
// Returns:
//   total          — all-time euros
//   byMonth        — { 'YYYY-MM': euros }
//   byYear         — { 'YYYY': euros }
//   sessionsByMonth— { 'YYYY-MM': count of paid sessions }
export const computeEarnings = (sessions = [], subject) => {
  const byDay = {}; // 'YYYY-MM-DD' -> [moment, …] of paid sessions
  for (const s of sessions) {
    if (!PAID_STATUSES.has(s.status)) continue;
    const day = sessionDay(s);
    if (!day) continue;
    (byDay[day] ||= []).push(sessionMoment(s));
  }

  const byMonth = {};
  const byYear = {};
  const sessionsByMonth = {};
  let total = 0;

  for (const [day, moments] of Object.entries(byDay)) {
    moments.sort(); // chronological — determines first/second within the day
    let dayEuros = 0;
    moments.forEach((moment, i) => {
      const { first, second } = RATES[rateAt(subject, moment)];
      dayEuros += i % 2 === 0 ? first : second;
    });
    const month = day.slice(0, 7);
    const year = day.slice(0, 4);
    byMonth[month] = (byMonth[month] || 0) + dayEuros;
    byYear[year] = (byYear[year] || 0) + dayEuros;
    sessionsByMonth[month] = (sessionsByMonth[month] || 0) + moments.length;
    total += dayEuros;
  }

  return { total, byMonth, byYear, sessionsByMonth };
};

// Euros earned in a specific month ("YYYY-MM"), convenience for the profile card.
export const monthEarnings = (sessions, subject, yearMonth) =>
  computeEarnings(sessions, subject).byMonth[yearMonth] || 0;
