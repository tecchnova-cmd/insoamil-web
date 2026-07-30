import { useState } from 'react';

export default function DeleteOriginalDialog({ service, onConfirm, onCancel, busy }) {
  const [typed, setTyped] = useState('');
  const matches = typed.trim() === service.nombre;

  return (
    <div className="confirm-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="confirm-box" style={{ maxWidth: 460 }}>
        <h3>Eliminar un servicio original</h3>
        <p>
          <strong>"{service.nombre}"</strong> es uno de los 17 servicios originales de INSOAMIL. Eliminarlo es
          una acción permanente. Para confirmar, escribe el nombre exacto del servicio:
        </p>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={service.nombre}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--p-line)', marginBottom: 18 }}
        />
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button className="confirm-danger" onClick={onConfirm} disabled={!matches || busy}>
            {busy ? 'Eliminando...' : 'Eliminar definitivamente'}
          </button>
        </div>
      </div>
    </div>
  );
}
