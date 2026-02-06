export interface MemberRemovedEventPayload {
  membershipId: string;
  organisationId: string;
  userId: string;
  deletedAt: Date;
}

/**
 * Domain event emitted when a member is removed from an organisation.
 * Replaces MembershipDeletedEvent from the old memberships module.
 */
export class MemberRemovedEvent {
  constructor(public readonly payload: MemberRemovedEventPayload) {}
}
