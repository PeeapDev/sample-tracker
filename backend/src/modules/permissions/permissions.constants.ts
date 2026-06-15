// Canonical permission keys — kept in sync with the admin console's RBAC matrix.
export const ALL_PERMISSIONS = [
  'dashboard.view',
  'samples.view',
  'samples.manage',
  'dispatches.view',
  'dispatches.manage',
  'users.view',
  'users.manage',
  'roles.manage',
  'settings.manage',
] as const;

export type PermissionKey = (typeof ALL_PERMISSIONS)[number];

// Default permissions per role (admin is implicit — it always has everything).
export const DEFAULT_MATRIX: Record<string, string[]> = {
  collector: ['dashboard.view', 'samples.view', 'samples.manage'],
  dispatcher: ['dashboard.view', 'samples.view', 'dispatches.view', 'dispatches.manage'],
  hub_officer: ['dashboard.view', 'samples.view', 'dispatches.view'],
  lab_officer: ['dashboard.view', 'samples.view'],
};
