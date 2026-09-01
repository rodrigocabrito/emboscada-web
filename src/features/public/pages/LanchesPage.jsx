import { lanchesPage } from '../content';
import { useT } from '../i18n';
import Carousel from '../components/Carousel';

// Snack-service page (/snacks), linked from the "Zona de Lanches" facility on
// the activity pages. Reuses the pack-card and extras styles.
const LanchesPage = () => {
  const t = useT();
  const p = lanchesPage;

  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <h1>{t(p.title)}</h1>
          {p.lead && <p>{t(p.lead)}</p>}
        </div>
      </section>

      <section className="pub-section" style={{ paddingTop: '2.5rem' }}>
        <div className="pub-container">
          <div className="pub-packs">
            {p.images?.length > 0 && (
              <Carousel images={p.images} alt={t(p.title)} className="pub-carousel--snack" />
            )}
            {p.menus.map((m) => (
              <div key={m.name} className="pub-pack">
                <div className="pub-pack-name">{t(m.name)}</div>
                <div className="pub-pack-price"><strong>{m.price}</strong><span>{t(m.per)}</span></div>
                <ul className="pub-pack-list">
                  {m.items.map((it) => <li key={it}>{t(it)}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="pub-extras-grid" style={{ marginTop: '2.5rem' }}>
            <div className="pub-extras">
              <h4>{t('Extras')}</h4>
              <ul className="pub-extras-list">
                {p.extras.map((ex) => (
                  <li key={ex.name}><span>{t(ex.name)}</span><strong>{ex.price}</strong></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pub-lanches-info">
            <p>{t(p.note)}</p>
            <p>{t(p.booking)}</p>
            <p className="pub-lanches-email"><a href={`mailto:${p.contact.email}`}>{p.contact.email}</a></p>
          </div>
        </div>
      </section>
    </>
  );
};

export default LanchesPage;
