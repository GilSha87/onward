import React, { useEffect, useState } from 'react';
import i18next from 'i18next';
import { ICONS } from '../lib/data';
import { loadPlanByToken, approvePlanByToken, groupByPhase, PHASES } from '../lib/plan';

// Map the client's stored language label to an i18n code (mirrors ClientView).
const LANG_MAP = {
  'English': 'en',
  'עברית': 'he',
  'Español': 'es',
  'Nederlands': 'nl',
  'Deutsch': 'de',
  'Français': 'fr',
  'Português': 'pt',
  '日本語': 'ja',
};

const OWNER_COLORS = { DD: '#0B0B0F', CL: '#FB673E', BO: '#6D5BFF' };

function fmtDate(iso, locale) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(locale || undefined, { year: 'numeric', month: 'long', day: 'numeric' });
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

  // Render in the client's language once the plan loads; fall back to English.
  const langCode = LANG_MAP[state.plan?.client?.lang] || 'en';
  const t = i18next.getFixedT(langCode);

  const ownerLabel = (o) =>
    o === 'DD' ? 'Duda'
    : o === 'CL' ? t('publicPlan.owner_client')
    : o === 'BO' ? t('publicPlan.owner_both')
    : o;

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
    if (!who) { setError(t('publicPlan.enter_name_error')); return; }
    setBusy(true);
    setError('');
    try {
      await approvePlanByToken(token, state.plan.client.id, who);
      setApproved({ by: who, at: new Date().toISOString() });
    } catch (err) {
      setError(err?.message || t('publicPlan.generic_error'));
    }
    setBusy(false);
  }

  if (state.status === 'loading') {
    return (
      <main className="canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="muted text-sm">{t('publicPlan.loading')}</div>
      </main>
    );
  }

  if (state.status === 'invalid') {
    return (
      <main className="canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 className="h1" style={{ marginBottom: 10 }}>{t('publicPlan.invalid_title')}</h1>
          <p className="muted text-sm">{t('publicPlan.invalid_body')}</p>
        </div>
      </main>
    );
  }

  const { client, milestones } = state.plan;
  const grouped = groupByPhase(milestones);

  return (
    <main className="canvas">
      <section style={{ paddingBottom: 32, borderBottom: '1px solid var(--hairline)', marginBottom: 40 }}>
        <div className="eyebrow">{t('publicPlan.eyebrow', { name: client.name })}</div>
        <h1 className="display-2" style={{ marginTop: 10 }}>{t('publicPlan.headline')}</h1>
        <p className="lede" style={{ maxWidth: 720, marginTop: 24 }}>
          {t('publicPlan.lede', { name: client.name })}
        </p>
      </section>

      <div className="plan-grid">
        {PHASES.map(phase => {
          const label = t('publicPlan.phase_label_' + phase, { defaultValue: `${phase}` });
          const pname = t('publicPlan.phase_name_' + phase, { defaultValue: '' });
          const list = grouped[phase] || [];
          return (
            <article key={phase} className="plan-card">
              <div className="day-mark"><span className="tabnum">{phase}</span><sup>{t('publicPlan.days')}</sup></div>
              <div className="day-label">{label}</div>
              {pname && <h3 className="plan-name">{pname}</h3>}
              <div className="milestones">
                {list.length === 0 ? (
                  <div className="muted text-xs" style={{ padding: '6px 0' }}>{t('publicPlan.no_milestones')}</div>
                ) : list.map(m => (
                  <div key={m.id} className={`milestone ${m.done ? 'done' : ''}`}>
                    <span className="m-dot">{m.done && ICONS.check}</span>
                    <div className="m-text">
                      <b style={{ textDecoration: m.done ? 'line-through' : 'none', color: m.done ? 'var(--ink-muted)' : 'var(--ink)' }}>{m.title}</b>
                      {m.detail && <div className="muted text-xs" style={{ marginTop: 3 }}>{m.detail}</div>}
                      {m.owner && (
                        <div className="m-meta">
                          <span className="m-owner-av" style={{ background: OWNER_COLORS[m.owner] || 'var(--ink)' }}>{m.owner}</span>
                          <span>{ownerLabel(m.owner)}</span>
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
              <div className="eyebrow">{t('publicPlan.signoff')}</div>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 18, marginTop: 6, fontStyle: 'italic' }}>
                {approved.at
                  ? t('publicPlan.approved_line', { by: approved.by, date: fmtDate(approved.at, langCode) })
                  : t('publicPlan.approved_line_nodate', { by: approved.by })}
              </p>
            </div>
            <span className="pill done"><span className="dot"></span>{t('publicPlan.plan_approved')}</span>
          </div>
        ) : (
          <div>
            <div className="eyebrow">{t('publicPlan.approve_title')}</div>
            <p className="text-sm muted" style={{ marginTop: 6, marginBottom: 16 }}>
              {t('publicPlan.approve_desc')}
            </p>
            <div className="flex items-center gap-2" style={{ maxWidth: 520 }}>
              <input
                className="input"
                placeholder={t('publicPlan.name_placeholder')}
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') approve(); }}
                style={{ flex: 1 }}
              />
              <button className="btn primary" onClick={approve} disabled={busy || !name.trim()}>
                {busy ? t('publicPlan.saving') : <>{ICONS.check} {t('publicPlan.approve_button')}</>}
              </button>
            </div>
            {error && <div className="text-xs" style={{ color: 'var(--bad, #c0392b)', marginTop: 12 }}>{error}</div>}
          </div>
        )}
      </div>

      <p className="muted text-xs" style={{ textAlign: 'center', marginTop: 28 }}>
        {t('publicPlan.footer', { name: client.name })}
      </p>
    </main>
  );
}
