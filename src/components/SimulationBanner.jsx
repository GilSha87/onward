import React from 'react';
import { useRoleSimulation } from '../lib/RoleSimulationContext';

// Persistent banner shown WHILE simulating, so a simulated view is never
// mistaken for real access. Its Exit button keys off real super-admin state via
// exitSimulation, so it always works — even inside a simulated Staff view.
export default function SimulationBanner() {
  const { isSimulating, effectiveRole, exitSimulation } = useRoleSimulation();
  if (!isSimulating) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 500,
        background: '#F6BA1A',
        color: '#1A1714',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <span>
        Viewing as <strong>{effectiveRole.toUpperCase()}</strong> — simulated view, not your real access
      </span>
      <button
        onClick={exitSimulation}
        style={{
          border: 'none',
          background: 'transparent',
          color: '#1A1714',
          fontWeight: 700,
          textDecoration: 'underline',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        Exit
      </button>
    </div>
  );
}
