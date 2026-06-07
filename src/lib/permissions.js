// Onward — canonical role & permission model (single source of truth).
// Every access decision in the app reads from here. Do not compare raw role
// strings anywhere else.
//
// NOTE: roles are stored capitalized in `team_members.role`
// ('Staff' | 'Executive' | 'Admin'), so the keys here match that exactly.

export const ROLES = ['Executive', 'Admin', 'Staff'];

export const ROLE_LABELS = {
  Executive: 'Executive',
  Admin: 'Admin',
  Staff: 'Staff',
};

export const ROLE_DESCRIPTIONS = {
  Executive:
    'Approver and reviewer. Sees all clients, documents, statuses, and pending approvals. Approves or rejects NDA, MSA, and SoW. Cannot manage setup, users, templates, or day-to-day data entry.',
  Admin:
    'System owner. Can do everything: manage users and roles, create/edit records, upload documents, manage templates, approve items, archive records, and view audit logs. Keep this role limited.',
  Staff:
    'Working team member. Creates and manages onboarding records, uploads drafts, submits for approval, uploads signed files, tracks progress. Cannot approve, manage users/templates, or delete records.',
};

// Ordered for rendering the permission matrix in the Team Access page.
export const PERMISSION_MATRIX = [
  { key: 'dashboard.view', label: 'View dashboard' },
  { key: 'clients.viewAll', label: 'View all clients' },
  { key: 'clients.create', label: 'Create clients' },
  { key: 'clients.edit', label: 'Edit clients' },
  { key: 'documents.uploadDraft', label: 'Upload draft documents' },
  { key: 'documents.submitForApproval', label: 'Submit for approval' },
  { key: 'documents.uploadSigned', label: 'Upload signed documents' },
  { key: 'approvals.review', label: 'Approve / reject (NDA·MSA·SoW)' },
  { key: 'templates.manage', label: 'Manage templates' },
  { key: 'users.manage', label: 'Manage users' },
  { key: 'roles.change', label: 'Change roles' },
  { key: 'records.deleteArchive', label: 'Delete / archive records' },
  { key: 'audit.view', label: 'View audit history' },
];

const PERMISSIONS = {
  Executive: ['dashboard.view', 'clients.viewAll', 'approvals.review', 'audit.view'],
  Admin: ['*'],
  Staff: [
    'dashboard.view',
    'clients.viewAll',
    'clients.create',
    'clients.edit',
    'documents.uploadDraft',
    'documents.submitForApproval',
    'documents.uploadSigned',
  ],
};

export function can(role, permission) {
  const perms = PERMISSIONS[role] ?? [];
  return perms.includes('*') || perms.includes(permission);
}
