import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSessions } from '../firebase/firestore';

const STATS_CONFIG = [
  {
    key: 'done',
    label: 'Feitas',
    icon: '✅',
    color: '#16a34a',
    bg: '#dcfce7',
    border: '#86efac',
  },
  {
    key: 'active',
    label: 'Ativas',
    icon: '🟢',
    color: '#1d4ed8',
    bg: '#dbeafe',
    border: '#93c5fd',
  },
  {
    key: 'pending',
    label: 'Pendentes',
    icon: '⏳',
    color: '#b45309',
    bg: '#fef9c3',
    border: '#fde047',
  },
  {
    key: 'cancelled',
    label: 'Canceladas',
    icon: '❌',
    color: '#b91c1c',
    bg: '#fee2e2',
    border: '#fca5a5',
  },
];

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ done: 0, active: 0, pending: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessions = await getSessions();
        setStats({
          done:      sessions.filter((s) => s.status === 'done').length,
          active:    sessions.filter((s) => s.status === 'active').length,
          pending:   sessions.filter((s) => s.status === 'pending_payment').length,
          cancelled: sessions.filter((s) => s.status === 'cancelled' || s.status === 'no_show').length,
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const total = stats.done + stats.active + stats.pending + stats.cancelled;

  return (
    <div className="page">
      <div className="welcome-banner">
        <h1>Olá, {profile?.firstName}! 👋</h1>
        <p>Aqui tens um resumo do estado atual das sessões.</p>
        {!loading && total > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', marginBottom: '0.5rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
              {total} sessões no total
            </div>
            <div style={{ display: 'flex', height: '8px', borderRadius: '99px', overflow: 'hidden', gap: '2px' }}>
              {STATS_CONFIG.map((s) => {
                const pct = total ? (stats[s.key] / total) * 100 : 0;
                return pct > 0 ? (
                  <div key={s.key} style={{ width: `${pct}%`, background: s.border, borderRadius: '99px', transition: 'width 0.6s ease' }} title={`${s.label}: ${stats[s.key]}`} />
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-stats">
        {STATS_CONFIG.map((s) => (
          <div
            key={s.key}
            className="dashboard-stat-card"
            style={{ '--stat-color': s.color, '--stat-bg': s.bg, '--stat-border': s.border }}
          >
            <div className="dashboard-stat-icon">{s.icon}</div>
            <div className="dashboard-stat-value">{loading ? '—' : stats[s.key]}</div>
            <div className="dashboard-stat-label">{s.label}</div>
            {!loading && total > 0 && (
              <div className="dashboard-stat-bar">
                <div
                  className="dashboard-stat-bar-fill"
                  style={{ width: `${(stats[s.key] / total) * 100}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
