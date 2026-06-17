import { useState, useEffect } from 'react';
import { getUsers } from '../firebase/firestore';
import { getUserColor } from '../utils/avatarColors';

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
  const icons = {
    1: '🎉',
    3: '⭐',
    5: '👑',
    10: '💎',
    20: '🏆',
  };

  return (
    <div className="achievement" title={`${years} ano(s) em Emboscada`}>
      <span className="achievement-icon">{icons[years]}</span>
      <span className="achievement-label">{years}y</span>
    </div>
  );
};

const UserCard = ({ user, onSelect }) => {
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  const color = getUserColor(user.uuid);
  const achievements = getAchievements(user.startedAt);

  return (
    <div className="team-user-card" onClick={() => onSelect(user)}>
      <div className="team-user-avatar" style={{ backgroundColor: color }}>
        {initials}
      </div>
      <div className="team-user-info">
        <div className="team-user-name">{user.firstName} {user.lastName}</div>
        {user.nickname && <div className="team-user-nickname">{user.nickname}</div>}
        <div className="team-user-role">
          {user.role === 'admin' ? 'Administrador' : 'Monitor'}
        </div>
        {achievements.length > 0 && (
          <div className="team-user-achievements">
            {achievements.map((y) => (
              <Achievement key={y} years={y} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const UserModal = ({ user, onClose }) => {
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  const color = getUserColor(user.uuid);
  const achievements = getAchievements(user.startedAt);
  const birthDate = user.birthday ? new Date(user.birthday).toLocaleDateString('pt-PT') : '—';
  const startDate = user.startedAt ? new Date(user.startedAt).toLocaleDateString('pt-PT') : '—';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{user.firstName} {user.lastName}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div className="profile-avatar-lg" style={{ backgroundColor: color }}>
            {initials}
          </div>

          {user.nickname && <p className="profile-nickname">{user.nickname}</p>}
          <p className="profile-role">{user.role === 'admin' ? 'Administrador' : 'Monitor'}</p>

          {achievements.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {achievements.map((y) => (
                <Achievement key={y} years={y} />
              ))}
            </div>
          )}

          <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>
                Email
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text)', marginTop: '0.25rem' }}>
                {user.email}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>
                Data de Nascimento
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text)', marginTop: '0.25rem' }}>
                {birthDate}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>
                Membro desde
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text)', marginTop: '0.25rem' }}>
                {startDate}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const admins = users.filter((u) => u.role === 'admin');
  const monitors = users.filter((u) => u.role === 'monitor');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Equipa</h1>
        <p>Conhece melhor a equipa da Emboscada Parque Aventura.</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '2rem' }}>
          A carregar...
        </p>
      ) : (
        <>
          {admins.length > 0 && (
            <div className="team-section">
              <h2 className="section-title">Administradores</h2>
              <div className="team-grid">
                {admins.map((user) => (
                  <UserCard key={user.uuid} user={user} onSelect={setSelectedUser} />
                ))}
              </div>
            </div>
          )}

          {monitors.length > 0 && (
            <div className="team-section">
              <h2 className="section-title">Monitores</h2>
              <div className="team-grid">
                {monitors.map((user) => (
                  <UserCard key={user.uuid} user={user} onSelect={setSelectedUser} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selectedUser && (
        <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
};

export default Team;
