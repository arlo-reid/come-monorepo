/**
 * Application routes with versioning support
 * https://github.com/Sairyss/backend-best-practices#api-versioning
 *
 * This file centralizes all API route definitions for better maintainability
 * and versioning. Each bounded context has its own route namespace.
 *
 * Usage in controllers:
 * ```typescript
 * import { routesV1 } from 'routes';
 *
 * @ApiTags(routesV1.auth.root)
 * @ApiBearerAuth()
 * @Controller(routesV1.version)
 * export class RegisterUserHttpController {
 *   @Post(routesV1.auth.register)
 *   async handle() { ... }
 * }
 * ```
 */

// API Versions
const v1 = 'v1';

/**
 * V1 API Routes
 *
 * Route naming conventions:
 * - `root`: Resource name for @ApiTags (no version prefix)
 * - Other keys: Full method decorator paths including resource (no leading slash)
 * - Use kebab-case for multi-word paths
 * - Use :param for path parameters
 * - Nested resources use parent/:parentId/child pattern
 *
 * Controllers use @Controller(routesV1.version) and method decorators use full paths
 */
export const routesV1 = {
  version: v1,

  /**
   * Authentication routes
   * Handles user registration and login
   */
  auth: {
    root: 'auth',
    register: 'auth/register',
    login: 'auth/login',
  },

  /**
   * User management routes
   * Handles user queries and self-service operations
   */
  user: {
    root: 'users',
    me: 'users/me',
    byId: 'users/:userId',
    updateRoles: 'users/:userId/roles',
    myMemberships: 'users/me/memberships',
  },

  /**
   * Profile routes
   * Handles user profile management
   */
  profile: {
    root: 'profile',
    get: 'profile',
    update: 'profile',
  },

  /**
   * Account linking routes
   * Handles OAuth provider account linking/unlinking
   */
  account: {
    root: 'accounts',
    link: 'accounts/link',
    unlink: 'accounts/unlink/:providerType',
  },

  /**
   * Admin routes
   * System administration operations (requires elevated permissions)
   */
  admin: {
    root: 'admin',
    seed: 'admin/seed',
  },

  /**
   * Organisation routes
   * Organisation CRUD operations
   */
  organisation: {
    root: 'organisations',
    create: 'organisations',
    list: 'organisations',
    bySlug: 'organisations/:slug',
    delete: 'organisations/:slug',
  },

  /**
   * Membership routes (nested under organisations)
   * Handles organisation member management
   */
  membership: {
    root: 'memberships',
    /** Base path for membership routes under an organisation */
    forOrg: 'organisations/:orgSlug/memberships',
    /** Path for individual membership operations */
    byId: 'organisations/:orgSlug/memberships/:id',
    /** Standalone path for user's own memberships */
    userMemberships: 'users/me/memberships',
  },
} as const;

/**
 * Type for route keys to enable autocomplete and type safety
 */
export type RoutesV1 = typeof routesV1;
