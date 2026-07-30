import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { logActivity } from '../lib/activity';
import AnnouncementBarSettings from './AnnouncementBarSettings';

const DEFAULTS = {
  email: 'insoamil@gmail.com',
  direccion: 'Parroquia 24 de Mayo, Av. Walter Andrade y Chang Murrieta, Quevedo, Los Ríos, Ecuador · CP 120302',
  horarios: '',
  instagramUrl: 'https://www.instagram.com/insoamil',
  facebookUrl: 'https://www.facebook.com/share/1Ee5NEPgSC/',
  footerText: 'INSOAMIL. Todos los derechos reservados.',
};

export default function GeneralSettings() {
  const { user, profile } = useAuth();
  const actorName = profile?.displayName || user.email;

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'siteSettings', 'general'), (snap) => {
      setForm(snap.exists() ? { ...DEFAULTS, ...snap.data() } : DEFAULTS);
    });
    return unsub;
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'siteSettings', 'general'),
        { ...form, updatedAt: serverTimestamp(), updatedBy: user.uid, updatedByName: actorName },
        { merge: true }
      );
      logActivity({ uid: user.uid, accion: 'editar', modulo: 'configuracionGeneral' });
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
          <h1>Configuración General</h1>
        </div>
        <p className="muted">Cargando...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <h1>Configuración General</h1>
        <p>Información de contacto, redes sociales y pie de página que se muestran en todo el sitio.</p>
      </div>

      <form className="ct-section-card" onSubmit={handleSave}>
        <h3>Contacto</h3>
        <div className="ct-field-grid">
          <div className="ct-field">
            <label>Correo de contacto</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="ct-field">
            <label>Horarios de atención (opcional)</label>
            <input type="text" value={form.horarios} onChange={(e) => setForm({ ...form, horarios: e.target.value })} placeholder="Ej: Lunes a viernes, 8:00 - 17:00" />
          </div>
          <div className="ct-field full">
            <label>Dirección</label>
            <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </div>
        </div>

        <h3 style={{ marginTop: 26 }}>Redes sociales</h3>
        <div className="ct-field-grid">
          <div className="ct-field">
            <label>Instagram (URL)</label>
            <input type="text" value={form.instagramUrl} onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })} />
          </div>
          <div className="ct-field">
            <label>Facebook (URL)</label>
            <input type="text" value={form.facebookUrl} onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })} />
          </div>
        </div>

        <h3 style={{ marginTop: 26 }}>Pie de página</h3>
        <div className="ct-field-grid">
          <div className="ct-field full">
            <label>Texto de copyright (sin el año ni el símbolo ©, se agregan solos)</label>
            <input type="text" value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} />
          </div>
        </div>

        <div className="form-actions">
          {saved && <span style={{ alignSelf: 'center', color: 'var(--p-green-deep)', fontSize: '0.85rem' }}>Guardado ✓</span>}
          <button type="submit" className="btn-sm" style={{ background: 'var(--p-green-deep)', color: 'white', borderColor: 'var(--p-green-deep)' }} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <AnnouncementBarSettings />
    </div>
  );
}
