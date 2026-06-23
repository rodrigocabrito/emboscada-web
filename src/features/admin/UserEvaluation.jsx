import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsers, getEvaluation, saveEvaluation } from '../../firebase/firestore';

const SCALE = [
  { value: 0, label: 'Não fez',    selBg: '#e5e7eb', selColor: '#374151' },
  { value: 1, label: 'Nada apto',  selBg: '#dc2626', selColor: '#fff' },
  { value: 2, label: 'Pouco apto', selBg: '#ea580c', selColor: '#fff' },
  { value: 3, label: 'Médio apto', selBg: '#fde047', selColor: '#713f12' },
  { value: 4, label: 'Apto',       selBg: '#86efac', selColor: '#14532d' },
  { value: 5, label: 'Muito apto', selBg: '#15803d', selColor: '#fff' },
];

const ACTIVITIES = [
  { key: 'paintballMini',              label: 'Paintball MINI' },
  { key: 'paintballKids',              label: 'Paintball Kids' },
  { key: 'paintballAdultos',           label: 'Paintball Adultos' },
  { key: 'lasertagKids',               label: 'Lasertag Kids' },
  { key: 'lasertagAdultos',            label: 'Lasertag Adultos' },
  { key: 'bubbleFootballKids',         label: 'Bubble Football Kids' },
  { key: 'bubbleFootballAdultos',      label: 'Bubble Football Adultos' },
  { key: 'gelBlast',                   label: 'Gel Blast' },
  { key: 'cacaTesouro',                label: 'Caça ao Tesouro / Peddy Paper' },
  { key: 'dinamicasTradicionais',      label: 'Dinâmicas Tradicionais / Jogos' },
];

const TASKS = [
  { key: 'arrumacaoFatos',             label: 'Arrumação e ensacamento dos fatos' },
  { key: 'arrumacaoLuvas',             label: 'Arrumação e ensacamento das luvas' },
  { key: 'arrumacaoColetes',           label: 'Arrumação e limpeza dos coletes' },
  { key: 'arrumacaoRecepcao',          label: 'Arrumação e limpeza da receção' },
  { key: 'recolhaLixos',              label: 'Recolha dos lixos' },
  { key: 'limpezaCasasBanho',          label: 'Limpeza das casas de banho' },
  { key: 'ensacamentoRoupas',          label: 'Ensacamento das roupas que vão para a lavandaria' },
  { key: 'montagemSessoes',            label: 'Montagem das sessões' },
  { key: 'limpezaEquipamentos',        label: 'Limpeza dos equipamentos' },
  { key: 'arrumacaoEquipamentos',      label: 'Arrumação dos equipamentos' },
  { key: 'manutencaoEquipamentos',     label: 'Manutenção dos equipamentos' },
  { key: 'montagemArComprimido',       label: 'Montagem Ar Comprimido' },
  { key: 'utilizacaoArComprimido',     label: 'Utilização Ar Comprimido' },
  { key: 'manutencaoArComprimido',     label: 'Manutenção Ar Comprimido' },
  { key: 'briefingsSeguranca',         label: 'Briefings de segurança' },
  { key: 'monitorizacaoAcompanhantes', label: 'Monitorização de sessões (monitores acompanhantes)' },
  { key: 'monitorizacaoPrincipais',    label: 'Monitorização de sessões (monitores principais)' },
  { key: 'entradasSaidas',             label: 'Entradas e saídas dos grupos (porta/receção)' },
];

const emptyRatings = (items) => Object.fromEntries(items.map((i) => [i.key, null]));

const EMPTY_FORM = {
  positivePoints: '',
  negativePoints: '',
  preferredTypes: '',
  lessPreferredTypes: '',
  activities: emptyRatings(ACTIVITIES),
  tasks: emptyRatings(TASKS),
};

const RatingPicker = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
    {SCALE.map((s) => {
      const sel = value === s.value;
      return (
        <button
          key={s.value}
          type="button"
          title={s.label}
          onClick={() => onChange(sel ? null : s.value)}
          style={{
            width: '1.9rem', height: '1.9rem',
            borderRadius: '0.35rem',
            border: sel ? `1.5px solid ${s.selBg}` : '1.5px solid var(--border)',
            background: sel ? s.selBg : 'var(--surface)',
            color: sel ? s.selColor : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.82rem',
            cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {s.value}
        </button>
      );
    })}
    {value !== null && value !== undefined && (
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.35rem', order: -1 }}>
        {SCALE.find((s) => s.value === value)?.label}
      </span>
    )}
  </div>
);

const RatingRow = ({ label, value, onChange, last }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '0.6rem 0',
    borderBottom: last ? 'none' : '1px solid var(--border)',
  }}>
    <span style={{ flex: '1 1 0', fontSize: '0.875rem', color: 'var(--text)', minWidth: 0 }}>{label}</span>
    <RatingPicker value={value} onChange={onChange} />
  </div>
);

