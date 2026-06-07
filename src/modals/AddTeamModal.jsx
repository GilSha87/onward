import React, { useState } from 'react';
import { db } from '../lib/supabase';
import Modal from '../components/ui/Modal';
import ModalHead from '../components/ui/ModalHead';
import { ROLES, ROLE_LABELS } from '../lib/permissions';

// Short descriptors shown under each role option in the picker.
const ROLE_SUBS = {
  Staff: 'Own clients',
  Executive: 'Approve · read-only',
  Admin: 'Full access',
};

export default function AddTeamModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function save() {
    if (!name.trim() || !email.trim()) return;
    if (!EMAIL_RE.test(email.trim())) {
      setError(`"${email.trim()}" doesn't look like a valid email address.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await db.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-team-member`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), role }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Invite failed');
      onSave?.({ name: name.trim(), email: email.trim(), role });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send invite. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal size="md" onClose={onClose}>
      <ModalHead title="Add team member" eyebrow="Onboarding team" onClose={onClose} />
      <div className="modal-body" style={{ background: 'var(--paper-soft)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div className="field">
            <label>Full name *</label>
            <input className="input" placeholder="Avery Okonkwo"
              value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Email *</label>
            <input className="input" type="email" placeholder="avery@duda.co"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>Role *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {ROLES.map(k => (
              <button key={k} onClick={() => setRole(k)} className="card card-pad"
                style={{
                  padding: 12, textAlign: 'left', cursor: 'pointer',
                  borderColor: role === k ? 'var(--ink)' : 'var(--hairline)',
                  background: role === k ? 'var(--paper)' : 'var(--surface)',
                }}>
                <div className="text-sm semibold">{ROLE_LABELS[k]}</div>
                <div className="muted text-xs" style={{ marginTop: 2 }}>{ROLE_SUBS[k]}</div>
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p style={{ color: 'var(--crimson)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {error}
          </p>
        )}
      </div>
      <div className="modal-foot">
        <span className="muted text-xs">An invite email will be sent to {email || 'the member'}.</span>
        <div className="flex gap-2">
          <button className="btn" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn primary" onClick={save}
            disabled={!name.trim() || !email.trim() || loading}>
            {loading ? 'Sending invite…' : 'Send invite'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
