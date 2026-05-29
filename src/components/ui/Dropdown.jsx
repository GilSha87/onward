import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../../lib/data';

export default function Dropdown({ trigger, items, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h, true);
    return () => document.removeEventListener('mousedown', h, true);
  }, [open]);

  return (
    <div className="dropdown-wrap" ref={ref}>
      <button type="button" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="close" style={{ width: 28, height: 28 }}>
        {trigger || ICONS.dots}
      </button>
      {open && (
        <div className="dropdown-menu" style={{ [align === 'left' ? 'left' : 'right']: 0 }} onClick={e => e.stopPropagation()}>
          {items.map((item, i) =>
            item === null
              ? <div key={i} className="dd-sep" />
              : <button key={i} type="button" className={`dd-item${item.danger ? ' danger' : ''}`}
                  onClick={() => { item.onClick(); setOpen(false); }}>
                  {item.label}
                </button>
          )}
        </div>
      )}
    </div>
  );
}
