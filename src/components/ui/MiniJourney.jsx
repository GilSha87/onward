import React from 'react';
import { PHASES } from '../../lib/data';

export default function MiniJourney({ phaseIdx, progress, phaseId }) {
  const tipName = PHASES[phaseIdx]?.name || '—';
  return (
    <div className="mini-journey" title={`Currently in: ${tipName}`}>
      {PHASES.map((p, i) => {
        const cls = i < phaseIdx ? 'done' : i === phaseIdx ? 'cur' : '';
        const fill = i < phaseIdx ? '100%' : i === phaseIdx ? `${progress * 100}%` : '0%';
        return (
          <div key={p.id} className={`seg-bar ${cls}`} title={p.name}>
            <div className="fill" style={{ width: fill }}></div>
          </div>
        );
      })}
    </div>
  );
}
