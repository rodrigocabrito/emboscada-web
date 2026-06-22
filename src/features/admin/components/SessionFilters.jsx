const SESSION_TYPES = ['Paintball', 'Paintball Kids', 'Laser Tag', 'Laser Tag Kids', 'Gel Blast', 'Bubble Football'];

const STATUS_OPTIONS = [
  { value: 'done', label: 'Feita' },
  { value: 'active', label: 'Ativa' },
  { value: 'pending_payment', label: 'Pendente' },
  { value: 'no_show', label: 'Não compareceu' },
  { value: 'cancelled', label: 'Cancelada' },
];

const STATUS_PALETTE = {
  done:            { idle: { bg: 'var(--green-100)', color: 'var(--green-700)', border: 'var(--green-200)' }, sel: { bg: 'var(--green-500)', color: '#fff', border: 'var(--green-500)' } },
  active:          { idle: { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' }, sel: { bg: '#1d4ed8', color: '#fff', border: '#1d4ed8' } },
  pending_payment: { idle: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' }, sel: { bg: '#d97706', color: '#fff', border: '#d97706' } },
  no_show:         { idle: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }, sel: { bg: '#dc2626', color: '#fff', border: '#dc2626' } },
  cancelled:       { idle: { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' }, sel: { bg: '#6b7280', color: '#fff', border: '#6b7280' } },
};

const TextFilter = ({ label, value, onCommit, onClear, onApply, outerStyle }) => (
  <div className="form-group" style={{ margin: 0, flex: '1 1 160px', ...outerStyle }}>
    <label>{label}</label>
    <div style={{ position: 'relative' }}>
      <input
        type="search"
        placeholder="—"
        value={value.draft}
        onChange={(e) => value.set(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { onCommit(value.draft); onApply(); } }}
        style={{ width: '100%', paddingRight: value.draft ? '2rem' : undefined }}
      />
      {value.draft && (
        <div style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)' }}>
          <button
            type="button"
            onClick={() => { value.set(''); onClear(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1, display: 'flex', alignItems: 'center' }}
            aria-label={`Limpar ${label}`}
          >✕</button>
        </div>
      )}
    </div>
  </div>
);

const SessionFilters = ({
  filters, setFilters,
  showAdvanced, setShowAdvanced,
  nameDraft, setNameDraft,
  emailDraft, setEmailDraft,
  phoneDraft, setPhoneDraft,
  hasFilters, onClearAll, onApply,
}) => {
  const applyText = (field, value, setDraft) => {
    setDraft(value);
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleChip = (field, value) => {
    setFilters((prev) => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const handleDateChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <TextFilter
          label="Nome"
          value={{ draft: nameDraft, set: setNameDraft }}
          onCommit={(v) => applyText('name', v, setNameDraft)}
          onClear={() => applyText('name', '', setNameDraft)}
          onApply={onApply}
        />
        <TextFilter
          label="Email"
          value={{ draft: emailDraft, set: setEmailDraft }}
          onCommit={(v) => applyText('email', v, setEmailDraft)}
          onClear={() => applyText('email', '', setEmailDraft)}
          onApply={onApply}
        />
        <TextFilter
          label="Telemóvel"
          value={{ draft: phoneDraft, set: setPhoneDraft }}
          onCommit={(v) => applyText('phoneNumber', v, setPhoneDraft)}
          onClear={() => applyText('phoneNumber', '', setPhoneDraft)}
          onApply={onApply}
        />
        <div className="form-group" style={{ margin: 0, flex: '1 1 130px' }}>
          <label>De</label>
          <input type="date" value={filters.dateFrom} onChange={(e) => handleDateChange('dateFrom', e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0, flex: '1 1 130px' }}>
          <label>Até</label>
          <input type="date" value={filters.dateTo} onChange={(e) => handleDateChange('dateTo', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          type="button"
          className={showAdvanced ? 'btn-primary' : 'btn-secondary'}
          style={{ width: 'auto', whiteSpace: 'nowrap', fontSize: '0.875rem', padding: '0.5rem 1rem', position: 'relative', marginTop: 0 }}
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? '- Filtros' : '+ Filtros'}
          {(filters.typeOfSession.length > 0 || filters.status.length > 0) && (
            <span style={{ marginLeft: '0.4rem', background: 'var(--primary)', color: '#fff', borderRadius: '999px', fontSize: '0.65rem', padding: '0.05rem 0.4rem', fontWeight: 700 }}>
              {filters.typeOfSession.length + filters.status.length}
            </span>
          )}
        </button>
        <button
          className="btn-secondary"
          style={{ width: 'auto', whiteSpace: 'nowrap', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          onClick={onClearAll}
          disabled={!hasFilters}
        >
          Limpar filtros
        </button>
        <button
          className="btn-primary"
          style={{ width: 'auto', whiteSpace: 'nowrap', fontSize: '0.875rem', padding: '0.5rem 1rem', marginLeft: 'auto', marginTop: 0 }}
          onClick={onApply}
        >
          Aplicar filtros
        </button>
      </div>

      {showAdvanced && (
        <div style={{ display: 'flex', gap: '2rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Tipo de Sessão</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {SESSION_TYPES.map((t) => {
                const sel = filters.typeOfSession.includes(t);
                return (
                  <button key={t} type="button" onClick={() => toggleChip('typeOfSession', t)} style={{
                    padding: '0.4rem 0.9rem', fontSize: '0.82rem', borderRadius: '999px', cursor: 'pointer',
                    border: `1.5px solid ${sel ? 'var(--green-500)' : 'var(--border)'}`,
                    background: sel ? 'var(--green-500)' : 'var(--surface)',
                    color: sel ? '#fff' : 'var(--text-muted)',
                    fontWeight: sel ? 600 : 400, transition: 'all 0.15s',
                  }}>{t}</button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Estado</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {STATUS_OPTIONS.map((s) => {
                const sel = filters.status.includes(s.value);
                const c = (STATUS_PALETTE[s.value] ?? STATUS_PALETTE.cancelled)[sel ? 'sel' : 'idle'];
                return (
                  <button key={s.value} type="button" onClick={() => toggleChip('status', s.value)} style={{
                    padding: '0.4rem 0.9rem', fontSize: '0.82rem', borderRadius: '999px', cursor: 'pointer',
                    border: `1.5px solid ${c.border}`,
                    background: c.bg, color: c.color,
                    fontWeight: sel ? 600 : 500, transition: 'all 0.15s',
                  }}>{s.label}</button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionFilters;
