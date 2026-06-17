import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, logoutUser, getUserProfile } from '../firebase/auth';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      const profile = await getUserProfile(user.uid);

      if (!profile || !profile.role) {
        await logoutUser();
        setError('Utilizador não tem acesso. Contacte o administrador.');
        return;
      }

      const from = location.state?.from || '/home';
      navigate(from, { replace: true });
    } catch (err) {
      setError('Email ou password incorretos. Contacte o administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-portal">

      {/* Left panel — branding */}
      <div className="login-left">
        <div className="login-left-content">
          <h1>Bem-vindo ao Portal da</h1>
          <h1>Emboscada Parque Aventura</h1>
          <span className="tagline">Acesso reservado</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="login-right">
        <div className="login-form-wrap">
          <h2>Entrar</h2>
          <p className="login-subtitle">Introduz as tuas credenciais para aceder.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="o-teu@email.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="error-msg">
                <span>⚠</span> {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>

    </main>
  );
};

export default Login;
