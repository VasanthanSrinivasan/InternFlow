import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  open,
  title = "Are you sure?",
  message,
  confirmText = "Delete",
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div className="modal-card confirm-card" role="alertdialog" aria-modal="true">
        <div className="confirm-icon">
          <AlertTriangle size={26} />
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="danger-fill-button" onClick={onConfirm} disabled={busy}>
            {busy ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
