const PAYMENT_TYPES = [
  { value: 'card', label: 'Cartão', icon: '/visa.png' },
  { value: 'mbway', label: 'MBWay', icon: '/mbway.png' },
  { value: 'cash', label: 'Dinheiro', icon: '/cash.png' },
];

const fmt = (n) => Number(n || 0).toFixed(2);

const PaymentModal = ({ form, financials, onChange, onTogglePaymentType, onClose, onPay }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
      <div className="modal-header">
        <h2 className="modal-title">Pagamento</h2>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
      </div>

      <div className="financial-summary" style={{ marginBottom: '1.25rem' }}>
        <div className="financial-summary-title">Resumo</div>
        <div className="financial-row"><span>Packs</span><span>{fmt(financials.packsTotal)} €</span></div>
        {financials.extrasTotal > 0 && <div className="financial-row"><span>Extras</span><span>{fmt(financials.extrasTotal)} €</span></div>}
        {financials.othersTotal > 0 && <div className="financial-row"><span>Outros</span><span>{fmt(financials.othersTotal)} €</span></div>}
        <div className="financial-row financial-row--deduct"><span>Sinal</span><span>− {fmt(financials.signalAmount)} €</span></div>
        <div className="financial-row financial-row--total"><span>Total</span><span>{fmt(financials.total)} €</span></div>
      </div>

      <div className="form-group">
        <label htmlFor="signal">Sinal (€)</label>
        <input id="signal" name="signal" type="number" min="0" step="0.01" value={form.signal} onChange={onChange} style={{ maxWidth: '140px' }} />
      </div>

      <div className="form-group">
        <label>Tipo de Pagamento</label>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
          <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            {PAYMENT_TYPES.map((pt) => {
              const selected = form.paymentTypes.includes(pt.value);
              return (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => onTogglePaymentType(pt.value)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', userSelect: 'none', background: 'none', border: 'none', padding: 0 }}
                >
                  <div style={{
                    width: '100%', height: '64px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: selected ? 'var(--primary-light, #d1fae5)' : 'var(--bg)',
                    border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}>
                    <img src={pt.icon} alt={pt.label} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: selected ? 'var(--primary)' : 'var(--text-muted)' }}>{pt.label}</span>
                </button>
              );
            })}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {form.paymentTypes.includes('cash') && (() => {
              const troco = (parseFloat(form.cashPaid) || 0) - financials.total;
              return (
                <div style={{ width: '100%', marginTop: '-14px' }}>
                  <label htmlFor="cashPaid" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Montante Recebido</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      id="cashPaid" name="cashPaid" type="number" min="0" step="0.01"
                      value={form.cashPaid} onChange={onChange} placeholder="0.00"
                      style={{ width: '100%', paddingRight: form.cashPaid !== '' ? '5rem' : undefined }}
                    />
                    {form.cashPaid !== '' && (
                      <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                        Troco: <strong style={{ color: troco >= 0 ? 'var(--success, #16a34a)' : 'var(--error, #dc2626)' }}>
                          {troco >= 0 ? fmt(troco) : `−${fmt(Math.abs(troco))}`} €
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onClose}>Fechar</button>
        <button type="button" className="btn-primary" onClick={onPay}>Pagar</button>
      </div>
    </div>
  </div>
);

export default PaymentModal;
