import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, updateSession, getUsers, getCatalogItems } from '../firebase/firestore';
import useScrollLock from '../hooks/useScrollLock';
import useEscapeKey from '../hooks/useEscapeKey';

const SESSION_TYPES = ['Paintball', 'Paintball Kids', 'Laser Tag', 'Laser Tag Kids', 'Gel Blast', 'Bubble Football'];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => [
  `${String(i).padStart(2, '0')}:00`,
  `${String(i).padStart(2, '0')}:30`,
]).flat().filter((t) => t >= '08:00' && t <= '19:30');

const STATUS_OPTIONS = [
  { value: 'done', label: 'Feita' },
  { value: 'active', label: 'Ativa' },
  { value: 'pending_payment', label: 'Pendente' },
  { value: 'no_show', label: 'Não compareceu' },
  { value: 'cancelled', label: 'Cancelada' },
];

const PAYMENT_TYPES = [
  { value: 'card', label: 'Cartão', icon: '/visa.png' },
  { value: 'mbway', label: 'MBWay', icon: '/mbway.png' },
  { value: 'cash', label: 'Dinheiro', icon: '/cash.png' },
];

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'done': return 'badge-success';
    case 'active': return 'badge-active';
    case 'pending_payment': return 'badge-pending';
    case 'no_show': return 'badge-danger';
    case 'cancelled': return 'badge-default';
    default: return 'badge-default';
  }
};

const fmt = (n) => Number(n || 0).toFixed(2);

