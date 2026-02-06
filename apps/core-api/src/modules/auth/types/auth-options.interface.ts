import { Type } from '@nestjs/common';
import { Request } from 'express';

export const AUTH_OPTIONS = Symbol('AUTH_OPTIONS');
export const USER_RESOLVER = Symbol('USER_RESOLVER');

/**
 * Supported authentication strategies.
 * Extensible - add new strategies as needed.
 */
export enum AuthStrategy {
  FIREBASE = 'firebase',
  // Future: JWT = 'jwt', OAUTH = 'oauth', API_KEY = 'api_key'
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * Firebase-specific configuration options.
 */
export interface FirebaseAuthOptions {
  /**
   * Firebase project ID.
   * If not provided, uses GOOGLE_CLOUD_PROJECT env var.
   */
  projectId?: string;

  /**
   * Path to service account credentials JSON file.
   * If not provided, uses GOOGLE_APPLICATION_CREDENTIALS env var
   * or default application credentials.
   */
  credentialsPath?: string;

  /**
   * Whether to check if the token has been revoked.
   * Adds latency but improves security.
   * @default false
   */
  checkRevoked?: boolean;
}

/**
 * Main configuration for the AuthModule.
 */
export interface AuthModuleOptions {
  /**
   * Which authentication strategy to use.
   */
  strategy: AuthStrategy;

  /**
   * Strategy-specific configuration.
   */
  firebase?: FirebaseAuthOptions;

  /**
   * Header name for the auth token.
   * @default 'authorization'
   */
  headerName?: string;

  /**
   * Token prefix to strip (e.g., 'Bearer ').
   * @default 'Bearer '
   */
  tokenPrefix?: string;

  /**
   * Whether to make all routes protected by default.
   * Use @Public() decorator to opt-out specific routes.
   * @default true
   */
  globalGuard?: boolean;
}

/**
 * Authenticated user attached to the request.
 * Generic to allow app-specific user types.
 */
export interface AuthenticatedUser {
  /**
   * User's internal database ID.
   */
  id: string;

  /**
   * Firebase UID (or other provider's ID).
   */
  providerId: string;

  /**
   * User's email address.
   */
  email?: string;

  /**
   * Whether the email is verified.
   */
  emailVerified?: boolean;

  /**
   * User's assigned roles for authorization.
   */
  roles?: string[];

  /**
   * Additional properties from the user resolver.
   */
  [key: string]: unknown;
}

/**
 * Interface for resolving/creating users from auth provider tokens.
 * Implement this in your app to connect auth to your user database.
 */
export interface IUserResolver {
  /**
   * Find or create a user based on the authentication token claims.
   *
   * @param providerId - The user's ID from the auth provider (e.g., Firebase UID)
   * @param claims - Additional claims from the token (email, name, etc.)
   * @returns The authenticated user object to attach to the request
   */
  resolveUser(
    providerId: string,
    claims: Record<string, unknown>,
  ): Promise<AuthenticatedUser>;
}

/**
 * Type for classes that implement IUserResolver.
 */
export type UserResolverClass = Type<IUserResolver>;
