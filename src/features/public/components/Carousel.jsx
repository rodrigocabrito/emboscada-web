import { useState, useEffect, useCallback } from 'react';

// Simple auto-advancing image carousel (fade transition), with arrows + dots.
// `className` lets callers apply a style variant (e.g. pub-carousel--logos).
const Carousel = ({ images = [], interval = 4500, alt = '', className = '' }) => {
  const [i, setI] = useState(0);
  const n = images.length;

  const go = useCallback((next) => setI((c) => (c + next + n) % n), [n]);

  useEffect(() => {
    if (n <= 1) return undefined;
    const id = setInterval(() => setI((c) => (c + 1) % n), interval);
    return () => clearInterval(id);
  }, [n, interval, i]);

  if (!n) return null;

  return (
    <div className={`pub-carousel${className ? ` ${className}` : ''}`} role="group" aria-roledescription="carousel">
      {images.map((src, idx) => (
        <img
          key={src}
          className={`pub-carousel-img${idx === i ? ' is-active' : ''}`}
          src={src}
          alt={alt ? `${alt} ${idx + 1}` : ''}
          aria-hidden={idx !== i}
          loading="lazy"
          draggable="false"
        />
      ))}

      {n > 1 && (
        <>
          <button type="button" className="pub-carousel-arrow pub-carousel-arrow--prev" onClick={() => go(-1)} aria-label="Anterior">‹</button>
          <button type="button" className="pub-carousel-arrow pub-carousel-arrow--next" onClick={() => go(1)} aria-label="Seguinte">›</button>
          <div className="pub-carousel-dots">
            {images.map((src, idx) => (
              <button
                key={src}
                type="button"
                className={`pub-carousel-dot${idx === i ? ' is-active' : ''}`}
                onClick={() => setI(idx)}
                aria-label={`Imagem ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Carousel;
