import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastVariant = 'success' | 'danger' | 'info';
type ToastItem = { id: number; message: string; variant: ToastVariant };
type ToastApi = { success: (message: string) => void; error: (message: string) => void; info: (message: string) => void };

const ToastContext = createContext<ToastApi | null>(null);
let nextToastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const show = useCallback((variant: ToastVariant, message: string) => {
    const id = ++nextToastId;
    setToasts((items) => [...items, { id, variant, message }]);
    window.setTimeout(() => dismiss(id), 5_000);
  }, [dismiss]);
  const value = useMemo<ToastApi>(() => ({ success: (message) => show('success', message), error: (message) => show('danger', message), info: (message) => show('info', message) }), [show]);

  return <ToastContext.Provider value={value}>{children}<div className="toast-container position-fixed top-0 end-0 p-3" aria-live="polite" aria-atomic="true">{toasts.map((toast) => <div className={`toast show align-items-center text-bg-${toast.variant} border-0 mb-2`} key={toast.id} role="alert"><div className="d-flex"><div className="toast-body">{toast.message}</div><button type="button" className="btn-close btn-close-white me-2 m-auto" aria-label="Close" onClick={() => dismiss(toast.id)} /></div></div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider.');
  return context;
}
