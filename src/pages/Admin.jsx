import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { createUser, getCurrentUserToken } from '../firebase/auth';
import { getUsers } from '../firebase/firestore';

const ROLES = [
  { label: 'Administrador', value: 'admin' },
  { label: 'Monitor', value: 'monitor' },
];

const ROLE_LABEL = { admin: 'Administrador', monitor: 'Monitor' };

const EMPTY_FORM = { email: '', firstName: '', lastName: '', role: 'monitor' };

const Admin = () => {
  const { user, profile } = useAuth();

  // ── User list ─────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // ── Create modal ──────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen, closeModal]);

  const closeConfirm = () => { setDeletingId(null); setDeleteError(''); };

  useEffect(() => {
    if (!deletingId) return;
    const onKey = (e) => { if (e.key === 'Escape') closeConfirm(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [deletingId]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreating(true);
    try {
      await createUser(form.email, form.firstName, form.lastName, form.role);
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

  const handleDeleteConfirm = async (uid) => {
    setDeleteError('');
    try {
      const token = await getCurrentUserToken();
      const res = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ uid }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }

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
        <h1>Painel de Administração</h1>
        <p>Bem-vindo, {profile?.firstName}. Gere utilizadores, eventos e reservas.</p>
      </div>

      <div className="admin-section">
        <div className="sessions-toolbar">
          <h2 className="section-title" style={{ marginBottom: 0 }}>Utilizadores</h2>
          <button className="btn-primary btn-new-session" onClick={openModal}>
            + Novo Utilizador
          </button>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.uuid}>
                    <td className="td-name">{u.firstName} {u.lastName}</td>
                    <td className="td-muted">{u.email}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="td-actions">
                      <button
                        className="btn-table-delete"
                        onClick={() => { setDeleteError(''); setDeletingId(u.uuid); }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
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

      {/* Create user modal */}
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
                  {ROLES.map((r) => (
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

export default Admin;
