import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserColor } from '../utils/avatarColors';

const Navbar = () => {
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const close = () => setMenuOpen(false);
  const isActive = (path) => location.pathname === path ? 'active' : '';

  const initials = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={close}>
        <span className="brand-main">Emboscada</span>
        <span className="brand-sub">Parque Aventura</span>
      </Link>

      {/* Nav links (desktop) / dropdown (mobile) */}
      <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
        <ul className="navbar-links">
          <li><Link to="/home" className={isActive('/home')} onClick={close}>Início</Link></li>
          <li><Link to="/sessions" className={isActive('/sessions')} onClick={close}>Sessões</Link></li>
          <li><Link to="/availability" className={isActive('/availability')} onClick={close}>Disponibilidades</Link></li>
          <li><Link to="/team" className={isActive('/team')} onClick={close}>Equipa</Link></li>
          {isAdmin && (
            <li><Link to="/admin" className={isActive('/admin')} onClick={close}>Admin</Link></li>
          )}
        </ul>
      </div>

      {/* Right side: theme toggle + avatar + hamburger */}
      <div className="navbar-right">
        <button
          onClick={() => setDark((d) => !d)}
          aria-label="Alternar tema"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', padding: '0.3rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}
        >
          {dark ? '☀️' : '🌙'}
        </button>
        <Link
          to="/profile"
          className={`nav-avatar ${isActive('/profile')}`}
          onClick={close}
          title="Perfil"
          style={!profile?.photoURL ? { backgroundColor: getUserColor(user.uid) } : {}}
        >
          {profile?.photoURL
            ? <img src={profile.photoURL} alt="Avatar" />
            : <span>{initials}</span>
          }
        </Link>
        <button
          className={`navbar-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
