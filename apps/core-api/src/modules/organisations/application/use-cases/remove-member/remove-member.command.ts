export interface RemoveMemberCommandProps {
  organisationSlug: string;
  membershipId: string;
}

/**
 * Command to remove a member from an organisation
 */
export class RemoveMemberCommand {
  public readonly organisationSlug: string;
  public readonly membershipId: string;

  constructor(props: RemoveMemberCommandProps) {
    this.organisationSlug = props.organisationSlug;
    this.membershipId = props.membershipId;
  }
}
