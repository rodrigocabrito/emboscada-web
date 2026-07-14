import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createUser, updateUserProfile, DEFAULT_PASSWORD } from '../../firebase/auth';
import { getUsers, deleteUserProfile } from '../../firebase/firestore';
import { sendEmail } from '../../utils/email';
import { welcomeEmail, APP_URL } from '../../utils/emailTemplates';
import { ROLE_OPTIONS, roleLabel } from '../../utils/roles';
import useEscapeKey from '../../hooks/useEscapeKey';
import useScrollLock from '../../hooks/useScrollLock';

const EMPTY_FORM = { email: '', firstName: '', lastName: '', nickname: '', birthday: '', startedAt: '', role: 'monitor' };

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [viewingUser, setViewingUser] = useState(null);
  useEscapeKey(() => setViewingUser(null), !!viewingUser);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data.filter((u) => u.uuid !== user.uid));
    } catch {
      // silently fail
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setCreateError('');
    setCreateSuccess('');
    setModalOpen(true);
  };

  const closeModal = useCallback(() => {
    if (creating) return;
    setModalOpen(false);
  }, [creating]);

  useEscapeKey(closeModal, modalOpen);
  useScrollLock(modalOpen);

  const closeConfirm = () => { setDeletingId(null); setDeleteError(''); };
  useEscapeKey(closeConfirm, !!deletingId);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreating(true);
    // Capture the admin's token before createUser signs us out (Firebase side effect)
    let adminToken = null;
    try { adminToken = await user.getIdToken(); } catch { /* proceed without email */ }
    const newUser = { email: form.email, firstName: form.firstName };
    try {
      await createUser(form.email, form.firstName, form.lastName, form.role, {
        nickname: form.nickname,
        birthday: form.birthday || null,
        startedAt: form.startedAt || null,
      });

      // Welcome email with the default credentials (best-effort — never blocks creation)
      if (adminToken) {
        // CC all admins (except the new user themselves, if they were created as admin)
        const adminEmails = users
          .filter((u) => u.role === 'admin' && u.email && u.email !== newUser.email)
          .map((u) => u.email);
        try {
          await sendEmail({
            token: adminToken,
            to: newUser.email,
            cc: adminEmails.length ? adminEmails : undefined,
            subject: 'A tua conta na plataforma Emboscada',
            html: welcomeEmail({
              firstName: newUser.firstName,
              email: newUser.email,
              password: DEFAULT_PASSWORD,
              loginUrl: `${APP_URL}/login`,
              profileUrl: `${APP_URL}/profile`,
            }),
          });
        } catch (err) {
          console.error('Falha ao enviar email de boas-vindas:', err);
        }
      }

      setCreateSuccess(`Utilizador ${form.firstName} ${form.lastName} criado com sucesso. A sessão foi terminada — por favor volta a entrar.`);
      setForm(EMPTY_FORM);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setCreateError('Já existe um utilizador com este email.');
      } else {
        setCreateError('Erro ao criar utilizador. Tenta novamente.');
      }
    } finally {
      setCreating(false);
    }
  };

  const [roleChanging, setRoleChanging] = useState(false);
  const changeRole = async (u, newRole) => {
    setRoleChanging(true);
    try {
      await updateUserProfile(u.uuid, { role: newRole });
      setUsers((prev) => prev.map((x) => (x.uuid === u.uuid ? { ...x, role: newRole } : x)));
      setViewingUser((prev) => (prev && prev.uuid === u.uuid ? { ...prev, role: newRole } : prev));
    } catch {
      // silently fail
    } finally {
      setRoleChanging(false);
    }
  };

  const handleDeleteConfirm = async (uid) => {
    setDeleteError('');
    try {
      await deleteUserProfile(uid);
      setUsers((prev) => prev.filter((u) => u.uuid !== uid));
      setDeletingId(null);
    } catch {
      setDeleteError('Erro ao eliminar utilizador. Tenta novamente.');
      setDeletingId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-secondary" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate('/admin')}>
          ← Voltar
        </button>
        <h1>Gerir Utilizadores</h1>
        <p>Cria, consulta e elimina utilizadores da plataforma.</p>
      </div>

      <div className="admin-section">
        <div className="sessions-toolbar">
          <h2 className="section-title" style={{ marginBottom: 0 }}>Utilizadores</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="search"
              className="input-field"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '200px', padding: '0.4rem 1rem', fontSize: '0.85rem', lineHeight: '1.4' }}
            />
            <button className="btn-primary btn-new-session" onClick={openModal}>
              + Novo Utilizador
            </button>
          </div>
        </div>

        {deleteError && (
          <div className="error-msg" style={{ marginBottom: '1rem' }}>
            <span>⚠</span> {deleteError}
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loadingUsers ? (
            <p style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              A carregar...
            </p>
          ) : users.length === 0 ? (
            <p style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Nenhum outro utilizador registado.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Função</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = users.filter((u) => {
                    const q = search.toLowerCase();
                    return !q || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.nickname?.toLowerCase().includes(q);
                  });
                  if (!filtered.length) return (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Nenhum utilizador encontrado para "{search}".
                      </td>
                    </tr>
                  );
                  return filtered.map((u) => (
                  <tr key={u.uuid}>
                    <td className="td-name">{u.firstName} {u.lastName}</td>
                    <td className="td-muted">{u.email}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="td-actions">
                      <button
                        className="btn-table-action"
                        onClick={() => setViewingUser(u)}
                        aria-label="Ver detalhes"
                      >
                        <img src="/eye.png" alt="Ver detalhes" style={{ width: '22px', height: '22px' }} />
                      </button>
                      <button
                        className="btn-table-action"
                        onClick={() => navigate(`/admin/users/${u.uuid}/evaluate`)}
                        aria-label="Avaliar"
                      >
                        <img src="/evaluation.png" alt="Avaliar" style={{ width: '22px', height: '22px' }} />
                      </button>
                      <button
                        className="btn-table-delete"
                        onClick={() => { setDeleteError(''); setDeletingId(u.uuid); }}
                        aria-label="Eliminar"
                      >
                        <img src="/trash.png" alt="Eliminar" style={{ width: '22px', height: '22px' }} />
                      </button>
                    </td>
                  </tr>
                ));
                })()}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {deletingId && (() => {
        const target = users.find((u) => u.uuid === deletingId);
        return (
          <div className="modal-overlay" onClick={closeConfirm}>
            <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Eliminar utilizador</h2>
                <button className="modal-close" onClick={closeConfirm} aria-label="Fechar">✕</button>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Tens a certeza que queres eliminar{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {target?.firstName} {target?.lastName}
                </strong>
                ? Esta ação não pode ser revertida.
              </p>
              {deleteError && <div className="error-msg" style={{ marginTop: '1rem' }}><span>⚠</span> {deleteError}</div>}
              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeConfirm}>Cancelar</button>
                <button className="btn-danger" style={{ flex: 1, marginTop: 0 }} onClick={() => handleDeleteConfirm(deletingId)}>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {viewingUser && (
        <div className="modal-overlay" onClick={() => setViewingUser(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{viewingUser.firstName} {viewingUser.lastName}</h2>
              <button className="modal-close" onClick={() => setViewingUser(null)} aria-label="Fechar">✕</button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { label: 'Alcunha', value: viewingUser.nickname || '—' },
                { label: 'Email', value: viewingUser.email },
                { label: 'Telemóvel', value: viewingUser.phone || '—' },
                { label: 'Função', value: roleLabel(viewingUser.role) },
                { label: 'Data de Nascimento', value: viewingUser.birthday ? new Date(viewingUser.birthday).toLocaleDateString('pt-PT') : '—' },
                { label: 'Membro desde', value: viewingUser.startedAt ? new Date(viewingUser.startedAt).toLocaleDateString('pt-PT') : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
                  <span style={{ color: 'var(--text)', textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              {viewingUser.role === 'monitor' && (
                <button className="btn-primary" style={{ marginTop: 0 }} disabled={roleChanging} onClick={() => changeRole(viewingUser, 'monitor_leader')}>
                  {roleChanging ? 'A atualizar...' : 'Promover a Líder'}
                </button>
              )}
              {viewingUser.role === 'monitor_leader' && (
                <button className="btn-secondary" style={{ marginTop: 0 }} disabled={roleChanging} onClick={() => changeRole(viewingUser, 'monitor')}>
                  {roleChanging ? 'A atualizar...' : 'Despromover a Monitor'}
                </button>
              )}
              <button className="btn-secondary" onClick={() => setViewingUser(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Novo Utilizador</h2>
              <button className="modal-close" onClick={closeModal} aria-label="Fechar">✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Nome</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="João"
                    autoFocus
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Apelido</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Silva"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="nickname">Alcunha</label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  value={form.nickname}
                  onChange={handleChange}
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
                    value={form.birthday}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="startedAt">Membro desde</label>
                  <input
                    id="startedAt"
                    name="startedAt"
                    type="date"
                    value={form.startedAt}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="joao.silva@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Função</label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {createError && <div className="error-msg"><span>⚠</span> {createError}</div>}
              {createSuccess && <div className="success-msg"><span>✓</span> {createSuccess}</div>}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={creating}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'A criar...' : 'Criar Utilizador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
