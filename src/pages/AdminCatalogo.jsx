import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCatalogItems, addCatalogItem, updateCatalogItem, deleteCatalogItem } from '../firebase/firestore';
import useEscapeKey from '../hooks/useEscapeKey';

const CATEGORIES = ['Paintball', 'Laser Tag', 'Gel Blast', 'Bubble Football', 'Outro'];

const EMPTY_FORM = {
  name: '',
  category: '',
  description: '',
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
      await onSaved({ ...form, price: parseFloat(form.price) });
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
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
                <option value="por grupo">Por grupo</option>
                <option value="por sessão">Por sessão</option>
                <option value="por hora">Por hora</option>
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCatalogItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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

  const filtered = filterCategory ? items.filter((i) => i.category === filterCategory) : items;

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const inCat = filtered.filter((i) => i.category === cat);
    if (inCat.length) acc[cat] = inCat;
    return acc;
  }, {});
  const uncategorised = filtered.filter((i) => !i.category || !CATEGORIES.includes(i.category));

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

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button
          className={`btn-secondary${!filterCategory ? ' active-filter' : ''}`}
          onClick={() => setFilterCategory('')}
          style={{ fontSize: '0.8rem', padding: '0.3rem 0.9rem' }}
        >
          Todos
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`btn-secondary${filterCategory === c ? ' active-filter' : ''}`}
            onClick={() => setFilterCategory(filterCategory === c ? '' : c)}
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.9rem' }}
          >
            {c}
          </button>
        ))}
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
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                {cat}
              </h3>
              <div className="catalog-grid">
                {catItems.map((item) => (
                  <CatalogCard key={item.id} item={item} onEdit={() => setEditingItem(item)} onDelete={() => setDeletingItem(item)} />
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
                  <CatalogCard key={item.id} item={item} onEdit={() => setEditingItem(item)} onDelete={() => setDeletingItem(item)} />
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

const CatalogCard = ({ item, onEdit, onDelete }) => (
  <div className="catalog-card">
    <div className="catalog-card-header">
      <span className="catalog-card-name">{item.name}</span>
      {!item.active && <span className="badge badge-default" style={{ fontSize: '0.7rem' }}>Inativo</span>}
    </div>
    {item.description && <p className="catalog-card-desc">{item.description}</p>}
    <div className="catalog-card-footer">
      <span className="catalog-card-price">
        {Number(item.price).toFixed(2)} € <span className="catalog-card-unit">{item.unit}</span>
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn-table-action" onClick={onEdit}>Editar</button>
        <button className="btn-table-action btn-table-action--danger" onClick={onDelete}>Eliminar</button>
      </div>
    </div>
  </div>
);

export default AdminCatalogo;
