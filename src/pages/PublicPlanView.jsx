import React, { useEffect, useState } from 'react';
import { ICONS } from '../lib/data';
import { loadPlanByToken, approvePlanByToken, groupByPhase, PHASES } from '../lib/plan';

const PHASE_META = {
  60:  { label: 'Foundation', name: 'Set the table.' },
  90:  { label: 'Go-live',    name: 'Make it real.' },
  180: { label: 'Scale',      name: 'Compound.' },
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

export default function PublicPlanView({ token }) {
  const [state, setState] = useState({ status: 'loading', plan: null });
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [approved, setApproved] = useState(null); // { by, at } once approved this session

  useEffect(() => {
    let alive = true;
    (async () => {
      const plan = await loadPlanByToken(token);
      if (!alive) return;
      if (!plan) { setState({ status: 'invalid', plan: null }); return; }
      setState({ status: 'ok', plan });
      if (plan.token?.approvedAt) {
        setApproved({ by: plan.token.approvedBy, at: plan.token.approvedAt });
      }
    })();
    return () => { alive = false; };
  }, [token]);

  async function approve() {
    if (busy) return;
    const who = name.trim();
    if (!who) { setError('Please enter your name to approve.'); return; }
    setBusy(true);
    setError('');
    try {
      await approvePlanByToken(token, state.plan.client.id, who);
      setApproved({ by: who, at: new Date().toISOString() });
    } catch (err) {
      setError(err?.message || 'Could not record your approval. Please try again.');
    }
    setBusy(false);
  }

  if (state.status === 'loading') {
    return (
      <main className="canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="muted text-sm">Loading plan…</div>
      </main>
    );
  }

  if (state.status === 'invalid') {
    return (
      <main className="canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 className="h1" style={{ marginBottom: 10 }}>Link unavailable</h1>
          <p className="muted text-sm">
            This share link is invalid, has expired, or was revoked. Please ask your
            account manager for a fresh link.
          </p>
        </div>
      </main>
    );
  }

  const { client, milestones } = state.plan;
  const grouped = groupByPhase(milestones);

  return (
    <main className="canvas">
      <section style={{ paddingBottom: 32, borderBottom: '1px solid var(--hairline)', marginBottom: 40 }}>
        <div className="eyebrow">{client.name} · Onboarding plan</div>
        <h1 className="display-2" style={{ marginTop: 10 }}>
          The first <em style={{ fontStyle: 'normal', fontWeight: 400, color: 'var(--ink-muted)' }}>180 days</em>.
        </h1>
        <p className="lede" style={{ maxWidth: 720, marginTop: 24 }}>
          A shared plan for {client.name}. Review the milestones below and approve when you're ready.
        </p>
      </section>

      <div className="plan-grid">
        {PHASES.map(phase => {
          const meta = PHASE_META[phase] || { label: `Day ${phase}`, name: '' };
          const list = grouped[phase] || [];
          return (
            <article key={phase} className="plan-card">
              <div className="day-mark"><span className="tabnum">{phase}</span><sup>days</sup></div>
              <div className="day-label">{meta.label}</div>
              {meta.name && <h3 className="plan-name">{meta.name}</h3>}
              <div className="milestones">
                {list.length === 0 ? (
                  <div className="muted text-xs" style={{ padding: '6px 0' }}>No milestones in this phase.</div>
                ) : list.map(m => (
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
                ))}
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
                Approved by <b style={{ fontStyle: 'normal' }}>{approved.by}</b>
                {approved.at && <> on <span className="num">{fmtDate(approved.at)}</span></>}.
              </p>
            </div>
            <span className="pill done"><span className="dot"></span>Plan approved</span>
          </div>
        ) : (
          <div>
            <div className="eyebrow">Approve this plan</div>
            <p className="text-sm muted" style={{ marginTop: 6, marginBottom: 16 }}>
              Confirm you've reviewed the 60·90·180 plan. Type your name to record your approval.
            </p>
            <div className="flex items-center gap-2" style={{ maxWidth: 520 }}>
              <input
                className="input"
                placeholder="Your full name"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') approve(); }}
                style={{ flex: 1 }}
              />
              <button className="btn primary" onClick={approve} disabled={busy || !name.trim()}>
                {busy ? 'Saving…' : <>{ICONS.check} Approve plan</>}
              </button>
            </div>
            {error && <div className="text-xs" style={{ color: 'var(--bad, #c0392b)', marginTop: 12 }}>{error}</div>}
          </div>
        )}
      </div>

      <p className="muted text-xs" style={{ textAlign: 'center', marginTop: 28 }}>
        Powered by Onward · This link is private to {client.name}.
      </p>
    </main>
  );
}
