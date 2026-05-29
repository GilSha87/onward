import React from 'react';

export default function ProgressRing({ pct }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct);
  return (
    <div className="ring">
      <svg viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--hairline)" strokeWidth="3" />
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--ink)" strokeWidth="3"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div className="ring-num">
        {Math.round(pct * 100)}<span style={{ fontSize: 14, verticalAlign: 'top', marginLeft: 1 }}>%</span>
      </div>
    </div>
  );
}
