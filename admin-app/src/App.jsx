import { AuthProvider, useAuth } from './auth/AuthContext';
import { RouterProvider, useRouter } from './router';
import Login from './auth/Login';
import ChangePassword from './auth/ChangePassword';
import Layout from './components/Layout';
import Dashboard from './modules/Dashboard';
import './components/pages.css';

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
      <ModuleRouter path={path} />
    </Layout>
  );
}

function ModuleRouter({ path }) {
  switch (path) {
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
