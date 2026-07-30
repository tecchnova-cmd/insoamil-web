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
import ConfirmDialog from '../components/ConfirmDialog';
import FaqCategoryModal from './FaqCategoryModal';
import FaqQuestionModal from './FaqQuestionModal';
import './faqs.css';

export default function FAQs() {
  const { user, profile } = useAuth();
  const [categories, setCategories] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [estadoFilter, setEstadoFilter] = useState('todas');

  const [categoryModal, setCategoryModal] = useState(null); // { editing: cat|null } | null
  const [questionModal, setQuestionModal] = useState(null); // { editing, defaultCategoryId } | null
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'cat'|'faq', item }
  const [deleting, setDeleting] = useState(false);

  const actorName = profile?.displayName || user.email;

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, 'faqCategories'), orderBy('order', 'asc')), (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsub2 = onSnapshot(query(collection(db, 'faqs'), orderBy('order', 'asc')), (snap) => {
      setFaqs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const filteredFaqsByCategory = useMemo(() => {
    const term = search.trim().toLowerCase();
    const map = {};
    for (const cat of categories) {
      map[cat.id] = faqs.filter((f) => {
        if (f.categoryId !== cat.id) return false;
        if (estadoFilter === 'activas' && !f.active) return false;
        if (estadoFilter === 'inactivas' && f.active) return false;
        if (term && !(f.question.toLowerCase().includes(term) || f.answer.toLowerCase().includes(term))) return false;
        return true;
      });
    }
    return map;
  }, [categories, faqs, search, estadoFilter]);

  const visibleCategories = categories.filter((c) => categoryFilter === 'todas' || c.id === categoryFilter);

  // ---------- Category CRUD ----------
  async function saveCategory(data) {
    if (categoryModal.editing) {
      await updateDoc(doc(db, 'faqCategories', categoryModal.editing.id), {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedByName: actorName,
      });
      logActivity({ uid: user.uid, accion: 'editar', modulo: 'faqCategorias', docId: categoryModal.editing.id, detalle: data.name });
    } else {
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.order || 0), 0);
      const ref = await addDoc(collection(db, 'faqCategories'), {
        ...data,
        order: maxOrder + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        updatedBy: user.uid,
        updatedByName: actorName,
      });
      logActivity({ uid: user.uid, accion: 'crear', modulo: 'faqCategorias', docId: ref.id, detalle: data.name });
    }
    setCategoryModal(null);
  }

  async function moveCategory(cat, direction) {
    const sorted = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex((c) => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    const batch = writeBatch(db);
    batch.update(doc(db, 'faqCategories', cat.id), { order: other.order ?? swapIdx });
    batch.update(doc(db, 'faqCategories', other.id), { order: cat.order ?? idx });
    await batch.commit();
  }

  async function toggleCategoryActive(cat) {
    await updateDoc(doc(db, 'faqCategories', cat.id), {
      active: !cat.active,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      updatedByName: actorName,
    });
  }

  // ---------- Question CRUD ----------
  async function saveQuestion(data) {
    if (questionModal.editing) {
      await updateDoc(doc(db, 'faqs', questionModal.editing.id), {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedByName: actorName,
      });
      logActivity({ uid: user.uid, accion: 'editar', modulo: 'faqs', docId: questionModal.editing.id, detalle: data.question });
    } else {
      const siblingMax = faqs.filter((f) => f.categoryId === data.categoryId).reduce((m, f) => Math.max(m, f.order || 0), 0);
      const ref = await addDoc(collection(db, 'faqs'), {
        ...data,
        order: siblingMax + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        updatedBy: user.uid,
        updatedByName: actorName,
      });
      logActivity({ uid: user.uid, accion: 'crear', modulo: 'faqs', docId: ref.id, detalle: data.question });
    }
    setQuestionModal(null);
  }

  async function moveQuestion(item, direction) {
    const siblings = faqs.filter((f) => f.categoryId === item.categoryId).sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = siblings.findIndex((f) => f.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const other = siblings[swapIdx];
    const batch = writeBatch(db);
    batch.update(doc(db, 'faqs', item.id), { order: other.order ?? swapIdx });
    batch.update(doc(db, 'faqs', other.id), { order: item.order ?? idx });
    await batch.commit();
  }

  async function toggleQuestionActive(item) {
    await updateDoc(doc(db, 'faqs', item.id), {
      active: !item.active,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      updatedByName: actorName,
    });
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      if (deleteTarget.type === 'faq') {
        await deleteDoc(doc(db, 'faqs', deleteTarget.item.id));
        logActivity({ uid: user.uid, accion: 'eliminar', modulo: 'faqs', docId: deleteTarget.item.id, detalle: deleteTarget.item.question });
      } else {
        const children = faqs.filter((f) => f.categoryId === deleteTarget.item.id);
        const batch = writeBatch(db);
        children.forEach((f) => batch.delete(doc(db, 'faqs', f.id)));
        batch.delete(doc(db, 'faqCategories', deleteTarget.item.id));
        await batch.commit();
        logActivity({ uid: user.uid, accion: 'eliminar', modulo: 'faqCategorias', docId: deleteTarget.item.id, detalle: deleteTarget.item.name });
      }
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Preguntas Frecuentes</h1>
        <p>Administra las categorías y preguntas que se muestran en la web pública.</p>
      </div>

      <div className="toolbar">
        <input type="text" placeholder="Buscar en preguntas o respuestas..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="todas">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
          <option value="todas">Todos los estados</option>
          <option value="activas">Solo activas</option>
          <option value="inactivas">Solo inactivas</option>
        </select>
        <div className="toolbar-spacer" />
        <button className="btn-sm" onClick={() => setQuestionModal({ editing: null, defaultCategoryId: categories[0]?.id })} disabled={categories.length === 0}>
          + Nueva pregunta
        </button>
        <button className="btn-sm" onClick={() => setCategoryModal({ editing: null })}>
          + Nueva categoría
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : categories.length === 0 ? (
        <div className="empty-state">Todavía no hay categorías. Crea la primera con "+ Nueva categoría".</div>
      ) : (
        visibleCategories
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((cat, idx) => (
            <div className="faq-cat-card" key={cat.id}>
              <div className="faq-cat-head">
                <button className="icon-btn" title="Subir" disabled={idx === 0} onClick={() => moveCategory(cat, 'up')}>
                  ↑
                </button>
                <button className="icon-btn" title="Bajar" disabled={idx === visibleCategories.length - 1} onClick={() => moveCategory(cat, 'down')}>
                  ↓
                </button>
                <h3>{cat.name}</h3>
                {!cat.active && <span className="inactive-tag">Inactiva</span>}
                <button className="icon-btn" title={cat.active ? 'Desactivar' : 'Activar'} onClick={() => toggleCategoryActive(cat)}>
                  {cat.active ? '👁️' : '🚫'}
                </button>
                <button className="icon-btn" title="Editar categoría" onClick={() => setCategoryModal({ editing: cat })}>
                  ✏️
                </button>
                <button className="icon-btn" title="Eliminar categoría" onClick={() => setDeleteTarget({ type: 'cat', item: cat })}>
                  🗑️
                </button>
              </div>

              {(filteredFaqsByCategory[cat.id] || []).length === 0 ? (
                <p className="muted">Sin preguntas que coincidan.</p>
              ) : (
                filteredFaqsByCategory[cat.id]
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((f, i, arr) => (
                    <div className="faq-q-row" key={f.id}>
                      <div className="faq-q-actions">
                        <button className="icon-btn" title="Subir" disabled={i === 0} onClick={() => moveQuestion(f, 'up')}>
                          ↑
                        </button>
                        <button className="icon-btn" title="Bajar" disabled={i === arr.length - 1} onClick={() => moveQuestion(f, 'down')}>
                          ↓
                        </button>
                      </div>
                      <div className="faq-q-text">
                        {!f.active && <span className="q-inactive">[Inactiva] </span>}
                        {f.question}
                      </div>
                      <div className="faq-q-actions">
                        <button className="icon-btn" title={f.active ? 'Desactivar' : 'Activar'} onClick={() => toggleQuestionActive(f)}>
                          {f.active ? '👁️' : '🚫'}
                        </button>
                        <button className="icon-btn" title="Editar" onClick={() => setQuestionModal({ editing: f })}>
                          ✏️
                        </button>
                        <button className="icon-btn" title="Eliminar" onClick={() => setDeleteTarget({ type: 'faq', item: f })}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          ))
      )}

      {categoryModal && (
        <FaqCategoryModal initial={categoryModal.editing} onSave={saveCategory} onCancel={() => setCategoryModal(null)} />
      )}

      {questionModal && (
        <FaqQuestionModal
          initial={questionModal.editing}
          categories={categories}
          defaultCategoryId={questionModal.defaultCategoryId}
          onSave={saveQuestion}
          onCancel={() => setQuestionModal(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === 'cat' ? 'Eliminar categoría' : 'Eliminar pregunta'}
        message={
          deleteTarget?.type === 'cat'
            ? `¿Eliminar la categoría "${deleteTarget?.item.name}" y todas sus preguntas? Esta acción no se puede deshacer.`
            : `¿Eliminar la pregunta "${deleteTarget?.item.question}"? Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
