import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(() => {});

// Lightweight global toasts — used to surface failures that were previously
// swallowed by silent catch blocks.
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'error') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                background: t.type === 'error' ? '#dc2626' : 'var(--green-700, #15803d)',
                color: '#fff', padding: '0.6rem 1.1rem', borderRadius: '0.5rem',
                fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '90vw',
              }}
            >
              {t.type === 'error' ? '⚠' : '✓'} {t.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
