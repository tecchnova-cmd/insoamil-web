import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { logActivity } from '../lib/activity';
import ConfirmDialog from '../components/ConfirmDialog';
import StepModal from './StepModal';
import './comotrabajamos.css';

export default function ComoTrabajamos() {
  const { user, profile } = useAuth();
  const actorName = profile?.displayName || user.email;

  const [section, setSection] = useState(null);
  const [sectionForm, setSectionForm] = useState(null);
  const [savingSection, setSavingSection] = useState(false);
  const [sectionSaved, setSectionSaved] = useState(false);

  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stepModal, setStepModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const unsub1 = onSnapshot(doc(db, 'workProcess', '_section'), (snap) => {
      const data = snap.exists() ? snap.data() : { title: '', intro: '', buttonText: '', buttonType: 'whatsapp', buttonMessage: '' };
      setSection(data);
      setSectionForm(data);
    });
    const unsub2 = onSnapshot(query(collection(db, 'workProcess'), orderBy('order', 'asc')), (snap) => {
      setSteps(snap.docs.filter((d) => d.id !== '_section').map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  async function saveSection(e) {
    e.preventDefault();
    setSavingSection(true);
    try {
      await setDoc(
        doc(db, 'workProcess', '_section'),
        {
          ...sectionForm,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          updatedByName: actorName,
        },
        { merge: true }
      );
      logActivity({ uid: user.uid, accion: 'editar', modulo: 'comoTrabajamosSeccion' });
      setSectionSaved(true);
      setTimeout(() => setSectionSaved(false), 2500);
    } finally {
      setSavingSection(false);
    }
  }

  async function saveStep(data) {
    if (stepModal.editing) {
      await updateDoc(doc(db, 'workProcess', stepModal.editing.id), {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedByName: actorName,
      });
      logActivity({ uid: user.uid, accion: 'editar', modulo: 'comoTrabajamos', docId: stepModal.editing.id, detalle: data.title });
    } else {
      const maxOrder = steps.reduce((m, s) => Math.max(m, s.order || 0), 0);
      const ref = await addDoc(collection(db, 'workProcess'), {
        ...data,
        order: maxOrder + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        updatedBy: user.uid,
        updatedByName: actorName,
      });
      logActivity({ uid: user.uid, accion: 'crear', modulo: 'comoTrabajamos', docId: ref.id, detalle: data.title });
    }
    setStepModal(null);
  }

  async function moveStep(step, direction) {
    const sorted = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex((s) => s.id === step.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    const batch = writeBatch(db);
    batch.update(doc(db, 'workProcess', step.id), { order: other.order ?? swapIdx });
    batch.update(doc(db, 'workProcess', other.id), { order: step.order ?? idx });
    await batch.commit();
  }

  async function toggleActive(step) {
    await updateDoc(doc(db, 'workProcess', step.id), {
      active: !step.active,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      updatedByName: actorName,
    });
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'workProcess', deleteTarget.id));
      logActivity({ uid: user.uid, accion: 'eliminar', modulo: 'comoTrabajamos', docId: deleteTarget.id, detalle: deleteTarget.title });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const sortedSteps = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div>
      <div className="page-head">
        <h1>Cómo Trabajamos</h1>
        <p>Edita el proceso que se muestra en la web pública, paso a paso.</p>
      </div>

      {sectionForm && (
        <form className="ct-section-card" onSubmit={saveSection}>
          <h3>Texto de la sección</h3>
          <div className="ct-field-grid">
            <div className="ct-field full">
              <label>Título principal</label>
              <input type="text" value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} required />
            </div>
            <div className="ct-field full">
              <label>Texto introductorio</label>
              <textarea value={sectionForm.intro} onChange={(e) => setSectionForm({ ...sectionForm, intro: e.target.value })} />
            </div>
            <div className="ct-field">
              <label>Texto del botón final</label>
              <input type="text" value={sectionForm.buttonText} onChange={(e) => setSectionForm({ ...sectionForm, buttonText: e.target.value })} />
            </div>
            <div className="ct-field">
              <label>Destino del botón</label>
              <select value={sectionForm.buttonType} onChange={(e) => setSectionForm({ ...sectionForm, buttonType: e.target.value })}>
                <option value="whatsapp">WhatsApp</option>
                <option value="contacto">Formulario de contacto</option>
              </select>
            </div>
            {sectionForm.buttonType === 'whatsapp' && (
              <div className="ct-field full">
                <label>Mensaje predeterminado de WhatsApp</label>
                <input type="text" value={sectionForm.buttonMessage || ''} onChange={(e) => setSectionForm({ ...sectionForm, buttonMessage: e.target.value })} />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-sm" onClick={() => setShowPreview(true)}>
              Vista previa
            </button>
            {sectionSaved && <span style={{ alignSelf: 'center', color: 'var(--p-green-deep)', fontSize: '0.85rem' }}>Guardado ✓</span>}
            <button type="submit" className="btn-sm" style={{ background: 'var(--p-green-deep)', color: 'white', borderColor: 'var(--p-green-deep)' }} disabled={savingSection}>
              {savingSection ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <div className="toolbar-spacer" />
        <button className="btn-sm" onClick={() => setStepModal({ editing: null })}>
          + Nuevo paso
        </button>
      </div>

      <div className="ct-section-card">
        <h3>Pasos del proceso ({sortedSteps.length})</h3>
        {loading ? (
          <p className="muted">Cargando...</p>
        ) : sortedSteps.length === 0 ? (
          <p className="muted">Todavía no hay pasos. Crea el primero con "+ Nuevo paso".</p>
        ) : (
          sortedSteps.map((s, idx) => (
            <div className="ct-step-list-row" key={s.id}>
              <button className="icon-btn" title="Subir" disabled={idx === 0} onClick={() => moveStep(s, 'up')}>
                ↑
              </button>
              <button className="icon-btn" title="Bajar" disabled={idx === sortedSteps.length - 1} onClick={() => moveStep(s, 'down')}>
                ↓
              </button>
              <div className="ct-step-icon-preview">{s.icon}</div>
              <div className="ct-step-info">
                <strong>
                  {idx + 1}. {s.title} {!s.active && <span style={{ color: '#b3261e', fontWeight: 400 }}>(inactivo)</span>}
                </strong>
                <span>{s.description}</span>
              </div>
              <button className="icon-btn" title={s.active ? 'Desactivar' : 'Activar'} onClick={() => toggleActive(s)}>
                {s.active ? '👁️' : '🚫'}
              </button>
              <button className="icon-btn" title="Editar" onClick={() => setStepModal({ editing: s })}>
                ✏️
              </button>
              <button className="icon-btn" title="Eliminar" onClick={() => setDeleteTarget(s)}>
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      {stepModal && <StepModal initial={stepModal.editing} onSave={saveStep} onCancel={() => setStepModal(null)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar paso"
        message={`¿Eliminar el paso "${deleteTarget?.title}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {showPreview && sectionForm && (
        <div className="preview-overlay" onClick={(e) => e.target === e.currentTarget && setShowPreview(false)}>
          <div className="preview-box">
            <button className="preview-close" onClick={() => setShowPreview(false)}>
              ✕
            </button>
            <span className="preview-eyebrow">Cómo Trabajamos</span>
            <h2 className="preview-title">{sectionForm.title}</h2>
            <p className="preview-intro">{sectionForm.intro}</p>
            <div className="preview-timeline">
              {sortedSteps
                .filter((s) => s.active)
                .map((s, idx) => (
                  <div className="preview-step" key={s.id}>
                    <div className="preview-step-marker">{s.icon}</div>
                    <div className="preview-step-body">
                      <strong>
                        {idx + 1}. {s.title}
                      </strong>
                      <span>{s.description}</span>
                    </div>
                  </div>
                ))}
            </div>
            {sectionForm.buttonText && (
              <div className="preview-cta">
                <span>{sectionForm.buttonText}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
