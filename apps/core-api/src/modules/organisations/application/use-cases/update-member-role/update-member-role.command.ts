import { OrganisationRole } from '../../../domain/value-objects/organisation-role.value-object';

export interface UpdateMemberRoleCommandProps {
  organisationSlug: string;
  membershipId: string;
  newRole: OrganisationRole;
}

/**
 * Command to update a member's role in an organisation
 */
export class UpdateMemberRoleCommand {
  public readonly organisationSlug: string;
  public readonly membershipId: string;
  public readonly newRole: OrganisationRole;

  constructor(props: UpdateMemberRoleCommandProps) {
    this.organisationSlug = props.organisationSlug;
    this.membershipId = props.membershipId;
    this.newRole = props.newRole;
  }
}
