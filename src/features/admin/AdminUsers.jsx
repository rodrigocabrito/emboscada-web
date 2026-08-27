import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { updateUserProfile } from '../../firebase/auth';
import { getUsers } from '../../firebase/firestore';
import { adminUsersApi } from '../../utils/adminApi';
import { ROLE_OPTIONS, roleLabel } from '../../utils/roles';
import { RATE_OPTIONS, normalizeRate, promoteToSenior, seniorSinceDate } from '../../utils/pay';
import useEscapeKey from '../../hooks/useEscapeKey';
import useScrollLock from '../../hooks/useScrollLock';

const EMPTY_FORM = { email: '', firstName: '', lastName: '', nickname: '', birthday: '', startedAt: '', role: 'monitor', rate: 'junior' };

const pad2 = (n) => String(n).padStart(2, '0');
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const fmtDatePt = (s) => (s ? new Date(`${s}T00:00`).toLocaleDateString('pt-PT') : '');

const AdminUsers = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 5 * 60_000,
  });
  const users = allUsers;
  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [viewingUser, setViewingUser] = useState(null);
  const [rateDate, setRateDate] = useState(todayStr());
  useEscapeKey(() => setViewingUser(null), !!viewingUser);

  const openView = (u) => {
    setRateDate(seniorSinceDate(u) || todayStr());
    setViewingUser(u);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

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
    try {
      // Server-side creation: random password generated and emailed by the
      // server itself (with admins in CC) — the password never reaches the client.
      const { emailSent } = await adminUsersApi('create', {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        rate: form.rate,
        nickname: form.nickname,
        birthday: form.birthday || null,
        startedAt: form.startedAt || null,
      });

      setCreateSuccess(
        emailSent
          ? `Utilizador ${form.firstName} ${form.lastName} criado com sucesso. A password temporária foi enviada por email.`
          : `Utilizador ${form.firstName} ${form.lastName} criado, mas o email de boas-vindas falhou — contacta o utilizador manualmente.`
      );
      setForm(EMPTY_FORM);
      invalidateUsers();
    } catch (err) {
      if (err.status === 409) {
        setCreateError('Já existe um utilizador com este email.');
      } else {
        setCreateError(`Erro ao criar utilizador. ${err.detail || 'Tenta novamente.'}`);
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
      invalidateUsers();
      setViewingUser((prev) => (prev && prev.uuid === u.uuid ? { ...prev, role: newRole } : prev));
    } catch {
      showToast('Não foi possível alterar a função do utilizador.');
    } finally {
      setRoleChanging(false);
    }
  };

  const [rateChanging, setRateChanging] = useState(false);
  // Makes a user count as Senior from `dateStr` onward (Junior before it).
  const applySeniorFrom = async (u, dateStr) => {
    if (!dateStr) return;
    setRateChanging(true);
    try {
      const patch = promoteToSenior(dateStr);
      await updateUserProfile(u.uuid, patch);
      invalidateUsers();
      setViewingUser((prev) => (prev && prev.uuid === u.uuid ? { ...prev, ...patch } : prev));
    } catch {
      showToast('Não foi possível alterar a tarifa do utilizador.');
    } finally {
      setRateChanging(false);
    }
  };

  const handleDeleteConfirm = async (uid) => {
    setDeleteError('');
    try {
      // Server-side deletion removes both the profile and the Auth account
      await adminUsersApi('delete', { uid });
      invalidateUsers();
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
            <table className="data-table data-table--responsive">
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
                    <td className="td-name" data-label="Nome">{u.firstName} {u.lastName}</td>
                    <td className="td-muted" data-label="Email">{u.email}</td>
                    <td data-label="Função">
                      <span className={`role-badge role-${u.role}`}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="td-actions" data-label="Ações">
                      <button
                        className="btn-table-action"
                        onClick={() => openView(u)}
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
                      {u.uuid !== user.uid && (
                        <button
                          className="btn-table-delete"
                          onClick={() => { setDeleteError(''); setDeletingId(u.uuid); }}
                          aria-label="Eliminar"
                        >
                          <img src="/trash.png" alt="Eliminar" style={{ width: '22px', height: '22px' }} />
                        </button>
                      )}
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

              {/* Rate — promote-only (Junior → Senior) with an effective date.
                  Sessions on/after the date earn the Senior rate; earlier ones
                  stay Junior. */}
              {(() => {
                const isSenior = normalizeRate(viewingUser.rate) === 'senior';
                const sinceDate = seniorSinceDate(viewingUser);
                const statusText = isSenior
                  ? (sinceDate ? `Sénior · desde ${fmtDatePt(sinceDate)}` : 'Sénior')
                  : 'Júnior';
                const canApply = !!rateDate && !rateChanging && (!isSenior || rateDate !== sinceDate);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Tarifa</span>
                      <span style={{ color: 'var(--text)', textAlign: 'right', fontWeight: 600 }}>{statusText}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '150px' }}>
                        <label htmlFor="seniorFrom" style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Sénior a partir de
                        </label>
                        <input
                          id="seniorFrom"
                          type="date"
                          className="input-field"
                          value={rateDate}
                          onChange={(e) => setRateDate(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ width: 'auto', margin: 0, padding: '0.55rem 0.9rem', fontSize: '0.82rem' }}
                        disabled={!canApply}
                        onClick={() => applySeniorFrom(viewingUser, rateDate)}
                      >
                        {rateChanging ? 'A guardar…' : (isSenior ? 'Atualizar data' : 'Promover a Sénior')}
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Sessões a partir desta data contam como Sénior; as anteriores contam como Júnior.
                    </p>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn-primary" style={{ marginTop: 0 }} onClick={() => navigate(`/admin/users/${viewingUser.uuid}/earnings`)}>
                Ver ganhos
              </button>
              {viewingUser.role === 'monitor' && (
                <button className="btn-secondary" style={{ marginTop: 0 }} disabled={roleChanging} onClick={() => changeRole(viewingUser, 'monitor_leader')}>
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

              <div className="form-row">
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
                <div className="form-group">
                  <label htmlFor="rate">Tarifa</label>
                  <select
                    id="rate"
                    name="rate"
                    value={form.rate}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    {RATE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
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
