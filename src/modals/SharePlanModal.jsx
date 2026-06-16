import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../lib/data';
import Modal from '../components/ui/Modal';
import ModalHead from '../components/ui/ModalHead';
import { listShareTokens, createShareToken, revokeShareToken, shareUrl } from '../lib/plan';

export default function SharePlanModal({ client, onClose }) {
  const { t } = useTranslation();
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
      setError(err?.message || t('modals.sharePlan.err_create'));
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
      setError(t('modals.sharePlan.err_copy'));
    }
  }

  async function revoke(tok) {
    if (!window.confirm(t('modals.sharePlan.revoke_confirm'))) return;
    const ok = await revokeShareToken(tok.id);
    if (ok) setTokens(prev => prev.filter(x => x.id !== tok.id));
    else setError(t('modals.sharePlan.err_revoke'));
  }

  return (
    <Modal size="md" onClose={onClose}>
      <ModalHead title={t('modals.sharePlan.title')} eyebrow={client.name} onClose={onClose} />
      <div className="modal-body" style={{ background: 'var(--paper-soft)' }}>
        <p className="muted text-sm" style={{ marginTop: 0, marginBottom: 16 }}>
          {t('modals.sharePlan.desc')}
        </p>

        {loading ? (
          <div className="muted text-sm">{t('modals.sharePlan.loading')}</div>
        ) : tokens.length === 0 ? (
          <div className="muted text-sm" style={{ padding: '8px 0' }}>{t('modals.sharePlan.no_links')}</div>
        ) : (
          <div className="flex flex-col gap-3">
            {tokens.map(tok => (
              <div key={tok.id} style={{ border: '1px solid var(--hairline)', borderRadius: 10, padding: 12, background: 'var(--surface)' }}>
                <div className="flex items-center gap-2">
                  <input className="input" readOnly value={shareUrl(tok.token)} style={{ flex: 1, fontSize: 12 }} onFocus={e => e.target.select()} />
                  <button className="btn sm" onClick={() => copy(tok)}>
                    {copiedId === tok.id ? <>{ICONS.check} {t('modals.sharePlan.copied')}</> : <>{ICONS.link} {t('modals.sharePlan.copy')}</>}
                  </button>
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                  <span className="muted text-xs">
                    {tok.approvedAt
                      ? <>{t('modals.sharePlan.approved_by')} <b>{tok.approvedBy}</b></>
                      : t('modals.sharePlan.awaiting')}
                  </span>
                  <button className="btn ghost sm" onClick={() => revoke(tok)}>{ICONS.close} {t('modals.sharePlan.revoke')}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="text-xs" style={{ color: 'var(--bad, #c0392b)', marginTop: 12 }}>{error}</div>}
      </div>
      <div className="modal-foot">
        <span className="muted text-xs">{t('modals.sharePlan.foot')}</span>
        <div className="flex gap-2">
          <button className="btn" onClick={onClose}>{t('modals.done')}</button>
          <button className="btn primary" onClick={generate} disabled={busy}>
            {busy ? t('modals.sharePlan.creating') : <>{ICONS.plus} {t('modals.sharePlan.new_link')}</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}
