import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, getSessions } from '../firebase/firestore';

const toDate = (ts) => {
  if (!ts) return new Date();
  if (ts?.toDate) return ts.toDate();
  return new Date(ts);
};

const Dashboard = () => {
  const { profile, isAdmin } = useAuth();
  const [monitorCount, setMonitorCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, sessions] = await Promise.all([getUsers(), getSessions()]);

        // Monitor count
        const monitors = users.filter((u) => u.role === 'monitor');
        setMonitorCount(monitors.length);

        // Session stats based on status
        const scheduled = sessions.filter((s) => s.status === 'active').length;
        setScheduledCount(scheduled);

        const pending = sessions.filter((s) => s.status === 'pending_payment').length;
        setPendingCount(pending);

        const cancelled = sessions.filter((s) => s.status === 'cancelled' || s.status === 'no_show').length;
        setCancelledCount(cancelled);
      } catch {
        // silently fail
      }
    };
    fetchData();
  }, []);

  return (
    <div className="page">
      <div className="welcome-banner">
        <h1>Olá, {profile?.firstName}! 👋</h1>
        <p>
          {isAdmin
            ? 'Bem-vindo ao painel de administração.'
            : 'Bem-vindo à tua área pessoal.'}
        </p>
      </div>

      <div className="card-grid">
        <div className="stat-card">
          <span className="stat-label">Sessões Agendadas</span>
          <span className="stat-value">{scheduledCount}</span>
          <span className="stat-sub">Futuras e pagas</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Sessões por confirmar</span>
          <span className="stat-value">{pendingCount}</span>
          <span className="stat-sub">Sem pagamento</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Sessões Canceladas</span>
          <span className="stat-value">{cancelledCount}</span>
          <span className="stat-sub">Passadas sem pagamento</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Monitores</span>
          <span className="stat-value">{monitorCount}</span>
          <span className="stat-sub">Da plataforma</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
