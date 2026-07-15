import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { setAvailability, getAvailabilityForMonth, deleteAvailability } from '../firebase/firestore';
import useEscapeKey from '../hooks/useEscapeKey';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const HOURS = [];
for (let h = 7; h <= 21; h++) {
  HOURS.push(`${String(h).padStart(2, '0')}h00`);
  if (h < 21) HOURS.push(`${String(h).padStart(2, '0')}h30`);
}

const toMinutes = (s) => {
  const [h, m] = s.split('h');
  return parseInt(h) * 60 + (parseInt(m) || 0);
};

const formatHour = (s) => s.endsWith('h00') ? s.replace('h00', 'h') : s;

const EMPTY_FORM = { available: true, typeOfAvailability: 'full', earlierLimit: '', laterLimit: '' };

const pad2 = (n) => String(n).padStart(2, '0');

// Cache holidays by year to avoid redundant fetches
const holidayCache = {};

const fetchHolidays = async (year) => {
  if (holidayCache[year]) return holidayCache[year];
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PT`);
  if (!res.ok) return {};
  const data = await res.json();
  const map = {};
  data.forEach((h) => {
    const isNational = h.global;
    const isLisbon = h.counties?.includes('PT-11');
    if (isNational || isLisbon) map[h.date] = h.localName;
  });
  holidayCache[year] = map;
  return map;
};

const DayModal = ({ date, existing, onClose, onSaved, onErased }) => {
  const [form, setForm] = useState(existing ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [error, setError] = useState('');

  useEscapeKey(onClose);

  const label = date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'available' && !checked) {
      setForm((prev) => ({ ...prev, available: false, typeOfAvailability: '', earlierLimit: '', laterLimit: '' }));
    } else if (name === 'earlierLimit') {
      setForm((prev) => ({
        ...prev,
        earlierLimit: value,
        laterLimit: prev.laterLimit && value && toMinutes(prev.laterLimit) <= toMinutes(value) ? '' : prev.laterLimit,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.available && form.typeOfAvailability === 'part' && !form.earlierLimit && !form.laterLimit) {
      setError('Para disponibilidade parcial, preenche pelo menos um limite horário.');
      return;
    }
    setSaving(true);
    try {
      await onSaved(date, form);
      onClose();
    } catch {
      setError('Erro ao guardar. Tenta novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ textTransform: 'capitalize' }}>{label}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginTop: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                name="available"
                checked={form.available}
                onChange={handleChange}
                style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Disponível neste dia</span>
            </label>
          </div>

          {form.available && (
            <>
              <div className="form-group">
                <label>Tipo de disponibilidade</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  {[{ value: 'full', label: 'Full' }, { value: 'part', label: 'Part' }].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, typeOfAvailability: opt.value }))}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1.5px solid',
                        borderColor: form.typeOfAvailability === opt.value ? 'var(--primary)' : 'var(--border)',
                        background: form.typeOfAvailability === opt.value ? 'var(--green-100)' : 'var(--surface)',
                        color: form.typeOfAvailability === opt.value ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="earlierLimit">Disponível a partir das</label>
                  <select
                    id="earlierLimit"
                    name="earlierLimit"
                    value={form.earlierLimit}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">-- Sem limite --</option>
                    {HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="laterLimit">Disponível até às</label>
                  <select
                    id="laterLimit"
                    name="laterLimit"
                    value={form.laterLimit}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">-- Sem limite --</option>
                    {HOURS.filter((h) => !form.earlierLimit || toMinutes(h) > toMinutes(form.earlierLimit)).map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {error && <div className="error-msg"><span>⚠</span> {error}</div>}

          <div className="modal-footer">
            {existing && (
              <button
                type="button"
                className="btn-danger"
                style={{ marginTop: 0 }}
                disabled={erasing || saving}
                onClick={async () => {
                  setErasing(true);
                  try { await onErased(date); onClose(); }
                  catch { setError('Erro ao apagar. Tenta novamente.'); setErasing(false); }
                }}
              >
                {erasing ? 'A apagar…' : 'Apagar'}
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving || erasing}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving || erasing}>
              {saving ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Availability = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const queryClient = useQueryClient();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const yearMonth = `${year}-${pad2(month + 1)}`;

  const { data: monthData = {}, isLoading: loading } = useQuery({
    queryKey: ['availability', user.uid, yearMonth],
    queryFn: async () => {
      try {
        return await getAvailabilityForMonth(user.uid, yearMonth);
      } catch {
        showToast('Não foi possível carregar as disponibilidades.');
        return {};
      }
    },
    staleTime: 60_000,
  });

  const { data: holidays = {} } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => fetchHolidays(year).catch(() => ({})),
    staleTime: Infinity,
  });

  const setMonthData = (updater) =>
    queryClient.setQueryData(['availability', user.uid, yearMonth], (old = {}) => updater(old));

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const goToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const handleSaved = async (date, form) => {
    const dateStr = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    await setAvailability(user.uid, dateStr, form);
    const day = date.getDate();
    setMonthData((prev) => ({ ...prev, [day]: { ...form, date: dateStr, userId: user.uid } }));
  };

  const handleErased = async (date) => {
    const dateStr = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    await deleteAvailability(user.uid, dateStr);
    const day = date.getDate();
    setMonthData((prev) => { const next = { ...prev }; delete next[day]; return next; });
  };

  const firstDow = new Date(year, month, 1).getDay();
  const startOffset = (firstDow + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Disponibilidades</h1>
        <p>Regista a tua disponibilidade para cada dia do mês.</p>
      </div>

      <div className="avail-nav">
        <button className="avail-nav-btn" onClick={prevMonth}>← Mês anterior</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
          <button
            className="avail-today-btn"
            style={{ visibility: isCurrentMonth ? 'hidden' : 'visible' }}
            onClick={goToday}
          >
            Hoje
          </button>
          <h2 className="avail-month-title">{MONTHS[month]} {year}</h2>
        </div>
        <button className="avail-nav-btn" onClick={nextMonth}>Próximo mês →</button>
      </div>

      <div className="avail-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="avail-weekday">{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} className="avail-cell avail-cell--empty" />;
          const isToday = isCurrentMonth && day === today.getDate();
          const entry = monthData[day];
          const hasData = !!entry;
          const isAvailable = hasData && entry.available;
          const isUnavailable = hasData && !entry.available;
          const dow = new Date(year, month, day).getDay();
          const isWeekend = dow === 0 || dow === 6;
          const dateStr = `${year}-${pad2(month + 1)}-${pad2(day)}`;
          const holidayName = holidays[dateStr];

          return (
            <button
              key={day}
              className={`avail-cell avail-cell--day${isWeekend ? ' avail-cell--weekend' : ''}${holidayName ? ' avail-cell--holiday' : ''}${isToday ? ' avail-cell--today' : ''}${isAvailable ? ' avail-cell--available' : ''}${isUnavailable ? ' avail-cell--unavailable' : ''}`}
              onClick={() => setSelectedDay(day)}
              disabled={loading}
            >
              {isToday && <span className="avail-today-badge">Hoje</span>}
              <span className="avail-day-num">{day}</span>
              {holidayName && <span className="avail-holiday-name">{holidayName}</span>}
              {hasData && (
                <span className="avail-day-tag">
                  {(() => {
                    if (isUnavailable) return 'Indisponível';
                    const e = entry.earlierLimit ? formatHour(entry.earlierLimit) : '';
                    const l = entry.laterLimit ? formatHour(entry.laterLimit) : '';
                    if (e && !l) return `A partir das ${e}`;
                    if (!e && l) return `Até às ${l}`;
                    if (e && l) return `Das ${e} às ${l}`;
                    return 'Disponível';
                  })()}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay !== null && (
        <DayModal
          date={new Date(year, month, selectedDay)}
          existing={monthData[selectedDay] ?? null}
          onClose={() => setSelectedDay(null)}
          onSaved={handleSaved}
          onErased={handleErased}
        />
      )}
    </div>
  );
};

export default Availability;
