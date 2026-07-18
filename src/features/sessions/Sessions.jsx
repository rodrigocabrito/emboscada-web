import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { addSession } from '../../firebase/firestore';
import { useSessions } from './hooks/useSessions';
import GridView, { GridLegend } from './components/SessionsGrid';
import SessionViewModal from './components/SessionViewModal';
import NewSessionModal from './components/NewSessionModal';
import { usePermissions } from '../../hooks/usePermissions';
import useEscapeKey from '../../hooks/useEscapeKey';
import useScrollLock from '../../hooks/useScrollLock';

const VIEWS = [
  { key: 'day', label: 'Dia' },
  { key: 'week', label: 'Semana' },
];

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

const Sessions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = usePermissions();
  const [view, setView] = useState('day');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const ret = location.state?.returnDate;
    if (ret) { const [y, m, d] = ret.split('-'); return new Date(+y, +m - 1, +d); }
    return new Date();
  });
  const [hideCancelled, setHideCancelled] = useState(false);

  // Months ("YYYY-MM") covering the visible range — a week view can span two
  const months = useMemo(() => {
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const set = new Set([fmt(currentDate)]);
    if (view === 'week') {
      const weekStart = new Date(currentDate);
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - day + (day === 0 ? -6 : 1)); // Monday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      set.add(fmt(weekStart));
      set.add(fmt(weekEnd));
    }
    return [...set].sort();
  }, [view, currentDate]);

  const { sessions, users, loading: sessionsLoading, refetchSessions } = useSessions(months);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setError('');
    setSuccess('');
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
    } else if (name === 'spocPhoneNumber') {
      // Only digits, "+" and whitespace
      setForm((prev) => ({ ...prev, spocPhoneNumber: value.replace(/[^0-9+\s]/g, '') }));
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
      await refetchSessions();
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
            {hideCancelled ? 'Canceladas ocultas' : 'Ocultar Canceladas'}
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
          {isAdmin && (
            <button className="btn-primary btn-new-session" onClick={openModal}>
              + Nova Sessão
            </button>
          )}
        </div>
      </div>

      {sessionsLoading && sessions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '2rem' }}>
          A carregar…
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

      {modalOpen && isAdmin && (
        <NewSessionModal
          form={form}
          loading={loading}
          error={error}
          success={success}
          onChange={handleChange}
          onCaliberSelect={(c) => setForm((prev) => ({ ...prev, caliber: c }))}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      {selectedSession && (
        <SessionViewModal
          session={selectedSession}
          users={users}
          onClose={() => setSelectedSession(null)}
          onEdit={(id) => navigate(`/sessions/${id}`, { state: { returnDate: currentDate.toISOString().slice(0, 10) } })}
        />
      )}
    </div>
  );
};

export default Sessions;
