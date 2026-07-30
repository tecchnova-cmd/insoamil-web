import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import MessageDetail from './MessageDetail';
import './mensajes.css';

const ESTADOS = [
  ['nuevo', 'Nuevo'],
  ['leido', 'Leído'],
  ['en_seguimiento', 'En seguimiento'],
  ['cotizacion_enviada', 'Cotización enviada'],
  ['atendido', 'Atendido'],
  ['cerrado', 'Cerrado'],
  ['spam', 'Spam'],
];
const ESTADO_LABEL = Object.fromEntries(ESTADOS);

function fmtDate(ts) {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
}

function csvEscape(v) {
  const s = (v ?? '').toString().replace(/"/g, '""');
  return `"${s}"`;
}

export default function Mensajes() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return messages.filter((m) => {
      if (!showArchived && m.archivado) return false;
      if (estadoFilter !== 'todos' && m.estado !== estadoFilter) return false;
      if (term) {
        const haystack = [m.nombre, m.empresa, m.email, m.mensaje, m.asunto].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [messages, estadoFilter, search, showArchived]);

  function exportCsv() {
    const header = ['Nombre', 'Empresa', 'Email', 'Teléfono', 'Servicio de interés', 'Mensaje', 'Estado', 'Fuente', 'Fecha'];
    const rows = filtered.map((m) => [
      m.nombre,
      m.empresa,
      m.email,
      m.telefono,
      m.servicioInteres,
      m.mensaje,
      ESTADO_LABEL[m.estado] || m.estado,
      m.fuente,
      fmtDate(m.fecha),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mensajes-insoamil-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="page-head">
        <h1>Mensajes</h1>
        <p>Solicitudes recibidas desde el formulario web.</p>
      </div>

      {error && <div className="banner error">{error}</div>}

      <div className="toolbar">
        <input
          type="text"
          placeholder="Buscar por nombre, empresa, email o mensaje..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
          <option value="todos">Todos los estados</option>
          {ESTADOS.map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Mostrar archivados
        </label>
        <div className="toolbar-spacer" />
        <button className="btn-sm" onClick={exportCsv}>
          Exportar CSV
        </button>
      </div>

      <div className="msg-table-wrap">
        {loading ? (
          <div className="empty-state">Cargando mensajes...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No hay mensajes que coincidan con este filtro.</div>
        ) : (
          <table className="msg-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Mensaje</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className={m.estado === 'nuevo' ? 'unread' : ''} onClick={() => setSelected(m)}>
                  <td>{m.nombre}</td>
                  <td>{m.empresa || '—'}</td>
                  <td className="msg-snippet">{m.mensaje}</td>
                  <td>
                    <span className={`badge-estado badge-${m.estado}`}>{ESTADO_LABEL[m.estado] || m.estado}</span>
                  </td>
                  <td>{fmtDate(m.fecha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && <MessageDetail message={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
