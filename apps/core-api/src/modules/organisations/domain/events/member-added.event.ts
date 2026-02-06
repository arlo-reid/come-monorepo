import { OrganisationRole } from '../value-objects/organisation-role.value-object';

export interface MemberAddedEventPayload {
  membershipId: string;
  organisationId: string;
  userId: string;
  role: OrganisationRole;
}

/**
 * Domain event emitted when a member is added to an organisation.
 * Replaces MembershipCreatedEvent from the old memberships module.
 */
export class MemberAddedEvent {
  constructor(public readonly payload: MemberAddedEventPayload) {}
}
