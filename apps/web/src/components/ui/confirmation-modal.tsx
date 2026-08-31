import type { ReactNode } from 'react';

export function ConfirmationModal({ title, message, confirmLabel, variant = 'danger', pending, onConfirm, onCancel }: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  variant?: 'danger' | 'success' | 'primary';
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return <>
    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true" aria-labelledby="confirmation-modal-title">
      <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
        <div className="modal-header"><h2 className="modal-title fs-5" id="confirmation-modal-title">{title}</h2><button type="button" className="btn-close" onClick={onCancel} disabled={pending} aria-label="Close" /></div>
        <div className="modal-body"><p className="mb-0">{message}</p></div>
        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>Cancel</button><button type="button" className={`btn btn-${variant}`} onClick={onConfirm} disabled={pending}>{pending ? 'Processing…' : confirmLabel}</button></div>
      </div></div>
    </div>
    <div className="modal-backdrop fade show" />
  </>;
}
