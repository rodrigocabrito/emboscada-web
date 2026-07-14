import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, changePassword, logoutUser } from '../firebase/auth';
import { getSessions, getEvaluation } from '../firebase/firestore';
import { getUserColor } from '../utils/avatarColors';
import { roleLabel } from '../utils/roles';

const SCALE = [
  { value: 0, selBg: '#e5e7eb', selColor: '#374151' },
  { value: 1, selBg: '#dc2626', selColor: '#fff' },
  { value: 2, selBg: '#ea580c', selColor: '#fff' },
  { value: 3, selBg: '#fde047', selColor: '#713f12' },
  { value: 4, selBg: '#86efac', selColor: '#14532d' },
  { value: 5, selBg: '#15803d', selColor: '#fff' },
];

const calcOverallAvg = (evaluation) => {
  if (!evaluation) return null;
  const vals = [
    ...Object.values(evaluation.activities ?? {}),
    ...Object.values(evaluation.tasks ?? {}),
  ].filter((v) => v !== null && v !== undefined && v > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
};

const getAchievements = (startedAt) => {
  if (!startedAt) return [];
  const started = new Date(startedAt);
  const now = new Date();
  const yearsElapsed = (now - started) / (365.25 * 24 * 60 * 60 * 1000);

  const achievements = [];
  if (yearsElapsed >= 20) achievements.push(20);
  if (yearsElapsed >= 10) achievements.push(10);
  if (yearsElapsed >= 5) achievements.push(5);
  if (yearsElapsed >= 3) achievements.push(3);
  if (yearsElapsed >= 1) achievements.push(1);
  return achievements;
};

const Achievement = ({ years }) => {
  const icons = { 1: '🎉', 3: '⭐', 5: '👑', 10: '💎', 20: '🏆' };
  return (
    <div className="achievement" title={`${years} ano(s) em Emboscada`}>
      <span className="achievement-icon">{icons[years]}</span>
      <span className="achievement-label">{years}y</span>
    </div>
  );
};

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const initials = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase();
  const [sessionCount, setSessionCount] = useState(0);

  const { data: evaluation } = useQuery({
    queryKey: ['evaluation', user.uid],
    queryFn: () => getEvaluation(user.uid),
    staleTime: 5 * 60_000,
  });
  const overallAvg = calcOverallAvg(evaluation);
  const avgScale = overallAvg !== null ? SCALE.find((s) => s.value === Math.round(overallAvg)) : null;
  const unseenUpdates = Math.max(0, (evaluation?.saveCount ?? 0) - (profile?.lastEvalSeenCount ?? 0));

  const [infoForm, setInfoForm] = useState({
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    nickname: profile?.nickname ?? '',
    birthday: profile?.birthday ?? '',
    startedAt: profile?.startedAt ?? '',
    phone: profile?.phone ?? '',
  });

  useEffect(() => {
    if (profile) {
      setInfoForm({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        nickname: profile.nickname ?? '',
        birthday: profile.birthday ?? '',
        startedAt: profile.startedAt ?? '',
        phone: profile.phone ?? '',
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchSessionCount = async () => {
      try {
        const sessions = await getSessions();
        const count = sessions.filter((s) => s.monitors?.includes(user.uid)).length;
        setSessionCount(count);
      } catch {
        // silently fail
      }
    };
    fetchSessionCount();
  }, [user.uid]);
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
        {/* Avatar and Stats column */}
        <div>
          <div className="card profile-avatar-section">
            <div className="profile-avatar-lg" style={{ backgroundColor: getUserColor(user.uid) }}>
              {initials}
            </div>
            <p className="profile-name">{profile?.firstName} {profile?.lastName}</p>
            {profile?.nickname && <p className="profile-nickname">{profile.nickname}</p>}
            <p className="profile-role">{roleLabel(profile?.role)}</p>
          </div>

          <div className="card" style={{ marginTop: '1rem', padding: '2rem', textAlign: 'center' }}>
            {avgScale && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                  Avaliação geral
                </div>
                <span style={{
                  background: avgScale.selBg, color: avgScale.selColor,
                  padding: '0.4rem 0.7rem', borderRadius: '0.3rem',
                  fontWeight: 800, fontSize: '1.3rem',
                }}>
                  {overallAvg.toFixed(1)}
                </span>
              </div>
            )}
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <button
                className="btn-secondary"
                style={{ width: '100%', marginTop: 0 }}
                onClick={() => navigate('/my-evaluation')}
              >
                 Ver Avaliação
              </button>
              {unseenUpdates > 0 && (
                <span style={{
                  position: 'absolute', top: '-0.45rem', right: '-0.45rem',
                  background: '#dc2626', color: '#fff',
                  borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                  minWidth: '1.2rem', height: '1.2rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 0.25rem', pointerEvents: 'none',
                }}>
                  {unseenUpdates}
                </span>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: '1rem', padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estatísticas</h3>
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {sessionCount}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Sessões
                </div>
              </div>
            </div>

            {getAchievements(profile?.startedAt).length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', width: '100%' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Anos em Emboscada</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', justifyContent: 'center', overflow: 'hidden' }}>
                  {getAchievements(profile?.startedAt).map((y) => (
                    <Achievement key={y} years={y} />
                  ))}
                </div>
              </div>
            )}
          </div>
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
                  placeholder="Ex: Johnny"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="birthday">Data de Nascimento</label>
                  <input
                    id="birthday"
                    name="birthday"
                    type="date"
                    value={infoForm.birthday}
                    onChange={handleInfoChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="startedAt">Membro desde</label>
                  <input
                    id="startedAt"
                    name="startedAt"
                    type="date"
                    value={infoForm.startedAt}
                    onChange={handleInfoChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Telemóvel</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={infoForm.phone}
                  onChange={handleInfoChange}
                  placeholder="Ex: 912 345 678"
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
