import { useState } from 'react';
import { useAuth } from './AuthContext';
import AuthBrand from '../components/AuthBrand';
import './auth.css';

export default function Login() {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'reset'

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await resetPassword(email.trim());
        setInfo('Te enviamos un correo para restablecer tu contraseña.');
      }
    } catch (err) {
      setError(mapAuthError(err.code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <AuthBrand />
        <h1>{mode === 'login' ? 'Acceso administrativo' : 'Recuperar contraseña'}</h1>
        <p className="auth-sub">
          {mode === 'login'
            ? 'Ingresa con tu cuenta para gestionar el sitio.'
            : 'Escribe tu correo y te enviaremos un enlace para restablecer tu contraseña.'}
        </p>

        <label>
          Correo
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />
        </label>

        {mode === 'login' && (
          <label>
            Contraseña
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
        )}

        {error && <div className="auth-alert error">{error}</div>}
        {info && <div className="auth-alert success">{info}</div>}

        <button type="submit" disabled={busy}>
          {busy ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Enviar enlace'}
        </button>

        <button
          type="button"
          className="auth-link"
          onClick={() => {
            setMode(mode === 'login' ? 'reset' : 'login');
            setError('');
            setInfo('');
          }}
        >
          {mode === 'login' ? '¿Olvidaste tu contraseña?' : 'Volver a iniciar sesión'}
        </button>
      </form>
    </div>
  );
}

function mapAuthError(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    default:
      return 'Ocurrió un error. Inténtalo de nuevo.';
  }
}
