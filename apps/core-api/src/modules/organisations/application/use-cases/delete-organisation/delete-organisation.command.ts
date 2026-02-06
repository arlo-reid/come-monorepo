export interface DeleteOrganisationCommandProps {
  slug: string;
}

/**
 * Delete Organisation Command
 *
 * Command object representing the intent to soft-delete an organisation.
 */
export class DeleteOrganisationCommand {
  public readonly slug: string;

  constructor(props: DeleteOrganisationCommandProps) {
    this.slug = props.slug;
  }
}
