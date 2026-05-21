import { useState, useCallback, useRef, useEffect } from 'react';
import { ToastContext } from './toast.ts';
import { Toaster } from './Toaster.tsx';

let nextId = 0;
const DISMISS_AFTER_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showError = useCallback(
    (message: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message }]);
      const timer = setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
      timers.current.push(timer);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, showError, dismiss }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}
