export interface DeleteUserCommandProps {
  userId: string;
}

/**
 * Delete User Command
 *
 * Command object representing the intent to delete a user account.
 */
export class DeleteUserCommand {
  public readonly userId: string;

  constructor(props: DeleteUserCommandProps) {
    this.userId = props.userId;
  }
}
