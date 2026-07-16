import { useEffect } from 'react';

const useScrollLock = (active) => {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [active]);
};

export default useScrollLock;
