import { pages, packPages, packValue } from '../content';
import { useT } from '../i18n';
import { PubLink } from '../components/LangLink';

// Data-driven activities + packs page. Shared by /adults and /kids — the
// content comes from packPages[pageKey] and pages[pageKey] in content.js.
const ActivityPacksPage = ({ pageKey }) => {
  const t = useT();
  const p = pages[pageKey];
  const data = packPages[pageKey];
  if (!p || !data) return null;
  const { activities } = data;
  const audience = pageKey === 'crianca' ? 'Crianças' : 'Adultos';

  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <h1>{t(p.title)}</h1>
          {p.lead && <p>{t(p.lead)}</p>}
          <nav className="pub-audience-nav">
            {activities.map((a) => (
              <a key={a.slug} href={`#${a.slug}`} className="pub-anchor">{t(a.title)}</a>
            ))}
          </nav>
        </div>
      </section>

      {activities.map((a, idx) => (
        <section key={a.slug} id={a.slug} className={`pub-section${idx % 2 ? ' pub-section--alt' : ''}`}>
          <div className="pub-container">
            {a.image && (
              <img
                className="pub-activity-banner"
                src={a.image}
                alt={t(a.title)}
                loading="lazy"
                style={a.imagePos ? { objectPosition: a.imagePos } : undefined}
              />
            )}
            <div className="pub-activity-head">
              <div>
                <h2>{t(a.title)}</h2>
                <p className="pub-activity-intro">{t(a.intro)}</p>
              </div>
              <div className="pub-activity-meta">
                <span className="pub-price-tag">{t('Desde')} <strong>{a.from}</strong></span>
                <span className="pub-age-badge">{t(a.age)}</span>
              </div>
            </div>

            <div className="pub-packs">
              {a.packs.map((pack) => (
                <div key={pack.name} className="pub-pack">
                  <div className="pub-pack-name">{t(pack.name)}</div>
                  <div className="pub-pack-price"><strong>{pack.price}€</strong><span>{t('/ pessoa')}</span></div>
                  <ul className="pub-pack-list">
                    {pack.items.map((it) => <li key={it}>{t(it)}</li>)}
                  </ul>
                  <PubLink
                    to={`/reservations?activity=${encodeURIComponent(a.title)}&pack=${encodeURIComponent(packValue(pack.name, audience))}`}
                    className="pub-cta pub-cta--ghost"
                  >
                    {t('Reservar')}
                  </PubLink>
                </div>
              ))}
            </div>

            <div className="pub-includes">
              <h4>{t('Qualquer pack inclui')}</h4>
              <ul>
                {a.includes.map((it) => <li key={it}>{t(it)}</li>)}
              </ul>
            </div>
          </div>
        </section>
      ))}
    </>
  );
};

export default ActivityPacksPage;
