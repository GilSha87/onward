// Onward — super-admin role simulation (CLIENT STATE ONLY).
//
// Lets a super admin temporarily view the app *as* a functional role to QA the
// UI. This is UI simulation, not impersonation: Supabase calls still carry the
// real identity, so RLS always sees the real (super-admin) user. It exercises
// client-side gating only — it does NOT prove RLS blocks forbidden writes.
//
// Invariants:
//   * Writes nothing to the DB; never mutates the stored role.
//   * Non-super-admins ALWAYS get their real role — no simulation possible.
//   * The switcher keys off the REAL is_super_admin flag, never effectiveRole,
//     so a simulated Staff view can never trap the user out of the switcher.

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ROLES } from './permissions';

const STORAGE_KEY = 'onward.effectiveRole';

const RoleSimulationContext = createContext(null);

// Mount INSIDE the auth/current-user provider so realRole + isSuperAdmin come
// from the already-loaded current user row.
export function RoleSimulationProvider({ realRole, isSuperAdmin, children }) {
  const [effectiveRole, setEffectiveRoleState] = useState(realRole);

  // Restore a session-only simulated role on refresh (super admins only).
  useEffect(() => {
    if (!isSuperAdmin) {
      setEffectiveRoleState(realRole);
      return;
    }
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && ROLES.includes(saved)) {
      setEffectiveRoleState(saved);
    } else {
      setEffectiveRoleState(realRole);
    }
  }, [isSuperAdmin, realRole]);

  const setEffectiveRole = role => {
    // Hard guard: only super admins can simulate, and only valid roles.
    if (!isSuperAdmin || !ROLES.includes(role)) return;
    setEffectiveRoleState(role);
    sessionStorage.setItem(STORAGE_KEY, role);
  };

  const exitSimulation = () => {
    setEffectiveRoleState(realRole);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      realRole,
      isSuperAdmin: !!isSuperAdmin,
      // Non-super-admins ALWAYS get their real role — no simulation possible,
      // regardless of any tampered sessionStorage value.
      effectiveRole: isSuperAdmin ? effectiveRole : realRole,
      isSimulating: isSuperAdmin && effectiveRole !== realRole,
      availableRoles: ROLES,
      setEffectiveRole,
      exitSimulation,
    }),
    [realRole, isSuperAdmin, effectiveRole]
  );

  return (
    <RoleSimulationContext.Provider value={value}>{children}</RoleSimulationContext.Provider>
  );
}

export function useRoleSimulation() {
  const ctx = useContext(RoleSimulationContext);
  if (!ctx) throw new Error('useRoleSimulation must be used within RoleSimulationProvider');
  return ctx;
}
