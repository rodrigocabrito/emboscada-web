import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCatalogItems, addCatalogItem, updateCatalogItem, deleteCatalogItem } from '../../firebase/firestore';
import useEscapeKey from '../../hooks/useEscapeKey';

// Each category carries a light and a dark palette. The values are handed to CSS
// as custom properties (see .cat-tinted in global.css), which picks the right set
// per theme — inline styles alone can't react to dark mode.
const CATEGORIES = [
  { label: 'Paintball',       color: '#ea580c', bg: '#fff7ed', border: '#fdba74', darkColor: '#fdba74', darkBg: '#431407', darkBorder: '#9a3412' },
  { label: 'Paintball Kids',  color: '#b45309', bg: '#fffbeb', border: '#fcd34d', darkColor: '#fcd34d', darkBg: '#451a03', darkBorder: '#92400e' },
  { label: 'Laser Tag',       color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', darkColor: '#93c5fd', darkBg: '#172554', darkBorder: '#1e40af' },
  { label: 'Laser Tag Kids',  color: '#3730a3', bg: '#eef2ff', border: '#a5b4fc', darkColor: '#a5b4fc', darkBg: '#1e1b4b', darkBorder: '#3730a3' },
  { label: 'Gel Blast',       color: '#0e7490', bg: '#ecfeff', border: '#67e8f9', darkColor: '#67e8f9', darkBg: '#083344', darkBorder: '#155e75' },
  { label: 'Bubble Football', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', darkColor: '#c4b5fd', darkBg: '#2e1065', darkBorder: '#5b21b6' },
  { label: 'Extras',          color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7', darkColor: '#6ee7b7', darkBg: '#022c22', darkBorder: '#065f46' },
  { label: 'Outro',           color: '#374151', bg: '#f3f4f6', border: '#d1d5db', darkColor: '#d1d5db', darkBg: '#1f2937', darkBorder: '#4b5563' },
];

// Exposes a category's palette to CSS as custom properties
const catVars = (c) => ({
  '--cat-bg': c.bg,
  '--cat-color': c.color,
  '--cat-border': c.border,
  '--cat-bg-dark': c.darkBg,
  '--cat-color-dark': c.darkColor,
  '--cat-border-dark': c.darkBorder,
});

const EMPTY_FORM = {
  name: '',
  category: '',
  description: '',
  details: [],
  price: '',
  unit: 'por pessoa',
  active: true,
};

const ItemModal = ({ item, onClose, onSaved }) => {
  const [form, setForm] = useState(item ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEscapeKey(onClose);

  const isEdit = !!item?.id;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('O nome é obrigatório.');
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      return setError('Preço inválido.');
    setSaving(true);
    try {
      await onSaved({ ...form, price: parseFloat(form.price), details: (form.details ?? []).filter((d) => d.trim()) });
      onClose();
    } catch {
      setError('Erro ao guardar. Tenta novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Editar item' : 'Novo item'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nome</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Ex: Pack Básico" />
            </div>
            <div className="form-group">
              <label>Categoria</label>
              <select name="category" value={form.category} onChange={handleChange} className="form-select">
                <option value="">-- Selecionar --</option>
                {CATEGORIES.map((c) => <option key={c.label} value={c.label}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Descrição do pack ou serviço..."
              rows={3}
              style={{ resize: 'vertical', fontFamily: 'var(--font-body)', fontSize: '0.9rem', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text)', width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label>Detalhes incluídos</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
              {(form.details ?? []).map((detail, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input
                    value={detail}
                    onChange={(e) => setForm((prev) => {
                      const next = [...prev.details];
                      next[idx] = e.target.value;
                      return { ...prev, details: next };
                    })}
                    placeholder={`Detalhe ${idx + 1}`}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, details: prev.details.filter((_, i) => i !== idx) }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '1rem', padding: '0 0.25rem', lineHeight: 1 }}
                    aria-label="Remover"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary"
                style={{ width: 'auto', alignSelf: 'flex-start', fontSize: '0.8rem', padding: '0.3rem 0.8rem', marginTop: '0.1rem' }}
                onClick={() => setForm((prev) => ({ ...prev, details: [...(prev.details ?? []), ''] }))}
              >
                + Adicionar detalhe
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Preço (€)</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Unidade</label>
              <select name="unit" value={form.unit} onChange={handleChange} className="form-select">
                <option value="por pessoa">Por pessoa</option>
                <option value="por unidade">Por unidade</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
                style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Disponível para venda</span>
            </label>
          </div>

          {error && <div className="error-msg"><span>⚠</span> {error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteModal = ({ item, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);
  useEscapeKey(onClose);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Eliminar item</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ padding: '0 0 1rem', color: 'var(--text-muted)' }}>
          Tens a certeza que queres eliminar <strong>{item.name}</strong>? Esta acção é irreversível.
        </p>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={deleting}>Cancelar</button>
          <button
            className="btn-danger"
            style={{ marginTop: 0 }}
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              await onConfirm(item.id);
              onClose();
            }}
          >
            {deleting ? 'A eliminar…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminCatalogo = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [dragOverId, setDragOverId] = useState(null);
  const draggedId = useRef(null);

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const data = await getCatalogItems();
      return data.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    },
    staleTime: 60_000,
  });

  // Keeps the existing optimistic-update call sites working against the query cache
  const setItems = (updater) =>
    queryClient.setQueryData(['catalog'], (old = []) =>
      typeof updater === 'function' ? updater(old) : updater
    );

  const handleReorder = async (categoryLabel, fromId, toId) => {
    if (fromId === toId) return;
    const catItems = items.filter((i) => (i.category || '') === categoryLabel);
    const fromIdx = catItems.findIndex((i) => i.id === fromId);
    const toIdx = catItems.findIndex((i) => i.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...catItems];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    setItems((prev) => {
      const others = prev.filter((i) => (i.category || '') !== categoryLabel);
      return [...others, ...reordered.map((item, idx) => ({ ...item, order: idx }))];
    });

    await Promise.all(reordered.map((item, idx) => updateCatalogItem(item.id, { order: idx })));
  };

  const handleSave = async (form) => {
    if (editingItem?.id) {
      await updateCatalogItem(editingItem.id, form);
      setItems((prev) => prev.map((i) => i.id === editingItem.id ? { ...i, ...form } : i));
    } else {
      const ref = await addCatalogItem(form);
      setItems((prev) => [...prev, { id: ref.id, ...form }]);
    }
  };

  const handleDelete = async (id) => {
    await deleteCatalogItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const CATEGORY_LABELS = CATEGORIES.map((c) => c.label);

  const filtered = filterCategory ? items.filter((i) => i.category === filterCategory) : items;

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const inCat = filtered.filter((i) => i.category === cat.label);
    if (inCat.length) acc[cat.label] = { items: inCat, meta: cat };
    return acc;
  }, {});
  const uncategorised = filtered.filter((i) => !i.category || !CATEGORY_LABELS.includes(i.category));

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-secondary" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate('/admin')}>
          ← Voltar
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Catálogo</h1>
            <p>Packs, actividades e preços dos serviços disponíveis.</p>
          </div>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowCreate(true)}>
            + Novo item
          </button>
        </div>
      </div>

      <div className="catalog-filter-bar">
        <button
          className={`catalog-chip${!filterCategory ? ' catalog-chip--all-active' : ''}`}
          onClick={() => setFilterCategory('')}
        >
          Todos
        </button>
        {CATEGORIES.map((c) => {
          const isActive = filterCategory === c.label;
          return (
            <button
              key={c.label}
              className={`catalog-chip${isActive ? ' catalog-chip--active cat-tinted' : ''}`}
              onClick={() => setFilterCategory(isActive ? '' : c.label)}
              style={isActive ? catVars(c) : undefined}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>A carregar…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Nenhum item no catálogo.</p>
          <p style={{ fontSize: '0.875rem' }}>Cria o primeiro pack ou serviço.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(grouped).map(([cat, { items: catItems, meta }]) => (
            <div key={cat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span className="cat-badge cat-tinted" style={catVars(meta)}>
                  {cat}
                </span>
              </div>
              <div className="catalog-grid">
                {catItems.map((item) => (
                  <CatalogCard
                    key={item.id}
                    item={item}
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => setDeletingItem(item)}
                    isDragOver={dragOverId === item.id}
                    onDragStart={() => { draggedId.current = item.id; }}
                    onDragOver={() => setDragOverId(item.id)}
                    onDrop={() => { handleReorder(item.category || '', draggedId.current, item.id); setDragOverId(null); }}
                    onDragEnd={() => { draggedId.current = null; setDragOverId(null); }}
                  />
                ))}
              </div>
            </div>
          ))}
          {uncategorised.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Sem categoria
              </h3>
              <div className="catalog-grid">
                {uncategorised.map((item) => (
                  <CatalogCard
                    key={item.id}
                    item={item}
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => setDeletingItem(item)}
                    isDragOver={dragOverId === item.id}
                    onDragStart={() => { draggedId.current = item.id; }}
                    onDragOver={() => setDragOverId(item.id)}
                    onDrop={() => { handleReorder('', draggedId.current, item.id); setDragOverId(null); }}
                    onDragEnd={() => { draggedId.current = null; setDragOverId(null); }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(showCreate || editingItem) && (
        <ItemModal
          item={editingItem}
          onClose={() => { setShowCreate(false); setEditingItem(null); }}
          onSaved={handleSave}
        />
      )}
      {deletingItem && (
        <DeleteModal item={deletingItem} onClose={() => setDeletingItem(null)} onConfirm={handleDelete} />
      )}
    </div>
  );
};

const CatalogCard = ({ item, onEdit, onDelete, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd }) => {
  const [draggable, setDraggable] = useState(false);
  return (
  <div
    className={`catalog-card${isDragOver ? ' catalog-card--drag-over' : ''}`}
    draggable={draggable}
    onDragStart={onDragStart}
    onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
    onDrop={onDrop}
    onDragEnd={() => { setDraggable(false); onDragEnd(); }}
  >
    <span
      className="catalog-drag-handle"
      title="Arrastar para reordenar"
      onMouseEnter={() => setDraggable(true)}
      onMouseLeave={() => setDraggable(false)}
    >⠿</span>
    <div className="catalog-card-header">
      <span className="catalog-card-name">{item.name}</span>
      {!item.active && <span className="badge badge-default" style={{ fontSize: '0.7rem' }}>Inativo</span>}
    </div>
    {item.details?.length > 0 && (
      <ul className="catalog-card-details">
        {item.details.map((d, i) => <li key={i}>{d}</li>)}
      </ul>
    )}
    {item.description && <p className="catalog-card-desc">{item.description}</p>}
    <div className="catalog-card-footer">
      <span className="catalog-card-price">
        {Number(item.price).toFixed(2)} € <span className="catalog-card-unit">{item.unit}</span>
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', marginTop: 0 }} onClick={onEdit}>Editar</button>
        <button className="btn-danger" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', marginTop: 0 }} onClick={onDelete}>Eliminar</button>
      </div>
    </div>
  </div>
  );
};

export default AdminCatalogo;
