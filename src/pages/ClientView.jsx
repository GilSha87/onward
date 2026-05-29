import React, { useState } from 'react';
import { PHASES, ICONS, CLIENT_RESOURCES } from '../lib/data';
import { nextMilestoneForPhase } from '../lib/helpers';
import Pill from '../components/ui/Pill';
import ProgressRing from '../components/ui/ProgressRing';
import JourneyStrip from '../components/journey/JourneyStrip';
import Gantt from '../components/journey/Gantt';
import ResourcesPanel from '../components/ui/ResourcesPanel';

export default function ClientView({ client, steps, onOpenPlan, onToggleStep }) {
  const [tab, setTab] = useState('tasks');
  const phaseIdx = PHASES.findIndex(p => p.id === client.phase);
  const pct = client.progress.total > 0 ? client.progress.done / client.progress.total : 0;
  const stepCounts = {};
  PHASES.forEach(p => {
    const ps = steps.filter(s => s.phase === p.id);
    stepCounts[p.id] = { done: ps.filter(s => s.status === 'done').length, total: ps.length };
  });
  const visibleSteps = steps.filter(s => s.status !== 'skip');
  const clientTasks = visibleSteps.filter(s => s.owner === 'Client' || s.owner === 'Both').filter(s => s.status !== 'done');
  const allClientSteps = visibleSteps.filter(s => s.owner === 'Client' || s.owner === 'Both');

  return (
    <div className="client-shell">
      <section className="client-mast">
        <div className="container">
          <p className="client-greeting">Welcome back, {client.contacts[0]?.name?.split(' ')[0] || 'there'}.</p>
          <h1 className="client-title">Your <em>onboarding</em>,<br/>day <span className="num" style={{ fontWeight: 700, color: 'var(--ink)' }}>{client.dayIn}</span> of <span className="num" style={{ fontWeight: 700, color: 'var(--ink)' }}>180</span>.</h1>
          <div className="client-progress">
            <ProgressRing pct={pct} />
            <div className="meta">
              <div className="label">You are here</div>
              <div className="value">{PHASES[phaseIdx]?.name}</div>
              <div className="sub">{client.progress.done} of {client.progress.total} steps · led by {client.am}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-muted)', fontWeight: 500 }}>Next milestone</div>
              <div style={{ fontSize: 22, marginTop: 4, fontWeight: 700 }}>{nextMilestoneForPhase(client.phase)}</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 64px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="tab-row">
          <button className={tab === 'tasks' ? 'on' : ''} onClick={() => setTab('tasks')}>Your tasks <span className="count">{clientTasks.length}</span></button>
          <button className={tab === 'journey' ? 'on' : ''} onClick={() => setTab('journey')}>Journey</button>
          <button className={tab === 'timeline' ? 'on' : ''} onClick={() => setTab('timeline')}>Timeline</button>
          <button className={tab === 'resources' ? 'on' : ''} onClick={() => setTab('resources')}>Resources</button>
        </div>

        {tab === 'tasks' && (
          <div className="rail">
            <div>
              {clientTasks.length > 0 ? (
                <>
                  <div className="eyebrow accent" style={{ marginBottom: 12 }}>Open tasks for you</div>
                  <div className="card" style={{ overflow: 'hidden', marginBottom: 32 }}>
                    {clientTasks.slice(0, 6).map(s => (
                      <div key={s.id} className={`step-row ${s.status}`} style={{ padding: '16px 20px', gridTemplateColumns: '28px 1fr auto auto', cursor: 'default' }}>
                        <span className="step-check clickable" onClick={() => onToggleStep && onToggleStep(s.id)} title="Mark complete">{s.status === 'done' && ICONS.check}</span>
                        <div className="title"><b>{s.title}</b><div className="why">{s.why}</div></div>
                        <span className="due">Day {s.due}</span>
                        <Pill kind={s.status} />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--ink-muted)', fontStyle: 'italic', marginBottom: 32 }}>Nothing on your plate right now. We'll let you know.</div>
              )}
              <div className="eyebrow" style={{ marginBottom: 12 }}>All your steps</div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {allClientSteps.map(s => (
                  <div key={s.id} className={`step-row ${s.status}`} style={{ padding: '14px 20px', gridTemplateColumns: '28px 1fr auto auto', cursor: 'default' }}>
                    <span className="step-check clickable" onClick={() => onToggleStep && onToggleStep(s.id)} title={s.status === 'done' ? 'Mark not started' : 'Mark complete'}>{s.status === 'done' && ICONS.check}</span>
                    <div className="title"><b>{s.title}</b><div className="why">{s.why}</div></div>
                    <span className="due">Day {s.due}</span>
                    <Pill kind={s.status} />
                  </div>
                ))}
              </div>
            </div>
            <aside>
              <div className="card card-pad">
                <div className="eyebrow">Your team at Duda</div>
                <div className="flex items-center gap-3" style={{ marginTop: 14 }}>
                  <span className="avatar" style={{ width: 44, height: 44, fontSize: 14, background: 'var(--ink)' }}>ML</span>
                  <div><div style={{ fontSize: 18, fontWeight: 700 }}>{client.am}</div><div className="muted text-xs">Account Manager · responds within 4 hrs</div></div>
                </div>
              </div>
              <div className="card card-pad" style={{ marginTop: 20, background: 'var(--paper-soft)' }}>
                <div className="eyebrow">This page</div>
                <p className="text-sm muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 8 }}>Bookmark this — it updates automatically. No login needed.</p>
              </div>
            </aside>
          </div>
        )}

        {tab === 'journey' && (
          <div>
            <JourneyStrip phaseIdx={phaseIdx} phaseProgress={(stepCounts[client.phase]?.done || 0) / (stepCounts[client.phase]?.total || 1)} stepCounts={stepCounts} kickoff={client.kickoff} />
            <div style={{ marginTop: 24 }}><button className="btn" onClick={onOpenPlan}>{ICONS.cal} See full 180-day plan</button></div>
          </div>
        )}

        {tab === 'timeline' && <Gantt steps={visibleSteps} dayIn={client.dayIn} />}

        {tab === 'resources' && <ResourcesPanel resources={CLIENT_RESOURCES} title="Resources" subtitle="Training, guides, and tools for your team." />}
      </section>

      <footer style={{ padding: '32px 64px', borderTop: '1px solid var(--hairline)', color: 'var(--ink-muted)', fontSize: 12 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          <span>{client.name} · powered by <b style={{ color: 'var(--ink)' }}>Duda</b></span>
          <span className="num">Last updated 2 hours ago</span>
        </div>
      </footer>
    </div>
  );
}
