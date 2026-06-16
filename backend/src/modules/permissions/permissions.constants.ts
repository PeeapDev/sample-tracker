// Canonical permission keys — kept in sync with the admin console's RBAC matrix.
export const ALL_PERMISSIONS = [
  'dashboard.view', // a role-appropriate dashboard
  'dashboard.network', // the full network-wide metrics (admin only)
  'samples.view',
  'samples.manage', // register/collect samples
  'samples.scan',
  'batches.manage',
  'dispatches.view',
  'dispatches.manage',
  'parcels.view', // see/scan return parcels
  'parcels.register', // register return cargo at the centre
  'livemap.view', // live rider map (admin only)
  'users.view',
  'users.manage',
  'roles.manage',
  'settings.manage',
] as const;

export type PermissionKey = (typeof ALL_PERMISSIONS)[number];

// Default permissions per role (admin is implicit — it always has everything,
// including dashboard.network, livemap.view, users.*, roles.manage, settings.manage).
// Tightened so each role only sees what it needs — see the per-role table.
export const DEFAULT_MATRIX: Record<string, string[]> = {
  collector: [
    'dashboard.view',
    'samples.view',
    'samples.manage',
    'samples.scan',
    'batches.manage',
    'parcels.view',
  ],
  dispatcher: [
    'dashboard.view',
    'samples.view',
    'samples.scan',
    'dispatches.view',
    'dispatches.manage',
    'parcels.view',
  ],
  hub_officer: [
    'dashboard.view',
    'samples.view',
    'samples.scan',
    'batches.manage',
    'dispatches.view',
    'parcels.view',
    'parcels.register',
  ],
  lab_officer: [
    'dashboard.view',
    'samples.view',
    'samples.scan',
    'batches.manage',
    'parcels.view',
    'parcels.register',
  ],
};
