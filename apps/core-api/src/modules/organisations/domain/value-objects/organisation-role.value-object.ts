/**
 * Organisation Role Value Object
 *
 * Represents the role a user has within an organisation.
 * Used for authorization and access control.
 */
export enum OrganisationRole {
  /**
   * Organisation Administrator - Full access to manage the organisation
   * Can add/remove members, change roles, and manage organisation settings
   */
  ORG_ADMIN = 'ORG_ADMIN',

  /**
   * Organisation Member - Basic member with read access
   * Can view organisation details and other members
   */
  ORG_MEMBER = 'ORG_MEMBER',
}

/**
 * Check if a string is a valid OrganisationRole
 */
export function isValidOrganisationRole(
  value: string,
): value is OrganisationRole {
  return Object.values(OrganisationRole).includes(value as OrganisationRole);
}

/**
 * Parse a string to OrganisationRole, throws if invalid
 */
export function parseOrganisationRole(value: string): OrganisationRole {
  if (!isValidOrganisationRole(value)) {
    throw new Error(`Invalid organisation role: ${value}`);
  }
  return value;
}
