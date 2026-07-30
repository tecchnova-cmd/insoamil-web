import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { logActivity } from '../lib/activity';

const DEFAULTS = {
  whatsappNumber: '593982425506',
  whatsappDefaultMessage: 'Hola, deseo más información sobre sus servicios ambientales',
};

export default function WhatsAppSettings() {
  const { user, profile } = useAuth();
  const actorName = profile?.displayName || user.email;

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'siteSettings', 'general'), (snap) => {
      setForm(snap.exists() ? { ...DEFAULTS, ...snap.data() } : DEFAULTS);
    });
    return unsub;
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    const digits = form.whatsappNumber.replace(/[^0-9]/g, '');
    if (digits.length < 10) {
      setError('El número debe incluir código de país, solo dígitos (ej: 593982425506).');
      return;
    }
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'siteSettings', 'general'),
        {
          ...form,
          whatsappNumber: digits,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          updatedByName: actorName,
        },
        { merge: true }
      );
      logActivity({ uid: user.uid, accion: 'editar', modulo: 'whatsappSettings' });
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
          <h1>Contacto y WhatsApp</h1>
        </div>
        <p className="muted">Cargando...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <h1>Contacto y WhatsApp</h1>
        <p>Este número y mensaje se usan como respaldo en toda la web cuando un servicio no tiene un mensaje propio.</p>
      </div>

      <form className="ct-section-card" onSubmit={handleSave}>
        <div className="ct-field-grid">
          <div className="ct-field">
            <label>Número de WhatsApp general</label>
            <input
              type="text"
              value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              placeholder="593982425506"
              required
            />
          </div>
          <div className="ct-field full">
            <label>Mensaje predeterminado general</label>
            <input
              type="text"
              value={form.whatsappDefaultMessage}
              onChange={(e) => setForm({ ...form, whatsappDefaultMessage: e.target.value })}
            />
          </div>
        </div>

        {error && <div className="banner error">{error}</div>}

        <div className="form-actions">
          {saved && <span style={{ alignSelf: 'center', color: 'var(--p-green-deep)', fontSize: '0.85rem' }}>Guardado ✓</span>}
          <button type="submit" className="btn-sm" style={{ background: 'var(--p-green-deep)', color: 'white', borderColor: 'var(--p-green-deep)' }} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
