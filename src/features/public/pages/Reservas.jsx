import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pages, parks, activityOptions, packsByActivity, packValue } from '../content';
import { useT, useLang } from '../i18n';
import { defaultDialForLang } from '../dialCodes';
import PhoneInput from '../components/PhoneInput';

const EMPTY = { name: '', email: '', phone: '', phonePrefix: '+351', park: '', activity: '', pack: '', date: '', groupSize: '', message: '', company: '' };

// Earliest selectable date = today (no past dates).
const minBookingDate = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Pre-fill activity/pack from ?activity=&pack= (e.g. from a pack's "Reservar"
// button), only accepting values that actually exist.
const prefillFromParams = (params) => {
  const a = params.get('activity') || '';
  const activity = activityOptions.includes(a) ? a : '';
  const p = params.get('pack') || '';
  const validValues = (activity ? packsByActivity[activity] || [] : [])
    .flatMap((g) => g.packs.map((name) => packValue(name, g.audience)));
  const pack = validValues.includes(p) ? p : '';
  return { activity, pack };
};

const Reservas = () => {
  const t = useT();
  const { lang } = useLang();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(() => ({ ...EMPTY, phonePrefix: defaultDialForLang(lang), ...prefillFromParams(searchParams) }));
  const [status, setStatus] = useState('idle'); // idle | sending | ok | error
  const [error, setError] = useState('');

  // Changing the activity resets the pack (its options depend on the activity).
  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => (name === 'activity' ? { ...f, activity: value, pack: '' } : { ...f, [name]: value }));
  };
  const packGroups = packsByActivity[form.activity] || [];

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
      const payload = { ...form, phone: form.phone ? `${form.phonePrefix} ${form.phone}` : '' };
      const res = await fetch('/api/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const p = pages.reservas;

  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <h1>{t(p.title)}</h1>
          <p>{t(p.lead)}</p>
        </div>
      </section>

      <section className="pub-section" style={{ paddingTop: '2.5rem' }}>
        <div className="pub-container">
          {status === 'ok' ? (
            <div className="pub-form">
              <div className="pub-form-msg pub-form-msg--ok">
                ✓ {t('Pedido enviado! Entramos em contacto para confirmar a tua reserva.')}
              </div>
              <button type="button" className="pub-cta pub-cta--ghost" style={{ alignSelf: 'center' }} onClick={() => setStatus('idle')}>
                {t('Fazer outro pedido')}
              </button>
            </div>
          ) : (
            <form className="pub-form" onSubmit={submit}>
              {/* Honeypot — hidden from users, catches bots */}
              <input
                type="text" name="company" value={form.company} onChange={change}
                autoComplete="off" tabIndex={-1}
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
                aria-hidden="true"
              />

              <div className="pub-form-row">
                <div className="pub-field">
                  <label htmlFor="name">{t('Nome')} *</label>
                  <input id="name" name="name" value={form.name} onChange={change} required />
                </div>
                <div className="pub-field">
                  <label htmlFor="phone">{t('Telefone')}</label>
                  <PhoneInput
                    id="phone"
                    prefix={form.phonePrefix}
                    onPrefixChange={(dial) => setForm((f) => ({ ...f, phonePrefix: dial }))}
                    value={form.phone}
                    onValueChange={(digits) => setForm((f) => ({ ...f, phone: digits }))}
                  />
                </div>
              </div>

              <div className="pub-form-row">
                <div className="pub-field">
                  <label htmlFor="email">{t('Email')} *</label>
                  <input id="email" name="email" type="email" value={form.email} onChange={change} required />
                </div>
                <div className="pub-field">
                  <label htmlFor="date">{t('Data pretendida')} *</label>
                  <input id="date" name="date" type="date" min={minBookingDate()} value={form.date} onChange={change} required />
                </div>
              </div>

              <div className="pub-form-row">
                <div className="pub-field">
                  <label htmlFor="park">{t('Parque')} *</label>
                  <select id="park" name="park" value={form.park} onChange={change} required>
                    <option value="">{t('Selecionar…')}</option>
                    {parks.map((pk) => <option key={pk.slug} value={`${pk.name} (${pk.city})`}>{pk.name} ({t(pk.city)})</option>)}
                  </select>
                </div>
                <div className="pub-field">
                  <label htmlFor="activity">{t('Actividade')} *</label>
                  <select id="activity" name="activity" value={form.activity} onChange={change} required>
                    <option value="">{t('Selecionar…')}</option>
                    {activityOptions.map((a) => <option key={a} value={a}>{t(a)}</option>)}
                  </select>
                </div>
              </div>

              <div className="pub-form-row">
                <div className="pub-field">
                  <label htmlFor="pack">{t('Pack')}</label>
                  <select id="pack" name="pack" value={form.pack} onChange={change} disabled={!packGroups.length}>
                    <option value="">{packGroups.length ? t('Selecionar…') : t('Escolhe primeiro a actividade')}</option>
                    {packGroups.map((g) => (
                      <optgroup key={g.audience} label={t(g.audience)}>
                        {g.packs.map((name) => {
                          const val = packValue(name, g.audience);
                          return <option key={val} value={val}>{t(name)}</option>;
                        })}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="pub-field">
                  <label htmlFor="groupSize">{t('Nº de jogadores (mínimo 10)')} *</label>
                  <input id="groupSize" name="groupSize" type="number" min="1" value={form.groupSize} onChange={change} required />
                </div>
              </div>

              <div className="pub-field">
                <label htmlFor="message">{t('Mensagem')}</label>
                <textarea id="message" name="message" rows={4} value={form.message} onChange={change} placeholder={t('Conta-nos o que procuras…')} />
              </div>

              {status === 'error' && <div className="pub-form-msg pub-form-msg--err">⚠ {error}</div>}

              <button type="submit" className="pub-cta" style={{ alignSelf: 'center' }} disabled={status === 'sending'}>
                {status === 'sending' ? t('A enviar…') : t('Enviar pedido')}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
};

export default Reservas;
