import { useState } from 'react';

function fmtDate(ts) {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function FaqQuestionModal({ initial, categories, defaultCategoryId, onSave, onCancel }) {
  const [categoryId, setCategoryId] = useState(initial?.categoryId || defaultCategoryId || categories[0]?.id || '');
  const [question, setQuestion] = useState(initial?.question || '');
  const [answer, setAnswer] = useState(initial?.answer || '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim() || !answer.trim() || !categoryId) {
      setError('Categoría, pregunta y respuesta son obligatorias.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ categoryId, question: question.trim(), answer: answer.trim(), active });
    } catch (err) {
      setError('No se pudo guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="form-box" onSubmit={handleSubmit}>
        <h3>{initial ? 'Editar pregunta' : 'Nueva pregunta'}</h3>

        <label>Categoría</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label>Pregunta</label>
        <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} required />

        <label>Respuesta</label>
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} required />

        <label className="form-check">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Pregunta activa (visible en la web)
        </label>

        {error && <div className="banner error" style={{ marginTop: 16 }}>{error}</div>}

        {initial && (
          <div className="form-meta">
            Creada: {fmtDate(initial.createdAt)} · Última actualización: {fmtDate(initial.updatedAt)}
            {initial.updatedByName ? ` · por ${initial.updatedByName}` : ''}
          </div>
        )}

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
