import { useEffect } from 'react';

const useEscapeKey = (onClose, active = true) => {
  useEffect(() => {
    if (!active) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, active]);
};

export default useEscapeKey;
