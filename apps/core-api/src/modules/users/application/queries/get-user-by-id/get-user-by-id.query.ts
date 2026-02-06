export interface GetUserByIdQueryProps {
  userId: string;
}

/**
 * Get User By ID Query
 */
export class GetUserByIdQuery {
  public readonly userId: string;

  constructor(props: GetUserByIdQueryProps) {
    this.userId = props.userId;
  }
}
