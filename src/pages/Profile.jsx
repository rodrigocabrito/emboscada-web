import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, changePassword, logoutUser } from '../firebase/auth';

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const initials = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase();

  const [infoForm, setInfoForm] = useState({
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    nickname: profile?.nickname ?? '',
  });

  useEffect(() => {
    if (profile) {
      setInfoForm({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        nickname: profile.nickname ?? '',
      });
    }
  }, [profile]);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState('');
  const [infoError, setInfoError] = useState('');

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const handleInfoChange = (e) =>
    setInfoForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePwChange = (e) =>
    setPwForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoError('');
    setInfoSuccess('');
    setInfoLoading(true);
    try {
      await updateUserProfile(user.uid, infoForm);
      await refreshProfile();
      setInfoSuccess('Perfil atualizado com sucesso.');
    } catch {
      setInfoError('Erro ao atualizar perfil. Tenta novamente.');
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.next !== pwForm.confirm) {
      setPwError('As passwords não coincidem.');
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError('A nova password deve ter pelo menos 8 caracteres.');
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(pwForm.current, pwForm.next);
      setPwSuccess('Password alterada com sucesso.');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPwError('Password atual incorreta.');
      } else {
        setPwError('Erro ao alterar password. Tenta novamente.');
      }
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Perfil</h1>
        <p>Gere as tuas informações pessoais e credenciais de acesso.</p>
      </div>

      <div className="profile-grid">
        {/* Avatar column */}
        <div className="card profile-avatar-section">
          <div className="profile-avatar-lg">{initials}</div>
          <p className="profile-name">{profile?.firstName} {profile?.lastName}</p>
          {profile?.nickname && <p className="profile-nickname">{profile.nickname}</p>}
          <p className="profile-role">{profile?.role === 'admin' ? 'Administrador' : 'Monitor'}</p>
        </div>

        {/* Forms column */}
        <div className="profile-sections">
          <div className="card">
            <h3 className="card-section-title">Informações Pessoais</h3>
            <form onSubmit={handleInfoSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Nome</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={infoForm.firstName}
                    onChange={handleInfoChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Apelido</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={infoForm.lastName}
                    onChange={handleInfoChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="nickname">Alcunha</label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  value={infoForm.nickname}
                  onChange={handleInfoChange}
                  placeholder="Ex: João da Silva"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  className="input-disabled"
                />
              </div>
              {infoError && <div className="error-msg"><span>⚠</span> {infoError}</div>}
              {infoSuccess && <div className="success-msg"><span>✓</span> {infoSuccess}</div>}
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={infoLoading}>
                  {infoLoading ? 'A guardar...' : 'Guardar alterações'}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h3 className="card-section-title">Alterar Password</h3>
            <form onSubmit={handlePwSubmit}>
              <div className="form-group">
                <label htmlFor="current">Password atual</label>
                <input
                  id="current"
                  name="current"
                  type="password"
                  value={pwForm.current}
                  onChange={handlePwChange}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="next">Nova password</label>
                  <input
                    id="next"
                    name="next"
                    type="password"
                    value={pwForm.next}
                    onChange={handlePwChange}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm">Confirmar</label>
                  <input
                    id="confirm"
                    name="confirm"
                    type="password"
                    value={pwForm.confirm}
                    onChange={handlePwChange}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              {pwError && <div className="error-msg"><span>⚠</span> {pwError}</div>}
              {pwSuccess && <div className="success-msg"><span>✓</span> {pwSuccess}</div>}
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={pwLoading}>
                  {pwLoading ? 'A alterar...' : 'Alterar password'}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h3 className="card-section-title">Sessão</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Termina a sessão atual e regressa ao ecrã de login.
            </p>
            <button className="btn-danger" onClick={handleLogout}>
              Terminar sessão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
