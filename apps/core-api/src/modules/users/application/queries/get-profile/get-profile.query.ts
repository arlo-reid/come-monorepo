export interface GetProfileQueryProps {
  userId: string;
}

/**
 * Get Profile Query
 */
export class GetProfileQuery {
  public readonly userId: string;

  constructor(props: GetProfileQueryProps) {
    this.userId = props.userId;
  }
}
