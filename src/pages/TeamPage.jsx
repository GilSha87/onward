import React, { useState, useMemo } from 'react';
import { ICONS } from '../lib/data';
import Modal from '../components/ui/Modal';
import ModalHead from '../components/ui/ModalHead';
import Dropdown from '../components/ui/Dropdown';
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, PERMISSION_MATRIX, can } from '../lib/permissions';
import { usePermissions } from '../hooks/usePermissions';

function fmtWhen(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

export default function TeamPage({ team, onAdd, onDeleteMember, onChangeRole, currentUserId, auditLog = [] }) {
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
        <div className="eyebrow">Onboarding org</div>
        <div className="flex items-end justify-between" style={{ marginTop: 8 }}>
          <h1 className="display-2">The team.</h1>
          <button
            className="btn primary"
            onClick={onAdd}
            disabled={!canManageUsers}
            title={canManageUsers ? undefined : 'Admin only'}
          >
            {ICONS.plus} Add member
          </button>
        </div>
      </section>

      {/* Roles & permissions matrix */}
      <div className="eyebrow" style={{ marginBottom: 16 }}>Roles &amp; permissions</div>
      <div className="role-cards">
        {ROLES.map(r => (
          <div key={r} className="card card-pad role-card">
            <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <span className="semibold">{ROLE_LABELS[r]}</span>
              {r === 'Admin' && <span className="pill must" style={{ fontSize: 10 }}>{ICONS.lock} Full access</span>}
            </div>
            <p className="text-sm muted" style={{ lineHeight: 1.5 }}>{ROLE_DESCRIPTIONS[r]}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16, marginBottom: 36, overflow: 'hidden' }}>
        <table className="perm-matrix">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Permission</th>
              {ROLES.map(r => <th key={r}>{ROLE_LABELS[r]}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MATRIX.map(p => (
              <tr key={p.key}>
                <td style={{ textAlign: 'left' }}>{p.label}</td>
                {ROLES.map(r => (
                  <td key={r}>
                    {can(r, p.key)
                      ? <span className="perm-yes" title="Allowed">{ICONS.check}</span>
                      : <span className="perm-no" title="Not allowed">–</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Members */}
      <div className="eyebrow" style={{ marginBottom: 16 }}>All members ({team.length})</div>
      <div className="team-grid">
        {team.map(t => {
          const isLastAdmin = t.role === 'Admin' && adminCount <= 1;
          return (
            <div key={t.id} className="team-card">
              <div className="top">
                <span className="client-logo" style={{ background: t.color }}>{t.mono}</span>
                <div style={{ flex: 1 }}>
                  <div className="name">{t.name}{t.id === currentUserId && <span className="muted text-xs"> · you</span>}</div>
                  <div className="role">{t.email}</div>
                </div>
                {canManageUsers && (
                  <Dropdown items={[
                    { label: 'Remove from team', danger: true, onClick: () => setDeleteId(t.id) },
                  ]} />
                )}
              </div>

              {/* Role selector */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <label className="text-xs muted" style={{ minWidth: 34 }}>Role</label>
                <select
                  className="input"
                  value={t.role}
                  disabled={!canChangeRoles || isLastAdmin}
                  title={
                    !canChangeRoles ? 'Admin only'
                      : isLastAdmin ? 'Cannot demote the last remaining Admin'
                        : undefined
                  }
                  onChange={e => attemptRoleChange(t, e.target.value)}
                  style={{ fontSize: 13, flex: 1, opacity: (!canChangeRoles || isLastAdmin) ? 0.55 : 1 }}
                >
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>

              {canManageUsers && deleteId === t.id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 2px', borderTop: '1px solid var(--hairline-soft)', marginTop: 8 }}>
                  <span className="text-xs muted" style={{ flex: 1 }}>Remove {t.name}?</span>
                  <button
                    className="btn sm"
                    style={{ color: 'var(--duda)', borderColor: 'var(--duda)' }}
                    onClick={() => { onDeleteMember(t.id); setDeleteId(null); }}
                  >
                    Remove
                  </button>
                  <button className="btn sm ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                </div>
              )}

              <div className="stats">
                <div className="stat"><div className="n tabnum">{t.clients}</div><div className="l">Clients</div></div>
                <div className="stat"><div className="n tabnum">{t.open}</div><div className="l">Open</div></div>
                <div className="stat"><div className="n tabnum">{t.resolved}</div><div className="l">Done</div></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Access-change audit history */}
      {canViewAudit && (
        <section style={{ marginTop: 40 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Access history</div>
          {auditLog.length === 0 ? (
            <p className="text-sm muted">No role changes recorded yet.</p>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="perm-matrix audit-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Member</th>
                    <th style={{ textAlign: 'left' }}>Change</th>
                    <th style={{ textAlign: 'left' }}>By</th>
                    <th style={{ textAlign: 'left' }}>When</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map(row => (
                    <tr key={row.id}>
                      <td style={{ textAlign: 'left' }}>{nameById[row.user_id] || '—'}</td>
                      <td style={{ textAlign: 'left' }}>
                        <span className="muted">{row.old_role || '—'}</span> {ICONS.arrow} <b>{row.new_role}</b>
                      </td>
                      <td style={{ textAlign: 'left' }}>{nameById[row.changed_by] || '—'}</td>
                      <td style={{ textAlign: 'left' }} className="num">{fmtWhen(row.changed_at)}</td>
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
            title={confirm.type === 'promote' ? 'Promote to Admin?' : 'Remove your own Admin access?'}
            eyebrow="Role change"
            onClose={() => setConfirm(null)}
          />
          <div className="modal-body" style={{ background: 'var(--paper-soft)' }}>
            <p className="text-sm" style={{ lineHeight: 1.55 }}>
              {confirm.type === 'promote'
                ? <>This grants <b>{confirm.member.name}</b> full system access including user management, role changes, and record deletion. Continue?</>
                : <>You are about to change your own role from Admin to <b>{ROLE_LABELS[confirm.newRole]}</b>. You will immediately lose admin access. Continue?</>}
            </p>
          </div>
          <div className="modal-foot">
            <div style={{ flex: 1 }} />
            <div className="flex gap-2">
              <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn primary" onClick={confirmRoleChange}>
                {confirm.type === 'promote' ? 'Promote to Admin' : 'Change my role'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
