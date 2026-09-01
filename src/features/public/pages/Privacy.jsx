import { pages } from '../content';
import { useT } from '../i18n';

const Privacy = () => {
  const t = useT();
  const p = pages.privacy;
  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <h1>{t(p.title)}</h1>
        </div>
      </section>
      <section className="pub-section">
        <div className="pub-container pub-prose">
          {p.body.map((para) => <p key={para}>{t(para)}</p>)}
        </div>
      </section>
    </>
  );
};

export default Privacy;
