import { useState } from 'react';

// Progressive disclosure for already-loaded lists: show `step` items at a time.
// Returns how many to render, whether more exist, and a handler to reveal more.
export const useVisibleCount = (total, step = 3) => {
  const [visible, setVisible] = useState(step);
  const count = Math.min(visible, total);
  return {
    count,
    hasMore: total > count,
    remaining: total - count,
    showMore: () => setVisible((v) => v + step),
  };
};
