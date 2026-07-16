const LineItemsTable = ({ label, datalistId, items, draft, setDraft, catalogItems, subtotal, onUpdate, onRemove, onAddDraft }) => {
  const fmt = (n) => Number(n || 0).toFixed(2);

  return (
    <div className="session-detail-card">
      <div className="form-group" style={{ marginBottom: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <th style={{ fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem 0.2rem 0' }}>{label}</th>
              <th style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem', width: '90px' }}>Qtd</th>
              <th style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem', width: '90px' }}>€/un</th>
              <th style={{ width: '28px' }} />
            </tr>
          </thead>
          <tbody>
            {[...items, draft].map((item, idx) => {
              const isNew = idx === items.length;
              return (
                <tr key={idx}>
                  <td style={{ padding: '0.25rem 0.4rem 0.25rem 0' }}>
                    <input
                      type="text"
                      list={datalistId}
                      value={item.name}
                      placeholder="Escreve ou seleciona..."
                      onChange={(e) => {
                        const val = e.target.value;
                        const match = catalogItems.find((i) => i.name === val);
                        if (isNew) {
                          setDraft((d) => ({ ...d, name: val, unitPrice: match ? String(match.price) : d.unitPrice, catalogId: match?.id || '' }));
                        } else {
                          onUpdate(idx, { name: val, catalogId: match?.id || item.catalogId, unitPrice: match ? String(match.price) : item.unitPrice });
                        }
                      }}
                      onBlur={() => {
                        if (isNew && draft.name.trim()) {
                          onAddDraft({ catalogId: draft.catalogId || '', name: draft.name.trim(), quantity: draft.quantity, unitPrice: draft.unitPrice });
                          setDraft({ name: '', quantity: '', unitPrice: '' });
                        }
                      }}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.4rem' }}>
                    <input
                      type="number" min="0" step="1" value={item.quantity}
                      onChange={(e) => isNew ? setDraft((d) => ({ ...d, quantity: e.target.value })) : onUpdate(idx, { quantity: e.target.value })}
                      style={{ width: '100%', textAlign: 'center', borderColor: item.name && !item.quantity ? 'var(--error, #dc2626)' : undefined }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0.4rem' }}>
                    <input
                      type="number" min="0" step="0.01" value={item.unitPrice}
                      onChange={(e) => isNew ? setDraft((d) => ({ ...d, unitPrice: e.target.value })) : onUpdate(idx, { unitPrice: e.target.value })}
                      style={{ width: '100%', textAlign: 'center' }}
                    />
                  </td>
                  <td style={{ padding: '0.25rem 0', textAlign: 'center' }}>
                    {!isNew && (
                      <button type="button" onClick={() => onRemove(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                        <img src="/trash-squared.png" alt="Eliminar" style={{ width: '28px', height: '28px', display: 'block' }} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <datalist id={datalistId}>
          {catalogItems.map((i) => <option key={i.id} value={i.name} />)}
        </datalist>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
          Subtotal: <strong style={{ color: 'var(--text)' }}>{fmt(subtotal)} €</strong>
        </p>
      </div>
    </div>
  );
};

export default LineItemsTable;
