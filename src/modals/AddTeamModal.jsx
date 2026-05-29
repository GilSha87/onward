import React, { useState } from 'react';
import { ICONS } from '../lib/data';
import Modal from '../components/ui/Modal';
import ModalHead from '../components/ui/ModalHead';

export default function AddTeamModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Staff');
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('4178');

  function gen() {
    setPin(String(Math.floor(1000 + Math.random() * 9000)));
  }

  function save() {
    if (!name.trim()) return;
    onSave?.({ name, email, role });
  }

  return (
    <Modal size="md" onClose={onClose}>
      <ModalHead title="Add team member" eyebrow="Onboarding team" onClose={onClose} />
      <div className="modal-body" style={{ background: 'var(--paper-soft)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div className="field"><label>Full name *</label><input className="input" placeholder="Avery Okonkwo" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="field"><label>Email</label><input className="input" placeholder="avery@duda.co" value={email} onChange={e => setEmail(e.target.value)} /></div>
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>Role *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { k: 'Staff', label: 'Staff (AM)', sub: 'Own clients' },
              { k: 'Executive', label: 'Executive', sub: 'Read-only org' },
              { k: 'Admin', label: 'Admin', sub: 'Full access' },
            ].map(o => (
              <button key={o.k} onClick={() => setRole(o.k)} className="card card-pad"
                style={{ padding: 12, textAlign: 'left', cursor: 'pointer', borderColor: role === o.k ? 'var(--ink)' : 'var(--hairline)', background: role === o.k ? 'var(--paper)' : 'var(--surface)' }}>
                <div className="text-sm semibold">{o.label}</div>
                <div className="muted text-xs" style={{ marginTop: 2 }}>{o.sub}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>PIN *</label>
          <div className="flex gap-2">
            <input type={showPin ? 'text' : 'password'} value={pin} onChange={e => setPin(e.target.value)} className="input mono" style={{ flex: 1, letterSpacing: '0.3em', textAlign: 'center' }} />
            <button className="btn" onClick={() => setShowPin(!showPin)}>{showPin ? 'Hide' : 'Show'}</button>
            <button className="btn" onClick={gen}>{ICONS.spark} Generate</button>
          </div>
        </div>
      </div>
      <div className="modal-foot">
        <span className="muted text-xs">An invite email will be sent.</span>
        <div className="flex gap-2">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={!name.trim()}>Save member</button>
        </div>
      </div>
    </Modal>
  );
}
