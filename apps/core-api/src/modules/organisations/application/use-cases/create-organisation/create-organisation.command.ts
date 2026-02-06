export interface CreateOrganisationCommandProps {
  name: string;
  slug?: string;
  ownerId: string;
}

/**
 * Create Organisation Command
 *
 * Command object representing the intent to create a new organisation.
 */
export class CreateOrganisationCommand {
  public readonly name: string;
  public readonly slug?: string;
  public readonly ownerId: string;

  constructor(props: CreateOrganisationCommandProps) {
    this.name = props.name;
    this.slug = props.slug;
    this.ownerId = props.ownerId;
  }
}
