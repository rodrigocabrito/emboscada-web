import { useState } from 'react';
import { locations } from '../content';
import { useT } from '../i18n';
import Carousel from '../components/Carousel';

// Detail page for a single park (/porto, /monsanto), driven by locations[slug].
const LocationPage = ({ slug }) => {
  const t = useT();
  const loc = locations[slug];
  const [showGallery, setShowGallery] = useState(false);
  if (!loc) return null;

  const { lat, lng } = loc.coords;
  const mapSrc = `https://www.google.com/maps?q=${lat},${lng}&z=15&hl=pt&output=embed`;
  const dirHref = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <h1>{loc.title}</h1>
        </div>
      </section>

      {loc.scenarios?.length > 0 && (
        <section className="pub-section pub-section--alt" style={{ paddingTop: '2.5rem' }}>
          <div className="pub-container">
            <div className="pub-scenarios">
              {loc.scenarios.map((sc) => (
                <div key={sc.name} className="pub-scenario">
                  <Carousel images={sc.images} alt={sc.name} className="pub-carousel--scenario" />
                  <h3 className="pub-scenario-name">{t(sc.name)}</h3>
                  <ul className="pub-scenario-stats">
                    {sc.stats.map((st) => (
                      <li key={st.label}>
                        <span className="pub-stat-label">{t(st.label)}</span>
                        <span className="pub-stat-stars" aria-label={`${st.value} / 5`}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} className={n <= st.value ? 'is-on' : ''}>★</span>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="pub-section" style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
        <div className="pub-container pub-prose">
          {loc.description.map((para) => <p key={para}>{t(para)}</p>)}
        </div>
      </section>

      <section className="pub-section pub-section--alt">
        <div className="pub-container pub-loc-grid">
          <div className="pub-loc-info">
            <h2 className="pub-loc-h">{t('Localização')}</h2>
            <p>{loc.address}</p>
            <p>{t('Telefone')}: {loc.phone}{loc.phone2 ? ` | ${loc.phone2}` : ''}</p>
            <p>GPS: {loc.gps}</p>

            <h2 className="pub-loc-h" style={{ marginTop: '1.75rem' }}>{t('Como chegar')}</h2>
            <ul className="pub-loc-directions">
              {loc.howToGet.map((d) => <li key={d}>{t(d)}</li>)}
            </ul>

            <a className="pub-cta pub-cta--ghost" href={dirHref} target="_blank" rel="noreferrer" style={{ marginTop: '1.25rem' }}>
              {t('Ver no Google Maps')}
            </a>
          </div>

          <div className="pub-map">
            <iframe
              title={`Mapa — ${loc.name}`}
              src={mapSrc}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <section className="pub-section" style={{ paddingTop: '2.5rem' }}>
        <div className="pub-container" style={{ textAlign: 'center' }}>
          {!showGallery ? (
            <button type="button" className="pub-cta" onClick={() => setShowGallery(true)}>
              {t('Ver galeria')}
            </button>
          ) : (
            <>
              <h2 className="pub-section-title">{t('Galeria')}</h2>
              <div className="pub-gallery">
                {loc.gallery.map((src, i) => (
                  <a key={src} className="pub-gallery-item" href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt={`${loc.name} ${i + 1}`} loading="lazy" />
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default LocationPage;
