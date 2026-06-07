import React from 'react';
import { PHASES } from '../../lib/data';

export default function Gantt({ steps, dayIn = 0 }) {
  if (!steps.length) {
    return <div className="empty"><p className="muted">No steps to display on the timeline.</p></div>;
  }
  const min = Math.min(...steps.map(s => s.start));
  const max = Math.max(...steps.map(s => s.due));
  const range = max - min || 1;
  const todayPct = ((dayIn - min) / range) * 100;

  const ticks = [];
  for (let d = Math.ceil(min / 30) * 30; d <= max; d += 30) {
    const pct = ((d - min) / range) * 100;
    ticks.push({ d, pct });
  }

  function barFor(s) {
    const left = ((s.start - min) / range) * 100;
    const width = Math.max(((s.due - s.start) / range) * 100, 2);
    return { left: `${left}%`, width: `${width}%` };
  }

  return (
    <div className="gantt">
      <div className="gantt-head">
        <div className="left">Phase · Step</div>
        <div className="scale">
          {ticks.map(t => (
            <div key={t.d} className="tick" style={{ flex: 1 }}>
              Day {t.d}
            </div>
          ))}
        </div>
      </div>
      <div className="gantt-body">
        <div className="gantt-today" style={{ left: `calc(220px + (100% - 220px) * ${todayPct / 100})` }}></div>
        {PHASES.map(p => {
          const phaseSteps = steps.filter(s => s.phase === p.id);
          if (phaseSteps.length === 0) return null;
          const phaseMin = Math.min(...phaseSteps.map(s => s.start));
          const phaseMax = Math.max(...phaseSteps.map(s => s.due));
          const left = ((phaseMin - min) / range) * 100;
          const width = ((phaseMax - phaseMin) / range) * 100;
          return (
            <React.Fragment key={p.id}>
              <div className="gantt-row phase">
                <div className="label">
                  <span className="mono faint" style={{ fontSize: 11 }}>Phase {p.num}</span>
                  &nbsp;{p.short}
                </div>
                <div className="lane">
                  <div className="gantt-bar phase-bar" style={{ left: `${left}%`, width: `${width}%` }}></div>
                </div>
              </div>
              {phaseSteps.map(s => (
                <div key={s.id} className="gantt-row">
                  <div className="label" title={s.title}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                  </div>
                  <div className="lane">
                    <div className={`gantt-bar ${s.status}`} style={barFor(s)} title={`${s.title} · day ${s.start}–${s.due}`} />
                  </div>
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
