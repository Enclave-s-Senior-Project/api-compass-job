import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
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

        const request = context.switchToHttp().getRequest();
        const user = request.user.payload;

        if (!user || !user.roles || !Array.isArray(user.roles)) {
            throw new ForbiddenException('FORBIDDEN');
        }

        // Check if user has at least one of the required roles
        const hasRole = user.roles.some((role) => requiredRoles.includes(role as Role));
        if (!hasRole) {
            throw new ForbiddenException('FORBIDDEN');
        }

        return true;
    }
}
