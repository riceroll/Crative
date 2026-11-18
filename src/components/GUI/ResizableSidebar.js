import React, { useRef, useState } from 'react';

const MIN_WIDTH = 280;
const MAX_WIDTH = 560;
const DEFAULT_WIDTH = 344;

export default function ResizableSidebar({ children }) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  const drag = useRef(null);

  const clamp = (value) => Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth - 320, value));

  const finishResize = () => {
    drag.current = null;
    setResizing(false);
  };

  return (
    <>
      <div
        className="sidebar-resizer"
        role="separator"
        tabIndex={0}
        aria-label="Resize sidebar"
        aria-orientation="vertical"
        aria-controls="configurator-sidebar"
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={Math.min(MAX_WIDTH, window.innerWidth - 320)}
        aria-valuenow={width}
        aria-valuetext={`${width} pixels`}
        title="Drag to resize · double-click to reset"
        data-resizing={resizing}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          const sidebar = event.currentTarget.nextElementSibling;
          drag.current = { x: event.clientX, width: sidebar.getBoundingClientRect().width };
          setResizing(true);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          setWidth(Math.round(clamp(drag.current.width + drag.current.x - event.clientX)));
        }}
        onPointerUp={finishResize}
        onPointerCancel={finishResize}
        onLostPointerCapture={finishResize}
        onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
        onKeyDown={(event) => {
          const delta = event.shiftKey ? 40 : 16;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            setWidth((current) => clamp(current + (event.key === 'ArrowLeft' ? delta : -delta)));
          } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            setWidth(clamp(event.key === 'Home' ? MIN_WIDTH : MAX_WIDTH));
          }
        }}
      />
      <aside className="sidebar" id="configurator-sidebar" aria-label="Crate configuration" style={{ '--resizable-sidebar-width': `${width}px` }}>
        {children}
      </aside>
    </>
  );
}