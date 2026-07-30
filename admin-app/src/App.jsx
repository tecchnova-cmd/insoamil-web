import { AuthProvider, useAuth } from './auth/AuthContext';
import { RouterProvider, useRouter } from './router';
import Login from './auth/Login';
import ChangePassword from './auth/ChangePassword';
import Layout from './components/Layout';
import AuthBrand from './components/AuthBrand';
import Dashboard from './modules/Dashboard';
import Mensajes from './modules/Mensajes';
import FAQs from './modules/FAQs';
import ComoTrabajamos from './modules/ComoTrabajamos';
import Operadores from './modules/Operadores';
import Servicios from './modules/Servicios';
import WhatsAppSettings from './modules/WhatsAppSettings';
import Usuarios from './modules/Usuarios';
import ActivityLog from './modules/ActivityLog';
import GeneralSettings from './modules/GeneralSettings';
import './components/pages.css';

const MESSAGE_ROLES = ['superadmin', 'admin', 'comercial'];
const CONTENT_ROLES = ['superadmin', 'admin', 'editor'];
const SETTINGS_ROLES = ['superadmin', 'admin'];
const SUPERADMIN_ONLY = ['superadmin'];

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
          <AuthBrand />
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
          <AuthBrand />
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
    case 'servicios':
      return CONTENT_ROLES.includes(role) ? <Servicios /> : <NoAccess />;
    case 'whatsapp':
      return SETTINGS_ROLES.includes(role) ? <WhatsAppSettings /> : <NoAccess />;
    case 'usuarios':
      return SUPERADMIN_ONLY.includes(role) ? <Usuarios /> : <NoAccess />;
    case 'configuracion':
      return SETTINGS_ROLES.includes(role) ? <GeneralSettings /> : <NoAccess />;
    case 'actividad':
      return SETTINGS_ROLES.includes(role) ? <ActivityLog /> : <NoAccess />;
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
