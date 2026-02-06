import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { RequestWithUser } from '../types/auth-options.interface';

/**
 * Global authentication guard.
 *
 * Enforces authentication on all routes by default.
 * Use @Public() decorator to opt-out specific routes.
 *
 * Note: This guard does NOT verify tokens or build users.
 * The FirebaseAuthMiddleware runs before guards and populates req.user.
 * This guard simply enforces that req.user exists for protected routes.
 *
 * Flow:
 * 1. Middleware runs → verifies token, populates req.user (or leaves undefined)
 * 2. Guard runs → checks if route is public or if req.user exists
 * 3. Throws 401 if protected route has no user
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // User should already be populated by FirebaseAuthMiddleware
    if (!request.user) {
      throw new UnauthorizedException(
        'Missing or invalid authentication token',
      );
    }

    return true;
  }
}
