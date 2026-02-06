export interface RegisterUserCommandProps {
  email: string;
  password: string;
  displayName?: string;
}

/**
 * Register User Command
 *
 * Command object representing the intent to register a new user.
 */
export class RegisterUserCommand {
  public readonly email: string;
  public readonly password: string;
  public readonly displayName?: string;

  constructor(props: RegisterUserCommandProps) {
    this.email = props.email;
    this.password = props.password;
    this.displayName = props.displayName;
  }
}
