import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getEvaluation, markEvaluationSeen } from '../../firebase/firestore';

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
  { key: 'recolhaLixos',               label: 'Recolha dos lixos' },
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

const cardTitleStyle = { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' };

const calcAvg = (ratings) => {
  const vals = Object.values(ratings ?? {}).filter((v) => v !== null && v > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
};

const RatingBadge = ({ value }) => {
  if (value === null || value === undefined) return <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>;
  const s = SCALE.find((x) => x.value === value);
  if (!s) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      background: s.selBg, color: s.selColor,
      padding: '0.2rem 0.6rem', borderRadius: '0.35rem',
      fontWeight: 700, fontSize: '0.82rem', flexShrink: 0,
    }}>
      {value} <span style={{ fontWeight: 400, fontSize: '0.75rem' }}>{s.label}</span>
    </span>
  );
};

const SectionAvg = ({ ratings }) => {
  const avg = calcAvg(ratings);
  if (avg === null) return null;
  const s = SCALE.find((x) => x.value === Math.round(avg));
  if (!s) return null;
  return (
    <span style={{ background: s.selBg, color: s.selColor, padding: '0.3rem 0.65rem', borderRadius: '0.4rem', fontWeight: 700, fontSize: '1rem' }}>
      {avg.toFixed(1)}
    </span>
  );
};

const CardHeader = ({ title, ratings }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
    <p style={{ ...cardTitleStyle, margin: 0 }}>{title}</p>
    {ratings && <SectionAvg ratings={ratings} />}
  </div>
);

const RatingRow = ({ label, value, last }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
    <span style={{ flex: '1 1 0', fontSize: '0.875rem', color: 'var(--text)', minWidth: 0 }}>{label}</span>
    <RatingBadge value={value} />
  </div>
);

const TextField = ({ label, value }) => {
  if (!value) return null;
  return (
    <div style={{ marginBottom: '1rem' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'pre-wrap', margin: 0 }}>{value}</p>
    </div>
  );
};

const RatingChip = ({ value }) => {
  if (value === null || value === undefined) {
    return <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>—</span>;
  }
  const s = SCALE.find((x) => x.value === value);
  return (
    <span style={{
      background: s?.selBg ?? '#e5e7eb', color: s?.selColor ?? '#374151',
      borderRadius: '0.3rem', padding: '0.1rem 0.45rem',
      fontWeight: 700, fontSize: '0.78rem',
    }}>
      {value}
    </span>
  );
};

const ChangeRow = ({ change }) => {
  if (typeof change === 'string') {
    return <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text)' }}>{change}</p>;
  }
  if (change.type === 'rating') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text)' }}>
        <span style={{ color: 'var(--text-muted)', flexShrink: 0, minWidth: 0, flex: 1, fontSize: '0.8rem' }}>{change.label}</span>
        <RatingChip value={change.from} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>→</span>
        <RatingChip value={change.to} />
      </div>
    );
  }
  if (change.type === 'text') {
    return <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text)' }}><span style={{ color: 'var(--text-muted)' }}>{change.label}:</span> atualizado</p>;
  }
  if (change.type === 'openEval') {
    return <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text)' }}>Nova avaliação em texto ({new Date(change.date + 'T00:00:00').toLocaleDateString('pt-PT')})</p>;
  }
  return null;
};

const EvaluationView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: evaluation, isLoading } = useQuery({
    queryKey: ['evaluation', user.uid],
    queryFn: () => getEvaluation(user.uid),
    staleTime: 5 * 60_000,
  });

  // Mark the evaluation as seen (clears the "unseen updates" badge). The ref
  // guards against re-marking the same saveCount when the query refetches.
  const markedCountRef = useRef(null);
  useEffect(() => {
    if (!evaluation) return;
    const count = evaluation.saveCount ?? 0;
    if (markedCountRef.current === count) return;
    markedCountRef.current = count;
    // The live profile subscription picks up lastEvalSeenCount automatically
    markEvaluationSeen(user.uid, count).catch(() => {});
  }, [evaluation, user.uid]);

  const activities = evaluation?.activities ?? {};
  const tasks = evaluation?.tasks ?? {};
  const openEvals = ((evaluation?.openEvals ?? []).slice().sort((a, b) => b.date.localeCompare(a.date)));

  return (
    <div className="page">
      <div className="page-header" style={{ border: 'none', paddingBottom: 0, marginBottom: '1.5rem' }}>
        <button className="btn-secondary" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate('/profile')}>
          ← Voltar
        </button>
        <h1>A minha avaliação</h1>
        {evaluation?.lastCompetencyEvalDate && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Última avaliação de competências:{' '}
            <strong style={{ color: 'var(--text)' }}>
              {new Date(evaluation.lastCompetencyEvalDate + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
            </strong>
          </p>
        )}
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>A carregar...</p>
      ) : !evaluation ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Ainda não tens nenhuma avaliação registada.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

          {/* Main content */}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Profile */}
          {(evaluation.positivePoints || evaluation.negativePoints || evaluation.preferredTypes || evaluation.lessPreferredTypes) && (
            <div className="session-detail-card">
              <CardHeader title="Perfil" />
              <TextField label="Pontos positivos" value={evaluation.positivePoints} />
              <TextField label="Pontos a melhorar" value={evaluation.negativePoints} />
              <TextField label="Tipos de sessão preferidos" value={evaluation.preferredTypes} />
              <TextField label="Tipos de sessão menos preferidos" value={evaluation.lessPreferredTypes} />
            </div>
          )}

          {/* Activities */}
          <div className="session-detail-card">
            <CardHeader title="Atividades" ratings={activities} />
            {ACTIVITIES.map(({ key, label }, i) => (
              <RatingRow key={key} label={label} value={activities[key] ?? null} last={i === ACTIVITIES.length - 1} />
            ))}
          </div>

          {/* Tasks */}
          <div className="session-detail-card">
            <CardHeader title="Tarefas" ratings={tasks} />
            {TASKS.map(({ key, label }, i) => (
              <RatingRow key={key} label={label} value={tasks[key] ?? null} last={i === TASKS.length - 1} />
            ))}
          </div>

          {/* Open evaluations */}
          {openEvals.length > 0 && (
            <div className="session-detail-card">
              <CardHeader title="Avaliações" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {openEvals.map((entry) => (
                  <div key={entry.id} style={{ padding: '0.85rem 1rem', background: 'var(--surface-alt, var(--surface))', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      {new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text)', whiteSpace: 'pre-wrap', margin: 0 }}>{entry.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          </div>

          {/* Changelog — sticky sidebar */}
          {(evaluation.changelog ?? []).length > 0 && (
            <div className="session-detail-card" style={{ width: '380px', flexShrink: 0, position: 'sticky', top: '5rem', maxHeight: 'calc(100vh - 7rem)', overflowY: 'auto' }}>
              <CardHeader title="Histórico de alterações" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(evaluation.changelog ?? []).map((entry, i) => (
                  <div key={entry.timestamp ?? i} style={{ padding: '0.75rem 1rem', background: 'var(--surface-alt, var(--surface))', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {entry.changes.map((change, j) => (
                        <ChangeRow key={j} change={change} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default EvaluationView;
