import React from 'react';
import { PHASES } from '../../lib/data';
import { PHASE_DAY_RANGES, phaseDates } from '../../lib/helpers';

export default function JourneyStrip({ phaseIdx, phaseProgress, stepCounts, onPhase, kickoff }) {
  const total = 180;
  const phaseWidths = PHASES.map(p => {
    const [start, end] = PHASE_DAY_RANGES[p.id];
    return ((end - start) / total) * 100;
  });
  const cumulativeStart = PHASES.map(p => (PHASE_DAY_RANGES[p.id][0] / total) * 100);
  const currentStart = cumulativeStart[phaseIdx];
  const currentWidth = phaseWidths[phaseIdx];
  const filledLength = currentStart + (currentWidth * phaseProgress);
  const dates = kickoff ? phaseDates(kickoff) : null;

  return (
    <div className="journey">
      <div className="journey-track" style={{ gridTemplateColumns: phaseWidths.map(w => `${w}fr`).join(' ') }}>
        <div className="journey-line">
          <div className="fill" style={{ width: `${Math.min(filledLength, 100)}%` }}></div>
        </div>
        {PHASES.map((p, i) => {
          const cls = i < phaseIdx ? 'done' : i === phaseIdx ? 'current' : '';
          const counts = stepCounts[p.id] || { done: 0, total: 0 };
          const range = PHASE_DAY_RANGES[p.id];
          return (
            <div key={p.id} className={`journey-station ${cls}`} onClick={() => onPhase?.(p.id)}>
              <span className="station-num">Phase {p.num}</span>
              <span className="station-dot"></span>
              <span className="station-name">{p.name}</span>
              <span className="station-meta">{counts.done}/{counts.total} {i === phaseIdx ? '· active' : i < phaseIdx ? '· complete' : ''}</span>
              <span className="station-date">
                {dates
                  ? `${dates[p.id].start} – ${dates[p.id].end}`
                  : `Day ${range[0]}–${range[1]}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
