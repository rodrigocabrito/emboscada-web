import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hero, categories, activities, site } from '../content';
import { useT } from '../i18n';

const Home = () => {
  const t = useT();
  const [slide, setSlide] = useState(0);

  // Auto-advance the hero every 5s; pauses nothing fancy, resets on manual pick.
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % hero.length), 5000);
    return () => clearInterval(id);
  }, [slide]);

  return (
    <>
      {/* Hero slider */}
      <section className="pub-hero" aria-roledescription="carousel">
        {hero.map((h, i) => (
          <div
            key={h.title}
            className={`pub-hero-slide${i === slide ? ' is-active' : ''}`}
            style={{ backgroundImage: `url(${h.image})` }}
            aria-hidden={i !== slide}
          />
        ))}
        <div className="pub-container pub-hero-content">
          <span className="pub-hero-eyebrow">Emboscada Parque Aventura</span>
          <h1>{t(hero[slide].title)}</h1>
          <p>{t(hero[slide].subtitle)}</p>
          <Link to="/reservations" className="pub-cta">{t('Reservar agora')}</Link>
        </div>
        <div className="pub-hero-dots">
          {hero.map((h, i) => (
            <button
              key={h.title}
              className={`pub-hero-dot${i === slide ? ' is-active' : ''}`}
              onClick={() => setSlide(i)}
              aria-label={`Ver ${h.title}`}
            />
          ))}
        </div>
      </section>

      {/* Category cards */}
      <section className="pub-section">
        <div className="pub-container">
          <div className="pub-cards">
            {categories.map((c) => (
              <Link key={c.title} to={c.to} className="pub-card" style={{ backgroundImage: `url(${c.image})` }}>
                <div className="pub-card-body">
                  <h3>{t(c.title)}</h3>
                  {c.subtitle && <span>{t(c.subtitle)}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className="pub-section pub-section--alt">
        <div className="pub-container">
          <h2 className="pub-section-title">{t('As Nossas Actividades')}</h2>
          <p className="pub-section-subtitle">{t('Diversão em segurança, com monitorização em todos os jogos.')}</p>
          <div className="pub-activities">
            {activities.map((a) => (
              <div key={a.slug} className="pub-activity">
                <div className="pub-activity-icon"><img src={a.icon} alt={a.title} /></div>
                <h3>{t(a.title)}</h3>
                <p>{t(a.blurb)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clean & Safe + clients */}
      <section className="pub-section" style={{ paddingTop: '2.5rem' }}>
        <div className="pub-container pub-trust">
          {site.safetyBadge && (
            <img className="pub-safe-badge" src={site.safetyBadge} alt="Clean & Safe" loading="lazy" />
          )}
          <h2 className="pub-section-title">{t('Clientes com experiências nos nossos parques')}</h2>
          {site.clientsBadge && (
            <img className="pub-clients-logos" src={site.clientsBadge} alt={t('Clientes com experiências nos nossos parques')} loading="lazy" />
          )}
        </div>
      </section>
    </>
  );
};

export default Home;