const cardTitleStyle = { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' };

const CardTitle = ({ children, avg }) => {
  const scale = avg !== null ? SCALE.find((s) => s.value === Math.round(avg)) : null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <p style={{ ...cardTitleStyle, margin: 0 }}>{children}</p>
      {avg !== null && scale && (
        <span style={{
          fontSize: '1rem', fontWeight: 700,
          background: scale.selBg, color: scale.selColor,
          padding: '0.3rem 0.65rem', borderRadius: '0.4rem',
        }}>
          {avg.toFixed(1)}
        </span>
      )}
    </div>
  );
};

const calcAvg = (ratings) => {
  const vals = Object.values(ratings).filter((v) => v !== null && v > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
};

const generateChanges = (existing, newForm, newOpenEvals) => {
  const changes = [];

  for (const { key, label } of ACTIVITIES) {
    const from = existing?.activities?.[key] ?? null;
    const to   = newForm.activities[key] ?? null;
    if (from !== to) changes.push({ type: 'rating', label, from, to });
  }

  for (const { key, label } of TASKS) {
    const from = existing?.tasks?.[key] ?? null;
    const to   = newForm.tasks[key] ?? null;
    if (from !== to) changes.push({ type: 'rating', label, from, to });
  }

  const TEXT_FIELDS = [
    { key: 'positivePoints',     label: 'Pontos positivos' },
    { key: 'negativePoints',     label: 'Pontos a melhorar' },
    { key: 'preferredTypes',     label: 'Tipos de sessão preferidos' },
    { key: 'lessPreferredTypes', label: 'Tipos de sessão menos preferidos' },
  ];
  for (const { key, label } of TEXT_FIELDS) {
    if ((existing?.[key] ?? '') !== (newForm[key] ?? '')) changes.push({ type: 'text', label });
  }

  const oldIds = new Set((existing?.openEvals ?? []).map((e) => e.id));
  for (const e of newOpenEvals) {
    if (!oldIds.has(e.id)) changes.push({ type: 'openEval', date: e.date });
  }

  return changes;
};

const UserEvaluation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: getUsers, staleTime: 5 * 60_000 });
  const user = users.find((u) => u.uuid === id);

  const { data: existing } = useQuery({
    queryKey: ['evaluation', id],
    queryFn: () => getEvaluation(id),
    staleTime: 5 * 60_000,
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openEvals, setOpenEvals] = useState([]);
  const [openEvalDraft, setOpenEvalDraft] = useState({ date: new Date().toISOString().slice(0, 10), text: '' });

  useEffect(() => {
    if (!existing) return;
    setForm({
      positivePoints:    existing.positivePoints    ?? '',
      negativePoints:    existing.negativePoints    ?? '',
      preferredTypes:    existing.preferredTypes    ?? '',
      lessPreferredTypes:existing.lessPreferredTypes ?? '',
      activities: { ...emptyRatings(ACTIVITIES), ...(existing.activities ?? {}) },
      tasks:      { ...emptyRatings(TASKS),      ...(existing.tasks ?? {}) },
    });
    const evals = (existing.openEvals ?? []).slice().sort((a, b) => b.date.localeCompare(a.date));
    setOpenEvals(evals);
  }, [existing]);

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleChange = (e) => set(e.target.name, e.target.value);

  const setRating = (group, key, value) => {
    setForm((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
    setSaved(false);
  };

  const doSave = async (currentOpenEvals, setCompetencyDate = false) => {
    setSaving(true);
    try {
      const changes = generateChanges(existing, form, currentOpenEvals);
      const prevChangelog = (existing?.changelog ?? []);
      const changelog = changes.length
        ? [{ date: new Date().toISOString().slice(0, 10), timestamp: Date.now(), changes }, ...prevChangelog]
        : prevChangelog;

      const payload = { ...form, openEvals: currentOpenEvals, changelog };
      if (setCompetencyDate) payload.lastCompetencyEvalDate = new Date().toISOString().slice(0, 10);
      await saveEvaluation(id, payload);
      queryClient.invalidateQueries({ queryKey: ['evaluation', id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const addOpenEval = async () => {
    if (!openEvalDraft.text.trim()) return;
    const newEntry = { ...openEvalDraft, id: String(Date.now()) };
    const updatedEvals = [...openEvals, newEntry].sort((a, b) => b.date.localeCompare(a.date));
    setOpenEvals(updatedEvals);
    setOpenEvalDraft({ date: new Date().toISOString().slice(0, 10), text: '' });
    await doSave(updatedEvals, false);
  };

  const removeOpenEval = (entryId) => setOpenEvals((prev) => prev.filter((e) => e.id !== entryId));

  const handleSave = async (e) => {
    e.preventDefault();
    await doSave(openEvals, true);
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
        {existing?.lastCompetencyEvalDate && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Última avaliação de competências:{' '}
            <strong style={{ color: 'var(--text)' }}>
              {new Date(existing.lastCompetencyEvalDate + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
            </strong>
          </p>
        )}
      </div>

      <form onSubmit={handleSave} style={{ maxWidth: '680px' }}>

        {/* Profile */}
        <div className="session-detail-card" style={{ marginBottom: '1.25rem' }}>
          <CardTitle>Perfil</CardTitle>
          <div className="form-group">
            <label htmlFor="positivePoints">Pontos positivos</label>
            <textarea id="positivePoints" name="positivePoints" value={form.positivePoints} onChange={handleChange} className="form-textarea" rows={3} placeholder="O que se destaca positivamente..." />
          </div>
          <div className="form-group">
            <label htmlFor="negativePoints">Pontos a melhorar</label>
            <textarea id="negativePoints" name="negativePoints" value={form.negativePoints} onChange={handleChange} className="form-textarea" rows={3} placeholder="O que precisa de atenção ou melhoria..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="preferredTypes">Tipos de sessão preferidos</label>
              <textarea id="preferredTypes" name="preferredTypes" value={form.preferredTypes} onChange={handleChange} className="form-textarea" rows={2} placeholder="Ex: Paintball, Lasertag..." />
            </div>
            <div className="form-group">
              <label htmlFor="lessPreferredTypes">Tipos de sessão menos preferidos</label>
              <textarea id="lessPreferredTypes" name="lessPreferredTypes" value={form.lessPreferredTypes} onChange={handleChange} className="form-textarea" rows={2} placeholder="Ex: Bubble Football..." />
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="session-detail-card" style={{ marginBottom: '1.25rem' }}>
          <CardTitle avg={calcAvg(form.activities)}>Atividades</CardTitle>
          {ACTIVITIES.map(({ key, label }, i) => (
            <RatingRow
              key={key}
              label={label}
              value={form.activities[key]}
              onChange={(v) => setRating('activities', key, v)}
              last={i === ACTIVITIES.length - 1}
            />
          ))}
        </div>

        {/* Tasks */}
        <div className="session-detail-card" style={{ marginBottom: '1.25rem' }}>
          <CardTitle avg={calcAvg(form.tasks)}>Tarefas</CardTitle>
          {TASKS.map(({ key, label }, i) => (
            <RatingRow
              key={key}
              label={label}
              value={form.tasks[key]}
              onChange={(v) => setRating('tasks', key, v)}
              last={i === TASKS.length - 1}
            />
          ))}
        </div>

        {/* Open evaluation */}
        <div className="session-detail-card" style={{ marginBottom: '1.25rem' }}>
          <CardTitle>Avaliações</CardTitle>
          <div className="form-group">
            <label htmlFor="openEvalDate">Data</label>
            <input
              id="openEvalDate"
              type="date"
              value={openEvalDraft.date}
              onChange={(e) => setOpenEvalDraft((d) => ({ ...d, date: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="openEvalText">Avaliação</label>
            <textarea
              id="openEvalText"
              value={openEvalDraft.text}
              onChange={(e) => setOpenEvalDraft((d) => ({ ...d, text: e.target.value }))}
              className="form-textarea"
              rows={4}
              placeholder="Escreve a avaliação detalhada aqui..."
            />
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: 'auto', marginTop: 0 }}
            onClick={addOpenEval}
            disabled={!openEvalDraft.text.trim()}
          >
            + Adicionar avaliação
          </button>

          {openEvals.length > 0 && (
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              {openEvals.map((entry) => (
                <div key={entry.id} style={{ padding: '0.85rem 1rem', background: 'var(--surface-alt, var(--surface))', borderRadius: '0.5rem', border: '1px solid var(--border)', position: 'relative' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    {new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text)', whiteSpace: 'pre-wrap', margin: 0, paddingRight: '1.5rem' }}>{entry.text}</p>
                  <button
                    type="button"
                    onClick={() => removeOpenEval(entry.id)}
                    aria-label="Remover avaliação"
                    style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1, padding: '0.15rem' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn-secondary" style={{ width: 'auto' }} onClick={() => navigate('/admin/users')}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" style={{ width: 'auto', marginTop: 0 }} disabled={saving}>
            {saving ? 'A guardar...' : 'Guardar Avaliação'}
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
