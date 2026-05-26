import { createContext, useContext } from 'react';

export interface Toast {
  id: number;
  message: string;
}

export interface ToastContextValue {
  toasts: Toast[];
  showError: (message: string) => void;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
