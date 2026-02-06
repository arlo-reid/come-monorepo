export interface GetOrganisationBySlugQueryProps {
  slug: string;
}

/**
 * Get Organisation By Slug Query
 */
export class GetOrganisationBySlugQuery {
  public readonly slug: string;

  constructor(props: GetOrganisationBySlugQueryProps) {
    this.slug = props.slug;
  }
}
