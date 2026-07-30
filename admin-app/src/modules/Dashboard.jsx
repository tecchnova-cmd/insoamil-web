import { useEffect, useState } from 'react';
import { collection, query, where, getCountFromServer, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

function StatCard({ label, value, loading }) {
  return (
    <div className="dash-card">
      <div className="dash-card-value">{loading ? '—' : value}</div>
      <div className="dash-card-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function safeCount(q) {
      try {
        const snap = await getCountFromServer(q);
        return snap.data().count;
      } catch {
        return 0; // collection may not exist yet at this stage of the build
      }
    }

    async function load() {
      setLoading(true);
      setError('');
      try {
        const messagesCol = collection(db, 'messages');
        const [total, nuevos, atendidos, cotizaciones, serviciosActivos, faqsActivas] = await Promise.all([
          safeCount(query(messagesCol)),
          safeCount(query(messagesCol, where('estado', '==', 'nuevo'))),
          safeCount(query(messagesCol, where('estado', '==', 'atendido'))),
          safeCount(query(messagesCol, where('estado', '==', 'cotizacion_enviada'))),
          safeCount(query(collection(db, 'services'), where('active', '==', true))),
          safeCount(query(collection(db, 'faqs'), where('active', '==', true))),
        ]);

        if (cancelled) return;
        setStats({ total, nuevos, atendidos, cotizaciones, serviciosActivos, faqsActivas });

        try {
          const logsSnap = await getDocs(
            query(collection(db, 'activityLogs'), orderBy('fecha', 'desc'), limit(8))
          );
          if (!cancelled) {
            setRecent(logsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
          }
        } catch {
          if (!cancelled) setRecent([]);
        }
      } catch (e) {
        if (!cancelled) setError('No se pudieron cargar las métricas: ' + e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="page-head">
        <h1>Dashboard</h1>
        <p>Hola {profile?.displayName || ''}, este es el resumen de INSOAMIL.</p>
      </div>

      {error && <div className="banner error">{error}</div>}

      <div className="dash-grid">
        <StatCard label="Mensajes recibidos" value={stats?.total ?? 0} loading={loading} />
        <StatCard label="Mensajes nuevos" value={stats?.nuevos ?? 0} loading={loading} />
        <StatCard label="Mensajes atendidos" value={stats?.atendidos ?? 0} loading={loading} />
        <StatCard label="Cotizaciones solicitadas" value={stats?.cotizaciones ?? 0} loading={loading} />
        <StatCard label="Servicios activos" value={stats?.serviciosActivos ?? 0} loading={loading} />
        <StatCard label="Preguntas frecuentes activas" value={stats?.faqsActivas ?? 0} loading={loading} />
      </div>

      <div className="dash-section">
        <h2>Actividad reciente</h2>
        {recent.length === 0 ? (
          <p className="muted">
            Todavía no hay actividad registrada — este panel apenas se está construyendo por fases.
          </p>
        ) : (
          <ul className="activity-list">
            {recent.map((log) => (
              <li key={log.id}>
                <strong>{log.accion}</strong> · {log.modulo} · {log.uid}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
