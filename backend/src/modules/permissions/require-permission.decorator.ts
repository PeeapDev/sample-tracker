import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';

/** Marks a route as requiring a specific RBAC permission. */
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);
