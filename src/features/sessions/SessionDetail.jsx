import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { updateSession, adjustAmmoStock } from '../../firebase/firestore';
import { useSession } from './hooks/useSession';
import LineItemsTable from './components/LineItemsTable';
import PaymentModal from './components/PaymentModal';
import useScrollLock from '../../hooks/useScrollLock';
import useEscapeKey from '../../hooks/useEscapeKey';

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

  const { session, updateSessionCache, users, catalogItems, loading } = useSession(id);
  const [form, setForm] = useState(null);
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
    if (!session || form !== null) return;
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
      // financial
      packId: session.packId || '',
      packName: session.packName || '',
      numPacks: session.numPacks !== undefined ? String(session.numPacks) : defaultNumPacks(session.actualNumberOfPlayers, numPlayers),
      packPrice: session.packPrice !== undefined ? String(session.packPrice) : '',
      extras: session.extras || [],
      others: session.others || [],
      signal: session.signal !== undefined ? String(session.signal) : String(numPlayers >= 15 ? 80 : 50),
      paymentTypes: session.paymentTypes || [],
      cashPaid: session.cashPaid !== undefined ? String(session.cashPaid) : '',
      bulletsSpent: session.bulletsSpent !== undefined && session.bulletsSpent !== null ? String(session.bulletsSpent) : '',
    });
  }, [session, form]);

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


  const updateExtra = (idx, fields) => {
    setForm((prev) => {
      const extras = [...prev.extras];
      extras[idx] = { ...extras[idx], ...fields };
      return { ...prev, extras };
    });
    setDirty(true);
  };

  const removeExtra = (idx) => {
    setForm((prev) => ({ ...prev, extras: prev.extras.filter((_, i) => i !== idx) }));
    setDirty(true);
  };

  const updateOther = (idx, fields) => {
    setForm((prev) => {
      const others = [...prev.others];
      others[idx] = { ...others[idx], ...fields };
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

  const saveForm = async (f) => {
    setError('');
    setSaving(true);
    const oldBullets = session?.bulletsSpent ?? 0;
    const oldCaliber = session?.caliber || '';
    try {
      await updateSession(id, {
        spocName: f.spocName,
        spocEmail: f.spocEmail,
        spocPhoneNumber: f.spocPhoneNumber,
        expectedNumberOfPlayers: parseInt(f.expectedNumberOfPlayers, 10),
        actualNumberOfPlayers: f.actualNumberOfPlayers !== '' ? parseInt(f.actualNumberOfPlayers, 10) : null,
        sessionDate: f.sessionDate,
        sessionTime: f.sessionTime,
        sessionDatetime: `${f.sessionDate}T${f.sessionTime}`,
        typeOfSession: f.typeOfSession,
        caliber: (f.typeOfSession === 'Paintball' || f.typeOfSession === 'Paintball Kids') ? f.caliber : '',
        status: f.status,
        additionalComments: f.additionalComments,
        monitors: f.monitors,
        packId: f.packId,
        packName: f.packName,
        numPacks: parseFloat(f.numPacks) || 0,
        packPrice: parseFloat(f.packPrice) || 0,
        extras: f.extras.map((e) => ({ ...e, quantity: parseFloat(e.quantity) || 0, unitPrice: parseFloat(e.unitPrice) || 0 })),
        others: f.others.map((o) => ({ ...o, quantity: parseFloat(o.quantity) || 0, unitPrice: parseFloat(o.unitPrice) || 0 })),
        signal: parseFloat(f.signal) || 0,
        paymentTypes: f.paymentTypes,
        cashPaid: f.paymentTypes.includes('cash') ? (parseFloat(f.cashPaid) || 0) : null,
        total: financials.total,
        bulletsSpent: f.bulletsSpent !== '' ? (parseInt(f.bulletsSpent, 10) || 0) : null,
      });
      const newCaliber = (f.typeOfSession === 'Paintball' || f.typeOfSession === 'Paintball Kids') ? f.caliber : '';
      const newBullets = f.bulletsSpent !== '' ? (parseInt(f.bulletsSpent, 10) || 0) : 0;
      if (newCaliber === oldCaliber) {
        const bulletsDelta = newBullets - oldBullets;
        if (newCaliber && bulletsDelta !== 0) await adjustAmmoStock(-bulletsDelta, newCaliber);
      } else {
        if (oldCaliber && oldBullets !== 0) await adjustAmmoStock(oldBullets, oldCaliber);
        if (newCaliber && newBullets !== 0) await adjustAmmoStock(-newBullets, newCaliber);
      }
      updateSessionCache(f);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Erro ao guardar sessão. Tenta novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => saveForm(form);

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
      bulletsSpent: session.bulletsSpent !== undefined && session.bulletsSpent !== null ? String(session.bulletsSpent) : '',
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
        <button className="btn-secondary" style={{ width: 'auto' }} onClick={() => navigate(-1)}>
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
                    onClick={() => { if (form.caliber === c) return; setForm((prev) => ({ ...prev, caliber: c })); setDirty(true); }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {['Paintball', 'Paintball Kids', 'Gel Blast'].includes(form.typeOfSession) && (
            <div className="form-group">
              <label htmlFor="bulletsSpent">Munições gastas</label>
              <input
                id="bulletsSpent"
                name="bulletsSpent"
                type="number"
                min="0"
                step="1"
                value={form.bulletsSpent}
                onChange={handleChange}
                placeholder="—"
                disabled={['Paintball', 'Paintball Kids'].includes(form.typeOfSession) && !form.caliber}
              />
              {['Paintball', 'Paintball Kids'].includes(form.typeOfSession) && !form.caliber && (
                <p style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '0.3rem', marginBottom: 0 }}>
                  Seleciona o calibre antes de preencher as munições gastas.
                </p>
              )}
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
          <LineItemsTable
            label="Extras"
            datalistId="extra-datalist"
            items={form.extras}
            draft={draftExtra}
            setDraft={setDraftExtra}
            catalogItems={extraItems}
            subtotal={financials.extrasTotal}
            onUpdate={updateExtra}
            onRemove={removeExtra}
            onAddDraft={(item) => { setForm((prev) => ({ ...prev, extras: [...prev.extras, item] })); setDirty(true); }}
          />

          {/* ── Card 4: Outros ── */}
          <LineItemsTable
            label="Outros"
            datalistId="other-datalist"
            items={form.others}
            draft={draftOther}
            setDraft={setDraftOther}
            catalogItems={otherItems}
            subtotal={financials.othersTotal}
            onUpdate={updateOther}
            onRemove={removeOther}
            onAddDraft={(item) => { setForm((prev) => ({ ...prev, others: [...prev.others, item] })); setDirty(true); }}
          />

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
        <PaymentModal
          form={form}
          financials={financials}
          onChange={handleChange}
          onTogglePaymentType={togglePaymentType}
          onClose={() => setPayModal(false)}
          onPay={async () => {
            const updatedForm = { ...form, status: 'done' };
            setForm(updatedForm);
            setPayModal(false);
            await saveForm(updatedForm);
          }}
        />
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
