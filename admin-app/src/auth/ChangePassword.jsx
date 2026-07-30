import { useState } from 'react';
import { useAuth } from './AuthContext';
import './auth.css';

export default function ChangePassword() {
  const { changePassword, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    try {
      await changePassword(password);
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Por seguridad, vuelve a iniciar sesión y cambia la contraseña justo después.');
        await logout();
      } else {
        setError('No se pudo cambiar la contraseña. Inténtalo de nuevo.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">INSOAMIL</div>
        <h1>Cambia tu contraseña</h1>
        <p className="auth-sub">Por seguridad, debes establecer una nueva contraseña antes de continuar.</p>

        <label>
          Nueva contraseña
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label>
          Confirmar contraseña
          <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>

        {error && <div className="auth-alert error">{error}</div>}

        <button type="submit" disabled={busy}>
          {busy ? 'Guardando...' : 'Guardar y continuar'}
        </button>
      </form>
    </div>
  );
}
