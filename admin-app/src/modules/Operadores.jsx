import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { logActivity } from '../lib/activity';
import { markdownLiteToHtml } from '../lib/richtext';
import RichTextField from '../components/RichTextField';
import './operadores.css';
import './comotrabajamos.css';

const ICON_PRESETS = ['🏗️', '⚒️', '🏥', '♻️', '🛢️', '⛏️', '🌲', '🏭', '🐄', '🌱'];

const EMPTY_BLOCK = {
  titulo: '',
  descripcionMd: '',
  icon: '🏗️',
  ctaText: '',
  ctaType: 'whatsapp',
  ctaMessage: '',
  visible: true,
  order: 1,
};

export default function Operadores() {
  const { user, profile } = useAuth();
  const actorName = profile?.displayName || user.email;

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'operatorsContent', 'main'), (snap) => {
      if (snap.exists()) {
        setForm(snap.data());
      } else {
        setForm({
          sectionVisible: true,
          title: '',
          intro: '',
          estrategico: { ...EMPTY_BLOCK, order: 2 },
          noEstrategico: { ...EMPTY_BLOCK, order: 1 },
        });
      }
    });
    return unsub;
  }, []);

  function updateBlock(key, patch) {
    setForm((f) => ({ ...f, [key]: { ...f[key], ...patch } }));
  }

  function swapOrder() {
    setForm((f) => ({
      ...f,
      estrategico: { ...f.estrategico, order: f.noEstrategico.order },
      noEstrategico: { ...f.noEstrategico, order: f.estrategico.order },
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'operatorsContent', 'main'),
        { ...form, updatedAt: serverTimestamp(), updatedBy: user.uid, updatedByName: actorName },
        { merge: true }
      );
      logActivity({ uid: user.uid, accion: 'editar', modulo: 'operadores' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <div>
        <div className="page-head">
          <h1>Operadores Estratégicos</h1>
        </div>
        <p className="muted">Cargando...</p>
      </div>
    );
  }

  const [first, second] =
    form.noEstrategico.order <= form.estrategico.order
      ? [['noEstrategico', form.noEstrategico], ['estrategico', form.estrategico]]
      : [['estrategico', form.estrategico], ['noEstrategico', form.noEstrategico]];

  return (
    <div>
      <div className="page-head">
        <h1>Operadores Estratégicos</h1>
        <p>Edita la sección "Trabajamos con operadores estratégicos y no estratégicos" del sitio público.</p>
      </div>

      <form className="ct-section-card" onSubmit={handleSave}>
        <h3>Texto general de la sección</h3>

        <label className="form-check" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={form.sectionVisible} onChange={(e) => setForm({ ...form, sectionVisible: e.target.checked })} />
          Sección visible en la web
        </label>

        <div className="ct-field-grid">
          <div className="ct-field full">
            <label>Título principal</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="ct-field full">
            <RichTextField label="Texto introductorio" value={form.intro} onChange={(v) => setForm({ ...form, intro: v })} />
          </div>
        </div>

        <div className="op-swap-row">
          <button type="button" className="btn-sm" onClick={swapOrder}>
            ⇄ Invertir orden de presentación
          </button>
        </div>

        <div className="op-grid">
          {[
            ['noEstrategico', 'Operadores No Estratégicos'],
            ['estrategico', 'Operadores Estratégicos'],
          ].map(([key, label]) => (
            <div className="op-block" key={key}>
              <h4>
                {label} <span className="muted">· orden {form[key].order}</span>
              </h4>

              <div className="ct-field">
                <label>Título</label>
                <input type="text" value={form[key].titulo} onChange={(e) => updateBlock(key, { titulo: e.target.value })} required />
              </div>

              <RichTextField label="Descripción" value={form[key].descripcionMd} onChange={(v) => updateBlock(key, { descripcionMd: v })} />

              <div className="ct-field" style={{ marginTop: 14 }}>
                <label>Icono</label>
                <input type="text" value={form[key].icon} onChange={(e) => updateBlock(key, { icon: e.target.value })} maxLength={4} style={{ width: 70 }} />
                <div className="icon-preset-row">
                  {ICON_PRESETS.map((ic) => (
                    <button type="button" key={ic} className={`icon-preset-btn ${form[key].icon === ic ? 'active' : ''}`} onClick={() => updateBlock(key, { icon: ic })}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ct-field">
                <label>Texto del botón (opcional)</label>
                <input type="text" value={form[key].ctaText} onChange={(e) => updateBlock(key, { ctaText: e.target.value })} />
              </div>
              <div className="ct-field">
                <label>Destino del botón</label>
                <select value={form[key].ctaType} onChange={(e) => updateBlock(key, { ctaType: e.target.value })}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="contacto">Formulario de contacto</option>
                </select>
              </div>
              {form[key].ctaType === 'whatsapp' && (
                <div className="ct-field">
                  <label>Mensaje de WhatsApp</label>
                  <input type="text" value={form[key].ctaMessage || ''} onChange={(e) => updateBlock(key, { ctaMessage: e.target.value })} />
                </div>
              )}

              <label className="form-check">
                <input type="checkbox" checked={form[key].visible} onChange={(e) => updateBlock(key, { visible: e.target.checked })} />
                Visible en la web
              </label>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="button" className="btn-sm" onClick={() => setShowPreview(true)}>
            Vista previa
          </button>
          {saved && <span style={{ alignSelf: 'center', color: 'var(--p-green-deep)', fontSize: '0.85rem' }}>Guardado ✓</span>}
          <button type="submit" className="btn-sm" style={{ background: 'var(--p-green-deep)', color: 'white', borderColor: 'var(--p-green-deep)' }} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      {showPreview && (
        <div className="preview-overlay" onClick={(e) => e.target === e.currentTarget && setShowPreview(false)}>
          <div className="preview-box" style={{ maxWidth: 820 }}>
            <button className="preview-close" onClick={() => setShowPreview(false)}>
              ✕
            </button>
            <span className="preview-eyebrow">Sectores de atención</span>
            <h2 className="preview-title">{form.title}</h2>
            <div className="preview-intro" dangerouslySetInnerHTML={{ __html: markdownLiteToHtml(form.intro) }} />
            <div className="op-preview-grid">
              {[first, second].map(([key, block]) =>
                block.visible ? (
                  <div className={`op-preview-card ${key === 'estrategico' ? 'estrategico' : 'no-estrategico'}`} key={key}>
                    <span className="tag">{key === 'estrategico' ? 'Sector Estratégico' : 'Sector No Estratégico'}</span>
                    <h3>
                      {block.icon} {block.titulo}
                    </h3>
                    <div className="op-desc" dangerouslySetInnerHTML={{ __html: markdownLiteToHtml(block.descripcionMd) }} />
                    {block.ctaText && <span className="op-cta">{block.ctaText}</span>}
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
