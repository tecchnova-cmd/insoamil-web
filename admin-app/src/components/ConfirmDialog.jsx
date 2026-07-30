import './confirm-dialog.css';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', danger = false, busy = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="confirm-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="confirm-box" role="alertdialog" aria-modal="true">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button className={danger ? 'confirm-danger' : 'confirm-ok'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
