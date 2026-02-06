import {
  Inject,
  Injectable,
  Logger,
  NestMiddleware,
  Optional,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { FirebaseStrategy } from '../strategy/firebase.strategy';
import type {
  AuthenticatedUser,
  IUserResolver,
  RequestWithUser,
} from '../types/auth-options.interface';
import { USER_RESOLVER } from '../types/auth-options.interface';

/**
 * Firebase Authentication Middleware
 *
 * Populates req.user from the Bearer token BEFORE request-scoped providers
 * are instantiated. This ensures that ZenStack's PolicyPlugin receives the
 * correct user context when the enhanced DB is created.
 *
 * Unlike the AuthGuard, this middleware does NOT throw on missing/invalid tokens.
 * It silently sets req.user to undefined for unauthenticated requests.
 * The AuthGuard still handles enforcement (throwing 401 for protected routes).
 *
 * Auto-Provisioning:
 * When a UserResolver is configured and a valid token lacks a userId custom claim,
 * the middleware calls the resolver to get or create the user. This enables
 * "just-in-time" user provisioning where users are created on first API request.
 *
 * Flow:
 * 1. Middleware runs → populates req.user (or leaves undefined)
 * 2. If no userId claim and UserResolver exists → resolve/create user
 * 3. Request-scoped providers instantiate → ENHANCED_DB reads req.user
 * 4. Guards run → AuthGuard validates and throws if needed
 */
@Injectable()
export class FirebaseAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(FirebaseAuthMiddleware.name);

  constructor(
    private readonly firebaseStrategy: FirebaseStrategy,
    @Optional()
    @Inject(USER_RESOLVER)
    private readonly userResolver?: IUserResolver,
  ) {}

  async use(
    req: RequestWithUser,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = this.extractTokenFromHeader(req);

    if (!token) {
      // No token - let the guard handle enforcement
      return next();
    }

    try {
      const decodedToken = await this.firebaseStrategy.verifyToken(token);

      // Check if this is a known user (has userId custom claim)
      const hasUserIdClaim =
        decodedToken.userId !== undefined && decodedToken.userId !== null;

      if (hasUserIdClaim) {
        // User exists with custom claims, build from token
        req.user = this.buildAuthenticatedUser(decodedToken);
      } else if (this.userResolver) {
        // No userId claim but we have a resolver - get or create user
        req.user = await this.resolveUser(decodedToken);
      } else {
        // No userId claim and no resolver - use providerId as fallback
        req.user = this.buildAuthenticatedUser(decodedToken);
      }
    } catch (error) {
      // Invalid token or user resolution failed - leave req.user undefined
      this.logger.debug(
        `Token verification/resolution failed in middleware: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    next();
  }

  /**
   * Resolves a user using the configured UserResolver.
   * Used for auto-provisioning when a valid token lacks userId claims.
   */
  private async resolveUser(
    decodedToken: Awaited<ReturnType<FirebaseStrategy['verifyToken']>>,
  ): Promise<AuthenticatedUser> {
    const claims: Record<string, unknown> = {
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    const user = await this.userResolver!.resolveUser(decodedToken.uid, claims);

    this.logger.debug(
      `Resolved user ${user.id} for Firebase UID: ${decodedToken.uid}`,
    );

    return user;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }

  private buildAuthenticatedUser(
    decodedToken: Awaited<ReturnType<FirebaseStrategy['verifyToken']>>,
  ): AuthenticatedUser {
    const providerId = decodedToken.uid;

    // Use userId from custom claims if present, otherwise fall back to providerId
    const userId = (decodedToken.userId as string) ?? providerId;

    return {
      id: userId,
      providerId,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      roles: (decodedToken.roles as string[]) ?? [],
    };
  }
}
