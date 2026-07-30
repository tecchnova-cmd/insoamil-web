import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { logActivity } from '../lib/activity';
import { isValidHex, contrastRatio } from '../lib/color';
import './announcementbar.css';

const MAX_LENGTH = 200;

const DEFAULTS = {
  text: 'INSOAMIL Ingeniería, Soluciones Ambientales Integrales y Legales',
  backgroundColor: '#1E5631',
  textColor: '#FFFFFF',
  separator: '•',
  speed: 'normal',
  enabled: true,
};

export default function AnnouncementBarSettings() {
  const { user, profile } = useAuth();
  const actorName = profile?.displayName || user.email;

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'siteSettings', 'announcementBar'), (snap) => {
      setForm(snap.exists() ? { ...DEFAULTS, ...snap.data() } : { ...DEFAULTS });
    });
    return unsub;
  }, []);

  const contrast = useMemo(() => {
    if (!form) return null;
    return contrastRatio(form.backgroundColor, form.textColor);
  }, [form]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');

    if (!form.text.trim()) {
      setError('El texto de la franja no puede quedar vacío.');
      return;
    }
    if (form.text.length > MAX_LENGTH) {
      setError(`El texto no puede superar los ${MAX_LENGTH} caracteres.`);
      return;
    }
    if (!isValidHex(form.backgroundColor) || !isValidHex(form.textColor)) {
      setError('Los colores deben ser códigos hexadecimales válidos (ej: #1E5631).');
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, 'siteSettings', 'announcementBar'),
        {
          text: form.text.trim(),
          backgroundColor: form.backgroundColor,
          textColor: form.textColor,
          separator: (form.separator || '•').trim() || '•',
          speed: form.speed,
          enabled: form.enabled,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          updatedByName: actorName,
        },
        { merge: true }
      );
      logActivity({ uid: user.uid, accion: 'editar', modulo: 'franjaInformativa' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function restoreDefaults() {
    setForm({ ...DEFAULTS });
    setError('');
  }

  if (!form) {
    return (
      <div className="ct-section-card">
        <h3>Franja informativa</h3>
        <p className="muted">Cargando...</p>
      </div>
    );
  }

  const previewUnit = `${form.text} ${form.separator || '•'} `;
  const previewRepeated = previewUnit.repeat(6);

  return (
    <form className="ct-section-card" onSubmit={handleSave}>
      <h3>Franja informativa</h3>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        Franja animada debajo del menú superior del sitio público.
      </p>

      <label className="form-check" style={{ marginBottom: 16 }}>
        <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
        Franja visible en la web
      </label>

      <div className="ct-field-grid">
        <div className="ct-field full">
          <label>Texto de la franja</label>
          <input
            type="text"
            value={form.text}
            maxLength={MAX_LENGTH}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            required
          />
          <div className="ab-char-count">
            {form.text.length}/{MAX_LENGTH}
          </div>
        </div>

        <div className="ct-field">
          <label>Color de fondo</label>
          <div className="ab-color-row">
            <input
              type="color"
              value={isValidHex(form.backgroundColor) ? form.backgroundColor : '#1E5631'}
              onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
            />
            <input
              type="text"
              value={form.backgroundColor}
              onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
              placeholder="#1E5631"
            />
          </div>
        </div>

        <div className="ct-field">
          <label>Color del texto</label>
          <div className="ab-color-row">
            <input
              type="color"
              value={isValidHex(form.textColor) ? form.textColor : '#FFFFFF'}
              onChange={(e) => setForm({ ...form, textColor: e.target.value })}
            />
            <input
              type="text"
              value={form.textColor}
              onChange={(e) => setForm({ ...form, textColor: e.target.value })}
              placeholder="#FFFFFF"
            />
          </div>
        </div>

        <div className="ct-field">
          <label>Velocidad</label>
          <select value={form.speed} onChange={(e) => setForm({ ...form, speed: e.target.value })}>
            <option value="lenta">Lenta</option>
            <option value="normal">Normal</option>
            <option value="rapida">Rápida</option>
          </select>
        </div>

        <div className="ct-field">
          <label>Separador entre repeticiones</label>
          <input type="text" value={form.separator} maxLength={5} onChange={(e) => setForm({ ...form, separator: e.target.value })} placeholder="•" />
        </div>
      </div>

      {contrast !== null && contrast < 4.5 && (
        <div className="ab-contrast-warning">
          ⚠️ El contraste entre el color de fondo y el color del texto es bajo ({contrast.toFixed(2)}:1 — se recomienda al menos 4.5:1
          para buena legibilidad). Puedes guardar igual, pero considera ajustar los colores.
        </div>
      )}

      <div className="ab-preview-wrap">
        <div className="ab-preview-bar" style={{ background: isValidHex(form.backgroundColor) ? form.backgroundColor : '#1E5631' }}>
          <div
            className="ab-preview-track"
            style={{ color: isValidHex(form.textColor) ? form.textColor : '#FFFFFF', animationDuration: speedToSeconds(form.speed) + 's' }}
          >
            <span>{previewRepeated}</span>
            <span aria-hidden="true">{previewRepeated}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="banner error" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn-sm" onClick={restoreDefaults} disabled={saving}>
          Restaurar valores predeterminados
        </button>
        {saved && <span style={{ alignSelf: 'center', color: 'var(--p-green-deep)', fontSize: '0.85rem' }}>Guardado ✓</span>}
        <button type="submit" className="btn-sm" style={{ background: 'var(--p-green-deep)', color: 'white', borderColor: 'var(--p-green-deep)' }} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

function speedToSeconds(speed) {
  // Preview-only approximation (public site computes real duration from
  // measured pixel width so the speed feels the same regardless of text length).
  if (speed === 'lenta') return 22;
  if (speed === 'rapida') return 7;
  return 13;
}
