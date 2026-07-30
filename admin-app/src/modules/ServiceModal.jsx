import { useState } from 'react';
import { collection, doc } from 'firebase/firestore';
import { db } from '../firebase';
import RichTextField from '../components/RichTextField';
import { ServiceImagesField, ServiceFilesField } from './ServiceMediaFields';
import { SERVICE_CATEGORIES } from '../lib/serviceCategories';

function fmtDate(ts) {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
}

const EMPTY = {
  nombre: '',
  tituloCorto: '',
  categoria: SERVICE_CATEGORIES[0][0],
  descripcionResumida: '',
  descripcionCompleta: '',
  beneficios: '',
  alcance: '',
  proceso: '',
  requisitos: '',
  tiempoEstimado: '',
  observaciones: '',
  textoBoton: 'Solicitar cotización',
  whatsappMensaje: '',
  active: true,
  images: [],
  files: [],
};

export default function ServiceModal({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? { ...EMPTY, ...initial } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [workingId] = useState(() => initial?.id || doc(collection(db, 'services')).id);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('El nombre del servicio es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const message =
        form.whatsappMensaje?.trim() ||
        `Hola, deseo recibir información y una cotización sobre el servicio de ${form.nombre.trim()}.`;
      await onSave({ ...form, nombre: form.nombre.trim(), whatsappMensaje: message }, workingId);
    } catch (err) {
      setError('No se pudo guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="form-box" style={{ maxWidth: 620 }} onSubmit={handleSubmit}>
        <h3>{initial ? 'Editar servicio' : 'Nuevo servicio'}</h3>

        {initial?.isOriginal && (
          <div className="banner success" style={{ marginBottom: 4 }}>
            Este es uno de los 17 servicios originales.
          </div>
        )}

        <label>Nombre del servicio</label>
        <input type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} autoFocus required />

        <label>Título corto (opcional, para tarjetas pequeñas)</label>
        <input type="text" value={form.tituloCorto} onChange={(e) => set('tituloCorto', e.target.value)} />

        <label>Categoría</label>
        <select value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
          {SERVICE_CATEGORIES.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <label>Descripción resumida</label>
        <textarea value={form.descripcionResumida} onChange={(e) => set('descripcionResumida', e.target.value)} />

        <div style={{ marginTop: 14 }}>
          <RichTextField label="Descripción completa" value={form.descripcionCompleta} onChange={(v) => set('descripcionCompleta', v)} />
        </div>
        <div style={{ marginTop: 14 }}>
          <RichTextField label="Beneficios" value={form.beneficios} onChange={(v) => set('beneficios', v)} />
        </div>
        <div style={{ marginTop: 14 }}>
          <RichTextField label="Alcance" value={form.alcance} onChange={(v) => set('alcance', v)} />
        </div>
        <div style={{ marginTop: 14 }}>
          <RichTextField label="Proceso" value={form.proceso} onChange={(v) => set('proceso', v)} />
        </div>
        <div style={{ marginTop: 14 }}>
          <RichTextField label="Requisitos o documentos necesarios" value={form.requisitos} onChange={(v) => set('requisitos', v)} />
        </div>

        <label>Tiempo estimado</label>
        <input type="text" value={form.tiempoEstimado} onChange={(e) => set('tiempoEstimado', e.target.value)} placeholder="Ej: 5 a 10 días hábiles" />

        <div style={{ marginTop: 14 }}>
          <RichTextField label="Observaciones (opcional)" value={form.observaciones} onChange={(v) => set('observaciones', v)} />
        </div>

        <label>Texto del botón</label>
        <input type="text" value={form.textoBoton} onChange={(e) => set('textoBoton', e.target.value)} />

        <label>Mensaje preestablecido de WhatsApp (opcional — si lo dejas vacío se genera uno automático con el nombre del servicio)</label>
        <input type="text" value={form.whatsappMensaje} onChange={(e) => set('whatsappMensaje', e.target.value)} />

        <label className="form-check">
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
          Servicio activo (visible en la web)
        </label>

        <ServiceImagesField serviceId={workingId} images={form.images || []} onChange={(images) => set('images', images)} />
        <ServiceFilesField serviceId={workingId} files={form.files || []} onChange={(files) => set('files', files)} />

        {error && <div className="banner error" style={{ marginTop: 16 }}>{error}</div>}

        {initial && (
          <div className="form-meta">
            Creado: {fmtDate(initial.createdAt)} · Última actualización: {fmtDate(initial.updatedAt)}
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
