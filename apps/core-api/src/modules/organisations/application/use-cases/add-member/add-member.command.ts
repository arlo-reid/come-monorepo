import { OrganisationRole } from '../../../domain/value-objects/organisation-role.value-object';

export interface AddMemberCommandProps {
  organisationSlug: string;
  userId: string;
  role: OrganisationRole;
}

/**
 * Command to add a member to an organisation
 */
export class AddMemberCommand {
  public readonly organisationSlug: string;
  public readonly userId: string;
  public readonly role: OrganisationRole;

  constructor(props: AddMemberCommandProps) {
    this.organisationSlug = props.organisationSlug;
    this.userId = props.userId;
    this.role = props.role;
  }
}
