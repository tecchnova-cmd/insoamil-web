import { useState } from 'react';

export default function FaqCategoryModal({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), active });
    } catch (err) {
      setError('No se pudo guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="form-box" onSubmit={handleSubmit}>
        <h3>{initial ? 'Editar categoría' : 'Nueva categoría'}</h3>

        <label>Nombre</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />

        <label className="form-check">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Categoría activa (visible en la web)
        </label>

        {error && <div className="banner error" style={{ marginTop: 16 }}>{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn-sm" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn-sm" style={{ background: 'var(--p-green-deep)', color: 'white', borderColor: 'var(--p-green-deep)' }} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
