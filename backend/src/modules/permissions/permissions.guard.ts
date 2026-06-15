import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from './permissions.service';
import { PERMISSION_KEY } from './require-permission.decorator';

/**
 * Enforces @RequirePermission(...) against the database-backed RBAC matrix.
 * Must run AFTER JwtAuthGuard so req.user is populated.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user?.role) {
      throw new ForbiddenException('Not authenticated');
    }
    if (user.role === 'admin') return true;

    const allowed = await this.permissionsService.can(user.role, required);
    if (!allowed) {
      throw new ForbiddenException(`Missing permission: ${required}`);
    }
    return true;
  }
}
