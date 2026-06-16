import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/supabase';
import Modal from '../components/ui/Modal';
import ModalHead from '../components/ui/ModalHead';
import { ROLES } from '../lib/permissions';

export default function AddTeamModal({ onClose, onSave }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function save() {
    if (!name.trim() || !email.trim()) return;
    if (!EMAIL_RE.test(email.trim())) {
      setError(t('modals.addTeam.err_email', { email: email.trim() }));
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
      // Refresh the team list, then show the shareable invite link instead of
      // closing — delivery no longer depends on a (rate-limited, scanner-prone)
      // email. The admin copies this link and sends it however they like.
      onSave?.({ name: name.trim(), email: email.trim(), role });
      if (json.invite_url) {
        setInviteUrl(json.invite_url);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message || t('modals.addTeam.err_failed'));
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Modal size="md" onClose={onClose}>
      <ModalHead title={t('modals.addTeam.title')} eyebrow={t('modals.addTeam.eyebrow')} onClose={onClose} />

      {inviteUrl ? (
        <>
          <div className="modal-body" style={{ background: 'var(--paper-soft)' }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              {t('modals.addTeam.link_ready', { defaultValue: 'Invite link ready' })}
            </p>
            <p className="muted text-sm" style={{ marginBottom: 14 }}>
              {t('modals.addTeam.link_help', {
                name: name.trim(),
                defaultValue: 'Send this link to {{name}}. They open it to set their own password — no email required.',
              })}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" readOnly value={inviteUrl} onFocus={e => e.target.select()}
                style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }} />
              <button className="btn primary" onClick={copyLink} type="button">
                {copied
                  ? t('modals.addTeam.copied', { defaultValue: 'Copied!' })
                  : t('modals.addTeam.copy', { defaultValue: 'Copy' })}
              </button>
            </div>
            <p className="muted text-xs" style={{ marginTop: 10 }}>
              {t('modals.addTeam.link_expiry', { defaultValue: 'This link expires in 7 days and can only be used once.' })}
            </p>
          </div>
          <div className="modal-foot">
            <span className="muted text-xs">{email}</span>
            <button className="btn primary" onClick={onClose}>
              {t('common.done', { defaultValue: 'Done' })}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="modal-body" style={{ background: 'var(--paper-soft)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
              <div className="field">
                <label>{t('modals.addTeam.full_name')}</label>
                <input className="input" placeholder={t('modals.addTeam.name_ph')}
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="field">
                <label>{t('modals.addTeam.email')}</label>
                <input className="input" type="email" placeholder={t('modals.addTeam.email_ph')}
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 18 }}>
              <label>{t('modals.addTeam.role')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {ROLES.map(k => (
                  <button key={k} onClick={() => setRole(k)} className="card card-pad"
                    style={{
                      padding: 12, textAlign: 'left', cursor: 'pointer',
                      borderColor: role === k ? 'var(--ink)' : 'var(--hairline)',
                      background: role === k ? 'var(--paper)' : 'var(--surface)',
                    }}>
                    <div className="text-sm semibold">{t('teamRoles.' + k, { defaultValue: k })}</div>
                    <div className="muted text-xs" style={{ marginTop: 2 }}>{t('modals.addTeam.sub_' + k, { defaultValue: '' })}</div>
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
            <span className="muted text-xs">{t('modals.addTeam.invite_note', { email: email || t('modals.addTeam.invite_fallback') })}</span>
            <div className="flex gap-2">
              <button className="btn" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
              <button className="btn primary" onClick={save}
                disabled={!name.trim() || !email.trim() || loading}>
                {loading ? t('modals.addTeam.sending') : t('modals.addTeam.send_invite')}
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
