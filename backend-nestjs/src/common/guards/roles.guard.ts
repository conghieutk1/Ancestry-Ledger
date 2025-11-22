import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      return false;
    }

    // Admin has access to everything? Or strictly follow roles?
    // Usually Admin should have access to everything, but let's stick to strict role check or hierarchy.
    // Hierarchy: ADMIN > COLLABORATOR > MEMBER > GUEST
    // But for simplicity, let's just check if user role is in requiredRoles.

    return requiredRoles.some((role) => user.role === role);
  }
}
