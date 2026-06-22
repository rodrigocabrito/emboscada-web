import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../firebase/firestore';

const RATING_OPTIONS = [
  { value: '', label: '— Selecionar —' },
  { value: '5', label: '5 — Excelente' },
  { value: '4', label: '4 — Bom' },
  { value: '3', label: '3 — Satisfatório' },
  { value: '2', label: '2 — A melhorar' },
  { value: '1', label: '1 — Insatisfatório' },
];

const CRITERIA = [
  { name: 'punctuality',   label: 'Pontualidade' },
  { name: 'attitude',      label: 'Atitude e Postura' },
  { name: 'clientRelation',label: 'Relação com Clientes' },
  { name: 'teamwork',      label: 'Trabalho em Equipa' },
  { name: 'technical',     label: 'Desempenho Técnico' },
];

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  periodFrom: '',
  periodTo: '',
  punctuality: '',
  attitude: '',
  clientRelation: '',
  teamwork: '',
  technical: '',
  overall: '',
  notes: '',
};

const UserEvaluation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: getUsers, staleTime: 5 * 60_000 });
  const user = users.find((u) => u.uuid === id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    // saving does nothing for now
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page">
      <div className="page-header" style={{ border: 'none', paddingBottom: 0, marginBottom: '1.5rem' }}>
        <button className="btn-secondary" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate('/admin/users')}>
          ← Voltar
        </button>
        <h1>Avaliação</h1>
        {user && (
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {user.firstName} {user.lastName}{user.nickname ? ` (${user.nickname})` : ''}
          </p>
        )}
      </div>

      <form onSubmit={handleSave} style={{ maxWidth: '640px' }}>

        {/* Dates */}
        <div className="session-detail-card" style={{ marginBottom: '1.25rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Data da Avaliação</label>
              <input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="periodFrom">Período Avaliado — De</label>
              <input id="periodFrom" name="periodFrom" type="date" value={form.periodFrom} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="periodTo">Até</label>
              <input id="periodTo" name="periodTo" type="date" value={form.periodTo} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Criteria */}
        <div className="session-detail-card" style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Critérios
          </p>
          {CRITERIA.map(({ name, label }) => (
            <div className="form-group" key={name}>
              <label htmlFor={name}>{label}</label>
              <select id={name} name={name} value={form[name]} onChange={handleChange} className="form-select">
                {RATING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Overall & Notes */}
        <div className="session-detail-card" style={{ marginBottom: '1.25rem' }}>
          <div className="form-group">
            <label htmlFor="overall">Avaliação Geral</label>
            <select id="overall" name="overall" value={form.overall} onChange={handleChange} className="form-select">
              {RATING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notas e Comentários</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Observações adicionais..."
              rows={4}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn-secondary" style={{ width: 'auto' }} onClick={() => navigate('/admin/users')}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" style={{ width: 'auto', marginTop: 0 }}>
            Guardar Avaliação
          </button>
        </div>
      </form>

      {saved && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          background: 'var(--success, #16a34a)', color: '#fff',
          padding: '0.6rem 1.1rem', borderRadius: '0.5rem',
          fontSize: '0.875rem', fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          ✓ Avaliação guardada
        </div>
      )}
    </div>
  );
};

export default UserEvaluation;
