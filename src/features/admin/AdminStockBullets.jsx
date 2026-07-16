import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAmmoStock, addAmmoRestock, setAmmoStockCount, deleteAmmoRestock, deleteAmmoCount, getAmmoRestocks, getSessionsWithAmmo } from '../../firebase/firestore';

const PERIODS = ['Dia', 'Mês', 'Ano'];

const fmtInput = (val) => {
  const digits = val.replace(/\D/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
const parseInput = (val) => parseInt(val.replace(/\D/g, ''), 10);

const sessionDate = (s) => {
  if (s.sessionDate) return s.sessionDate;
  if (s.sessionDatetime) {
    const d = s.sessionDatetime?.toDate?.() ?? new Date(s.sessionDatetime);
    return d.toISOString().slice(0, 10);
  }
  return null;
};

const groupUsage = (sessions, caliber, period) => {
  const map = {};
  for (const s of sessions) {
    if (s.caliber !== caliber) continue;
    const date = sessionDate(s);
    if (!date) continue;
    const key = period === 'Dia' ? date : period === 'Mês' ? date.slice(0, 7) : date.slice(0, 4);
    map[key] = (map[key] ?? 0) + (s.bulletsSpent ?? 0);
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, total]) => ({ key, total }));
};

const formatPeriodKey = (key, period) => {
  if (period === 'Dia') {
    return new Date(key + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  if (period === 'Mês') {
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  }
  return key;
};

const StockLevel = ({ stock, caliber }) => {
  const color = stock > 10000 ? '#16a34a' : stock > 3000 ? '#d97706' : '#dc2626';
  return (
    <div style={{ textAlign: 'center', padding: '1.5rem 2rem' }}>
      <div style={{ fontSize: '3rem', fontWeight: 800, color, lineHeight: 1 }}>
        {stock.toLocaleString('pt-PT')}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        munições {caliber} em stock
      </div>
    </div>
  );
};

const AdminStockBullets = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caliber = searchParams.get('cal') || '.50';
  const queryClient = useQueryClient();

  const [period, setPeriod] = useState('Dia');
  const [restockForm, setRestockForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), note: '' });
  const [countForm, setCountForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), note: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingCount, setSavingCount] = useState(false);
  const [savedCount, setSavedCount] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, amount, note, date, isCount }
  const [deleting, setDeleting] = useState(false);

  const { data: currentStock = 0 } = useQuery({
    queryKey: ['ammoStock', caliber],
    queryFn: () => getAmmoStock(caliber),
    staleTime: 30_000,
  });
  const { data: restocks = [] } = useQuery({
    queryKey: ['ammoRestocks', caliber],
    queryFn: () => getAmmoRestocks(caliber),
    staleTime: 30_000,
  });
  const { data: ammoSessions = [] } = useQuery({
    queryKey: ['sessionsWithAmmo'],
    queryFn: getSessionsWithAmmo,
    staleTime: 60_000,
  });

  const usageRows = groupUsage(ammoSessions, caliber, period);
