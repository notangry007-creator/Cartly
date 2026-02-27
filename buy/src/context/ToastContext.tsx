import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Snackbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const COLORS: Record<ToastType, string> = {
  success: '#2E7D32',
  error: '#B71C1C',
  info: '#1565C0',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState<Toast>({ message: '', type: 'info' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
        style={[s.snackbar, { backgroundColor: COLORS[toast.type] }]}
        wrapperStyle={s.wrapper}
        action={{ label: '✕', onPress: () => setVisible(false), textColor: '#fff' }}
      >
        {toast.message}
      </Snackbar>
    </ToastContext.Provider>
  );
}

const s = StyleSheet.create({
  wrapper: { bottom: 80, zIndex: 1000 },
  snackbar: { borderRadius: 8 },
});
