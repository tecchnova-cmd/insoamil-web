import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { logActivity } from '../lib/activity';
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_LABEL } from '../lib/serviceCategories';
import ConfirmDialog from '../components/ConfirmDialog';
import ServiceModal from './ServiceModal';
import DeleteOriginalDialog from './DeleteOriginalDialog';
import './servicios.css';

export default function Servicios() {
  const { user, profile } = useAuth();
  const actorName = profile?.displayName || user.email;

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [estadoFilter, setEstadoFilter] = useState('todas');

  const [modal, setModal] = useState(null); // { editing } | null
  const [deleteTarget, setDeleteTarget] = useState(null); // service (non-original)
  const [deleteOriginalTarget, setDeleteOriginalTarget] = useState(null); // service (original)
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'services'), orderBy('order', 'asc')), (snap) => {
      setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const map = {};
    for (const [key] of SERVICE_CATEGORIES) map[key] = [];
    for (const s of services) {
      if (categoryFilter !== 'todas' && s.categoria !== categoryFilter) continue;
      if (estadoFilter === 'activos' && !s.active) continue;
      if (estadoFilter === 'inactivos' && s.active) continue;
      if (term) {
        const haystack = [s.nombre, s.tituloCorto, s.descripcionResumida].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(term)) continue;
      }
      (map[s.categoria] = map[s.categoria] || []).push(s);
    }
    for (const key of Object.keys(map)) map[key].sort((a, b) => (a.order || 0) - (b.order || 0));
    return map;
  }, [services, search, categoryFilter, estadoFilter]);

  async function saveService(data) {
    if (modal.editing) {
      await updateDoc(doc(db, 'services', modal.editing.id), {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedByName: actorName,
      });
      logActivity({ uid: user.uid, accion: 'editar', modulo: 'servicios', docId: modal.editing.id, detalle: data.nombre });
    } else {
      const siblingMax = services.filter((s) => s.categoria === data.categoria).reduce((m, s) => Math.max(m, s.order || 0), 0);
      const ref = await addDoc(collection(db, 'services'), {
        ...data,
        order: siblingMax + 1,
        isOriginal: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        updatedBy: user.uid,
        updatedByName: actorName,
      });
      logActivity({ uid: user.uid, accion: 'crear', modulo: 'servicios', docId: ref.id, detalle: data.nombre });
    }
    setModal(null);
  }

  async function duplicateService(s) {
    const { id, createdAt, updatedAt, ...rest } = s;
    const siblingMax = services.filter((x) => x.categoria === s.categoria).reduce((m, x) => Math.max(m, x.order || 0), 0);
    const ref = await addDoc(collection(db, 'services'), {
      ...rest,
      nombre: 'Copia de ' + s.nombre,
      isOriginal: false,
      active: false,
      order: siblingMax + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
      updatedBy: user.uid,
      updatedByName: actorName,
    });
    logActivity({ uid: user.uid, accion: 'duplicar', modulo: 'servicios', docId: ref.id, detalle: s.nombre });
  }

  async function toggleActive(s) {
    await updateDoc(doc(db, 'services', s.id), {
      active: !s.active,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      updatedByName: actorName,
    });
  }

  async function moveService(s, direction) {
    const siblings = (grouped[s.categoria] || []).slice();
    const idx = siblings.findIndex((x) => x.id === s.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const other = siblings[swapIdx];
    const batch = writeBatch(db);
    batch.update(doc(db, 'services', s.id), { order: other.order ?? swapIdx });
    batch.update(doc(db, 'services', other.id), { order: s.order ?? idx });
    await batch.commit();
  }

  async function handleDelete(target) {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'services', target.id));
      logActivity({ uid: user.uid, accion: 'eliminar', modulo: 'servicios', docId: target.id, detalle: target.nombre });
      setDeleteTarget(null);
      setDeleteOriginalTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const totalCount = services.length;
  const originalCount = services.filter((s) => s.isOriginal).length;

  return (
    <div>
      <div className="page-head">
        <h1>Servicios Especializados</h1>
        <p>
          {totalCount} servicios en total ({originalCount} originales). Los 17 servicios originales están protegidos contra
          borrado accidental.
        </p>
      </div>

      <div className="toolbar">
        <input type="text" placeholder="Buscar servicio..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="todas">Todas las categorías</option>
          {SERVICE_CATEGORIES.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
          <option value="todas">Todos los estados</option>
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo inactivos</option>
        </select>
        <div className="toolbar-spacer" />
        <button className="btn-sm" onClick={() => setModal({ editing: null })}>
          + Nuevo servicio
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : (
        SERVICE_CATEGORIES.filter(([key]) => categoryFilter === 'todas' || categoryFilter === key).map(([key, label]) => (
          <div className="svc-cat-card" key={key}>
            <h3>{label}</h3>
            {(grouped[key] || []).length === 0 ? (
              <p className="muted">Sin servicios que coincidan.</p>
            ) : (
              grouped[key].map((s, idx, arr) => (
                <div className="svc-row" key={s.id}>
                  <button className="icon-btn" title="Subir" disabled={idx === 0} onClick={() => moveService(s, 'up')}>
                    ↑
                  </button>
                  <button className="icon-btn" title="Bajar" disabled={idx === arr.length - 1} onClick={() => moveService(s, 'down')}>
                    ↓
                  </button>
                  <div className="svc-info">
                    <strong>{s.nombre}</strong>
                    <div className="svc-badges">
                      {s.isOriginal && <span className="svc-tag original">Original</span>}
                      {!s.active && <span className="svc-tag inactive">Inactivo</span>}
                    </div>
                  </div>
                  <div className="svc-actions">
                    <button className="icon-btn" title={s.active ? 'Desactivar' : 'Activar'} onClick={() => toggleActive(s)}>
                      {s.active ? '👁️' : '🚫'}
                    </button>
                    <button className="icon-btn" title="Editar" onClick={() => setModal({ editing: s })}>
                      ✏️
                    </button>
                    <button className="icon-btn" title="Duplicar" onClick={() => duplicateService(s)}>
                      📋
                    </button>
                    <button
                      className="icon-btn"
                      title="Eliminar"
                      onClick={() => (s.isOriginal ? setDeleteOriginalTarget(s) : setDeleteTarget(s))}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ))
      )}

      {modal && <ServiceModal initial={modal.editing} onSave={saveService} onCancel={() => setModal(null)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar servicio"
        message={`¿Eliminar el servicio "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        busy={deleting}
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      {deleteOriginalTarget && (
        <DeleteOriginalDialog
          service={deleteOriginalTarget}
          busy={deleting}
          onConfirm={() => handleDelete(deleteOriginalTarget)}
          onCancel={() => setDeleteOriginalTarget(null)}
        />
      )}
    </div>
  );
}
