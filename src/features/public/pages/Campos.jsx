import { pages, parks } from '../content';
import { useT } from '../i18n';
import { PubLink } from '../components/LangLink';

const Campos = () => {
  const t = useT();
  const p = pages.campos;
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
            {parks.map((pk) => (
              <PubLink key={pk.slug} to={`/fields/${pk.slug}`} className="pub-contact-card pub-park-card">
                {pk.image && <img className="pub-park-img" src={pk.image} alt={pk.name} loading="lazy" />}
                <h3>{pk.name}</h3>
                <div style={{ color: 'var(--pub-muted)' }}>{t(pk.city)}</div>
              </PubLink>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Campos;
