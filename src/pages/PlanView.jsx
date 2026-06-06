import React, { useEffect, useMemo, useState } from 'react';
import { ICONS, PLAN, QUESTIONS } from '../lib/data';
import ClientLogo from '../components/ui/ClientLogo';
import { loadMilestones, saveMilestones, groupByPhase, setPlanStatus, PHASES } from '../lib/plan';

const PHASE_META = {
  60:  { label: 'Foundation', name: 'Set the table.' },
  90:  { label: 'Go-live',    name: 'Make it real.' },
  180: { label: 'Scale',      name: 'Compound.' },
};
const PHASE_GOALS = {
  60:  PLAN.d60?.goal  || '',
  90:  PLAN.d90?.goal  || '',
  180: PLAN.d180?.goal || '',
};

const OWNER_COLORS = { DD: '#0B0B0F', CL: '#FB673E', BO: '#6D5BFF' };
const OWNER_LABELS = { DD: 'Duda', CL: 'Client', BO: 'Both' };

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

export default function PlanView({ client, editable, onClose, onShare, onReopen }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const approved = client.planStatus === 'approved' || client.planStatus === 'locked';

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { milestones: ms } = await loadMilestones(client.id);
      if (!alive) return;
      setMilestones(ms);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [client.id]);

  const grouped = useMemo(() => groupByPhase(milestones), [milestones]);

  function updateMilestone(id, patch) {
    setMilestones(prev => prev.map(m => (m.id === id ? { ...m, ...patch } : m)));
  }

  function addMilestone(phase) {
    const inPhase = milestones.filter(m => String(m.phase) === String(phase));
    const nextOrder = inPhase.length ? Math.max(...inPhase.map(m => m.sortOrder ?? 0)) + 1 : 0;
    setMilestones(prev => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        phase: String(phase),
        title: '',
        detail: '',
        sortOrder: nextOrder,
        isCustom: true,
      },
    ]);
  }

  function removeMilestone(id) {
    setMilestones(prev => prev.filter(m => m.id !== id));
  }

  // Reorder within a phase by swapping sortOrder with the neighbour.
  function move(id, dir) {
    setMilestones(prev => {
      const target = prev.find(m => m.id === id);
      if (!target) return prev;
      const siblings = prev
        .filter(m => String(m.phase) === String(target.phase))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      const idx = siblings.findIndex(m => m.id === id);
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return prev;
      const a = siblings[idx];
      const b = siblings[swapIdx];
      const ao = a.sortOrder ?? 0;
      const bo = b.sortOrder ?? 0;
      return prev.map(m => {
        if (m.id === a.id) return { ...m, sortOrder: bo };
        if (m.id === b.id) return { ...m, sortOrder: ao };
        return m;
      });
    });
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError('');
    // Normalise sort_order to be contiguous per phase before persisting.
    const normalised = [];
    PHASES.forEach(p => {
      grouped[p]
        .filter(m => (m.title || '').trim())
        .forEach((m, i) => normalised.push({ ...m, sortOrder: i }));
    });
    try {
      await saveMilestones(client.id, normalised);
      setMilestones(normalised);
      setEditing(false);
    } catch (err) {
      setError(err?.message || 'Could not save the plan.');
    }
    setSaving(false);
  }

  async function cancelEdit() {
    // Reload from source to discard unsaved changes.
    setError('');
    const { milestones: ms } = await loadMilestones(client.id);
    setMilestones(ms);
    setEditing(false);
  }

  async function reopen() {
    if (onReopen) { onReopen(); return; }
    try {
      await setPlanStatus(client.id, 'sent');
    } catch (err) {
      setError(err?.message || 'Could not reopen the plan.');
    }
  }

  return (
    <main className="canvas">
      {editable && (
        <div className="tab-row">
          <button onClick={onClose}>Overview</button>
          <button onClick={onClose}>Steps</button>
          <button onClick={onClose}>Timeline</button>
          <button className="on">Plan</button>
          <button onClick={onClose}>Resources</button>
          <button onClick={onClose}>
            Inbox {QUESTIONS.filter(q => q.status === 'Open').length > 0 && <span className="count" style={{ background: 'var(--duda-soft)', color: 'var(--duda-deep)' }}>{QUESTIONS.filter(q => q.status === 'Open').length}</span>}
          </button>
          <button onClick={onClose}>Files</button>
        </div>
      )}

      <section style={{ paddingBottom: 32, borderBottom: '1px solid var(--hairline)', marginBottom: 40 }}>
        <div className="flex items-center gap-3">
          <ClientLogo client={client} />
          <div>
            <div className="eyebrow">{client.name} · Strategy</div>
            <h1 className="display-2" style={{ marginTop: 10 }}>The first <em style={{ fontStyle: 'normal', fontWeight: 400, color: 'var(--ink-muted)' }}>180 days</em>.</h1>
          </div>
          <div style={{ flex: 1 }}></div>
          {editable && !editing && (
            <button className="btn primary" onClick={() => setEditing(true)} disabled={approved}>
              {ICONS.spark} Edit milestones
            </button>
          )}
          {editable && editing && (
            <>
              <button className="btn" onClick={cancelEdit} disabled={saving}>Cancel</button>
              <button className="btn primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : <>{ICONS.check} Save plan</>}
              </button>
            </>
          )}
        </div>
        <p className="lede" style={{ maxWidth: 720, marginTop: 24 }}>
          A shared promise between us and {client.name}. Three milestones, written together at kickoff,
          revisited at each phase gate.
        </p>
        {editable && approved && !editing && (
          <p className="text-xs muted" style={{ marginTop: 12 }}>
            This plan is approved and locked for editing. Reopen it from the signoff card below to make changes.
          </p>
        )}
        {error && <div className="text-xs" style={{ color: 'var(--bad, #c0392b)', marginTop: 12 }}>{error}</div>}
      </section>

      {loading ? (
        <div className="plan-grid">
          {[60, 90, 180].map(phase => (
            <article key={phase} className="plan-card">
              <div className="sk" style={{ width: 80, height: 80, borderRadius: 6, marginBottom: 8 }} />
              <div className="sk" style={{ width: 64, height: 11, marginBottom: 18 }} />
              <div className="sk" style={{ width: 120, height: 26, marginBottom: 24, borderRadius: 6 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map(n => (
                  <div key={n} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 8, alignItems: 'center' }}>
                    <div className="sk" style={{ width: 18, height: 18, borderRadius: 5 }} />
                    <div>
                      <div className="sk" style={{ height: 13, width: `${70 + n * 8}%`, marginBottom: 4 }} />
                      <div className="sk" style={{ height: 11, width: `${40 + n * 5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <>
        <div className="plan-grid">
          {PHASES.map(phase => {
            const meta = PHASE_META[phase] || { label: `Day ${phase}`, name: '' };
            const list = grouped[phase] || [];
            return (
              <article key={phase} className="plan-card">
                <div className="day-mark"><span className="tabnum">{phase}</span><sup>days</sup></div>
                <div className="day-label">{meta.label}</div>
                <h3 className="plan-name">{meta.name}</h3>
                {PHASE_GOALS[phase] && <p className="plan-goal">"{PHASE_GOALS[phase]}"</p>}

                <div className="milestones">
                  {list.length === 0 && !editing && (
                    <div className="muted text-xs" style={{ padding: '6px 0' }}>No milestones in this phase.</div>
                  )}
                  {list.map((m, i) => (
                    editing ? (
                      <div key={m.id} className="milestone" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div className="m-text" style={{ flex: 1, minWidth: 0 }}>
                          <input
                            className="input"
                            placeholder="Milestone title"
                            value={m.title}
                            onChange={e => updateMilestone(m.id, { title: e.target.value })}
                            style={{ fontSize: 13, fontWeight: 600, width: '100%' }}
                          />
                          <input
                            className="input"
                            placeholder="Detail (optional)"
                            value={m.detail || ''}
                            onChange={e => updateMilestone(m.id, { detail: e.target.value })}
                            style={{ fontSize: 12, marginTop: 6, width: '100%' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <button className="btn ghost sm" title="Move up" onClick={() => move(m.id, 'up')} disabled={i === 0}>↑</button>
                          <button className="btn ghost sm" title="Move down" onClick={() => move(m.id, 'down')} disabled={i === list.length - 1}>↓</button>
                          <button className="btn ghost sm" title="Remove" onClick={() => removeMilestone(m.id)}>{ICONS.close}</button>
                        </div>
                      </div>
                    ) : !editable ? (
                      // Client-facing read-only milestone: no internal checkbox,
                      // owner avatars, or due dates — just the promise.
                      <div key={m.id} className="milestone milestone-ro">
                        <span className="m-bullet" />
                        <div className="m-text">
                          <b>{m.title}</b>
                          {m.detail && <div className="muted text-xs" style={{ marginTop: 3 }}>{m.detail}</div>}
                        </div>
                      </div>
                    ) : (
                      <div key={m.id} className={`milestone ${m.done ? 'done' : ''}`}>
                        <span className="m-dot">{m.done && ICONS.check}</span>
                        <div className="m-text">
                          <b style={{ textDecoration: m.done ? 'line-through' : 'none', color: m.done ? 'var(--ink-muted)' : 'var(--ink)' }}>{m.title}</b>
                          {m.detail && <div className="muted text-xs" style={{ marginTop: 3 }}>{m.detail}</div>}
                          {m.owner && (
                            <div className="m-meta">
                              <span className="m-owner-av" style={{ background: OWNER_COLORS[m.owner] || 'var(--ink)' }}>{m.owner}</span>
                              <span>{OWNER_LABELS[m.owner] || m.owner}</span>
                            </div>
                          )}
                        </div>
                        {(m.completed || m.due) && <span className="m-due">{m.completed ? `✓ ${m.completed}` : m.due}</span>}
                      </div>
                    )
                  ))}
                  {editing && (
                    <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => addMilestone(phase)}>
                      {ICONS.plus} Add milestone
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

      <div className="card card-pad" style={{ marginTop: 40, background: 'var(--paper-soft)' }}>
        {approved ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow">Client signoff</div>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 18, marginTop: 6, fontStyle: 'italic' }}>
                Approved by <b style={{ fontStyle: 'normal' }}>{client.planApprovedBy || client.contacts?.[0]?.name || client.name}</b>
                {client.planApprovedAt && <> on <span className="num">{fmtDate(client.planApprovedAt)}</span></>}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {editable && (
                <button className="btn ghost sm" onClick={reopen}>Reopen plan</button>
              )}
              <span className="pill done"><span className="dot"></span>Plan {client.planStatus === 'locked' ? 'locked' : 'approved'}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow">Client signoff</div>
              <p className="text-sm muted" style={{ marginTop: 6 }}>
                {client.planStatus === 'sent'
                  ? 'Shared with the client — awaiting their approval.'
                  : 'Not yet shared. Generate a private link to send this plan for approval.'}
              </p>
            </div>
            {editable && (
              <button className="btn" onClick={() => onShare?.(client.id)}>{ICONS.link} Share with client</button>
            )}
          </div>
        )}
      </div>
        </>
      )}
    </main>
  );
}
