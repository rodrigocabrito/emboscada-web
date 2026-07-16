import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Página Não Encontrada</h2>
        <p className="not-found-text">
          Desculpa, a página que procuras não existe ou foi movida para outro local.
        </p>
        <Link to="/home" className="btn-primary not-found-btn">
          Voltar ao Início
        </Link>
      </div>

      <div className="not-found-decoration">
        <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
          <circle cx="150" cy="150" r="140" fill="none" stroke="var(--green-100)" strokeWidth="2" opacity="0.5" />
          <circle cx="150" cy="150" r="100" fill="none" stroke="var(--green-100)" strokeWidth="2" opacity="0.3" />
          <circle cx="150" cy="150" r="60" fill="none" stroke="var(--green-100)" strokeWidth="2" opacity="0.2" />
          <path d="M 120 120 Q 150 160 180 120" stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="130" cy="110" r="6" fill="var(--accent)" />
          <circle cx="170" cy="110" r="6" fill="var(--accent)" />
        </svg>
      </div>
    </div>
  );
};

export default NotFound;
