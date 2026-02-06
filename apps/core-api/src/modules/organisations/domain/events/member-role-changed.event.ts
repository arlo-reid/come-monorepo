import { OrganisationRole } from '../value-objects/organisation-role.value-object';

export interface MemberRoleChangedEventPayload {
  membershipId: string;
  organisationId: string;
  userId: string;
  previousRole: OrganisationRole;
  newRole: OrganisationRole;
}

/**
 * Domain event emitted when a member's role is changed.
 * Replaces MembershipRoleChangedEvent from the old memberships module.
 */
export class MemberRoleChangedEvent {
  constructor(public readonly payload: MemberRoleChangedEventPayload) {}
}