const invalidateAmmo = () => {
    queryClient.invalidateQueries({ queryKey: ['ammoStock', caliber] });
    queryClient.invalidateQueries({ queryKey: ['ammoRestocks', caliber] });
    queryClient.invalidateQueries({ queryKey: ['ammoStocks'] });
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    const amount = parseInput(restockForm.amount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      await addAmmoRestock(amount, restockForm.date, restockForm.note, caliber);
      invalidateAmmo();
      setRestockForm({ amount: '', date: new Date().toISOString().slice(0, 10), note: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCount = async (e) => {
    e.preventDefault();
    const amount = parseInput(countForm.amount);
    if (amount === undefined || isNaN(amount) || amount < 0) return;
    setSavingCount(true);
    try {
      await setAmmoStockCount(amount, countForm.date, countForm.note, caliber);
      invalidateAmmo();
      setCountForm({ amount: '', date: new Date().toISOString().slice(0, 10), note: '' });
      setSavedCount(true);
      setTimeout(() => setSavedCount(false), 3000);
    } finally {
      setSavingCount(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-secondary" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate('/admin/stock')}>
          ← Voltar
        </button>
        <h1>Munições <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>{caliber}</span></h1>
        <p>Controlo de munições em stock e registo de uso por sessão.</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Left column */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div className="card">
            <StockLevel stock={currentStock} caliber={caliber} />
          </div>

          <div className="card">
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Adicionar stock
            </p>
            <form onSubmit={handleRestock}>
              <div className="form-group">
                <label htmlFor="amount">Quantidade</label>
                <input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 10 000"
                  value={restockForm.amount}
                  onChange={(e) => setRestockForm((p) => ({ ...p, amount: fmtInput(e.target.value) }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="restockDate">Data</label>
                <input
                  id="restockDate"
                  type="date"
                  value={restockForm.date}
                  onChange={(e) => setRestockForm((p) => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="restockNote">Nota (opcional)</label>
                <input
                  id="restockNote"
                  type="text"
                  placeholder="Ex: Compra ao fornecedor X"
                  value={restockForm.note}
                  onChange={(e) => setRestockForm((p) => ({ ...p, note: e.target.value }))}
                />
              </div>
              {saved && <div className="success-msg" style={{ marginBottom: '0.75rem' }}><span>✓</span> Stock atualizado</div>}
              <button type="submit" className="btn-primary" style={{ marginTop: 0, width: '100%' }} disabled={saving}>
                {saving ? 'A guardar...' : '+ Adicionar munições'}
              </button>
            </form>
          </div>

          <div className="card">
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Contagem de stock
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Substitui o valor atual pelo resultado da contagem manual.
            </p>
            <form onSubmit={handleCount}>
              <div className="form-group">
                <label htmlFor="countAmount">Quantidade contada</label>
                <input
                  id="countAmount"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 50 000"
                  value={countForm.amount}
                  onChange={(e) => setCountForm((p) => ({ ...p, amount: fmtInput(e.target.value) }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="countDate">Data</label>
                <input
                  id="countDate"
                  type="date"
                  value={countForm.date}
                  onChange={(e) => setCountForm((p) => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="countNote">Nota (opcional)</label>
                <input
                  id="countNote"
                  type="text"
                  placeholder="Ex: Contagem mensal"
                  value={countForm.note}
                  onChange={(e) => setCountForm((p) => ({ ...p, note: e.target.value }))}
                />
              </div>
              {savedCount && <div className="success-msg" style={{ marginBottom: '0.75rem' }}><span>✓</span> Stock atualizado</div>}
              <button type="submit" className="btn-primary" style={{ marginTop: 0, width: '100%' }} disabled={savingCount}>
                {savingCount ? 'A guardar...' : '= Atualizar stock'}
              </button>
            </form>
          </div>

          {restocks.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: 0 }}>
                  Histórico
                </p>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Qtd.</th>
                    <th>Nota</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {restocks.map((r) => (
                    <tr key={r.id}>
                      <td className="td-muted" style={{ whiteSpace: 'nowrap' }}>
                        {new Date(r.date + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ fontWeight: 700, color: r.type === 'count' ? '#2563eb' : r.amount >= 0 ? '#16a34a' : '#dc2626' }}>
                        {r.type === 'count' ? '= ' : r.amount >= 0 ? '+' : ''}{r.amount.toLocaleString('pt-PT')}
                      </td>
                      <td className="td-muted">{r.note || '—'}</td>
                      <td style={{ width: '32px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ ...r, isCount: r.type === 'count' })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.1rem 0.3rem', borderRadius: '0.25rem' }}
                          title="Eliminar registo"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column — usage */}
        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: 0 }}>
                Munições usadas
              </p>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    style={{
                      padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderRadius: '0.35rem', cursor: 'pointer',
                      border: `1.5px solid ${period === p ? 'var(--green-500)' : 'var(--border)'}`,
                      background: period === p ? 'var(--green-500)' : 'var(--surface)',
                      color: period === p ? '#fff' : 'var(--text-muted)',
                      fontWeight: period === p ? 600 : 400,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {usageRows.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Sem registos de munições gastas.
              </p>
            ) : (
              <table className="data-table">
                <tbody>
                  {usageRows.map(({ key, total }) => (
                    <tr key={key}>
                      <td>{formatPeriodKey(key, period)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                        {total.toLocaleString('pt-PT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Eliminar registo</h2>
              <button className="modal-close" onClick={() => setDeleteTarget(null)} disabled={deleting} aria-label="Fechar">✕</button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0 0.25rem' }}>
              Tens a certeza que queres eliminar este registo?
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.5rem' }}>
              O stock será revertido automaticamente.
            </p>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#dc2626' }}
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    if (deleteTarget.isCount) {
                      await deleteAmmoCount(deleteTarget.id, caliber);
                    } else {
                      await deleteAmmoRestock(deleteTarget.id, caliber);
                    }
                    invalidateAmmo();
                    setDeleteTarget(null);
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? 'A eliminar...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStockBullets;
