import React, { useState } from 'react';
import { PHASES, ICONS, ACTIVITY, AM_RESOURCES } from '../lib/data';
import { QUESTIONS } from '../lib/data';
import ClientLogo from '../components/ui/ClientLogo';
import StatusBadge from '../components/ui/StatusBadge';
import Dropdown from '../components/ui/Dropdown';
import Pill from '../components/ui/Pill';
import ResourcesPanel from '../components/ui/ResourcesPanel';
import JourneyStrip from '../components/journey/JourneyStrip';
import PhaseGroup from '../components/journey/PhaseGroup';
import Gantt from '../components/journey/Gantt';
import InboxPanel from './InboxPanel';

export default function Tracker({ client, steps, setScreen, onPlanEdit, onStep, onToggleStep, onEditClient }) {
  const [tab, setTab] = useState('overview');

  const stepCounts = {};
  PHASES.forEach(p => {
    const ps = steps.filter(s => s.phase === p.id);
    stepCounts[p.id] = { done: ps.filter(s => s.status === 'done').length, total: ps.length };
  });
  const phaseIdx = PHASES.findIndex(p => p.id === client.phase);
  const cur = stepCounts[client.phase];
  const phaseProgress = cur && cur.total > 0 ? cur.done / cur.total : 0;

  return (
    <main className="canvas canvas-wide">
      <header className="tracker-head">
        <ClientLogo client={client} size="lg" />
        <div className="info">
          <div className="eyebrow">Client · {client.flag} {client.country}</div>
          <div className="flex items-center gap-3" style={{ marginTop: 6 }}>
            <h1 className="h1">{client.name}</h1>
            {client.status && client.status !== 'active' && <StatusBadge status={client.status} />}
          </div>
          <div className="meta">
            <span><b>ICP</b> · {client.icp}</span>
            <span><b>Flow</b> · {client.flow}</span>
            <span><b>Touch</b> · {client.touch}</span>
            <span><b>Kickoff</b> · <span className="num">{client.kickoff}</span></span>
          </div>
        </div>
        <div className="right">
          <div className="day-counter" style={{ alignItems: 'baseline' }}>
            <span className="n tabnum" style={{ fontSize: 40 }}>{client.dayIn}</span>
            <span className="l">day in</span>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={() => setScreen({ kind: 'client', clientId: client.id })}>{ICONS.link} Client link</button>
            <Dropdown items={[
              { label: '60·90·180 Plan', onClick: () => onPlanEdit(client.id) },
              null,
              { label: client.status === 'active' || !client.status ? 'Mark inactive' : 'Mark active', onClick: () => onEditClient?.(client.id, { status: client.status === 'active' || !client.status ? 'inactive' : 'active' }) },
              { label: client.status === 'archived' ? 'Unarchive' : 'Archive', onClick: () => onEditClient?.(client.id, { status: client.status === 'archived' ? 'active' : 'archived' }) },
              null,
              { label: 'Delete permanently', danger: true, onClick: () => { if (window.confirm('Delete ' + client.name + '?')) onEditClient?.(client.id, { status: 'deleted' }); } },
            ]} />
          </div>
        </div>
      </header>

      <div className="tab-row">
        <button className={tab === 'overview' ? 'on' : ''} onClick={() => setTab('overview')}>Overview</button>
        <button className={tab === 'steps' ? 'on' : ''} onClick={() => setTab('steps')}>Steps <span className="count">{steps.length}</span></button>
        <button className={tab === 'timeline' ? 'on' : ''} onClick={() => setTab('timeline')}>Timeline</button>
        <button onClick={() => onPlanEdit(client.id)}>Plan</button>
        <button className={tab === 'resources' ? 'on' : ''} onClick={() => setTab('resources')}>Resources</button>
        <button className={tab === 'inbox' ? 'on' : ''} onClick={() => setTab('inbox')}>
          Inbox <span className="count" style={{ background: 'var(--duda-soft)', color: 'var(--duda-deep)' }}>{QUESTIONS.filter(q => q.status === 'Open').length}</span>
        </button>
        <button className={tab === 'files' ? 'on' : ''} onClick={() => setTab('files')}>Files</button>
      </div>

      {tab === 'overview' && (
        <div className="rail">
          <div>
            <JourneyStrip phaseIdx={phaseIdx} phaseProgress={phaseProgress} stepCounts={stepCounts} kickoff={client.kickoff} onPhase={() => setTab('steps')} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
              <h2 className="h2">Current phase</h2>
              <button className="btn ghost sm" onClick={() => setTab('steps')}>View all phases {ICONS.arrow}</button>
            </div>
            <PhaseGroup phase={PHASES[phaseIdx]} steps={steps.filter(s => s.phase === client.phase)} onStep={onStep} dayIn={client.dayIn} />
          </div>
          <aside>
            <div className="rail-card">
              <h4>Up next</h4>
              <div className="flex flex-col gap-3">
                {steps.filter(s => s.status !== 'done' && s.status !== 'skip').slice(0, 3).map(s => (
                  <div key={s.id} style={{ borderBottom: '1px solid var(--hairline-soft)', paddingBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                    <div className="muted text-xs" style={{ marginTop: 3 }}>Day {s.due} · {s.owner}</div>
                    <div style={{ marginTop: 8 }}><Pill kind={s.status} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rail-card">
              <h4>Contacts</h4>
              {client.contacts.map((c, i) => (
                <div key={i} className="contact">
                  <span className="avatar" style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--hairline)' }}>{(c.name || '?').split(' ').map(n => n[0]).join('')}</span>
                  <div>
                    <div className="name">{c.name}</div>
                    <div className="role">{c.role} · {c.email}</div>
                    {c.designations && c.designations.length > 0 && (
                      <div className="contact-tags" style={{ marginTop: 3 }}>
                        {c.designations.map(d => (
                          <span key={d} className={`contact-tag ${d.toLowerCase()} on`} style={{ fontSize: 9, padding: '1px 6px' }}>{d}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="rail-card">
              <h4>Activity</h4>
              {ACTIVITY.slice(0, 5).map((a, i) => (
                <div key={i} className="activity-item">
                  <b>{a.who}</b> {a.what} <b>{a.target}</b>
                  {a.from && a.to && <><span className="change-chip from">{a.from}</span><span className="change-arr">→</span><span className="change-chip to">{a.to}</span></>}
                  {a.quote && <q>"{a.quote}"</q>}
                  <time>{a.when}</time>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {tab === 'steps' && (
        <div>
          {PHASES.map(p => {
            const ps = steps.filter(s => s.phase === p.id);
            if (!ps.length) return null;
            return <PhaseGroup key={p.id} phase={p} steps={ps} onStep={onStep} dayIn={client.dayIn} />;
          })}
        </div>
      )}

      {tab === 'timeline' && <Gantt steps={steps} dayIn={client.dayIn} />}

      {tab === 'resources' && <ResourcesPanel resources={AM_RESOURCES} title="AM Resource Library" subtitle="Internal resources. Not shared with the client." />}

      {tab === 'inbox' && <InboxPanel onStep={onStep} />}

      {tab === 'files' && (
        <div className="empty">
          <div className="empty-icon">{ICONS.cal}</div>
          <h3>No files yet</h3>
          <p>Logos, brand assets, contracts will appear here.</p>
          <div className="empty-actions">
            <button className="btn primary">{ICONS.plus} Upload file</button>
          </div>
        </div>
      )}
    </main>
  );
}
