import { pages } from '../content';
import { useT, useLang } from '../i18n';
import Carousel from '../components/Carousel';
import QuoteForm from '../components/QuoteForm';

const Empresas = () => {
  const t = useT();
  const { lang } = useLang();
  const p = pages.empresas;
  // Opens the PDF inside a small viewer page (public/ver-pdf.html) so the browser
  // tab shows the Emboscada favicon instead of a generic PDF icon. Portuguese gets
  // the PT terms; every other language gets the English version.
  const termsPdf = lang === 'pt' ? '/ver-pdf.html?lang=pt' : '/ver-pdf.html?lang=en';
  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <h1>{t(p.title)}</h1>
          {p.lead && <p>{t(p.lead)}</p>}
        </div>
      </section>

      {p.carousel?.length > 0 && (
        <section className="pub-section" style={{ paddingBottom: 0 }}>
          <div className="pub-container">
            <Carousel images={p.carousel} alt={t(p.title)} />
          </div>
        </section>
      )}

      <section className="pub-section">
        <div className="pub-container pub-prose">
          {p.intro.map((para) => <p key={para}>{t(para)}</p>)}
        </div>

        <div className="pub-container" style={{ marginTop: '1.5rem' }}>
          <div className="pub-includes" style={{ maxWidth: '760px', margin: '0 auto' }}>
            <h4>{t('Competências que reforça')}</h4>
            <ul>
              {p.competencias.map((c) => <li key={c}>{t(c)}</li>)}
            </ul>
          </div>
          {p.tagline && (
            <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.25rem', color: 'var(--pub-primary)', margin: '2rem 0 0' }}>
              {t(p.tagline)}
            </p>
          )}
        </div>
      </section>

      <section className="pub-section pub-section--alt">
        <div className="pub-container">
          <h2 className="pub-section-title">{t('Actividades para grupos')}</h2>
          <div className="pub-chips">
            {p.activities.map((a) => <span key={a} className="pub-chip">{t(a)}</span>)}
          </div>
          <div className="pub-prose" style={{ marginTop: '2.5rem' }}>
            {p.about.map((para) => <p key={para}>{t(para)}</p>)}
          </div>
        </div>
      </section>

      {/* Orçamento (quote) request form */}
      <section className="pub-section">
        <div className="pub-container">
          <h2 className="pub-section-title">{t('Peça o seu orçamento')}</h2>
          <p className="pub-section-subtitle">{t('Preencha o formulário e receberá o nosso orçamento o mais breve possível.')}</p>
          <QuoteForm />
          <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <a
              className="pub-cta pub-cta--ghost"
              href={termsPdf}
              target="_blank"
              rel="noreferrer"
            >
              ↗ {t('Condições de reserva para empresas')}
            </a>
          </p>
        </div>
      </section>

      {p.clientLogos?.length > 0 && (
        <section className="pub-section pub-section--alt">
          <div className="pub-container">
            <h2 className="pub-section-title">{t('Clientes com experiências nos nossos parques')}</h2>
            <Carousel images={p.clientLogos} className="pub-carousel--logos" alt="Clientes" interval={5000} />
          </div>
        </section>
      )}
    </>
  );
};

export default Empresas;
