import React from 'react';
import StepRow from './StepRow';

export default function PhaseGroup({ phase, steps, onStep, dayIn = 0 }) {
  const done = steps.filter(s => s.status === 'done').length;
  const pct = steps.length > 0 ? (done / steps.length) * 100 : 0;
  return (
    <div className="phase-group">
      <div className="phase-head">
        <span className="num">{phase.num}</span>
        <div style={{ flex: 1 }}>
          <h2 className="h2">{phase.name}</h2>
          <div className="muted text-sm" style={{ marginTop: 2 }}>{phase.blurb}</div>
        </div>
        <div className="meta">
          <span>{done} of {steps.length} complete</span>
          <div className="mini-progress"><div className="fill" style={{ width: `${pct}%` }}></div></div>
        </div>
      </div>
      {steps.map(s => <StepRow key={s.id} step={s} onClick={() => onStep?.(s)} dayIn={dayIn} />)}
    </div>
  );
}
