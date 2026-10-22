import { useState, useCallback, useRef, useEffect } from 'react';
import { Toast, ToastContext } from './toast.ts';
import { Toaster } from './Toaster.tsx';

let nextId = 0;
const DISMISS_AFTER_MS = { error: 4000, info: 8000 };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: Toast['variant']) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, variant }]);
      const timer = setTimeout(() => dismiss(id), DISMISS_AFTER_MS[variant]);
      timers.current.push(timer);
    },
    [dismiss],
  );

  const showError = useCallback((message: string) => show(message, 'error'), [show]);
  const showInfo = useCallback((message: string) => show(message, 'info'), [show]);

  return (
    <ToastContext.Provider value={{ toasts, showError, showInfo, dismiss }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}
