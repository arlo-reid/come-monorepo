import { Role } from '../../../domain/value-objects/role.value-object';

export interface UpdateRolesCommandProps {
  /** ID of the user whose roles should be updated */
  userId: string;
  /** New set of roles (replaces existing roles) */
  roles: Role[];
}

/**
 * Update Roles Command
 *
 * Command to update the roles of a user.
 * Requires SYSTEM_ADMIN permission to execute.
 */
export class UpdateRolesCommand {
  public readonly userId: string;
  public readonly roles: Role[];

  constructor(props: UpdateRolesCommandProps) {
    this.userId = props.userId;
    this.roles = props.roles;
  }
}
