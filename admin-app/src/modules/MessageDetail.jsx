import { useEffect, useState } from 'react';
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { logActivity } from '../lib/activity';
import ConfirmDialog from '../components/ConfirmDialog';

const ESTADOS = [
  ['nuevo', 'Nuevo'],
  ['leido', 'Leído'],
  ['en_seguimiento', 'En seguimiento'],
  ['cotizacion_enviada', 'Cotización enviada'],
  ['atendido', 'Atendido'],
  ['cerrado', 'Cerrado'],
  ['spam', 'Spam'],
];

function fmtDate(ts) {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function MessageDetail({ message, onClose }) {
  const { user, profile } = useAuth();
  const [estado, setEstado] = useState(message.estado);
  const [notes, setNotes] = useState([]);
  const [history, setHistory] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const msgRef = doc(db, 'messages', message.id);

  useEffect(() => {
    // Mark as read the first time it's opened, if still "nuevo".
    if (message.estado === 'nuevo') {
      updateDoc(msgRef, { estado: 'leido' }).then(() => {
        setEstado('leido');
        addDoc(collection(msgRef, 'history'), {
          estado: 'leido',
          uid: user.uid,
          displayName: profile?.displayName || user.email,
          fecha: serverTimestamp(),
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubNotes = onSnapshot(query(collection(msgRef, 'notes'), orderBy('fecha', 'asc')), (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubHistory = onSnapshot(query(collection(msgRef, 'history'), orderBy('fecha', 'desc')), (snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubNotes();
      unsubHistory();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id]);

  async function handleEstadoChange(newEstado) {
    setEstado(newEstado);
    await updateDoc(msgRef, { estado: newEstado });
    await addDoc(collection(msgRef, 'history'), {
      estado: newEstado,
      uid: user.uid,
      displayName: profile?.displayName || user.email,
      fecha: serverTimestamp(),
    });
    logActivity({ uid: user.uid, accion: 'cambio_estado', modulo: 'mensajes', docId: message.id, detalle: newEstado });
  }

  async function toggleArchivado() {
    const next = !message.archivado;
    await updateDoc(msgRef, { archivado: next });
    logActivity({ uid: user.uid, accion: next ? 'archivar' : 'desarchivar', modulo: 'mensajes', docId: message.id });
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await addDoc(collection(msgRef, 'notes'), {
        texto: noteText.trim(),
        uid: user.uid,
        displayName: profile?.displayName || user.email,
        fecha: serverTimestamp(),
      });
      setNoteText('');
    } finally {
      setSavingNote(false);
    }
  }

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(label + ' copiado');
      setTimeout(() => setCopyMsg(''), 2000);
    } catch {
      setCopyMsg('No se pudo copiar');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const notesSnap = await getDocs(collection(msgRef, 'notes'));
      const historySnap = await getDocs(collection(msgRef, 'history'));
      await Promise.all([
        ...notesSnap.docs.map((d) => deleteDoc(d.ref)),
        ...historySnap.docs.map((d) => deleteDoc(d.ref)),
      ]);
      await deleteDoc(msgRef);
      logActivity({ uid: user.uid, accion: 'eliminar', modulo: 'mensajes', docId: message.id, detalle: message.nombre });
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  const whatsappHref = message.telefono
    ? `https://wa.me/${message.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        `Hola ${message.nombre}, te escribimos de INSOAMIL en respuesta a tu mensaje.`
      )}`
    : null;

  const mailHref = message.email
    ? `mailto:${message.email}?subject=${encodeURIComponent('Respuesta a tu consulta - INSOAMIL')}`
    : null;

  return (
    <div className="msg-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="msg-detail">
        <button className="msg-detail-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
        <h2>{message.nombre}</h2>
        <div className="meta">
          {fmtDate(message.fecha)} · Fuente: {message.fuente || '—'}
        </div>

        <div className="msg-detail-row">
          {message.empresa && (
            <div className="msg-field">
              <span className="label">Empresa</span>
              {message.empresa}
            </div>
          )}
          {message.email && (
            <div className="msg-field">
              <span className="label">Email</span>
              {message.email}
              <button className="copy-btn" onClick={() => copy(message.email, 'Email')}>
                copiar
              </button>
            </div>
          )}
          {message.telefono && (
            <div className="msg-field">
              <span className="label">Teléfono</span>
              {message.telefono}
              <button className="copy-btn" onClick={() => copy(message.telefono, 'Teléfono')}>
                copiar
              </button>
            </div>
          )}
          {message.servicioInteres && (
            <div className="msg-field">
              <span className="label">Servicio de interés</span>
              {message.servicioInteres}
            </div>
          )}
        </div>

        {copyMsg && <div className="banner success" style={{ padding: '6px 12px', display: 'inline-block' }}>{copyMsg}</div>}

        <div className="msg-body">{message.mensaje}</div>

        <div className="msg-actions-row">
          <select className="msg-select" value={estado} onChange={(e) => handleEstadoChange(e.target.value)}>
            {ESTADOS.map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          {mailHref && (
            <a className="btn btn-outline" style={{ borderColor: 'var(--p-line)', color: 'var(--p-ink)' }} href={mailHref}>
              Responder por Email
            </a>
          )}
          {whatsappHref && (
            <a className="btn btn-outline" style={{ borderColor: 'var(--p-line)', color: 'var(--p-ink)' }} target="_blank" rel="noopener" href={whatsappHref}>
              Responder por WhatsApp
            </a>
          )}
          <button className="btn-sm" onClick={toggleArchivado}>
            {message.archivado ? 'Desarchivar' : 'Archivar'}
          </button>
          <button className="btn-sm" style={{ color: '#b3261e', borderColor: '#f3c7c4' }} onClick={() => setConfirmDelete(true)}>
            Eliminar
          </button>
        </div>

        <div className="msg-section">
          <h4>Notas internas</h4>
          {notes.length === 0 && <p className="muted">Sin notas todavía.</p>}
          {notes.map((n) => (
            <div className="note-item" key={n.id}>
              <strong>{n.displayName}</strong> · {fmtDate(n.fecha)}
              <div>{n.texto}</div>
            </div>
          ))}
          <div className="note-form">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Agregar una nota interna..."
            />
            <button className="btn-sm" onClick={addNote} disabled={savingNote}>
              {savingNote ? '...' : 'Agregar'}
            </button>
          </div>
        </div>

        <div className="msg-section">
          <h4>Historial de cambios</h4>
          {history.length === 0 && <p className="muted">Sin historial todavía.</p>}
          {history.map((h) => (
            <div className="history-item" key={h.id}>
              Cambió a <strong>{ESTADOS.find(([v]) => v === h.estado)?.[1] || h.estado}</strong> · {h.displayName} · {fmtDate(h.fecha)}
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar mensaje"
        message={`¿Eliminar el mensaje de ${message.nombre}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
