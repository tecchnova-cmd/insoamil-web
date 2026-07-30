import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const MODULE_LABELS = {
  mensajes: 'Mensajes',
  faqCategorias: 'Categorías FAQ',
  faqs: 'Preguntas Frecuentes',
  comoTrabajamosSeccion: 'Cómo Trabajamos (sección)',
  comoTrabajamos: 'Cómo Trabajamos (pasos)',
  operadores: 'Operadores Estratégicos',
  servicios: 'Servicios',
  whatsappSettings: 'Contacto y WhatsApp',
  usuarios: 'Usuarios y Permisos',
  configuracionGeneral: 'Configuración General',
};

const ACTION_LABELS = {
  crear: 'creó',
  editar: 'editó',
  eliminar: 'eliminó',
  duplicar: 'duplicó',
  cambio_estado: 'cambió el estado de',
  archivar: 'archivó',
  desarchivar: 'desarchivó',
};

function fmtDate(ts) {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'activityLogs'), orderBy('fecha', 'desc'), limit(300)), (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        map[d.id] = d.data().displayName || d.data().email;
      });
      setUsers(map);
    });
    return unsub;
  }, []);

  const modules = useMemo(() => [...new Set(logs.map((l) => l.modulo))], [logs]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (moduleFilter !== 'todos' && l.modulo !== moduleFilter) return false;
      if (term) {
        const who = (users[l.uid] || l.uid || '').toLowerCase();
        const haystack = [who, l.detalle, l.accion, l.modulo].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [logs, moduleFilter, search, users]);

  return (
    <div>
      <div className="page-head">
        <h1>Registro de Actividad</h1>
        <p>Últimas {logs.length} acciones registradas en el panel (inicios/cierres de sesión, cambios de contenido, usuarios, etc.).</p>
      </div>

      <div className="toolbar">
        <input type="text" placeholder="Buscar por usuario o detalle..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
          <option value="todos">Todos los módulos</option>
          {modules.map((m) => (
            <option key={m} value={m}>
              {MODULE_LABELS[m] || m}
            </option>
          ))}
        </select>
      </div>

      <div className="msg-table-wrap">
        {loading ? (
          <div className="empty-state">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">Sin actividad registrada todavía.</div>
        ) : (
          <table className="msg-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Módulo</th>
                <th>Detalle</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td>{users[l.uid] || l.uid || '—'}</td>
                  <td>{ACTION_LABELS[l.accion] || l.accion}</td>
                  <td>{MODULE_LABELS[l.modulo] || l.modulo}</td>
                  <td className="msg-snippet">{l.detalle || '—'}</td>
                  <td>{fmtDate(l.fecha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
