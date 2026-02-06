/**
 * Test data generators for API tests
 */

/**
 * Generate a unique organisation payload
 */
export function generateOrganisation(overrides?: {
  name?: string;
  slug?: string;
}) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 7);

  return {
    name: overrides?.name ?? `Test Organisation ${timestamp}`,
    slug: overrides?.slug ?? `test-org-${timestamp}-${random}`,
  };
}

/**
 * Generate multiple unique organisations
 */
export function generateOrganisations(count: number) {
  return Array.from({ length: count }, () => generateOrganisation());
}

// ============================================================================
// User Test Data Generators
// ============================================================================

/**
 * Generate a unique user registration payload
 */
export function generateUserRegistration(overrides?: {
  email?: string;
  password?: string;
  displayName?: string;
}) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 7);

  return {
    email:
      overrides?.email ??
      `qatesting+${timestamp}-${random}@thoughtandfunction.com`,
    password: overrides?.password ?? "Testing123!",
    displayName: overrides?.displayName ?? `Test User ${random}`,
  };
}

/**
 * Generate multiple unique user registration payloads
 */
export function generateUserRegistrations(count: number) {
  return Array.from({ length: count }, () => generateUserRegistration());
}

/**
 * Generate a profile update payload
 */
export function generateProfileUpdate(overrides?: {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  locale?: string;
  notificationPreferences?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    marketingEmails?: boolean;
  };
}) {
  const random = Math.random().toString(36).slice(2, 7);

  return {
    displayName: overrides?.displayName ?? `Updated Name ${random}`,
    bio: overrides?.bio ?? `This is a test bio ${random}`,
    timezone: overrides?.timezone ?? "Europe/London",
    locale: overrides?.locale ?? "en-GB",
    ...(overrides?.avatarUrl !== undefined && {
      avatarUrl: overrides.avatarUrl,
    }),
    ...(overrides?.notificationPreferences !== undefined && {
      notificationPreferences: overrides.notificationPreferences,
    }),
  };
}

// ============================================================================
// Membership Test Data Generators
// ============================================================================

/**
 * Organisation role enum for test data
 */
export enum OrganisationRole {
  ORG_ADMIN = "ORG_ADMIN",
  ORG_MEMBER = "ORG_MEMBER",
}

/**
 * Generate a membership creation payload
 */
export function generateMembership(overrides?: {
  userId?: string;
  role?: OrganisationRole;
}) {
  return {
    userId: overrides?.userId ?? `test-user-${Date.now()}`,
    role: overrides?.role ?? OrganisationRole.ORG_MEMBER,
  };
}

/**
 * Generate a membership role update payload
 */
export function generateMembershipRoleUpdate(overrides?: {
  role?: OrganisationRole;
}) {
  return {
    role: overrides?.role ?? OrganisationRole.ORG_ADMIN,
  };
}
