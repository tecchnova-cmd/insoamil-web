import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../router';
import './layout.css';

// Sidebar items are added one phase at a time — never show a link to a
// module that doesn't actually work yet.
const NAV_ITEMS = [{ key: '', label: 'Dashboard', icon: '📊' }];

const ROLE_LABELS = {
  superadmin: 'Superadministrador',
  admin: 'Administrador',
  editor: 'Editor',
  comercial: 'Comercial',
  readonly: 'Solo lectura',
};

export default function Layout({ children }) {
  const { profile, user, logout } = useAuth();
  const { path, navigate } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="panel-shell">
      <aside className={`panel-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="panel-brand">INSOAMIL</div>
        <nav>
          {NAV_ITEMS.map((item) => (
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
            </button>
          ))}
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
