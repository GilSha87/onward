import React, { useEffect, useState, useCallback } from 'react';
import { ICONS } from '../lib/data';
import Modal from '../components/ui/Modal';
import ModalHead from '../components/ui/ModalHead';
import { listShareTokens, createShareToken, revokeShareToken, shareUrl } from '../lib/plan';

export default function SharePlanModal({ client, onClose }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listShareTokens(client.id);
    setTokens(list);
    setLoading(false);
  }, [client.id]);

  useEffect(() => { refresh(); }, [refresh]);

  async function generate() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const tok = await createShareToken(client.id);
      setTokens(prev => [tok, ...prev]);
    } catch (err) {
      setError(err?.message || 'Could not create a share link.');
    }
    setBusy(false);
  }

  async function copy(tok) {
    const url = shareUrl(tok.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(tok.id);
      setTimeout(() => setCopiedId(c => (c === tok.id ? null : c)), 1800);
    } catch {
      setError('Copy failed — select and copy the link manually.');
    }
  }

  async function revoke(tok) {
    if (!window.confirm('Revoke this link? The client will no longer be able to open it.')) return;
    const ok = await revokeShareToken(tok.id);
    if (ok) setTokens(prev => prev.filter(t => t.id !== tok.id));
    else setError('Could not revoke the link.');
  }

  return (
    <Modal size="md" onClose={onClose}>
      <ModalHead title="Share plan with client" eyebrow={client.name} onClose={onClose} />
      <div className="modal-body" style={{ background: 'var(--paper-soft)' }}>
        <p className="muted text-sm" style={{ marginTop: 0, marginBottom: 16 }}>
          Generate a private link the client can open without logging in. They can review
          the 60·90·180 plan and approve it once. Links expire after 30 days.
        </p>

        {loading ? (
          <div className="muted text-sm">Loading links…</div>
        ) : tokens.length === 0 ? (
          <div className="muted text-sm" style={{ padding: '8px 0' }}>No active links yet.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {tokens.map(tok => (
              <div key={tok.id} style={{ border: '1px solid var(--hairline)', borderRadius: 10, padding: 12, background: 'var(--surface)' }}>
                <div className="flex items-center gap-2">
                  <input className="input" readOnly value={shareUrl(tok.token)} style={{ flex: 1, fontSize: 12 }} onFocus={e => e.target.select()} />
                  <button className="btn sm" onClick={() => copy(tok)}>
                    {copiedId === tok.id ? <>{ICONS.check} Copied</> : <>{ICONS.link} Copy</>}
                  </button>
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                  <span className="muted text-xs">
                    {tok.approvedAt
                      ? <>Approved by <b>{tok.approvedBy}</b></>
                      : 'Awaiting approval'}
                  </span>
                  <button className="btn ghost sm" onClick={() => revoke(tok)}>{ICONS.close} Revoke</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="text-xs" style={{ color: 'var(--bad, #c0392b)', marginTop: 12 }}>{error}</div>}
      </div>
      <div className="modal-foot">
        <span className="muted text-xs">Anyone with the link can view & approve the plan.</span>
        <div className="flex gap-2">
          <button className="btn" onClick={onClose}>Done</button>
          <button className="btn primary" onClick={generate} disabled={busy}>
            {busy ? 'Creating…' : <>{ICONS.plus} New link</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}
