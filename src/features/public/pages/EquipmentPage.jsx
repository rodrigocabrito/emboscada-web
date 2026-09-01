import { equipmentPages } from '../content';
import { useT } from '../i18n';
import { PubLink } from '../components/LangLink';

// Equipment list per audience (/adults/equipment, /kids/equipment). Shows the
// gear included in each activity plus the universal inclusions. Reuses the
// existing pack-card styles so it needs no new CSS.
const EquipmentPage = ({ pageKey }) => {
  const t = useT();
  const data = equipmentPages[pageKey];
  if (!data) return null;
  const backTo = pageKey === 'crianca' ? '/kids' : '/adults';

  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <h1>{t(data.title)}</h1>
          {data.lead && <p>{t(data.lead)}</p>}
        </div>
      </section>

      <section className="pub-section" style={{ paddingTop: '2.5rem' }}>
        <div className="pub-container">
          <div className="pub-equip-incl-wrap">
            <h4>{t('Todas as atividades incluem')}</h4>
            <ul className="pub-equip-incl">
              {data.includes.map((it) => (
                <li key={it.name}>
                  <img src={it.img} alt={t(it.name)} loading="lazy" width="88" height="88" />
                  <span>{t(it.name)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pub-equip">
            {data.activities.map((a) => (
              <div key={a.title} className="pub-equip-activity">
                <h2 className="pub-equip-h">{t(a.title)}</h2>
                <ul className="pub-equip-list">
                  {a.items.map((it) => (
                    <li key={it.name}>
                      <img src={it.img} alt={t(it.name)} loading="lazy" width="200" height="200" />
                      <span>{t(it.name)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pub-equip-shop">
            <p>{t('Queres o teu próprio material? Conhece a nossa loja online.')}</p>
            <a href="https://emboscada.pt/" target="_blank" rel="noopener noreferrer" className="pub-cta">
              {t('Visitar a Loja Emboscada')} <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <PubLink to={backTo} className="pub-cta pub-cta--ghost">{t('Voltar aos packs')}</PubLink>
          </div>
        </div>
      </section>
    </>
  );
};

export default EquipmentPage;
