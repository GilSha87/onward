import React from 'react';
import { useRoleSimulation } from '../lib/RoleSimulationContext';

// "View as" control. Visible ONLY to real super admins; keyed off the real
// is_super_admin flag (never effectiveRole) so a simulated Staff view can't hide
// the control. Returns null — not in the DOM — for everyone else.
export default function RoleSwitcher() {
  const { isSuperAdmin, realRole, effectiveRole, availableRoles, setEffectiveRole, exitSimulation } =
    useRoleSimulation();

  if (!isSuperAdmin) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>View as</span>
      <select
        value={effectiveRole}
        onChange={e => (e.target.value === realRole ? exitSimulation() : setEffectiveRole(e.target.value))}
        style={{
          fontSize: 13,
          border: '1px solid var(--hairline)',
          borderRadius: 8,
          padding: '4px 8px',
          background: 'var(--paper)',
          cursor: 'pointer',
        }}
      >
        <option value={realRole}>{realRole} (you)</option>
        {availableRoles
          .filter(r => r !== realRole)
          .map(r => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
      </select>
    </div>
  );
}
