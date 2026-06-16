import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS, PLAN, QUESTIONS } from '../lib/data';
import ClientLogo from '../components/ui/ClientLogo';
import { loadMilestones, saveMilestones, groupByPhase, setPlanStatus, PHASES } from '../lib/plan';

const PHASE_GOALS = {
  60:  PLAN.d60?.goal  || '',
  90:  PLAN.d90?.goal  || '',
  180: PLAN.d180?.goal || '',
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

export default function PlanView({ client, editable, onClose, onShare, onReopen }) {
  const { t, i18n } = useTranslation();
  const ownerLabel = (o) => o === 'DD' ? t('owner.duda') : o === 'CL' ? t('owner.client') : o === 'BO' ? t('owner.both') : o;
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const approved = client.planStatus === 'approved' || client.planStatus === 'locked';

  // Header status chip: Draft → Shared → Signed, driven by plan status.
  const statusChip = approved
    ? { cls: 'done', label: t('planEditor.status_signed') }
    : client.planStatus === 'sent'
      ? { cls: 'progress', label: t('planEditor.status_shared') }
      : { cls: 'not', label: t('planEditor.status_draft') };

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
      setError(err?.message || t('planEditor.save_error'));
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
      setError(err?.message || t('planEditor.reopen_error'));
    }
  }

  return (
    <main className="canvas">
      {editable && (
        <div className="tab-row">
          <button onClick={onClose}>{t('tracker.tab_overview')}</button>
          <button onClick={onClose}>{t('tracker.tab_steps')}</button>
          <button onClick={onClose}>{t('tracker.tab_timeline')}</button>
          <button className="on">{t('tracker.tab_plan')}</button>
          <button onClick={onClose}>{t('tracker.tab_resources')}</button>
          <button onClick={onClose}>
            {t('tracker.tab_inbox')} {QUESTIONS.filter(q => q.status === 'Open').length > 0 && <span className="count" style={{ background: 'var(--duda-soft)', color: 'var(--duda-deep)' }}>{QUESTIONS.filter(q => q.status === 'Open').length}</span>}
          </button>
          <button onClick={onClose}>{t('tracker.tab_files')}</button>
        </div>
      )}

      <section style={{ paddingBottom: 32, borderBottom: '1px solid var(--hairline)', marginBottom: 40 }}>
        <div className="flex items-center gap-3">
          <ClientLogo client={client} />
          <div>
            <div className="eyebrow">{t('planEditor.eyebrow', { name: client.name })}</div>
            <h1 className="display-2" style={{ marginTop: 10 }}>{t('publicPlan.headline')}</h1>
          </div>
          <div style={{ flex: 1 }}></div>
          {editable && !editing && (
            <span className={`pill ${statusChip.cls}`} style={{ marginRight: 4 }}>
              <span className="dot"></span>{statusChip.label}
            </span>
          )}
          {editable && !editing && (
            <button className="btn primary" onClick={() => setEditing(true)} disabled={approved}>
              {ICONS.spark} {t('planEditor.edit_milestones')}
            </button>
          )}
          {editable && editing && (
            <>
              <button className="btn" onClick={cancelEdit} disabled={saving}>{t('common.cancel')}</button>
              <button className="btn primary" onClick={save} disabled={saving}>
                {saving ? t('publicPlan.saving') : <>{ICONS.check} {t('planEditor.save_plan')}</>}
              </button>
            </>
          )}
        </div>
        <p className="lede" style={{ maxWidth: 720, marginTop: 24 }}>
          {t('planEditor.lede', { name: client.name })}
        </p>
        {editable && approved && !editing && (
          <p className="text-xs muted" style={{ marginTop: 12 }}>
            {t('planEditor.locked_note')}
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
            const list = grouped[phase] || [];
            return (
              <article key={phase} className="plan-card">
                <div className="day-mark"><span className="tabnum">{phase}</span><sup>{t('publicPlan.days')}</sup></div>
                <div className="day-label">{t('publicPlan.phase_label_' + phase, { defaultValue: `${phase}` })}</div>
                <h3 className="plan-name">{t('publicPlan.phase_name_' + phase, { defaultValue: '' })}</h3>
                {PHASE_GOALS[phase] && <p className="plan-goal">"{PHASE_GOALS[phase]}"</p>}

                <div className="milestones">
                  {list.length === 0 && !editing && (
                    <div className="muted text-xs" style={{ padding: '6px 0' }}>{t('publicPlan.no_milestones')}</div>
                  )}
                  {list.map((m, i) => (
                    editing ? (
                      <div key={m.id} className="milestone" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div className="m-text" style={{ flex: 1, minWidth: 0 }}>
                          <input
                            className="input"
                            placeholder={t('planEditor.ph_milestone_title')}
                            value={m.title}
                            onChange={e => updateMilestone(m.id, { title: e.target.value })}
                            style={{ fontSize: 13, fontWeight: 600, width: '100%' }}
                          />
                          <input
                            className="input"
                            placeholder={t('planEditor.ph_detail')}
                            value={m.detail || ''}
                            onChange={e => updateMilestone(m.id, { detail: e.target.value })}
                            style={{ fontSize: 12, marginTop: 6, width: '100%' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <button className="btn ghost sm" title={t('planEditor.move_up')} onClick={() => move(m.id, 'up')} disabled={i === 0}>↑</button>
                          <button className="btn ghost sm" title={t('planEditor.move_down')} onClick={() => move(m.id, 'down')} disabled={i === list.length - 1}>↓</button>
                          <button className="btn ghost sm" title={t('planEditor.remove')} onClick={() => removeMilestone(m.id)}>{ICONS.close}</button>
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
                              <span>{ownerLabel(m.owner)}</span>
                            </div>
                          )}
                        </div>
                        {(m.completed || m.due) && <span className="m-due">{m.completed ? `✓ ${m.completed}` : m.due}</span>}
                      </div>
                    )
                  ))}
                  {editing && (
                    <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => addMilestone(phase)}>
                      {ICONS.plus} {t('planEditor.add_milestone')}
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
              <div className="eyebrow">{t('publicPlan.signoff')}</div>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 18, marginTop: 6, fontStyle: 'italic' }}>
                {client.planApprovedAt
                  ? t('publicPlan.approved_line', { by: client.planApprovedBy || client.contacts?.[0]?.name || client.name, date: fmtDate(client.planApprovedAt, i18n.language) })
                  : t('publicPlan.approved_line_nodate', { by: client.planApprovedBy || client.contacts?.[0]?.name || client.name })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {editable && (
                <button className="btn ghost sm" onClick={reopen}>{t('planEditor.reopen_plan')}</button>
              )}
              <span className="pill done"><span className="dot"></span>{client.planStatus === 'locked' ? t('planEditor.badge_locked') : t('planEditor.badge_approved')}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow">{t('publicPlan.signoff')}</div>
              <p className="text-sm muted" style={{ marginTop: 6 }}>
                {client.planStatus === 'sent'
                  ? t('planEditor.awaiting_shared')
                  : t('planEditor.not_shared')}
              </p>
            </div>
            {editable && (
              <button className="btn" onClick={() => onShare?.(client.id)}>{ICONS.link} {t('planEditor.share_with_client')}</button>
            )}
          </div>
        )}
      </div>
        </>
      )}
    </main>
  );
}
