import { pages } from '../content';
import { useT } from '../i18n';

const Faqs = () => {
  const t = useT();
  const p = pages.faqs;
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
          <div className="pub-faq">
            {p.items.map((it) => (
              <div key={it.q} className="pub-faq-item">
                <h3>{t(it.q)}</h3>
                <p>{t(it.a)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Faqs;
