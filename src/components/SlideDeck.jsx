import { useState, useEffect, useCallback, useRef } from 'react';
import Slide from './Slide';

export default function SlideDeck({ slides }) {
  const [current, setCurrent] = useState(0);
  const deckRef = useRef(null);

  const total = slides.length;

  const go = useCallback(
    (dir) =>
      setCurrent((prev) => Math.max(0, Math.min(total - 1, prev + dir))),
    [total],
  );

  const toggleFullscreen = useCallback(() => {
    const el = deckRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    function onKey(e) {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          go(1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          go(-1);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'Escape':
          if (document.fullscreenElement) document.exitFullscreen();
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, toggleFullscreen]);

  if (total === 0) {
    return <p className="empty-deck">This deck has no slides.</p>;
  }

  const progress = ((current + 1) / total) * 100;

  return (
    <div className="slide-deck" ref={deckRef}>
      <div className="slide-viewport">
        <Slide html={slides[current].html} index={current} total={total} />
      </div>

      <div className="slide-controls">
        <button
          className="control-btn"
          onClick={() => go(-1)}
          disabled={current === 0}
          aria-label="Previous slide"
        >
          &#8592;
        </button>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <button
          className="control-btn"
          onClick={() => go(1)}
          disabled={current === total - 1}
          aria-label="Next slide"
        >
          &#8594;
        </button>

        <span className="slide-counter">
          {current + 1} / {total}
        </span>

        <button
          className="control-btn fullscreen-btn"
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen"
        >
          &#x26F6;
        </button>
      </div>
    </div>
  );
}
