import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ICONS } from '../../lib/data';

const VIEWPORT_PAD = 8;   // keep this far from the viewport edges
const GAP = 6;            // gap between trigger and menu

export default function Dropdown({ trigger, items, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null); // { top, left, placement }
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Position the portaled menu relative to the trigger, flipping above when
  // there isn't room below and clamping inside the viewport.
  const place = useCallback(() => {
    const t = triggerRef.current;
    const menu = menuRef.current;
    if (!t || !menu) return;
    const r = t.getBoundingClientRect();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < mh + GAP + VIEWPORT_PAD && spaceAbove > spaceBelow;

    let top = openUp ? r.top - mh - GAP : r.bottom + GAP;
    top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - mh - VIEWPORT_PAD));

    let left = align === 'left' ? r.left : r.right - mw;
    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - mw - VIEWPORT_PAD));

    setCoords({ top, left, placement: openUp ? 'top' : 'bottom' });
  }, [align]);

  // Measure + position as soon as the menu mounts, then focus the first item.
  useLayoutEffect(() => {
    if (!open) return;
    place();
    const first = menuRef.current?.querySelector('.dd-item');
    first?.focus();
  }, [open, place]);

  // Close on outside-click, Esc, scroll, and resize while open.
  useEffect(() => {
    if (!open) return;
    const onDown = e => {
      if (wrapRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = e => { if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); } };
    const onScroll = () => setOpen(false);
    const onResize = () => setOpen(false);
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    // capture so it fires for any scrolling ancestor, not just window
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  function toggle(e) {
    e.stopPropagation();
    setOpen(o => !o);
  }

  // Arrow-key navigation between items inside the open menu.
  function onMenuKeyDown(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const nodes = Array.from(menuRef.current?.querySelectorAll('.dd-item') || []);
    if (!nodes.length) return;
    const idx = nodes.indexOf(document.activeElement);
    const next = e.key === 'ArrowDown'
      ? nodes[(idx + 1) % nodes.length]
      : nodes[(idx - 1 + nodes.length) % nodes.length];
    next?.focus();
  }

  return (
    <div className={`dropdown-wrap${open ? ' open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        onClick={toggle}
        className="close"
        style={{ width: 28, height: 28 }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger || ICONS.dots}
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="dropdown-menu"
          role="menu"
          onKeyDown={onMenuKeyDown}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: coords ? coords.top : -9999,
            left: coords ? coords.left : -9999,
            right: 'auto',
            bottom: 'auto',
            zIndex: 1000,
            visibility: coords ? 'visible' : 'hidden',
          }}
        >
          {items.map((item, i) =>
            item === null
              ? <div key={i} className="dd-sep" />
              : <button key={i} type="button" role="menuitem" className={`dd-item${item.danger ? ' danger' : ''}`}
                  onClick={() => { item.onClick(); setOpen(false); }}>
                  {item.label}
                </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
