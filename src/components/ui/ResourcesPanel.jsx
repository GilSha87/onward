import React, { useState } from 'react';

export default function ResourcesPanel({ resources, title, subtitle }) {
  const [typeFilter, setTypeFilter] = useState('All');
  const types = ['All', ...new Set(resources.map(r => r.type))];
  const shown = typeFilter === 'All' ? resources : resources.filter(r => r.type === typeFilter);

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div className="eyebrow">{title}</div>
        {subtitle && <p className="muted text-sm" style={{ marginTop: 6 }}>{subtitle}</p>}
      </div>
      <div className="flex gap-2" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        {types.map(t => (
          <button key={t} type="button" className={`btn sm${typeFilter === t ? ' primary' : ''}`} onClick={() => setTypeFilter(t)}>{t}</button>
        ))}
      </div>
      {shown.length === 0 && (
        <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>No resources match.</div>
      )}
      <div className="resource-grid">
        {shown.map((r, i) => (
          // URL-less cards are non-interactive ("Coming soon") — the
          // resource-card--static modifier removes the hover/pointer affordance
          // so they don't look clickable.
          <div key={i} className={`resource-card${r.url ? '' : ' resource-card--static'}`}>
            <div className="rc-type">{r.type}</div>
            {r.url
              ? <a href={r.url} target="_blank" rel="noopener noreferrer">{r.name}</a>
              : <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>}
            <div className="rc-desc">{r.when}</div>
            {!r.url && (
              <span className="rc-soon">Coming soon</span>
            )}
            {r.internal && (
              <span style={{ fontSize: 10, fontWeight: 600, color: '#8B5E0E', background: 'var(--sun-soft)', padding: '2px 8px', borderRadius: 999, alignSelf: 'flex-start' }}>AM only</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
