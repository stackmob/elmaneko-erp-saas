import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3500);
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
};
