export interface GetOrganisationsPagedQueryProps {
  limit: number;
  offset: number;
}

/**
 * Get Organisations Paged Query
 */
export class GetOrganisationsPagedQuery {
  public readonly limit: number;
  public readonly offset: number;

  constructor(props: GetOrganisationsPagedQueryProps) {
    this.limit = props.limit;
    this.offset = props.offset;
  }
}
