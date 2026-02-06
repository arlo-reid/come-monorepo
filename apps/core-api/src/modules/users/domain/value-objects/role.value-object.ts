/**
 * User roles for access control.
 *
 * SYSTEM_ADMIN - Internal super admin role for system-level access.
 *                Has full access to all resources and administrative functions.
 *                Should only be assigned to internal team members.
 */
export enum Role {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

/**
 * Check if a string is a valid Role
 */
export function isValidRole(role: string): role is Role {
  return Object.values(Role).includes(role as Role);
}
