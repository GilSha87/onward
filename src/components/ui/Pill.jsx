import React from 'react';
import { STATUS, ICONS } from '../../lib/data';

export default function Pill({ kind, children, noIcon }) {
  const cls = STATUS[kind]?.cls || kind;
  const ic = STATUS[kind]?.ic;
  return (
    <span className={`pill ${cls}`}>
      {!noIcon && ic && <span className="ic">{ICONS[ic]}</span>}
      {children || STATUS[kind]?.label}
    </span>
  );
}
