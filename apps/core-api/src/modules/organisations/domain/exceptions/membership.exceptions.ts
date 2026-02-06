/**
 * Domain exceptions for membership operations
 *
 * These exceptions represent business rule violations in the membership domain.
 * They are thrown by the domain layer and converted to HTTP exceptions
 * by the application layer handlers.
 */

/**
 * Thrown when attempting to add a user who is already a member
 */
export class DuplicateMembershipException extends Error {
  constructor(userId: string, organisationId: string) {
    super(
      `User ${userId} is already a member of organisation ${organisationId}`,
    );
    this.name = 'DuplicateMembershipException';
  }
}

/**
 * Thrown when attempting to remove the organisation owner
 */
export class OwnerRemovalException extends Error {
  constructor(organisationId: string) {
    super(
      `Cannot remove the owner from organisation ${organisationId}. Transfer ownership first.`,
    );
    this.name = 'OwnerRemovalException';
  }
}

/**
 * Thrown when a membership is not found
 */
export class MembershipNotFoundException extends Error {
  constructor(membershipId: string) {
    super(`Membership ${membershipId} not found`);
    this.name = 'MembershipNotFoundException';
  }
}

/**
 * Thrown when the user to be added does not exist
 */
export class UserNotFoundException extends Error {
  constructor(userId: string) {
    super(`User ${userId} not found`);
    this.name = 'UserNotFoundException';
  }
}
