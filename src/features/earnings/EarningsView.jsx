import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getMonitorSessions, getUsers } from '../../firebase/firestore';
import { computeEarnings, rateLabel, normalizeRate } from '../../utils/pay';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const fmtEur = (n) => `${Number(n || 0).toLocaleString('pt-PT')} €`;

const pad2 = (n) => String(n).padStart(2, '0');
const now = new Date();
const CURRENT_MONTH = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
const CURRENT_YEAR = String(now.getFullYear());

const StatCard = ({ label, value, accent }) => (
  <div className="card earnings-stat">
    <div className="earnings-stat-label">{label}</div>
    <div className="earnings-stat-value" style={accent ? { color: 'var(--primary)' } : undefined}>{value}</div>
  </div>
);

const EarningsView = () => {
  const navigate = useNavigate();
  const { id: routeUid } = useParams();
  const { user, profile } = useAuth();

  // Admin mode when the route carries a user id; otherwise the logged-in user.
  const isAdminView = !!routeUid;
  const uid = routeUid || user.uid;
  const backTo = isAdminView ? '/admin/users' : '/profile';

  // In admin view we need the target user's rate + name from the users list.
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 5 * 60_000,
    enabled: isAdminView,
  });
  const target = useMemo(() => users.find((u) => u.uuid === uid), [users, uid]);

  // The user whose earnings we're showing — carries rate + rate history.
  const subject = isAdminView ? target : profile;
  const currentRate = normalizeRate(subject?.rate); // for the badge only
  const name = isAdminView
    ? (target ? `${target.firstName} ${target.lastName}`.trim() : '')
    : `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['monitorSessions', uid],
    queryFn: () => getMonitorSessions(uid),
    staleTime: 60_000,
  });

  const earnings = useMemo(() => computeEarnings(sessions, subject), [sessions, subject]);

  // Years that actually have earnings, newest first, always including this year.
  const years = useMemo(() => {
    const set = new Set(Object.keys(earnings.byYear));
    set.add(CURRENT_YEAR);
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [earnings]);

  const [year, setYear] = useState(CURRENT_YEAR);
  const activeYear = years.includes(year) ? year : years[0];

  const monthValues = MONTHS_PT.map((_, i) => earnings.byMonth[`${activeYear}-${pad2(i + 1)}`] || 0);
  const maxMonth = Math.max(1, ...monthValues);

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-secondary" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate(backTo)}>
          ← Voltar
        </button>
        <h1>{isAdminView ? `Ganhos — ${name}` : 'Os meus ganhos'}</h1>
        <p>
          Rendimento por sessão, calculado a partir das sessões realizadas (concluídas ou com falta do cliente).{' '}
          <span className="rate-badge">Tarifa atual: {rateLabel(currentRate)}</span>
        </p>
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>A carregar…</div>
      ) : (
        <>
          <div className="earnings-stats">
            <StatCard label="Este mês" value={fmtEur(earnings.byMonth[CURRENT_MONTH] || 0)} accent />
            <StatCard label={`Total ${CURRENT_YEAR}`} value={fmtEur(earnings.byYear[CURRENT_YEAR] || 0)} />
            <StatCard label="Total acumulado" value={fmtEur(earnings.total)} />
          </div>

          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="earnings-chart-head">
              <h3 className="card-section-title" style={{ margin: 0 }}>Evolução mensal</h3>
              <div className="earnings-year-tabs">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    className={`earnings-year-tab${y === activeYear ? ' is-active' : ''}`}
                    onClick={() => setYear(y)}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {monthValues.every((v) => v === 0) ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1.5rem 0', textAlign: 'center' }}>
                Sem ganhos registados em {activeYear}.
              </p>
            ) : (
              <div className="earnings-chart" role="img" aria-label={`Ganhos mensais de ${activeYear}`}>
                {monthValues.map((v, i) => (
                  <div key={i} className="earnings-bar-col">
                    <div className="earnings-bar-track">
                      <div className="earnings-bar-value">{v > 0 ? v : ''}</div>
                      <div
                        className="earnings-bar-fill"
                        style={{ height: `${(v / maxMonth) * 100}%` }}
                        title={`${MONTHS_PT[i]} ${activeYear}: ${fmtEur(v)}`}
                      />
                    </div>
                    <div className="earnings-bar-label">{MONTHS_PT[i]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: '1.25rem' }}>
            <h3 className="card-section-title">Detalhe de {activeYear}</h3>
            <table className="data-table data-table--responsive">
              <thead>
                <tr><th>Mês</th><th>Sessões pagas</th><th>Ganho</th></tr>
              </thead>
              <tbody>
                {MONTHS_PT.map((m, i) => {
                  const key = `${activeYear}-${pad2(i + 1)}`;
                  const euros = earnings.byMonth[key] || 0;
                  const count = earnings.sessionsByMonth[key] || 0;
                  if (euros === 0 && count === 0) return null;
                  return (
                    <tr key={m}>
                      <td data-label="Mês">{m} {activeYear}</td>
                      <td data-label="Sessões pagas">{count}</td>
                      <td data-label="Ganho">{fmtEur(euros)}</td>
                    </tr>
                  );
                })}
                <tr className="earnings-total-row">
                  <td data-label="Mês"><strong>Total {activeYear}</strong></td>
                  <td data-label="Sessões pagas" />
                  <td data-label="Ganho"><strong>{fmtEur(earnings.byYear[activeYear] || 0)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default EarningsView;
