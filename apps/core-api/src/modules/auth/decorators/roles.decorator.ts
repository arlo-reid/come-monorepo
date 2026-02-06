import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route.
 * Used in conjunction with RolesGuard.
 *
 * @example
 * ```typescript
 * @Roles(Role.SYSTEM_ADMIN)
 * @UseGuards(RolesGuard)
 * async adminOnlyRoute() { ... }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
