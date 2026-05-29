import React, { useState } from 'react';
import { PHASES, STATUS, PRIO } from '../lib/data';
import Modal from '../components/ui/Modal';
import ModalHead from '../components/ui/ModalHead';

export default function EditStepModal({ step, onClose, onSave }) {
  const [title, setTitle] = useState(step.title);
  const [why, setWhy] = useState(step.why);
  const [status, setStatus] = useState(step.status);
  const [owner, setOwner] = useState(step.owner);
  const [prio, setPrio] = useState(step.prio);

  return (
    <Modal size="md" onClose={onClose}>
      <ModalHead title={step.title} eyebrow={`Phase ${PHASES.find(p => p.id === step.phase)?.num || '?'}`} onClose={onClose} />
      <div className="modal-body" style={{ background: 'var(--paper-soft)' }}>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>Task title</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>Status</label>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {Object.keys(STATUS).map(k => (
              <button key={k} onClick={() => setStatus(k)}
                className={`btn sm ${status === k ? 'primary' : ''}`}>
                {STATUS[k].label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div className="field">
            <label>Owner</label>
            <div className="seg" style={{ alignSelf: 'flex-start' }}>
              {['Duda', 'Client', 'Both'].map(o => (
                <button key={o} className={owner === o ? 'on' : ''} onClick={() => setOwner(o)}>{o}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Priority</label>
            <select className="input" value={prio} onChange={e => setPrio(e.target.value)}>
              {Object.keys(PRIO).map(k => <option key={k} value={k}>{PRIO[k].label}</option>)}
            </select>
          </div>
        </div>
        <div className="rule rule-soft"></div>
        <div style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 6, color: 'var(--duda-ink)' }}>AM internal note</div>
          <textarea className="input" placeholder="Notes only Duda sees…"></textarea>
        </div>
        <div style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Why it matters (client-facing)</div>
          <textarea className="input" value={why} onChange={e => setWhy(e.target.value)}></textarea>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn ghost" onClick={() => { if (onSave) onSave({ ...step, _delete: true }); onClose(); }}>Delete step</button>
        <div className="flex gap-2">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => { if (onSave) onSave({ ...step, title, why, status, owner, prio }); onClose(); }}>Save step</button>
        </div>
      </div>
    </Modal>
  );
}
