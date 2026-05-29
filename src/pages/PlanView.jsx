import React from 'react';
import { ICONS, PLAN } from '../lib/data';
import ClientLogo from '../components/ui/ClientLogo';

export default function PlanView({ client, editable, onClose }) {
  const days = [
    { key: 'd60',  n: 60,  label: 'Foundation', data: PLAN.d60 },
    { key: 'd90',  n: 90,  label: 'Go-live',    data: PLAN.d90 },
    { key: 'd180', n: 180, label: 'Scale',       data: PLAN.d180 },
  ];

  return (
    <main className="canvas">
      <section style={{ paddingBottom: 32, borderBottom: '1px solid var(--hairline)', marginBottom: 40 }}>
        <div className="flex items-center gap-3">
          <ClientLogo client={client} />
          <div>
            <div className="eyebrow">{client.name} · Strategy</div>
            <h1 className="display-2" style={{ marginTop: 10 }}>The first <em style={{ fontStyle: 'normal', fontWeight: 400, color: 'var(--ink-muted)' }}>180 days</em>.</h1>
          </div>
          <div style={{ flex: 1 }}></div>
          <button className="btn">{ICONS.cal} Export plan</button>
          {editable && <button className="btn primary">Edit milestones</button>}
        </div>
        <p className="lede" style={{ maxWidth: 720, marginTop: 24 }}>
          A shared promise between us and {client.name}. Three milestones, written together at kickoff,
          revisited at each phase gate.
        </p>
      </section>

      <div className="plan-grid">
        {days.map(d => (
          <article key={d.key} className="plan-card">
            <div className="day-mark"><span className="tabnum">{d.n}</span><sup>days</sup></div>
            <div className="day-label">{d.label}</div>
            <h3 className="plan-name">{d.label === 'Foundation' ? 'Set the table.' : d.label === 'Go-live' ? 'Make it real.' : 'Compound.'}</h3>
            <p className="plan-goal">"{d.data.goal}"</p>

            <div className="milestones">
              {d.data.milestones.map((m, i) => {
                const ownerColors = { DD: '#0B0B0F', CL: '#FB673E', BO: '#6D5BFF' };
                const ownerLabels = { DD: 'Duda', CL: 'Client', BO: 'Both' };
                return (
                  <div key={i} className={`milestone ${m.done ? 'done' : ''}`}>
                    <span className="m-dot">{m.done && ICONS.check}</span>
                    <div className="m-text">
                      <b style={{ textDecoration: m.done ? 'line-through' : 'none', color: m.done ? 'var(--ink-muted)' : 'var(--ink)' }}>{m.text}</b>
                      {m.owner && (
                        <div className="m-meta">
                          <span className="m-owner-av" style={{ background: ownerColors[m.owner] || 'var(--ink)' }}>{m.owner}</span>
                          <span>{ownerLabels[m.owner] || m.owner}</span>
                        </div>
                      )}
                    </div>
                    <span className="m-due">{m.completed ? `✓ ${m.completed}` : m.due}</span>
                  </div>
                );
              })}
            </div>

            {d.data.notes && (
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--hairline-soft)' }}>
                <div className="eyebrow">Note</div>
                <p className="text-sm muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{d.data.notes}</p>
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="card card-pad" style={{ marginTop: 40, background: 'var(--paper-soft)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow">Client signoff</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 18, marginTop: 6, fontStyle: 'italic' }}>
              Approved by <b style={{ fontStyle: 'normal' }}>{client.contacts?.[0]?.name || client.name}</b> on <span className="num">March 14, 2026</span>.
            </p>
          </div>
          <span className="pill done"><span className="dot"></span>Plan locked</span>
        </div>
      </div>
    </main>
  );
}
