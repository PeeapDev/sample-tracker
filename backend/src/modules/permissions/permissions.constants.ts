// Canonical permission keys — kept in sync with the admin console's RBAC matrix.
export const ALL_PERMISSIONS = [
  'dashboard.view',
  'samples.view',
  'samples.manage',
  'samples.scan',
  'dispatches.view',
  'dispatches.manage',
  'users.view',
  'users.manage',
  'roles.manage',
  'settings.manage',
] as const;

export type PermissionKey = (typeof ALL_PERMISSIONS)[number];

// Default permissions per role (admin is implicit — it always has everything).
// samples.scan is granted to every role by default — the camera scanner is open
// to all and can be switched off per role from the admin Roles & Permissions page.
export const DEFAULT_MATRIX: Record<string, string[]> = {
  collector: ['dashboard.view', 'samples.view', 'samples.manage', 'samples.scan'],
  dispatcher: ['dashboard.view', 'samples.view', 'samples.scan', 'dispatches.view', 'dispatches.manage'],
  hub_officer: ['dashboard.view', 'samples.view', 'samples.scan', 'dispatches.view'],
  lab_officer: ['dashboard.view', 'samples.view', 'samples.scan'],
};
