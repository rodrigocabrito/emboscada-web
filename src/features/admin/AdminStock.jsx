import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAmmoStocks } from '../../firebase/firestore';
import { CALIBERS } from '../../constants/sessions';

const STOCK_TYPES = [
  {
    key: 'bullets',
    label: 'Munições',
    description: 'Controlo de stock de munições e registo de uso por sessão.',
    icon: <img src="/paintball-balls.png" alt="Munições" style={{ width: '2rem', height: '2rem', objectFit: 'contain' }} />,
    active: true,
  },
  {
    key: 'marcadores',
    label: 'Marcadores',
    description: 'Gestão de marcadores e equipamento de paintball.',
    icon: <img src="/paintball-gun.png" alt="Marcadores" style={{ width: '2rem', height: '2rem', objectFit: 'contain' }} />,
    active: false,
  },
  {
    key: 'others',
    label: 'Outros',
    description: 'Outros tipos de material e equipamento.',
    icon: '📦',
    active: false,
  },
];

const fmtStock = (n) => {
  if (n === undefined || n === null) return '…';
  return n.toLocaleString('pt-PT');
};

const AdminStock = () => {
  const navigate = useNavigate();
  const [showCaliberModal, setShowCaliberModal] = useState(false);

  const { data: stocks = {} } = useQuery({
    queryKey: ['ammoStocks'],
    queryFn: getAmmoStocks,
    staleTime: 30_000,
    enabled: showCaliberModal,
  });

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-secondary" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate('/admin')}>
          ← Voltar
        </button>
        <h1>Stock</h1>
        <p>Seleciona o tipo de stock que queres gerir.</p>
      </div>

      <div className="admin-landing-grid">
        {STOCK_TYPES.map((t) => (
          <button
            key={t.key}
            className={`admin-landing-card${t.active ? '' : ' admin-landing-card--disabled'}`}
            onClick={() => t.active && (t.key === 'bullets' ? setShowCaliberModal(true) : null)}
            disabled={!t.active}
          >
            <span className="admin-landing-icon">{t.icon}</span>
            <span className="admin-landing-label">{t.label}</span>
            <span className="admin-landing-desc">{t.description}</span>
            {!t.active && <span className="admin-landing-soon">Em breve</span>}
          </button>
        ))}
      </div>

      {showCaliberModal && (
        <div className="modal-overlay" onClick={() => setShowCaliberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Selecionar calibre</h2>
              <button className="modal-close" onClick={() => setShowCaliberModal(false)} aria-label="Fechar">✕</button>
            </div>
            <div style={{ display: 'flex', gap: '1rem', padding: '1rem 0 0.5rem' }}>
              {CALIBERS.map((cal) => {
                const stock = stocks[cal];
                const color = stock > 10000 ? '#16a34a' : stock > 3000 ? '#d97706' : '#dc2626';
                return (
                  <button
                    key={cal}
                    type="button"
                    onClick={() => navigate(`/admin/stock/bullets?cal=${encodeURIComponent(cal)}`)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: '0.5rem', padding: '1.5rem 1rem',
                      background: 'var(--surface)', border: '2px solid var(--border)',
                      borderRadius: '0.75rem', cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--green-500)'; e.currentTarget.style.background = 'var(--surface-alt, var(--surface))'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
                  >
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{cal}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                      calibre
                    </span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1, marginTop: '0.25rem' }}>
                      {stock !== undefined ? fmtStock(stock) : '…'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>em stock</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStock;
