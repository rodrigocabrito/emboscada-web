import { useState, useEffect, useMemo, useCallback } from 'react';
import { addSession, getSessions } from '../firebase/firestore';

const VIEWS = [
  { key: 'day', label: 'Dia' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
];

const EMPTY_FORM = {
  spoc: '',
  numberOfPlayers: '',
  sessionDate: '',
  signalPaid: false,
  additionalComments: '',
};

const toDate = (ts) => {
  if (!ts) return new Date();
  if (ts?.toDate) return ts.toDate();
  return new Date(ts);
};

const groupSessions = (sessions, view) => {
  const groups = {};
  sessions.forEach((s) => {
    const d = toDate(s.sessionDate);
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

const SessionCard = ({ session }) => {
  const date = toDate(session.sessionDate);
  const time = date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="session-card">
      <span className="session-time">{time}</span>
      <div className="session-info">
        <span className="session-spoc">{session.spoc}</span>
        <span className="session-meta">{session.numberOfPlayers} jogadores</span>
        {session.additionalComments && (
          <span className="session-comment">{session.additionalComments}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {session.numberOfPlayers < 10 && (
          <span className="warn-tooltip" data-tip="Esta sessão tem menos de 10 jogadores">⚠</span>
        )}
        <span className={`badge ${session.signalPaid ? 'badge-paid' : 'badge-pending'}`}>
          {session.signalPaid ? 'Sinal Pago' : 'Pendente'}
        </span>
      </div>
    </div>
  );
};

const Sessions = () => {
  const [view, setView] = useState('day');
  const [sessions, setSessions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      // silently fail on list fetch
    }
  };

  useEffect(() => { fetchSessions(); }, []);

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
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen, closeModal]);

  const grouped = useMemo(() => groupSessions(sessions, view), [sessions, view]);
  const sortedKeys = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
        sessionDate: form.sessionDate,
        signalPaid: form.signalPaid,
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
        <h2 className="section-title" style={{ marginBottom: 0 }}>{countLabel}</h2>
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
        sortedKeys.map((key) => (
          <div key={key} className="session-group">
            <div className="session-group-label">{grouped[key].label}</div>
            <div className="session-list">
              {grouped[key].sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        ))
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

              <div className="form-group">
                <label htmlFor="sessionDate">Data e Hora</label>
                <input
                  id="sessionDate"
                  name="sessionDate"
                  type="datetime-local"
                  value={form.sessionDate}
                  onChange={handleChange}
                  required
                />
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

              <div className="form-checkbox-group">
                <input
                  id="signalPaid"
                  name="signalPaid"
                  type="checkbox"
                  checked={form.signalPaid}
                  onChange={handleChange}
                />
                <label htmlFor="signalPaid">Sinal pago</label>
              </div>

              {error && <div className="error-msg"><span>⚠</span> {error}</div>}
              {success && <div className="success-msg"><span>✓</span> {success}</div>}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'A criar...' : 'Criar Sessão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;
