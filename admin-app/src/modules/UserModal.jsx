import { useState } from 'react';
import { ROLES } from '../lib/roles';

export default function UserModal({ initial, onSave, onCancel }) {
  const [email, setEmail] = useState(initial?.email || '');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(initial?.displayName || '');
  const [role, setRole] = useState(initial?.role || 'readonly');
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!initial && password.length < 8) {
      setError('La contraseña inicial debe tener al menos 8 caracteres.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ email: email.trim(), password, displayName: displayName.trim(), role, active });
    } catch (err) {
      setError(mapError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="form-box" onSubmit={handleSubmit}>
        <h3>{initial ? 'Editar usuario' : 'Nuevo usuario'}</h3>

        <label>Correo</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!initial} required />

        {!initial && (
          <>
            <label>Contraseña inicial</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </>
        )}

        <label>Nombre para mostrar</label>
        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ej: María Pérez" />

        <label>Rol</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <label className="form-check">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Usuario activo (puede entrar al panel)
        </label>

        {error && <div className="banner error" style={{ marginTop: 16 }}>{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn-sm" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn-sm" style={{ background: 'var(--p-green-deep)', color: 'white', borderColor: 'var(--p-green-deep)' }} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

function mapError(err) {
  if (err.code === 'auth/email-already-in-use') return 'Ese correo ya tiene una cuenta.';
  if (err.code === 'auth/invalid-email') return 'El correo no es válido.';
  if (err.code === 'auth/weak-password') return 'La contraseña es muy débil.';
  return 'No se pudo guardar: ' + err.message;
}
