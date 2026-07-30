import { useState } from 'react';

const ICON_PRESETS = ['📞', '🔍', '📋', '📝', '✅', '⚙️', '🔎', '📦', '🤝', '📄', '💬', '📅'];

export default function StepModal({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [icon, setIcon] = useState(initial?.icon || '📞');
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('El título y la descripción son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ title: title.trim(), description: description.trim(), icon: icon.trim() || '•', active });
    } catch (err) {
      setError('No se pudo guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="form-box" onSubmit={handleSubmit}>
        <h3>{initial ? 'Editar paso' : 'Nuevo paso'}</h3>

        <label>Título</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />

        <label>Descripción</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

        <label>Icono</label>
        <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} style={{ width: 80 }} />
        <div className="icon-preset-row">
          {ICON_PRESETS.map((ic) => (
            <button
              type="button"
              key={ic}
              className={`icon-preset-btn ${icon === ic ? 'active' : ''}`}
              onClick={() => setIcon(ic)}
            >
              {ic}
            </button>
          ))}
        </div>

        <label className="form-check">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Paso activo (visible en la web)
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
