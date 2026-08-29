import { useState } from 'react';
import { parks, activityOptions } from '../content';
import { useT, useLang } from '../i18n';
import { defaultDialForLang } from '../dialCodes';
import PhoneInput from './PhoneInput';

const EMPTY = { name: '', email: '', phone: '', phonePrefix: '+351', park: '', activity: '', groupSize: '', date: '', period: '', message: '', company: '' };
const PERIODS = ['Manhã', 'Tarde', 'Dia Completo'];

// Earliest selectable date = today (no past dates).
const minBookingDate = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Company "orçamento" (quote) request form — posts to the same public endpoint
// as reservations, tagged kind:'empresas'.
const QuoteForm = () => {
  const t = useT();
  const { lang } = useLang();
  const [form, setForm] = useState(() => ({ ...EMPTY, phonePrefix: defaultDialForLang(lang) }));
  const [status, setStatus] = useState('idle'); // idle | sending | ok | error
  const [error, setError] = useState('');

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setStatus('error');
      setError(t('Introduz um email válido (com @).'));
      return;
    }
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: form.phone ? `${form.phonePrefix} ${form.phone}` : '', kind: 'empresas' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao enviar.');
      }
      setStatus('ok');
      setForm({ ...EMPTY, phonePrefix: defaultDialForLang(lang) });
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Erro ao enviar. Tenta novamente.');
    }
  };

  if (status === 'ok') {
    return (
      <div className="pub-form">
        <div className="pub-form-msg pub-form-msg--ok">
          ✓ {t('Pedido de orçamento enviado! Entramos em contacto brevemente.')}
        </div>
        <button type="button" className="pub-cta pub-cta--ghost" onClick={() => setStatus('idle')}>
          {t('Fazer outro pedido')}
        </button>
      </div>
    );
  }

  return (
    <form className="pub-form" onSubmit={submit}>
      {/* Honeypot */}
      <input
        type="text" name="company" value={form.company} onChange={change}
        autoComplete="off" tabIndex={-1}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
        aria-hidden="true"
      />

      <div className="pub-form-row">
        <div className="pub-field">
          <label htmlFor="q-name">{t('Nome do Organizador')} *</label>
          <input id="q-name" name="name" value={form.name} onChange={change} required />
        </div>
        <div className="pub-field">
          <label htmlFor="q-phone">{t('Telefone')}</label>
          <PhoneInput
            id="q-phone"
            prefix={form.phonePrefix}
            onPrefixChange={(dial) => setForm((f) => ({ ...f, phonePrefix: dial }))}
            value={form.phone}
            onValueChange={(digits) => setForm((f) => ({ ...f, phone: digits }))}
          />
        </div>
      </div>

      <div className="pub-form-row">
        <div className="pub-field">
          <label htmlFor="q-email">{t('Email')} *</label>
          <input id="q-email" name="email" type="email" value={form.email} onChange={change} required />
        </div>
        <div className="pub-field">
          <label htmlFor="q-date">{t('Data pretendida')} *</label>
          <input id="q-date" name="date" type="date" min={minBookingDate()} value={form.date} onChange={change} required />
        </div>
      </div>

      <div className="pub-form-row">
        <div className="pub-field">
          <label htmlFor="q-park">{t('Parque')} *</label>
          <select id="q-park" name="park" value={form.park} onChange={change} required>
            <option value="">{t('Selecionar…')}</option>
            {parks.map((pk) => <option key={pk.slug} value={`${pk.name} (${pk.city})`}>{pk.name} ({t(pk.city)})</option>)}
          </select>
        </div>
        <div className="pub-field">
          <label htmlFor="q-activity">{t('Actividade')} *</label>
          <select id="q-activity" name="activity" value={form.activity} onChange={change} required>
            <option value="">{t('Selecionar…')}</option>
            {activityOptions.map((a) => <option key={a} value={a}>{t(a)}</option>)}
          </select>
        </div>
      </div>

      <div className="pub-form-row">
        <div className="pub-field">
          <label htmlFor="q-size">{t('Nº de jogadores (mínimo 10)')} *</label>
          <input id="q-size" name="groupSize" type="number" min="10" value={form.groupSize} onChange={change} required />
        </div>
        <div className="pub-field">
          <label htmlFor="q-period">{t('Período preferencial')} *</label>
          <select id="q-period" name="period" value={form.period} onChange={change} required>
            <option value="">{t('Selecionar…')}</option>
            {PERIODS.map((p) => <option key={p} value={p}>{t(p)}</option>)}
          </select>
        </div>
      </div>

      <div className="pub-field">
        <label htmlFor="q-message">{t('Observações')}</label>
        <textarea id="q-message" name="message" rows={4} value={form.message} onChange={change} placeholder={t('Conta-nos o que procuras…')} />
      </div>

      {status === 'error' && <div className="pub-form-msg pub-form-msg--err">⚠ {error}</div>}

      <button type="submit" className="pub-cta" style={{ alignSelf: 'center' }} disabled={status === 'sending'}>
        {status === 'sending' ? t('A enviar…') : t('Pedir orçamento')}
      </button>
    </form>
  );
};

export default QuoteForm;
