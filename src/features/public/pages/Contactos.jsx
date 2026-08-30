import { pages, contacts, schedule, telHref } from '../content';
import { useT } from '../i18n';
import { PubLink } from '../components/LangLink';

const Contactos = () => {
  const t = useT();
  const p = pages.contactos;
  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <h1>{t(p.title)}</h1>
          {p.lead && <p>{t(p.lead)}</p>}
        </div>
      </section>
      <section className="pub-section">
        <div className="pub-container">
          <div className="pub-contact-band">
            {[contacts.lisboa, contacts.porto].map((c) => (
              <div key={c.label} className="pub-contact-card">
                <h3>{t(c.label)}</h3>
                {c.address && <div style={{ color: 'var(--pub-muted)', margin: '0.5rem 0 0.25rem' }}>{c.address}</div>}
                {c.gps && <div style={{ color: 'var(--pub-muted)', fontSize: '0.85rem', marginBottom: '0.85rem' }}>GPS: {c.gps}</div>}
                <div className="pub-phone"><a href={telHref(c.phone)}>{c.phone}</a></div>
                <a href={`mailto:${c.email}`}>{c.email}</a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--pub-muted)' }}>
            {t('Horários — Verão:')} {t(schedule.verao)} · {t('Inverno:')} {t(schedule.inverno)}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <PubLink to="/reservations" className="pub-cta">{t('Pedir reserva')}</PubLink>
            <PubLink to="/faqs" className="pub-cta pub-cta--ghost">{t('Perguntas Frequentes')}</PubLink>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contactos;