const defaultNumPacks = (actual, expected) => {
  const n = parseInt(actual) > 0 ? parseInt(actual) : parseInt(expected) || 0;
  return String(Math.max(n > 0 ? n : 0, n > 0 ? 10 : 0));
};

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [users, setUsers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [monitorSearch, setMonitorSearch] = useState('');
  const [draftExtra, setDraftExtra] = useState({ name: '', quantity: '', unitPrice: '' });
  const [draftOther, setDraftOther] = useState({ name: '', quantity: '', unitPrice: '' });
  const [payModal, setPayModal] = useState(false);
  const [confirmPayModal, setConfirmPayModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, u, catalog] = await Promise.all([getSession(id), getUsers(), getCatalogItems()]);
        if (!s) { navigate('/sessions', { replace: true }); return; }
        setSession(s);
        setUsers(u);
        setCatalogItems(catalog);
        const numPlayers = s.expectedNumberOfPlayers ?? s.numberOfPlayers ?? 0;
        setForm({
          spocName: s.spocName || s.spoc || '',
          spocEmail: s.spocEmail || '',
          spocPhoneNumber: s.spocPhoneNumber || '',
          expectedNumberOfPlayers: numPlayers || '',
          actualNumberOfPlayers: s.actualNumberOfPlayers !== undefined ? String(s.actualNumberOfPlayers) : '',
          sessionDate: s.sessionDate || '',
          sessionTime: s.sessionTime || '',
          typeOfSession: s.typeOfSession || '',
          caliber: s.caliber || '',
          status: s.status || 'pending_payment',
          additionalComments: s.additionalComments || '',
          monitors: s.monitors || [],
          // financial
          packId: s.packId || '',
          packName: s.packName || '',
          numPacks: s.numPacks !== undefined ? String(s.numPacks) : defaultNumPacks(s.actualNumberOfPlayers, numPlayers),
          packPrice: s.packPrice !== undefined ? String(s.packPrice) : '',
          extras: s.extras || [],
          others: s.others || [],
          signal: s.signal !== undefined ? String(s.signal) : String(numPlayers >= 15 ? 80 : 50),
          paymentTypes: s.paymentTypes || [],
          cashPaid: s.cashPaid !== undefined ? String(s.cashPaid) : '',
        });
      } catch {
        setError('Erro ao carregar sessão.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const sortedCatalog = useMemo(() =>
    [...catalogItems].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)),
    [catalogItems]
  );

  const packItems = useMemo(() =>
    sortedCatalog.filter((i) => i.category === form?.typeOfSession && i.active !== false),
    [sortedCatalog, form?.typeOfSession]
  );

  const extraItems = useMemo(() =>
    sortedCatalog.filter((i) => i.category === 'Extras' && i.active !== false),
    [sortedCatalog]
  );

  const otherItems = useMemo(() =>
    sortedCatalog.filter((i) => i.category === 'Outro' && i.active !== false),
    [sortedCatalog]
  );

  const financials = useMemo(() => {
    if (!form) return {};
    const packsTotal = (parseFloat(form.numPacks) || 0) * (parseFloat(form.packPrice) || 0);
    const extrasTotal = (form.extras || []).reduce(
      (sum, e) => sum + (parseFloat(e.quantity) || 0) * (parseFloat(e.unitPrice) || 0), 0
    );
    const othersTotal = (form.others || []).reduce(
      (sum, o) => sum + (parseFloat(o.quantity) || 0) * (parseFloat(o.unitPrice) || 0), 0
    );
    const signalAmount = parseFloat(form.signal) || 0;
    const total = packsTotal + extrasTotal + othersTotal - signalAmount;
    return { packsTotal, extrasTotal, othersTotal, signalAmount, total };
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'typeOfSession' && value !== 'Paintball' && value !== 'Paintball Kids') next.caliber = '';
      if (name === 'typeOfSession') { next.packId = ''; next.packName = ''; next.packPrice = ''; }
      if (name === 'expectedNumberOfPlayers' && prev.signal === String((prev.expectedNumberOfPlayers || 0) >= 15 ? 80 : 50)) {
        next.signal = String(parseInt(value) >= 15 ? 80 : 50);
      }
      if (name === 'actualNumberOfPlayers') {
        next.numPacks = defaultNumPacks(value, prev.expectedNumberOfPlayers);
      }
      return next;
    });
    setDirty(true);
  };

  const handlePackSelect = (packId) => {
    const pack = catalogItems.find((i) => i.id === packId);
    setForm((prev) => ({
      ...prev,
      packId: packId,
      packName: pack?.name || '',
      packPrice: pack ? String(pack.price) : '',
    }));
    setDirty(true);
  };


  const updateExtra = (idx, field, value) => {
    setForm((prev) => {
      const extras = [...prev.extras];
      extras[idx] = { ...extras[idx], [field]: value };
      return { ...prev, extras };
    });
    setDirty(true);
  };

  const removeExtra = (idx) => {
    setForm((prev) => ({ ...prev, extras: prev.extras.filter((_, i) => i !== idx) }));
    setDirty(true);
  };


  const updateOther = (idx, field, value) => {
    setForm((prev) => {
      const others = [...prev.others];
      others[idx] = { ...others[idx], [field]: value };
      return { ...prev, others };
    });
    setDirty(true);
  };

  const removeOther = (idx) => {
    setForm((prev) => ({ ...prev, others: prev.others.filter((_, i) => i !== idx) }));
    setDirty(true);
  };

  const toggleMonitor = (uid) => {
    setForm((prev) => ({
      ...prev,
      monitors: prev.monitors.includes(uid)
        ? prev.monitors.filter((m) => m !== uid)
        : [...prev.monitors, uid],
    }));
    setDirty(true);
  };

  const togglePaymentType = (value) => {
    setForm((prev) => ({
      ...prev,
      paymentTypes: prev.paymentTypes.includes(value)
        ? prev.paymentTypes.filter((p) => p !== value)
        : [...prev.paymentTypes, value],
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      await updateSession(id, {
        spocName: form.spocName,
        spocEmail: form.spocEmail,
        spocPhoneNumber: form.spocPhoneNumber,
        expectedNumberOfPlayers: parseInt(form.expectedNumberOfPlayers, 10),
        actualNumberOfPlayers: form.actualNumberOfPlayers !== '' ? parseInt(form.actualNumberOfPlayers, 10) : null,
        sessionDate: form.sessionDate,
        sessionTime: form.sessionTime,
        sessionDatetime: `${form.sessionDate}T${form.sessionTime}`,
        typeOfSession: form.typeOfSession,
        caliber: (form.typeOfSession === 'Paintball' || form.typeOfSession === 'Paintball Kids') ? form.caliber : '',
        status: form.status,
        additionalComments: form.additionalComments,
        monitors: form.monitors,
        packId: form.packId,
        packName: form.packName,
        numPacks: parseFloat(form.numPacks) || 0,
        packPrice: parseFloat(form.packPrice) || 0,
        extras: form.extras.map((e) => ({ ...e, quantity: parseFloat(e.quantity) || 0, unitPrice: parseFloat(e.unitPrice) || 0 })),
        others: form.others.map((o) => ({ ...o, quantity: parseFloat(o.quantity) || 0, unitPrice: parseFloat(o.unitPrice) || 0 })),
        signal: parseFloat(form.signal) || 0,
        paymentTypes: form.paymentTypes,
        cashPaid: form.paymentTypes.includes('cash') ? (parseFloat(form.cashPaid) || 0) : null,
        total: financials.total,
      });
      setSession((prev) => ({ ...prev, ...form }));
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Erro ao guardar sessão. Tenta novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    const numPlayers = session.expectedNumberOfPlayers ?? session.numberOfPlayers ?? 0;
    setForm({
      spocName: session.spocName || session.spoc || '',
      spocEmail: session.spocEmail || '',
      spocPhoneNumber: session.spocPhoneNumber || '',
      expectedNumberOfPlayers: numPlayers || '',
      actualNumberOfPlayers: session.actualNumberOfPlayers !== undefined ? String(session.actualNumberOfPlayers) : '',
      sessionDate: session.sessionDate || '',
      sessionTime: session.sessionTime || '',
      typeOfSession: session.typeOfSession || '',
      caliber: session.caliber || '',
      status: session.status || 'pending_payment',
      additionalComments: session.additionalComments || '',
      monitors: session.monitors || [],
      packId: session.packId || '',
      packName: session.packName || '',
      numPacks: session.numPacks !== undefined ? String(session.numPacks) : defaultNumPacks(session.actualNumberOfPlayers, numPlayers),
      packPrice: session.packPrice !== undefined ? String(session.packPrice) : '',
      extras: session.extras || [],
      others: session.others || [],
      signal: session.signal !== undefined ? String(session.signal) : String(numPlayers >= 15 ? 80 : 50),
      paymentTypes: session.paymentTypes || [],
      cashPaid: session.cashPaid !== undefined ? String(session.cashPaid) : '',
    });
    setDirty(false);
    setDraftExtra({ name: '', quantity: '', unitPrice: '' });
    setDraftOther({ name: '', quantity: '', unitPrice: '' });
  };

  useScrollLock(payModal);
  useScrollLock(confirmPayModal);
  useEscapeKey(() => setPayModal(false), payModal);
  useEscapeKey(() => setConfirmPayModal(false), confirmPayModal);

  if (loading) return <div className="page"><p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '3rem' }}>A carregar…</p></div>;
  if (!form) return <div className="page"><p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '3rem' }}>Sessão não encontrada.</p></div>;

  const monitorUsers = users.filter((u) => u.role === 'monitor' || u.role === 'admin');

  return (
    <div className="page page-session-detail">
      <div className="page-header" style={{ border: 'none', paddingBottom: 0, marginBottom: '1rem' }}>
        <button className="btn-secondary" style={{ width: 'auto' }} onClick={() => navigate('/sessions', { state: { returnDate: form.sessionDate } })}>
          ← Voltar
        </button>
      </div>

      <div className="session-detail-layout">

        {/* ── Card 1: Sessão ── */}
        <div className="session-detail-card">
          <div className="form-group">
            <label htmlFor="spocName">Responsável (Cliente)</label>
            <input id="spocName" name="spocName" type="text" value={form.spocName} onChange={handleChange} placeholder="Nome do responsável" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="spocEmail">Email</label>
              <input id="spocEmail" name="spocEmail" type="email" value={form.spocEmail} onChange={handleChange} placeholder="email@exemplo.com" />
            </div>
            <div className="form-group">
              <label htmlFor="spocPhoneNumber">Telemóvel</label>
              <input id="spocPhoneNumber" name="spocPhoneNumber" type="tel" value={form.spocPhoneNumber} onChange={handleChange} placeholder="9XX XXX XXX" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expectedNumberOfPlayers">Nº de Jogadores (Esperado)</label>
              <input id="expectedNumberOfPlayers" name="expectedNumberOfPlayers" type="number" min="1" value={form.expectedNumberOfPlayers} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="actualNumberOfPlayers">Nº de Jogadores (Real)</label>
              <input id="actualNumberOfPlayers" name="actualNumberOfPlayers" type="number" min="0" value={form.actualNumberOfPlayers} onChange={handleChange} placeholder="—" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sessionDate">Data</label>
              <input id="sessionDate" name="sessionDate" type="date" value={form.sessionDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="sessionTime">Hora</label>
              <select id="sessionTime" name="sessionTime" value={form.sessionTime} onChange={handleChange} className="form-select" required>
                <option value="">-- Selecionar hora --</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="typeOfSession">Tipo de Sessão</label>
            <select id="typeOfSession" name="typeOfSession" value={form.typeOfSession} onChange={handleChange} className="form-select" required>
              <option value="">-- Selecionar tipo --</option>
              {SESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {(form.typeOfSession === 'Paintball' || form.typeOfSession === 'Paintball Kids') && (
            <div className="form-group">
              <label>Calibre</label>
              <div className="caliber-toggle">
                {['.50', '.68'].map((c) => (
                  <button key={c} type="button" className={`caliber-btn${form.caliber === c ? ' active' : ''}`}
                    onClick={() => { setForm((prev) => ({ ...prev, caliber: c })); setDirty(true); }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Estado da Sessão</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {STATUS_OPTIONS.map((s) => (
                <button key={s.value} type="button" onClick={() => { setForm((prev) => ({ ...prev, status: s.value })); setDirty(true); }}
                  className={`badge ${getStatusBadgeClass(s.value)}`}
                  style={{ cursor: 'pointer', border: 'none', fontSize: '0.78rem', padding: '0.25rem 0.6rem', opacity: form.status === s.value ? 1 : 0.5, boxShadow: form.status === s.value ? '0 0 0 2px rgba(0,0,0,0.2)' : 'none', transform: form.status === s.value ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.15s ease' }}>
                  {form.status === s.value ? '✓ ' : ''}{s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="additionalComments">Comentários adicionais</label>
            <textarea id="additionalComments" name="additionalComments" value={form.additionalComments} onChange={handleChange} className="form-textarea" placeholder="Notas, requisitos especiais..." rows={3} />
          </div>

          <div className="form-group">
            <label>Monitores</label>
            <input type="text" value={monitorSearch} onChange={(e) => setMonitorSearch(e.target.value)} placeholder="Pesquisa por nome ou alcunha..." style={{ marginBottom: '0.5rem' }} />
            {(() => {
              const visible = monitorUsers.filter((u) => {
                if (form.monitors.includes(u.uuid)) return true;
                if (!monitorSearch) return false;
                const q = monitorSearch.toLowerCase();
                return `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || (u.nickname || '').toLowerCase().includes(q);
              });
              if (!visible.length) return null;
              return (
                <div className="monitors-checklist">
                  {visible.map((u) => (
                    <div key={u.uuid} className="form-checkbox-item">
                      <input id={`monitor-${u.uuid}`} type="checkbox" checked={form.monitors.includes(u.uuid)} onChange={() => toggleMonitor(u.uuid)} />
                      <label htmlFor={`monitor-${u.uuid}`}>{u.firstName} {u.lastName}{u.nickname ? ` (${u.nickname})` : ''}</label>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>{/* end card 1 */}

        {/* ── Right column ── */}
        <div className="session-detail-right-col">

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ── Card 2: Pack ── */}
          <div className="session-detail-card">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th style={{ fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem 0.2rem 0' }}>Pack</th>
                    <th style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem', width: '90px' }}>Qtd</th>
                    <th style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem', width: '90px' }}>€/un</th>
                    <th style={{ width: '28px' }} />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.25rem 0.4rem 0.25rem 0' }}>
                      {!form.typeOfSession ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--error, #dc2626)', fontStyle: 'italic' }}>Selecione o tipo de sessão</span>
                      ) : (
                        <select id="packId" value={form.packId} onChange={(e) => handlePackSelect(e.target.value)} className="form-select" style={{ width: '100%' }}>
                          <option value="">-- Selecionar pack --</option>
                          {packItems.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '0.25rem 0.4rem' }}>
                      <input id="numPacks" name="numPacks" type="number" min="10" step="1" value={form.numPacks} onChange={handleChange} onBlur={(e) => { const v = parseInt(e.target.value) || 0; if (v > 0 && v < 10) setForm((p) => ({ ...p, numPacks: '10' })); }} style={{ width: '100%', textAlign: 'center', borderColor: form.packId && !form.numPacks ? 'var(--error, #dc2626)' : undefined }} />
                    </td>
                    <td style={{ padding: '0.25rem 0.4rem' }}>
                      <input id="packPrice" name="packPrice" type="number" min="0" step="0.01" value={form.packPrice} onChange={handleChange} style={{ width: '100%', textAlign: 'center' }} />
                    </td>
                    <td style={{ width: '28px' }} />
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
              Subtotal: <strong style={{ color: 'var(--text)' }}>{fmt(financials.packsTotal)} €</strong>
            </p>
          </div>{/* end card 2 */}

          {/* ── Card 3: Extras ── */}
          <div className="session-detail-card">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th style={{ fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem 0.2rem 0' }}>Extras</th>
                    <th style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem', width: '90px' }}>Qtd</th>
                    <th style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem', width: '90px' }}>€/un</th>
                    <th style={{ width: '28px' }} />
                  </tr>
                </thead>
                <tbody>
                  {[...form.extras, draftExtra].map((extra, idx) => {
                    const isNew = idx === form.extras.length;
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '0.25rem 0.4rem 0.25rem 0' }}>
                          <input
                            type="text"
                            list="extra-datalist"
                            value={extra.name}
                            placeholder="Escreve ou seleciona..."
                            onChange={(e) => {
                              const val = e.target.value;
                              const match = extraItems.find((i) => i.name === val);
                              if (isNew) {
                                setDraftExtra((d) => ({ ...d, name: val, unitPrice: match ? String(match.price) : d.unitPrice, catalogId: match?.id || '' }));
                              } else {
                                setForm((prev) => { const arr = [...prev.extras]; arr[idx] = { ...arr[idx], name: val, catalogId: match?.id || arr[idx].catalogId, unitPrice: match ? String(match.price) : arr[idx].unitPrice }; return { ...prev, extras: arr }; });
                                setDirty(true);
                              }
                            }}
                            onBlur={() => {
                              if (isNew && draftExtra.name.trim()) {
                                setForm((prev) => ({ ...prev, extras: [...prev.extras, { catalogId: draftExtra.catalogId || '', name: draftExtra.name.trim(), quantity: draftExtra.quantity, unitPrice: draftExtra.unitPrice }] }));
                                setDraftExtra({ name: '', quantity: '', unitPrice: '' });
                                setDirty(true);
                              }
                            }}
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td style={{ padding: '0.25rem 0.4rem' }}>
                          <input type="number" min="0" step="1" value={extra.quantity}
                            onChange={(e) => isNew ? setDraftExtra((d) => ({ ...d, quantity: e.target.value })) : updateExtra(idx, 'quantity', e.target.value)}
                            style={{ width: '100%', textAlign: 'center', borderColor: extra.name && !extra.quantity ? 'var(--error, #dc2626)' : undefined }} />
                        </td>
                        <td style={{ padding: '0.25rem 0.4rem' }}>
                          <input type="number" min="0" step="0.01" value={extra.unitPrice}
                            onChange={(e) => isNew ? setDraftExtra((d) => ({ ...d, unitPrice: e.target.value })) : updateExtra(idx, 'unitPrice', e.target.value)}
                            style={{ width: '100%', textAlign: 'center' }} />
                        </td>
                        <td style={{ padding: '0.25rem 0', textAlign: 'center' }}>
                          {!isNew && <button type="button" onClick={() => removeExtra(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}><img src="/trash-squared.png" alt="Eliminar" style={{ width: '28px', height: '28px', display: 'block' }} /></button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <datalist id="extra-datalist">
                {extraItems.map((i) => <option key={i.id} value={i.name} />)}
              </datalist>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                Subtotal: <strong style={{ color: 'var(--text)' }}>{fmt(financials.extrasTotal)} €</strong>
              </p>
            </div>
          </div>{/* end card 3 */}

          {/* ── Card 4: Outros ── */}
          <div className="session-detail-card">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th style={{ fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem 0.2rem 0' }}>Outros</th>
                    <th style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem', width: '90px' }}>Qtd</th>
                    <th style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem', width: '90px' }}>€/un</th>
                    <th style={{ width: '28px' }} />
                  </tr>
                </thead>
                <tbody>
                  {[...form.others, draftOther].map((other, idx) => {
                    const isNew = idx === form.others.length;
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '0.25rem 0.4rem 0.25rem 0' }}>
                          <input
                            type="text"
                            list="other-datalist"
                            value={other.name}
                            placeholder="Escreve ou seleciona..."
                            onChange={(e) => {
                              const val = e.target.value;
                              const match = otherItems.find((i) => i.name === val);
                              if (isNew) {
                                setDraftOther((d) => ({ ...d, name: val, unitPrice: match ? String(match.price) : d.unitPrice, catalogId: match?.id || '' }));
                              } else {
                                setForm((prev) => { const arr = [...prev.others]; arr[idx] = { ...arr[idx], name: val, catalogId: match?.id || arr[idx].catalogId, unitPrice: match ? String(match.price) : arr[idx].unitPrice }; return { ...prev, others: arr }; });
                                setDirty(true);
                              }
                            }}
                            onBlur={() => {
                              if (isNew && draftOther.name.trim()) {
                                setForm((prev) => ({ ...prev, others: [...prev.others, { catalogId: draftOther.catalogId || '', name: draftOther.name.trim(), quantity: draftOther.quantity, unitPrice: draftOther.unitPrice }] }));
                                setDraftOther({ name: '', quantity: '', unitPrice: '' });
                                setDirty(true);
                              }
                            }}
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td style={{ padding: '0.25rem 0.4rem' }}>
                          <input type="number" min="0" step="1" value={other.quantity}
                            onChange={(e) => isNew ? setDraftOther((d) => ({ ...d, quantity: e.target.value })) : updateOther(idx, 'quantity', e.target.value)}
                            style={{ width: '100%', textAlign: 'center', borderColor: other.name && !other.quantity ? 'var(--error, #dc2626)' : undefined }} />
                        </td>
                        <td style={{ padding: '0.25rem 0.4rem' }}>
                          <input type="number" min="0" step="0.01" value={other.unitPrice}
                            onChange={(e) => isNew ? setDraftOther((d) => ({ ...d, unitPrice: e.target.value })) : updateOther(idx, 'unitPrice', e.target.value)}
                            style={{ width: '100%', textAlign: 'center' }} />
                        </td>
                        <td style={{ padding: '0.25rem 0', textAlign: 'center' }}>
                          {!isNew && <button type="button" onClick={() => removeOther(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}><img src="/trash-squared.png" alt="Eliminar" style={{ width: '28px', height: '28px', display: 'block' }} /></button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <datalist id="other-datalist">
                {otherItems.map((i) => <option key={i.id} value={i.name} />)}
              </datalist>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                Subtotal: <strong style={{ color: 'var(--text)' }}>{fmt(financials.othersTotal)} €</strong>
              </p>
            </div>
          </div>{/* end card 4 */}

          {/* ── Card 5: Resumo ── */}
          <div className="session-detail-card">
            <div className="financial-summary">
              <div className="financial-summary-title">Resumo</div>
              <div className="financial-row"><span>Packs</span><span>{fmt(financials.packsTotal)} €</span></div>
              {financials.extrasTotal > 0 && <div className="financial-row"><span>Extras</span><span>{fmt(financials.extrasTotal)} €</span></div>}
              {financials.othersTotal > 0 && <div className="financial-row"><span>Outros</span><span>{fmt(financials.othersTotal)} €</span></div>}
              <div className="financial-row financial-row--deduct"><span>Sinal</span><span>− {fmt(financials.signalAmount)} €</span></div>
              <div className="financial-row financial-row--total"><span>Total</span><span>{fmt(financials.total)} €</span></div>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={() => session.status === 'done' ? setConfirmPayModal(true) : setPayModal(true)}
            >
              {session.status === 'done' && <img src="/green-check.png" alt="" style={{ width: '18px', height: '18px' }} />}
              {session.status === 'done' ? 'Pago' : 'Pagar'}
            </button>
          </div>{/* end card 5 */}

          </div>{/* end financial items col */}

        </div>{/* end right col */}
      </div>{/* end layout */}

      {error && <div className="error-msg" style={{ marginTop: '1rem' }}><span>⚠</span> {error}</div>}

      {/* ── Confirm reopen payment modal ── */}
      {confirmPayModal && (
        <div className="modal-overlay" onClick={() => setConfirmPayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Sessão paga</h2>
              <button className="modal-close" onClick={() => setConfirmPayModal(false)} aria-label="Fechar">✕</button>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem' }}>
              Esta sessão já foi paga. Tem a certeza que pretende continuar?
            </p>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setConfirmPayModal(false)}>Não</button>
              <button type="button" className="btn-primary" onClick={() => { setConfirmPayModal(false); setPayModal(true); }}>Sim</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment modal ── */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Pagamento</h2>
              <button className="modal-close" onClick={() => setPayModal(false)} aria-label="Fechar">✕</button>
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
              <input id="signal" name="signal" type="number" min="0" step="0.01" value={form.signal} onChange={handleChange} style={{ maxWidth: '140px' }} />
            </div>

            <div className="form-group">
              <label>Tipo de Pagamento</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
                {/* Icons — left half */}
                <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  {PAYMENT_TYPES.map((pt) => {
                    const selected = form.paymentTypes.includes(pt.value);
                    return (
                      <button
                        key={pt.value}
                        type="button"
                        onClick={() => togglePaymentType(pt.value)}
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
                {/* Cash input — right half, mirrors Pagar button width */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  {form.paymentTypes.includes('cash') && (() => {
                    const troco = (parseFloat(form.cashPaid) || 0) - financials.total;
                    return (
                      <div style={{ width: '100%', marginTop: '-14px' }}>
                        <label htmlFor="cashPaid" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Montante Recebido</label>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <input
                          id="cashPaid" name="cashPaid" type="number" min="0" step="0.01"
                          value={form.cashPaid} onChange={handleChange} placeholder="0.00"
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
              <button type="button" className="btn-secondary" onClick={() => setPayModal(false)}>Fechar</button>
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  setForm((prev) => ({ ...prev, status: 'done' }));
                  setSession((prev) => ({ ...prev, status: 'done' }));
                  setDirty(true);
                  setPayModal(false);
                  try {
                    await updateSession(id, { status: 'done' });
                  } catch {
                    setError('Erro ao atualizar estado. Guarda manualmente.');
                  }
                }}
              >
                Pagar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="session-detail-footer">
        <button type="button" className="btn-secondary" onClick={handleDiscard} disabled={saving || !dirty}>Descartar alterações</button>
        <button type="button" className="btn-primary" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? 'A guardar…' : 'Guardar alterações'}
        </button>
      </div>

      {saved && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          background: 'var(--success, #16a34a)', color: '#fff',
          padding: '0.6rem 1.1rem', borderRadius: '0.5rem',
          fontSize: '0.875rem', fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          ✓ Alterações guardadas
        </div>
      )}
    </div>
  );
};

export default SessionDetail;
