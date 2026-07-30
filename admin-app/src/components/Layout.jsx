import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../router';
import './layout.css';

// Sidebar items are added one phase at a time — never show a link to a
// module that doesn't actually work yet.
const NAV_ITEMS = [
  { key: '', label: 'Dashboard', icon: '📊' },
  {
    key: 'mensajes',
    label: 'Mensajes',
    icon: '✉️',
    badge: 'newMessages',
    roles: ['superadmin', 'admin', 'comercial'],
  },
  {
    key: 'faqs',
    label: 'Preguntas frecuentes',
    icon: '❓',
    roles: ['superadmin', 'admin', 'editor'],
  },
  {
    key: 'como-trabajamos',
    label: 'Cómo trabajamos',
    icon: '🛠️',
    roles: ['superadmin', 'admin', 'editor'],
  },
  {
    key: 'operadores',
    label: 'Operadores estratégicos',
    icon: '🏗️',
    roles: ['superadmin', 'admin', 'editor'],
  },
];

const ROLE_LABELS = {
  superadmin: 'Superadministrador',
  admin: 'Administrador',
  editor: 'Editor',
  comercial: 'Comercial',
  readonly: 'Solo lectura',
};

function useNewMessagesCount(enabled) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const q = query(collection(db, 'messages'), where('estado', '==', 'nuevo'));
    const unsub = onSnapshot(q, (snap) => setCount(snap.size), () => setCount(0));
    return unsub;
  }, [enabled]);
  return count;
}

export default function Layout({ children }) {
  const { profile, user, logout } = useAuth();
  const { path, navigate } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const canSeeMessages = ['superadmin', 'admin', 'comercial'].includes(profile?.role);
  const newMessages = useNewMessagesCount(canSeeMessages);
  const badgeValues = { newMessages };
  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(profile?.role));

  return (
    <div className="panel-shell">
      <aside className={`panel-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="panel-brand">INSOAMIL</div>
        <nav>
          {visibleItems.map((item) => {
            const badgeCount = item.badge ? badgeValues[item.badge] : 0;
            return (
              <button
                key={item.key}
                className={path === item.key ? 'active' : ''}
                onClick={() => {
                  navigate(item.key);
                  setMenuOpen(false);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {badgeCount > 0 && <span className="nav-badge">{badgeCount}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="panel-main">
        <header className="panel-header">
          <button className="panel-menu-toggle" onClick={() => setMenuOpen((v) => !v)}>
            ☰
          </button>
          <div className="panel-header-spacer" />
          <div className="panel-profile">
            <div className="panel-profile-info">
              <strong>{profile?.displayName || user?.email}</strong>
              <span>{ROLE_LABELS[profile?.role] || profile?.role}</span>
            </div>
            <button className="panel-logout" onClick={logout} title="Cerrar sesión">
              ⏻
            </button>
          </div>
        </header>

        <main className="panel-content">{children}</main>
      </div>
    </div>
  );
}
