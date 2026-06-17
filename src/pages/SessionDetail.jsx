import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, updateSession, deleteSession, getUsers } from '../firebase/firestore';
import { getUserColor } from '../utils/avatarColors';

const SESSION_TYPES = ['Paintball', 'Laser Tag', 'Gel Blast', 'Bubble Football'];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => [
  `${String(i).padStart(2, '0')}:00`,
  `${String(i).padStart(2, '0')}:30`,
]).flat().filter((t) => t >= '08:00' && t <= '19:30');

const STATUS_OPTIONS = [
  { value: 'done', label: 'Feita' },
  { value: 'active', label: 'Ativa' },
  { value: 'pending_payment', label: 'Pendente' },
  { value: 'no_show', label: 'Não compareceu' },
  { value: 'cancelled', label: 'Cancelada' },
];

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'done': return 'badge-success';
    case 'active': return 'badge-active';
    case 'pending_payment': return 'badge-pending';
    case 'no_show': return 'badge-danger';
    case 'cancelled': return 'badge-default';
    default: return 'badge-default';
  }
};

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [monitorSearch, setMonitorSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [s, u] = await Promise.all([getSession(id), getUsers()]);
        if (!s) { navigate('/sessions', { replace: true }); return; }
        setSession(s);
        setUsers(u);
        setForm({
          spoc: s.spoc || '',
          numberOfPlayers: s.numberOfPlayers || '',
          sessionDate: s.sessionDate || '',
          sessionTime: s.sessionTime || '',
          typeOfSession: s.typeOfSession || '',
          caliber: s.caliber || '',
          status: s.status || 'pending_payment',
          additionalComments: s.additionalComments || '',
          monitors: s.monitors || [],
        });
      } catch {
        setError('Erro ao carregar sessão.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'typeOfSession' && value !== 'Paintball' ? { caliber: '' } : {}),
    }));
    setDirty(true);
  };

  const toggleMonitor = (uid) => {
    setForm((prev) => ({
      ...prev,
      monitors: prev.monitors.includes(uid)
        ? prev.monitors.filter((m) => m !== uid)
        : [...prev.monitors, uid],
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      await updateSession(id, {
        spoc: form.spoc,
        numberOfPlayers: parseInt(form.numberOfPlayers, 10),
        sessionDate: form.sessionDate,
        sessionTime: form.sessionTime,
        sessionDatetime: `${form.sessionDate}T${form.sessionTime}`,
        typeOfSession: form.typeOfSession,
        caliber: form.typeOfSession === 'Paintball' ? form.caliber : '',
        status: form.status,
        additionalComments: form.additionalComments,
        monitors: form.monitors,
      });
      navigate('/sessions', { state: { returnDate: form.sessionDate } });
    } catch {
      setError('Erro ao guardar sessão. Tenta novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    navigate('/sessions');
  };

  if (loading) {
    return (
      <div className="page">
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '3rem' }}>A carregar…</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="page">
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '3rem' }}>Sessão não encontrada.</p>
      </div>
    );
  }

  const monitorUsers = users.filter((u) => u.role === 'monitor' || u.role === 'admin');

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ marginBottom: '0.25rem' }}>
          Sessão — {session.sessionDate
            ? new Date(session.sessionDate + 'T00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
            : ''}
          {session.sessionTime ? ` às ${session.sessionTime}` : ''}
        </h1>
        <p style={{ margin: 0 }}>Responsável: <strong>{session.spoc}</strong></p>
      </div>

      <div className="session-detail-card">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="spoc">Responsável</label>
            <input
              id="spoc"
              name="spoc"
              type="text"
              value={form.spoc}
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
              value={form.numberOfPlayers}
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
              value={form.sessionDate}
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
                  onClick={() => { setForm((prev) => ({ ...prev, caliber: c })); setDirty(true); }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Estado da Sessão</label>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => { setForm((prev) => ({ ...prev, status: s.value })); setDirty(true); }}
                className={`badge ${getStatusBadgeClass(s.value)}`}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  fontSize: '0.78rem',
                  padding: '0.25rem 0.6rem',
                  opacity: form.status === s.value ? 1 : 0.5,
                  boxShadow: form.status === s.value ? '0 0 0 2px rgba(0,0,0,0.2)' : 'none',
                  transform: form.status === s.value ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              >
                {form.status === s.value ? '✓ ' : ''}{s.label}
              </button>
            ))}
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
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Monitores</label>
          <input
            type="text"
            value={monitorSearch}
            onChange={(e) => setMonitorSearch(e.target.value)}
            placeholder="Pesquisa por nome ou alcunha..."
            style={{ marginBottom: '0.5rem' }}
          />
          {(() => {
            const visible = monitorUsers.filter((u) => {
              if (form.monitors.includes(u.uuid)) return true;
              if (!monitorSearch) return false;
              const q = monitorSearch.toLowerCase();
              return (
                `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
                (u.nickname || '').toLowerCase().includes(q)
              );
            });
            if (!visible.length) return null;
            return (
              <div className="monitors-checklist">
                {visible.map((u) => (
                  <div key={u.uuid} className="form-checkbox-item">
                    <input
                      id={`monitor-${u.uuid}`}
                      type="checkbox"
                      checked={form.monitors.includes(u.uuid)}
                      onChange={() => toggleMonitor(u.uuid)}
                    />
                    <label htmlFor={`monitor-${u.uuid}`}>
                      {u.firstName} {u.lastName}{u.nickname ? ` (${u.nickname})` : ''}
                    </label>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {error && <div className="error-msg"><span>⚠</span> {error}</div>}

        <div className="session-detail-footer">
          <button type="button" className="btn-secondary" onClick={handleDiscard} disabled={saving}>
            Descartar alterações
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? 'A guardar…' : 'Guardar alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
