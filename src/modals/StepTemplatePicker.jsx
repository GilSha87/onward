import React, { useState } from 'react';
import { PHASES, PRIO, ICONS } from '../lib/data';
import PrioPill from '../components/ui/PrioPill';

export default function StepTemplatePicker({ steps, excludedSteps, setExcludedSteps, customSteps, setCustomSteps, icp, flow }) {
  const [showAddForm, setShowAddForm] = useState(false);
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

  const included = steps.length - excludedSteps.length + customSteps.length;

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div>
          <div className="eyebrow">Onboarding template</div>
          <p className="muted text-sm" style={{ marginTop: 4 }}>
            Starting from <b>{icp} · {flow}</b>. {included} steps will be created — toggle to include/exclude.
          </p>
        </div>
        <button type="button" className="btn sm primary" onClick={() => setShowAddForm(!showAddForm)}>
          {ICONS.plus} Custom step
        </button>
      </div>

      {showAddForm && (
        <div className="custom-step-form">
          <div className="eyebrow" style={{ marginBottom: 8 }}>Add custom step</div>
          <input className="input" placeholder="Step title *" value={newTitle}
            onChange={e => setNewTitle(e.target.value)} style={{ marginBottom: 8 }} />
          <input className="input" placeholder="Why it matters" value={newWhy}
            onChange={e => setNewWhy(e.target.value)} style={{ marginBottom: 8 }} />
          <div className="field-row">
            <select className="input" value={newPhase} onChange={e => setNewPhase(e.target.value)}>
              {PHASES.map(p => <option key={p.id} value={p.id}>Phase {p.num} · {p.name}</option>)}
            </select>
            <select className="input" value={newOwner} onChange={e => setNewOwner(e.target.value)}>
              <option value="Duda">Owner: Duda</option>
              <option value="Client">Owner: Client</option>
              <option value="Both">Owner: Both</option>
            </select>
          </div>
          <div className="field-row" style={{ marginTop: 8 }}>
            <select className="input" value={newPrio} onChange={e => setNewPrio(e.target.value)}>
              {Object.keys(PRIO).map(k => <option key={k} value={k}>{PRIO[k].label}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs muted">Due day:</span>
              <input type="number" className="input" value={newDue} min={0} max={180}
                onChange={e => setNewDue(Number(e.target.value))} style={{ width: 80 }} />
            </div>
          </div>
          <div className="flex gap-2" style={{ marginTop: 10 }}>
            <button type="button" className="btn sm primary" onClick={addCustomStep}>Add step</button>
            <button type="button" className="btn sm ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {customSteps.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="text-xs semibold muted" style={{ padding: '8px 14px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Custom steps ({customSteps.length})
          </div>
          {customSteps.map(s => (
            <div key={s.id} className="step-toggle" style={{ background: 'var(--duda-tint)' }}>
              <input type="checkbox" checked readOnly />
              <div className="step-info">
                <div className="step-title-text">{s.title}</div>
                <div className="step-owner-text">{s.owner} · Day {s.due}</div>
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
          const phaseSteps = steps.filter(s => s.phase === p.id);
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
                <span>Phase {p.num} · {p.name} ({phaseSteps.length - excludedCount}/{phaseSteps.length})</span>
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
                  Toggle all
                </button>
              </div>
              {phaseSteps.map(s => (
                <div key={s.id} className="step-toggle" style={{ opacity: excludedSteps.includes(s.id) ? 0.5 : 1 }}>
                  <input type="checkbox"
                    checked={!excludedSteps.includes(s.id)}
                    onChange={() => toggleStep(s.id)} />
                  <div className="step-info">
                    <div className="step-title-text">{s.title}</div>
                    <div className="step-owner-text">{s.owner} · Day {s.due}</div>
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
