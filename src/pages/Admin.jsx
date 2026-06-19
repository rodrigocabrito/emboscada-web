import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    key: 'sessions',
    label: 'Sessões',
    description: 'Consulta, filtra e gere todas as sessões registadas.',
    icon: '📋',
    path: '/admin/sessions',
    active: true,
  },
  {
    key: 'users',
    label: 'Utilizadores',
    description: 'Criar, consultar e eliminar utilizadores da plataforma.',
    icon: '👥',
    path: '/admin/users',
    active: true,
  },
  {
    key: 'catalogo',
    label: 'Catálogo',
    description: 'Gerir packs, actividades e preços dos serviços.',
    icon: '🏷️',
    path: '/admin/catalog',
    active: true,
  },
  {
    key: 'stock',
    label: 'Stock',
    description: 'Controlo de material e equipamento disponível.',
    icon: '📦',
    path: null,
    active: false,
  },
  {
    key: 'schedule',
    label: 'Escala',
    description: 'Planeamento e gestão de turnos da equipa.',
    icon: '📅',
    path: null,
    active: false,
  },
  {
    key: 'other',
    label: 'Outros',
    description: 'Funcionalidades adicionais em breve.',
    icon: '🔧',
    path: null,
    active: false,
  },
];

const Admin = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="page-header">
        <h1>Painel de Administração</h1>
        <p>Bem-vindo, {profile?.firstName}. O que queres gerir hoje?</p>
      </div>

      <div className="admin-landing-grid">
        {FEATURES.map((f) => (
          <button
            key={f.key}
            className={`admin-landing-card${f.active ? '' : ' admin-landing-card--disabled'}`}
            onClick={() => f.active && f.path && navigate(f.path)}
            disabled={!f.active}
          >
            <span className="admin-landing-icon">{f.icon}</span>
            <span className="admin-landing-label">{f.label}</span>
            <span className="admin-landing-desc">{f.description}</span>
            {!f.active && <span className="admin-landing-soon">Em breve</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Admin;
