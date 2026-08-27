import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getUserColor } from '../utils/avatarColors';
import { publishAnnouncement } from '../utils/adminApi';
import {
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementReaction,
  getUsers,
} from '../firebase/firestore';

const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Gosto' },
  { key: 'love', emoji: '❤️', label: 'Adoro' },
  { key: 'clap', emoji: '👏', label: 'Aplausos' },
  { key: 'sad', emoji: '😢', label: 'Triste' },
];

const fmtDate = (ts) => {
  const d = ts?.toDate?.() ?? (ts ? new Date(ts) : null);
  if (!d) return '';
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const initialsOf = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();

// Nickname when set, otherwise the full name
const displayName = (u) => u?.nickname || `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();

const ReactionBar = ({ announcement, uid, usersById, onToggle, busy }) => (
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
    {REACTIONS.map((r) => {
      const reactedBy = announcement.reactions?.[r.key] ?? [];
      const active = reactedBy.includes(uid);
      const count = reactedBy.length;
      // Who reacted — shown on hover (deleted users resolve to '' and drop out)
      const names = reactedBy.map((id) => displayName(usersById[id])).filter(Boolean);
      return (
        <div key={r.key} className="reaction-wrap">
          <button
            type="button"
            disabled={busy}
            onClick={() => onToggle(announcement, r.key, active)}
            aria-label={names.length ? `${r.label}: ${names.join(', ')}` : r.label}
            className={`reaction-pill${active ? ' is-active' : ''}`}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{r.emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
          {names.length > 0 && (
            <div className="reaction-popover" role="tooltip">
              <div className="reaction-popover-title">{r.emoji} {r.label}</div>
              {names.map((n, i) => (
                <div key={i} className="reaction-popover-name">{n}</div>
              ))}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

const Announcements = () => {
  const { user, isAdmin } = useAuth();
  const showToast = useToast();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [reacting, setReacting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: getAnnouncements,
    staleTime: 30_000,
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 5 * 60_000,
  });

  const usersById = useMemo(() => Object.fromEntries(users.map((u) => [u.uuid, u])), [users]);

  const authorLabel = (a) => usersById[a.authorId]?.nickname || a.authorName || 'Admin';

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['announcements'] });

  const handlePublish = async (e) => {
    e.preventDefault();
    const t = title.trim();
    const b = body.trim();
    if (!b) return;
    setPublishError('');
    setPublishing(true);
    try {
      // Server-side: creates the announcement AND emails the team in one call,
      // so closing the tab can't lose the notification.
      await publishAnnouncement({ title: t, body: b });
      setTitle('');
      setBody('');
      setShowCreate(false);
      invalidate();
    } catch (err) {
      setPublishError(`Erro ao publicar: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const openCreate = () => {
    setTitle('');
    setBody('');
    setPublishError('');
    setShowCreate(true);
  };

  const handleToggle = async (announcement, key, active) => {
    setReacting(true);
    try {
      await toggleAnnouncementReaction(announcement.id, key, user.uid, active);
      invalidate();
    } catch {
      showToast('Não foi possível registar a reação.');
    } finally {
      setReacting(false);
    }
  };

  const startEdit = (a) => {
    setEditingId(a.id);
    setEditTitle(a.title || '');
    setEditBody(a.body || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditBody('');
  };

  const saveEdit = async (id) => {
    if (!editBody.trim()) return;
    setSavingEdit(true);
    try {
      await updateAnnouncement(id, { title: editTitle.trim(), body: editBody.trim() });
      cancelEdit();
      invalidate();
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAnnouncement(deleteTarget.id);
      setDeleteTarget(null);
      invalidate();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1>Comunicados</h1>
          <p>Novidades e comunicados da equipa.</p>
        </div>
        {isAdmin && (
          <button type="button" className="btn-primary" style={{ marginTop: 0, width: 'auto' }} onClick={openCreate}>
            + Novo comunicado
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>A carregar…</div>
      ) : announcements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 1rem' }}>
          Ainda não há comunicados.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {announcements.map((a) => (
            <div key={a.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: getUserColor(a.authorId || a.id), color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700,
                }}>
                  {initialsOf(a.authorName || '?')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', overflowWrap: 'anywhere' }}>{authorLabel(a)}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {fmtDate(a.createdAt)}{a.updatedAt ? ' · editado' : ''}
                    </span>
                  </div>

                  {editingId === a.id ? (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div className="form-group">
                        <label htmlFor={`edit-title-${a.id}`}>Título (opcional)</label>
                        <input id={`edit-title-${a.id}`} type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Ex: Reunião de equipa" />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`edit-body-${a.id}`}>Mensagem</label>
                        <textarea id={`edit-body-${a.id}`} className="form-textarea" rows={4} value={editBody} onChange={(e) => setEditBody(e.target.value)} required />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="btn-secondary" style={{ marginTop: 0, width: 'auto' }} onClick={cancelEdit} disabled={savingEdit}>Cancelar</button>
                        <button type="button" className="btn-primary" style={{ marginTop: 0, width: 'auto' }} onClick={() => saveEdit(a.id)} disabled={savingEdit || !editBody.trim()}>
                          {savingEdit ? 'A guardar...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {a.title && <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.05rem', overflowWrap: 'anywhere' }}>{a.title}</h3>}
                      <p style={{ margin: '0.4rem 0 0', fontSize: '0.92rem', color: 'var(--text)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.5 }}>
                        {a.body}
                      </p>
                      <ReactionBar announcement={a} uid={user.uid} usersById={usersById} onToggle={handleToggle} busy={reacting} />
                    </>
                  )}
                </div>
                {isAdmin && editingId !== a.id && (
                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => startEdit(a)}
                      aria-label="Editar comunicado"
                      title="Editar"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0.15rem 0.35rem' }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(a)}
                      aria-label="Eliminar comunicado"
                      title="Eliminar"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.9rem', padding: '0.15rem 0.35rem' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => !publishing && setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', width: '100%' }}>
            <div className="modal-header">
              <h2 className="modal-title">Novo comunicado</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)} disabled={publishing} aria-label="Fechar">✕</button>
            </div>
            <form onSubmit={handlePublish}>
              <div className="form-group">
                <label htmlFor="annTitle">Título (opcional)</label>
                <input id="annTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Reunião de equipa" />
              </div>
              <div className="form-group">
                <label htmlFor="annBody">Mensagem</label>
                <textarea id="annBody" className="form-textarea" rows={9} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escreve o comunicado..." required />
              </div>
              {publishError && <div className="error-msg"><span>⚠</span> {publishError}</div>}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)} disabled={publishing}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ marginTop: 0 }} disabled={publishing || !body.trim()}>
                  {publishing ? 'A publicar...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Eliminar comunicado</h2>
              <button className="modal-close" onClick={() => setDeleteTarget(null)} disabled={deleting} aria-label="Fechar">✕</button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem' }}>
              Tens a certeza que queres eliminar este comunicado? Esta ação não pode ser revertida.
            </p>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</button>
              <button type="button" className="btn-primary" style={{ background: '#dc2626' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'A eliminar...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
