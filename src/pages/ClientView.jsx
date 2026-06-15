import React, { useState } from 'react';
import i18next from 'i18next';
import { PHASES, ICONS, CLIENT_RESOURCES } from '../lib/data';
import Pill from '../components/ui/Pill';
import ProgressRing from '../components/ui/ProgressRing';
import JourneyStrip from '../components/journey/JourneyStrip';
import Gantt from '../components/journey/Gantt';
import ResourcesPanel from '../components/ui/ResourcesPanel';
import ClientLogo from '../components/ui/ClientLogo';
import { localizeStep } from '../lib/stepI18n';

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

function amInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('');
}

// Convert a raw email like "gil.shalom@duda.co" to "Gil Shalom".
// If the value contains no "@" it is already a display name — return as-is.
function amDisplayName(am) {
  if (!am) return 'Your Account Manager';
  if (!am.includes('@')) return am;
  const local = am.split('@')[0];
  return local.split(/[._-]/).map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ').trim() || am;
}

export default function ClientView({ client, steps, onOpenPlan, onToggleStep }) {
  const [tab, setTab] = useState('tasks');
  const langCode = LANG_MAP[client.lang] || 'en';
  const t = i18next.getFixedT(langCode);

  const phaseIdx = Math.max(0, PHASES.findIndex(p => p.id === client.phase));
  const progress = client.progress || { done: 0, total: 0 };
  const pct = progress.total > 0 ? progress.done / progress.total : 0;
  const stepCounts = {};
  PHASES.forEach(p => {
    const ps = steps.filter(s => s.phase === p.id);
    stepCounts[p.id] = { done: ps.filter(s => s.status === 'done').length, total: ps.length };
  });
  const visibleSteps = steps.filter(s => s.status !== 'skip');
  const clientTasks = visibleSteps.filter(s => s.owner === 'Client' || s.owner === 'Both').filter(s => s.status !== 'done');
  const allClientSteps = visibleSteps.filter(s => s.owner === 'Client' || s.owner === 'Both');

  const firstName = client.contacts?.[0]?.name?.split(' ')[0] || null;
  const amName = amDisplayName(client.am);
  const amMonogram = amInitials(amName);

  return (
    <div className="client-shell">
      <section className="client-mast">
        <div className="container">
          <div className="client-mast-logo"><ClientLogo client={client} size="lg" /></div>
          <p className="client-greeting">{firstName ? t('clientView.greeting', { name: firstName }) : t('clientView.welcome_back')}</p>
          <h1 className="client-title">{t('clientView.heading', { day: client.dayIn })}</h1>
          <div className="client-progress">
            <ProgressRing pct={pct} />
            <div className="meta">
              <div className="label">{t('clientView.you_are_here')}</div>
              <div className="value">{t('phases.' + (PHASES[phaseIdx]?.id || 'pre'))}</div>
              <div className="sub">{t('clientView.progress_steps', { done: progress.done, total: progress.total, am: amName })}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-muted)', fontWeight: 500 }}>{t('clientView.next_milestone')}</div>
              <div style={{ fontSize: 22, marginTop: 4, fontWeight: 700 }}>{t('milestones.' + client.phase)}</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 64px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="tab-row">
          <button className={tab === 'tasks' ? 'on' : ''} onClick={() => setTab('tasks')}>{t('clientView.tabs.tasks')} <span className="count">{clientTasks.length}</span></button>
          <button className={tab === 'journey' ? 'on' : ''} onClick={() => setTab('journey')}>{t('clientView.tabs.journey')}</button>
          <button className={tab === 'timeline' ? 'on' : ''} onClick={() => setTab('timeline')}>{t('clientView.tabs.timeline')}</button>
          <button className={tab === 'resources' ? 'on' : ''} onClick={() => setTab('resources')}>{t('clientView.tabs.resources')}</button>
        </div>

        {tab === 'tasks' && (
          <div className="rail">
            <div>
              {clientTasks.length > 0 ? (
                <>
                  <div className="eyebrow accent" style={{ marginBottom: 12 }}>{t('clientView.open_tasks')}</div>
                  <div className="card" style={{ overflow: 'hidden', marginBottom: 32 }}>
                    {clientTasks.slice(0, 6).map(s => {
                      const loc = localizeStep(s, langCode);
                      return (
                      <div key={s.id} className={`step-row ${s.status}`} style={{ padding: '16px 20px', gridTemplateColumns: '28px 1fr auto auto', cursor: 'default' }}>
                        <span className="step-check clickable" onClick={() => onToggleStep && onToggleStep(s.id)} title={t('clientView.mark_complete')}>{s.status === 'done' && ICONS.check}</span>
                        <div className="title"><b>{loc.title}</b><div className="why">{loc.why}</div></div>
                        <span className="due">{t('clientView.day_label', { n: s.due })}</span>
                        <Pill kind={s.status}>{t('status.' + s.status)}</Pill>
                      </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--ink-muted)', fontStyle: 'italic', marginBottom: 32 }}>{t('clientView.no_tasks')}</div>
              )}
              <div className="eyebrow" style={{ marginBottom: 12 }}>{t('clientView.all_steps')}</div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {allClientSteps.map(s => {
                  const loc = localizeStep(s, langCode);
                  return (
                  <div key={s.id} className={`step-row ${s.status}`} style={{ padding: '14px 20px', gridTemplateColumns: '28px 1fr auto auto', cursor: 'default' }}>
                    <span className="step-check clickable" onClick={() => onToggleStep && onToggleStep(s.id)} title={s.status === 'done' ? t('clientView.mark_not_started') : t('clientView.mark_complete')}>{s.status === 'done' && ICONS.check}</span>
                    <div className="title"><b>{loc.title}</b><div className="why">{loc.why}</div></div>
                    <span className="due">{t('clientView.day_label', { n: s.due })}</span>
                    <Pill kind={s.status}>{t('status.' + s.status)}</Pill>
                  </div>
                  );
                })}
              </div>
            </div>
            <aside>
              <div className="card card-pad">
                <div className="eyebrow">{t('clientView.team_card_title')}</div>
                <div className="flex items-center gap-3" style={{ marginTop: 14 }}>
                  <span className="avatar" style={{ width: 44, height: 44, fontSize: 14, background: 'var(--ink)' }}>{amMonogram}</span>
                  <div><div style={{ fontSize: 18, fontWeight: 700 }}>{amName}</div><div className="muted text-xs">{t('clientView.am_tagline')}</div></div>
                </div>
              </div>
              <div className="card card-pad" style={{ marginTop: 20, background: 'var(--paper-soft)' }}>
                <div className="eyebrow">{t('clientView.page_card_title')}</div>
                <p className="text-sm muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 8 }}>{t('clientView.page_card_body')}</p>
              </div>
            </aside>
          </div>
        )}

        {tab === 'journey' && (
          <div>
            <JourneyStrip phaseIdx={phaseIdx} phaseProgress={(stepCounts[client.phase]?.done || 0) / (stepCounts[client.phase]?.total || 1)} stepCounts={stepCounts} kickoff={client.kickoff} />
            <div style={{ marginTop: 24 }}><button className="btn" onClick={onOpenPlan}>{ICONS.cal} {t('clientView.see_plan')}</button></div>
          </div>
        )}

        {tab === 'timeline' && <Gantt steps={visibleSteps} dayIn={client.dayIn} />}

        {tab === 'resources' && <ResourcesPanel resources={CLIENT_RESOURCES} title="Resources" subtitle="Training, guides, and tools for your team." />}
      </section>

      <footer style={{ padding: '32px 64px', borderTop: '1px solid var(--hairline)', color: 'var(--ink-muted)', fontSize: 12 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          <span>{client.name} · {t('clientView.powered_by')} <b style={{ color: 'var(--ink)' }}>Duda</b></span>
          <span className="num">{t('clientView.last_updated')}</span>
        </div>
      </footer>
    </div>
  );
}
