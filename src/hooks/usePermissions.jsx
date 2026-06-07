import React, { createContext, useContext, useMemo } from 'react';
import { can as canFor } from '../lib/permissions';

// Provides the authenticated user's role and a bound `can(permission)` check to
// the whole tree, so components never compare raw role strings themselves.
const PermissionsContext = createContext({ role: null, can: () => false });

export function PermissionsProvider({ role, children }) {
  const value = useMemo(
    () => ({ role: role ?? null, can: permission => canFor(role, permission) }),
    [role]
  );
  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
