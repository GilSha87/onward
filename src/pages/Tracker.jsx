import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PHASES, ICONS, ACTIVITY, AM_RESOURCES } from '../lib/data';
import { showToast } from '../components/ui/Toast';
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
import FilesPanel from '../components/files/FilesPanel';
import { fmtMoney, arrFromMrr } from '../lib/helpers';
import { usePermissions } from '../hooks/usePermissions';

export default function Tracker({ client, steps, setScreen, onPlanEdit, onStep, onToggleStep, onEditClient }) {
  const { t } = useTranslation();
  const ownerLabel = (o) => o === 'Duda' ? t('owner.duda') : o === 'Both' ? t('owner.both') : o === 'Client' ? t('owner.client') : o;
  const { can } = usePermissions();
  const canEdit = can('clients.edit');
  const canDeleteArchive = can('records.deleteArchive');
  const [tab, setTab] = useState('overview');
  const [addingContact, setAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', role: '', email: '' });

  const stepCounts = {};
  PHASES.forEach(p => {
    const ps = steps.filter(s => s.phase === p.id);
    stepCounts[p.id] = { done: ps.filter(s => s.status === 'done').length, total: ps.length };
  });
  // Guard: if client.phase doesn't match any known phase, fall back to index 0
  const phaseIdx = Math.max(0, PHASES.findIndex(p => p.id === client.phase));
  const cur = stepCounts[client.phase];
  const phaseProgress = cur && cur.total > 0 ? cur.done / cur.total : 0;

  return (
    <main className="canvas canvas-wide">
      <header className="tracker-head">
        <ClientLogo client={client} size="lg" />
        <div className="info">
          <div className="eyebrow">{t('tracker.client_label')} · {client.flag} {client.country}</div>
          <div className="flex items-center gap-3" style={{ marginTop: 6 }}>
            <h1 className="h1">{client.name}</h1>
            {client.status && client.status !== 'active' && <StatusBadge status={client.status} />}
          </div>
          <div className="meta">
            <span><b>{t('tracker.icp')}</b> · {client.icp}</span>
            <span><b>{t('tracker.flow')}</b> · {client.flow}</span>
            <span><b>{t('tracker.touch')}</b> · {client.touch}</span>
            <span><b>{t('tracker.kickoff')}</b> · <span className="num">{client.kickoff}</span></span>
            {client.mrr != null && client.mrr !== '' && (
              <span>
                <b>{t('tracker.mrr')}</b> · <span className="num">{fmtMoney(client.mrr, client.mrrCurrency)}</span>
                {arrFromMrr(client.mrr) != null && (
                  <span className="muted"> · {t('tracker.arr')} {fmtMoney(arrFromMrr(client.mrr), client.mrrCurrency)}</span>
                )}
              </span>
            )}
            {client.goLiveDate && (
              <span><b>{t('tracker.go_live')}</b> · <span className="num">{client.goLiveDate}</span></span>
            )}
            {client.sfId && (
              <span><b>{t('tracker.sf')}</b> · <span className="num">{client.sfId}</span></span>
            )}
            {client.boxUrl && (
              <span><b>{t('tracker.box')}</b> · <a href={client.boxUrl} target="_blank" rel="noreferrer" className="link-subtle">{t('tracker.contract')}</a></span>
            )}
          </div>
        </div>
        <div className="right">
          <div
            title={t('tracker.days_elapsed_title')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}
          >
            <div className="day-counter" style={{ alignItems: 'baseline' }}>
              <span className="n tabnum" style={{ fontSize: 40 }}>{client.dayIn}</span>
              <span className="l">/ 180</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-muted)', opacity: 0.65, lineHeight: 1 }}>{t('tracker.days_in_onboarding')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r)', padding: '3px 3px' }}>
            <button className="btn ghost" style={{ border: 'none', boxShadow: 'none', background: 'transparent' }} onClick={() => {
              setScreen({ kind: 'client', clientId: client.id });
              showToast(t('tracker.switched_toast'), 'success');
            }}>{ICONS.link} {t('tracker.client_link')}</button>
            <div style={{ width: 1, height: 20, background: 'var(--hairline)', margin: '0 2px', flexShrink: 0 }} />
            <Dropdown items={[
              { label: t('tracker.plan_link'), onClick: () => onPlanEdit(client.id) },
              canEdit ? null : undefined,
              canEdit ? { label: client.status === 'active' || !client.status ? t('dash.mark_inactive') : t('dash.mark_active'), onClick: () => onEditClient?.(client.id, { status: client.status === 'active' || !client.status ? 'inactive' : 'active' }) } : undefined,
              canDeleteArchive ? { label: client.status === 'archived' ? t('dash.unarchive') : t('dash.archive'), onClick: () => onEditClient?.(client.id, { status: client.status === 'archived' ? 'active' : 'archived' }) } : undefined,
              canDeleteArchive ? null : undefined,
              canDeleteArchive ? { label: t('dash.delete_permanently'), danger: true, onClick: () => { if (window.confirm(t('dash.delete_confirm', { name: client.name }))) onEditClient?.(client.id, { status: 'deleted' }); } } : undefined,
            ].filter(i => i !== undefined)} />
          </div>
        </div>
      </header>

      <div className="tab-row">
        <button className={tab === 'overview' ? 'on' : ''} onClick={() => setTab('overview')}>{t('tracker.tab_overview')}</button>
        <button className={tab === 'steps' ? 'on' : ''} onClick={() => setTab('steps')}>{t('tracker.tab_steps')} <span className="count">{steps.length}</span></button>
        <button className={tab === 'timeline' ? 'on' : ''} onClick={() => setTab('timeline')}>{t('tracker.tab_timeline')}</button>
        <button onClick={() => onPlanEdit(client.id)}>{t('tracker.tab_plan')}</button>
        <button className={tab === 'resources' ? 'on' : ''} onClick={() => setTab('resources')}>{t('tracker.tab_resources')}</button>
        <button className={tab === 'inbox' ? 'on' : ''} onClick={() => setTab('inbox')}>
          {t('tracker.tab_inbox')} {QUESTIONS.filter(q => q.status === 'Open').length > 0 && <span className="count" style={{ background: 'var(--duda-soft)', color: 'var(--duda-deep)' }}>{QUESTIONS.filter(q => q.status === 'Open').length}</span>}
        </button>
        <button className={tab === 'files' ? 'on' : ''} onClick={() => setTab('files')}>{t('tracker.tab_files')}</button>
      </div>

      {tab === 'overview' && (
        <div className="rail">
          <div>
            <JourneyStrip phaseIdx={phaseIdx} phaseProgress={phaseProgress} stepCounts={stepCounts} kickoff={client.kickoff} onPhase={() => setTab('steps')} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
              <h2 className="h2">{t('tracker.current_phase')}</h2>
              <button className="btn ghost sm" onClick={() => setTab('steps')}>{t('tracker.view_all_phases')} {ICONS.arrow}</button>
            </div>
            <PhaseGroup phase={PHASES[phaseIdx]} steps={steps.filter(s => s.phase === client.phase)} onStep={onStep} onToggle={onToggleStep} dayIn={client.dayIn} />
          </div>
          <aside>
            <div className="rail-card">
              <h4>{t('tracker.up_next')}</h4>
              <div className="flex flex-col gap-3">
                {steps.filter(s => s.status !== 'done' && s.status !== 'skip').slice(0, 3).map(s => (
                  <div key={s.id} style={{ borderBottom: '1px solid var(--hairline-soft)', paddingBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                    <div className="muted text-xs" style={{ marginTop: 3 }}>{t('tracker.day_owner', { day: s.due, owner: ownerLabel(s.owner) })}</div>
                    <div style={{ marginTop: 8 }}><Pill kind={s.status}>{t('status.' + s.status)}</Pill></div>
                  </div>
                ))}
                {steps.filter(s => s.status !== 'done' && s.status !== 'skip').length === 0 && (
                  <p className="muted text-sm">{t('tracker.no_upcoming')}</p>
                )}
              </div>
            </div>
            <div className="rail-card">
              <div className="flex items-center" style={{ marginBottom: (client.contacts || []).length > 0 ? 10 : 0 }}>
                <h4 style={{ flex: 1, margin: 0 }}>{t('tracker.contacts')}</h4>
                {!addingContact && canEdit && (
                  <button className="btn ghost sm" onClick={() => { setAddingContact(true); setNewContact({ name: '', role: '', email: '' }); }}>{t('tracker.add')}</button>
                )}
              </div>
              {(client.contacts || []).length === 0 && !addingContact && (
                <p className="muted text-sm">{t('tracker.no_contacts')}</p>
              )}
              {(client.contacts || []).map((c, i) => (
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
              {addingContact && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input className="input" placeholder={t('tracker.ph_name')} value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} style={{ fontSize: 13 }} />
                  <input className="input" placeholder={t('tracker.ph_role')} value={newContact.role} onChange={e => setNewContact(p => ({ ...p, role: e.target.value }))} style={{ fontSize: 13 }} />
                  <input className="input" placeholder={t('tracker.ph_email')} type="email" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} style={{ fontSize: 13 }} />
                  <div className="flex gap-2">
                    <button
                      className="btn primary sm"
                      disabled={!newContact.name.trim()}
                      onClick={() => {
                        const updated = [...(client.contacts || []), { name: newContact.name.trim(), role: newContact.role.trim(), email: newContact.email.trim() }];
                        onEditClient?.(client.id, { contacts: updated });
                        setAddingContact(false);
                      }}
                    >{t('common.save')}</button>
                    <button className="btn sm" onClick={() => setAddingContact(false)}>{t('common.cancel')}</button>
                  </div>
                </div>
              )}
            </div>
            <div className="rail-card">
              <div className="flex items-center" style={{ marginBottom: 10 }}>
                <h4 style={{ flex: 1, margin: 0 }}>{t('tracker.activity')}</h4>
                <span className="eyebrow" style={{ fontSize: 10, opacity: 0.5 }}>{t('tracker.sample')}</span>
              </div>
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
          {steps.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{t('tracker.no_steps')}</div>
              <p className="muted text-sm" style={{ marginTop: 8 }}>{t('tracker.no_steps_sub')}</p>
            </div>
          ) : (
            PHASES.map(p => {
              const ps = steps.filter(s => s.phase === p.id);
              if (!ps.length) return null;
              return <PhaseGroup key={p.id} phase={p} steps={ps} onStep={onStep} onToggle={onToggleStep} dayIn={client.dayIn} />;
            })
          )}
        </div>
      )}

      {tab === 'timeline' && <Gantt steps={steps} dayIn={client.dayIn} />}

      {tab === 'resources' && <ResourcesPanel resources={AM_RESOURCES} title={t('tracker.am_resources_title')} subtitle={t('tracker.am_resources_sub')} />}

      {tab === 'inbox' && <InboxPanel onStep={onStep} />}

      {tab === 'files' && <FilesPanel client={client} />}
    </main>
  );
}
