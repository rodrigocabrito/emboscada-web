import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { profile, isAdmin } = useAuth();

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
          <span className="stat-label">Eventos activos</span>
          <span className="stat-value">—</span>
          <span className="stat-sub">A carregar...</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Reservas</span>
          <span className="stat-value">—</span>
          <span className="stat-sub">A carregar...</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Clientes</span>
          <span className="stat-value">—</span>
          <span className="stat-sub">A carregar...</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
