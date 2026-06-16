import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../lib/data';
import Modal from '../components/ui/Modal';
import ModalHead from '../components/ui/ModalHead';
import Dropdown from '../components/ui/Dropdown';
import { ROLES, PERMISSION_MATRIX, can } from '../lib/permissions';
import { usePermissions } from '../hooks/usePermissions';

function fmtWhen(iso, locale) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(locale || undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

export default function TeamPage({ team, onAdd, onDeleteMember, onChangeRole, currentUserId, auditLog = [] }) {
  const { t, i18n } = useTranslation();
  // Alias because the members .map(t => …) parameter shadows the translate fn.
  const tr = t;
  const roleLabel = (r) => t('teamRoles.' + r, { defaultValue: r });
  const permLabel = (key) => t('perms.' + key.replace(/\./g, '_'), { defaultValue: key });
  const { can: canDo } = usePermissions();
  const [deleteId, setDeleteId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type, member, newRole }

  const canManageUsers = canDo('users.manage');
  const canChangeRoles = canDo('roles.change');
  const canViewAudit = canDo('audit.view');
  const adminCount = team.filter(m => m.role === 'Admin').length;

  const nameById = useMemo(() => {
    const map = {};
    team.forEach(m => { if (m.user_id) map[m.user_id] = m.name; map[m.id] = m.name; });
    return map;
  }, [team]);

  function attemptRoleChange(member, newRole) {
    if (!canChangeRoles || newRole === member.role) return;
    if (newRole === 'Admin') { setConfirm({ type: 'promote', member, newRole }); return; }
    if (member.role === 'Admin' && member.id === currentUserId) {
      setConfirm({ type: 'selfDemote', member, newRole });
      return;
    }
    onChangeRole?.(member.id, newRole);
  }

  function confirmRoleChange() {
    if (confirm) onChangeRole?.(confirm.member.id, confirm.newRole);
    setConfirm(null);
  }

  return (
    <main className="canvas">
      <section style={{ paddingBottom: 24, borderBottom: '1px solid var(--hairline)', marginBottom: 32 }}>
        <div className="eyebrow">{t('team.org_eyebrow')}</div>
        <div className="flex items-end justify-between" style={{ marginTop: 8 }}>
          <h1 className="display-2">{t('team.title')}</h1>
          <button
            className="btn primary"
            onClick={onAdd}
            disabled={!canManageUsers}
            title={canManageUsers ? undefined : t('team.admin_only')}
          >
            {ICONS.plus} {t('team.add_member')}
          </button>
        </div>
      </section>

      {/* Roles & permissions matrix */}
      <div className="eyebrow" style={{ marginBottom: 16 }}>{t('team.roles_permissions')}</div>
      <div className="role-cards">
        {ROLES.map(r => (
          <div key={r} className="card card-pad role-card">
            <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <span className="semibold">{roleLabel(r)}</span>
              {r === 'Admin' && <span className="pill must" style={{ fontSize: 10 }}>{ICONS.lock} {t('team.full_access')}</span>}
            </div>
            <p className="text-sm muted" style={{ lineHeight: 1.5 }}>{t('teamRoleDesc.' + r, { defaultValue: '' })}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16, marginBottom: 36, overflow: 'hidden' }}>
        <table className="perm-matrix">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>{t('team.col_permission')}</th>
              {ROLES.map(r => <th key={r}>{roleLabel(r)}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MATRIX.map(p => (
              <tr key={p.key}>
                <td style={{ textAlign: 'left' }}>{permLabel(p.key)}</td>
                {ROLES.map(r => (
                  <td key={r}>
                    {can(r, p.key)
                      ? <span className="perm-yes">{ICONS.check}</span>
                      : <span className="perm-no">–</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Members */}
      <div className="eyebrow" style={{ marginBottom: 16 }}>{t('team.all_members', { count: team.length })}</div>
      <div className="team-grid">
        {team.map(t => {
          const isLastAdmin = t.role === 'Admin' && adminCount <= 1;
          return (
            <div key={t.id} className="team-card">
              <div className="top">
                <span className="client-logo" style={{ background: t.color }}>{t.mono}</span>
                <div style={{ flex: 1 }}>
                  <div className="name">{t.name}{t.id === currentUserId && <span className="muted text-xs">{tr('team.you_suffix')}</span>}</div>
                  <div className="role">{t.email}</div>
                </div>
                {canManageUsers && (
                  <Dropdown items={[
                    { label: tr('team.remove_from_team'), danger: true, onClick: () => setDeleteId(t.id) },
                  ]} />
                )}
              </div>

              {/* Role selector */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <label className="text-xs muted" style={{ minWidth: 34 }}>{tr('team.role_label')}</label>
                <select
                  className="input"
                  value={t.role}
                  disabled={!canChangeRoles || isLastAdmin}
                  title={
                    !canChangeRoles ? tr('team.admin_only')
                      : isLastAdmin ? tr('team.cannot_demote_last_admin')
                        : undefined
                  }
                  onChange={e => attemptRoleChange(t, e.target.value)}
                  style={{ fontSize: 13, flex: 1, opacity: (!canChangeRoles || isLastAdmin) ? 0.55 : 1 }}
                >
                  {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </div>

              {canManageUsers && deleteId === t.id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 2px', borderTop: '1px solid var(--hairline-soft)', marginTop: 8 }}>
                  <span className="text-xs muted" style={{ flex: 1 }}>{tr('team.remove_confirm', { name: t.name })}</span>
                  <button
                    className="btn sm"
                    style={{ color: 'var(--duda)', borderColor: 'var(--duda)' }}
                    onClick={() => { onDeleteMember(t.id); setDeleteId(null); }}
                  >
                    {tr('team.remove')}
                  </button>
                  <button className="btn sm ghost" onClick={() => setDeleteId(null)}>{tr('common.cancel')}</button>
                </div>
              )}

              <div className="stats">
                <div className="stat"><div className="n tabnum">{t.clients}</div><div className="l">{tr('team.stat_clients')}</div></div>
                <div className="stat"><div className="n tabnum">{t.open}</div><div className="l">{tr('team.stat_open')}</div></div>
                <div className="stat"><div className="n tabnum">{t.resolved}</div><div className="l">{tr('team.stat_done')}</div></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Access-change audit history */}
      {canViewAudit && (
        <section style={{ marginTop: 40 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>{t('team.access_history')}</div>
          {auditLog.length === 0 ? (
            <p className="text-sm muted">{t('team.no_role_changes')}</p>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="perm-matrix audit-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>{t('team.col_member')}</th>
                    <th style={{ textAlign: 'left' }}>{t('team.col_change')}</th>
                    <th style={{ textAlign: 'left' }}>{t('team.col_by')}</th>
                    <th style={{ textAlign: 'left' }}>{t('team.col_when')}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map(row => (
                    <tr key={row.id}>
                      <td style={{ textAlign: 'left' }}>{nameById[row.user_id] || '—'}</td>
                      <td style={{ textAlign: 'left' }}>
                        <span className="muted">{row.old_role ? roleLabel(row.old_role) : '—'}</span> {ICONS.arrow} <b>{roleLabel(row.new_role)}</b>
                      </td>
                      <td style={{ textAlign: 'left' }}>{nameById[row.changed_by] || '—'}</td>
                      <td style={{ textAlign: 'left' }} className="num">{fmtWhen(row.changed_at, i18n.language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {confirm && (
        <Modal size="sm" onClose={() => setConfirm(null)}>
          <ModalHead
            title={confirm.type === 'promote' ? t('team.modal_promote_title') : t('team.modal_selfdemote_title')}
            eyebrow={t('team.role_change_eyebrow')}
            onClose={() => setConfirm(null)}
          />
          <div className="modal-body" style={{ background: 'var(--paper-soft)' }}>
            <p className="text-sm" style={{ lineHeight: 1.55 }}>
              {confirm.type === 'promote'
                ? t('team.promote_body', { name: confirm.member.name })
                : t('team.selfdemote_body', { role: roleLabel(confirm.newRole) })}
            </p>
          </div>
          <div className="modal-foot">
            <div style={{ flex: 1 }} />
            <div className="flex gap-2">
              <button className="btn" onClick={() => setConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn primary" onClick={confirmRoleChange}>
                {confirm.type === 'promote' ? t('team.promote_confirm') : t('team.selfdemote_confirm')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
