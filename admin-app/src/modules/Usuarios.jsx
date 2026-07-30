import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { logActivity } from '../lib/activity';
import { createUserWithoutSignIn } from '../lib/createUser';
import { ROLE_LABELS } from '../lib/roles';
import ConfirmDialog from '../components/ConfirmDialog';
import UserModal from './UserModal';
import './users.css';

function fmtDate(ts) {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('es-EC', { dateStyle: 'medium' });
}

function initials(nameOrEmail) {
  const base = (nameOrEmail || '').trim();
  if (!base) return '?';
  const parts = base.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export default function Usuarios() {
  const { user, profile } = useAuth();
  const actorName = profile?.displayName || user.email;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { editing } | null
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'asc')), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const activeSuperadminCount = useMemo(
    () => users.filter((u) => u.role === 'superadmin' && u.active).length,
    [users]
  );

  async function saveUser(data) {
    setError('');
    if (modal.editing) {
      const target = modal.editing;
      const wouldRemoveLastSuperadmin =
        target.role === 'superadmin' && target.active && activeSuperadminCount <= 1 && (data.role !== 'superadmin' || !data.active);
      if (wouldRemoveLastSuperadmin) {
        throw new Error('No puedes quitar el rol o desactivar al único superadministrador activo.');
      }
      await updateDoc(doc(db, 'users', target.id), {
        displayName: data.displayName,
        role: data.role,
        active: data.active,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedByName: actorName,
      });
      logActivity({ uid: user.uid, accion: 'editar', modulo: 'usuarios', docId: target.id, detalle: data.email });
    } else {
      const uid = await createUserWithoutSignIn(data.email, data.password);
      await setDoc(doc(db, 'users', uid), {
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        active: data.active,
        forcePasswordChange: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        updatedBy: user.uid,
        updatedByName: actorName,
      });
      logActivity({ uid: user.uid, accion: 'crear', modulo: 'usuarios', docId: uid, detalle: data.email });
    }
    setModal(null);
  }

  async function handleDelete() {
    setError('');
    const target = deleteTarget;
    if (target.id === user.uid) {
      setError('No puedes eliminar tu propia cuenta desde aquí.');
      setDeleteTarget(null);
      return;
    }
    if (target.role === 'superadmin' && target.active && activeSuperadminCount <= 1) {
      setError('No puedes eliminar al único superadministrador activo.');
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', target.id));
      logActivity({ uid: user.uid, accion: 'eliminar', modulo: 'usuarios', docId: target.id, detalle: target.email });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Usuarios y Permisos</h1>
        <p>Administra quién tiene acceso al panel y con qué rol.</p>
      </div>

      {error && <div className="banner error">{error}</div>}

      <div className="toolbar">
        <div className="toolbar-spacer" />
        <button className="btn-sm" onClick={() => setModal({ editing: null })}>
          + Nuevo usuario
        </button>
      </div>

      <div className="ct-section-card">
        {loading ? (
          <p className="muted">Cargando...</p>
        ) : (
          users.map((u) => (
            <div className="user-row" key={u.id}>
              <div className="user-avatar">{initials(u.displayName || u.email)}</div>
              <div className="user-info">
                <strong>
                  {u.displayName || u.email} {u.id === user.uid && <span className="muted">(tú)</span>}
                </strong>
                <span>
                  {u.email} · Desde {fmtDate(u.createdAt)}
                </span>
              </div>
              <span className={`role-pill role-${u.role}`}>{ROLE_LABELS[u.role] || u.role}</span>
              {!u.active && <span className="role-pill role-inactive">Inactivo</span>}
              <button className="icon-btn" title="Editar" onClick={() => setModal({ editing: u })}>
                ✏️
              </button>
              <button className="icon-btn" title="Eliminar acceso" onClick={() => setDeleteTarget(u)} disabled={u.id === user.uid}>
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      {modal && (
        <UserModal
          initial={modal.editing}
          onSave={async (data) => {
            try {
              await saveUser(data);
            } catch (err) {
              setError(err.message);
              throw err;
            }
          }}
          onCancel={() => setModal(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar acceso"
        message={`¿Quitar el acceso al panel de "${deleteTarget?.displayName || deleteTarget?.email}"? Podrá seguir existiendo su cuenta de correo, pero ya no podrá entrar al panel.`}
        confirmLabel="Eliminar acceso"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
