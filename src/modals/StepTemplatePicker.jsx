import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PHASES, PRIO, ICONS } from '../lib/data';
import PrioPill from '../components/ui/PrioPill';

export default function StepTemplatePicker({ steps, excludedSteps, setExcludedSteps, customSteps, setCustomSteps, icp, flow }) {
  const { t } = useTranslation();
  const ownerLabel = (o) => o === 'Duda' ? t('owner.duda') : o === 'Both' ? t('owner.both') : o === 'Client' ? t('owner.client') : o;
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter to only steps applicable to the selected flow and segment
  const filteredSteps = steps.filter(s => {
    const flowOk = !s.flows || s.flows.includes('All') || s.flows.includes(flow);
    const segOk = !s.segments || s.segments.includes('All') || s.segments.includes(icp);
    return flowOk && segOk;
  });
  const [newTitle, setNewTitle] = useState('');
  const [newWhy, setNewWhy] = useState('');
  const [newOwner, setNewOwner] = useState('Both');
  const [newPrio, setNewPrio] = useState('med');
  const [newPhase, setNewPhase] = useState('p1');
  const [newDue, setNewDue] = useState(30);

  function toggleStep(id) {
    if (excludedSteps.includes(id)) {
      setExcludedSteps(excludedSteps.filter(x => x !== id));
    } else {
      setExcludedSteps([...excludedSteps, id]);
    }
  }

  function addCustomStep() {
    if (!newTitle.trim()) return;
    const id = 'custom_' + Math.random().toString(36).slice(2, 8);
    setCustomSteps([...customSteps, {
      id, phase: newPhase, title: newTitle.trim(), why: newWhy.trim(),
      owner: newOwner, prio: newPrio, status: 'not',
      start: Math.max(0, newDue - 7), due: newDue
    }]);
    setNewTitle(''); setNewWhy(''); setShowAddForm(false);
  }

  function removeCustomStep(id) {
    setCustomSteps(customSteps.filter(s => s.id !== id));
  }

  const included = filteredSteps.filter(s => !excludedSteps.includes(s.id)).length + customSteps.length;

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div>
          <div className="eyebrow">{t('modals.stepPicker.eyebrow')}</div>
          <p className="muted text-sm" style={{ marginTop: 4 }}>
            {t('modals.stepPicker.summary', { icp, flow, count: included })}
          </p>
        </div>
        <button type="button" className="btn sm primary" onClick={() => setShowAddForm(!showAddForm)}>
          {ICONS.plus} {t('modals.stepPicker.custom_step')}
        </button>
      </div>

      {showAddForm && (
        <div className="custom-step-form">
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t('modals.stepPicker.add_custom')}</div>
          <input className="input" placeholder={t('modals.stepPicker.title_ph')} value={newTitle}
            onChange={e => setNewTitle(e.target.value)} style={{ marginBottom: 8 }} />
          <input className="input" placeholder={t('modals.stepPicker.why_ph')} value={newWhy}
            onChange={e => setNewWhy(e.target.value)} style={{ marginBottom: 8 }} />
          <div className="field-row">
            <select className="input" value={newPhase} onChange={e => setNewPhase(e.target.value)}>
              {PHASES.map(p => <option key={p.id} value={p.id}>{t('modals.stepPicker.phase_opt', { num: p.num, name: t('phases.' + p.id, { defaultValue: p.name }) })}</option>)}
            </select>
            <select className="input" value={newOwner} onChange={e => setNewOwner(e.target.value)}>
              <option value="Duda">{t('modals.stepPicker.owner_duda')}</option>
              <option value="Client">{t('modals.stepPicker.owner_client')}</option>
              <option value="Both">{t('modals.stepPicker.owner_both')}</option>
            </select>
          </div>
          <div className="field-row" style={{ marginTop: 8 }}>
            <select className="input" value={newPrio} onChange={e => setNewPrio(e.target.value)}>
              {Object.keys(PRIO).map(k => <option key={k} value={k}>{t('prio.' + k, { defaultValue: PRIO[k].label })}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs muted">{t('modals.stepPicker.due_day')}</span>
              <input type="number" className="input" value={newDue} min={0} max={180}
                onChange={e => setNewDue(Number(e.target.value))} style={{ width: 80 }} />
            </div>
          </div>
          <div className="flex gap-2" style={{ marginTop: 10 }}>
            <button type="button" className="btn sm primary" onClick={addCustomStep}>{t('modals.stepPicker.add_step')}</button>
            <button type="button" className="btn sm ghost" onClick={() => setShowAddForm(false)}>{t('common.cancel')}</button>
          </div>
        </div>
      )}

      {customSteps.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="text-xs semibold muted" style={{ padding: '8px 14px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {t('modals.stepPicker.custom_steps', { count: customSteps.length })}
          </div>
          {customSteps.map(s => (
            <div key={s.id} className="step-toggle" style={{ background: 'var(--duda-tint)' }}>
              <input type="checkbox" checked readOnly />
              <div className="step-info">
                <div className="step-title-text">{s.title}</div>
                <div className="step-owner-text">{t('modals.stepPicker.owner_day', { owner: ownerLabel(s.owner), due: s.due })}</div>
              </div>
              <PrioPill prio={s.prio} />
              <button type="button" className="close" style={{ width: 24, height: 24 }}
                onClick={() => removeCustomStep(s.id)}>{ICONS.close}</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ maxHeight: 320, overflow: 'auto', border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--surface)' }}>
        {PHASES.map(p => {
          const phaseSteps = filteredSteps.filter(s => s.phase === p.id);
          const excludedCount = phaseSteps.filter(s => excludedSteps.includes(s.id)).length;
          return (
            <div key={p.id}>
              <div style={{
                padding: '10px 16px', background: 'var(--paper)',
                borderBottom: '1px solid var(--hairline-soft)',
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em',
                color: 'var(--ink-muted)', fontWeight: 700,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span>{t('modals.stepPicker.phase_header', { num: p.num, name: t('phases.' + p.id, { defaultValue: p.name }), included: phaseSteps.length - excludedCount, total: phaseSteps.length })}</span>
                <button type="button" className="btn sm ghost" style={{ fontSize: 10 }}
                  onClick={() => {
                    const allIds = phaseSteps.map(s => s.id);
                    const allExcluded = allIds.every(id => excludedSteps.includes(id));
                    if (allExcluded) {
                      setExcludedSteps(excludedSteps.filter(id => !allIds.includes(id)));
                    } else {
                      setExcludedSteps([...new Set([...excludedSteps, ...allIds])]);
                    }
                  }}>
                  {t('modals.stepPicker.toggle_all')}
                </button>
              </div>
              {phaseSteps.map(s => (
                <div key={s.id} className="step-toggle" style={{ opacity: excludedSteps.includes(s.id) ? 0.5 : 1 }}>
                  <input type="checkbox"
                    checked={!excludedSteps.includes(s.id)}
                    onChange={() => toggleStep(s.id)} />
                  <div className="step-info">
                    <div className="step-title-text">{s.title}</div>
                    <div className="step-owner-text">{t('modals.stepPicker.owner_day', { owner: ownerLabel(s.owner), due: s.due })}</div>
                  </div>
                  <PrioPill prio={s.prio} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
