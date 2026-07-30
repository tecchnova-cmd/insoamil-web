import { AuthProvider, useAuth } from './auth/AuthContext';
import { RouterProvider, useRouter } from './router';
import Login from './auth/Login';
import ChangePassword from './auth/ChangePassword';
import Layout from './components/Layout';
import Dashboard from './modules/Dashboard';
import Mensajes from './modules/Mensajes';
import FAQs from './modules/FAQs';
import ComoTrabajamos from './modules/ComoTrabajamos';
import Operadores from './modules/Operadores';
import './components/pages.css';

const MESSAGE_ROLES = ['superadmin', 'admin', 'comercial'];
const CONTENT_ROLES = ['superadmin', 'admin', 'editor'];

function Screen({ children }) {
  return <div className="auth-screen">{children}</div>;
}

function Gate() {
  const { user, profile, loading, profileError } = useAuth();
  const { path } = useRouter();

  if (loading) {
    return (
      <Screen>
        <div style={{ color: 'white', fontWeight: 600 }}>Cargando...</div>
      </Screen>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (profileError) {
    return (
      <Screen>
        <div className="auth-card">
          <div className="auth-logo">INSOAMIL</div>
          <h1>Acceso pendiente</h1>
          <p className="auth-sub">{profileError}</p>
        </div>
      </Screen>
    );
  }

  if (profile && profile.active !== true) {
    return (
      <Screen>
        <div className="auth-card">
          <div className="auth-logo">INSOAMIL</div>
          <h1>Cuenta desactivada</h1>
          <p className="auth-sub">
            Tu acceso al panel fue desactivado. Contacta al superadministrador si crees que es un error.
          </p>
        </div>
      </Screen>
    );
  }

  if (profile?.forcePasswordChange) {
    return <ChangePassword />;
  }

  return (
    <Layout>
      <ModuleRouter path={path} role={profile?.role} />
    </Layout>
  );
}

function NoAccess() {
  return (
    <div className="page-head">
      <h1>Sin acceso</h1>
      <p>Tu rol no tiene permiso para ver esta sección.</p>
    </div>
  );
}

function ModuleRouter({ path, role }) {
  switch (path) {
    case 'mensajes':
      return MESSAGE_ROLES.includes(role) ? <Mensajes /> : <NoAccess />;
    case 'faqs':
      return CONTENT_ROLES.includes(role) ? <FAQs /> : <NoAccess />;
    case 'como-trabajamos':
      return CONTENT_ROLES.includes(role) ? <ComoTrabajamos /> : <NoAccess />;
    case 'operadores':
      return CONTENT_ROLES.includes(role) ? <Operadores /> : <NoAccess />;
    case '':
    default:
      return <Dashboard />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <Gate />
      </RouterProvider>
    </AuthProvider>
  );
}
