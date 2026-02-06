export interface LoginCommandProps {
  email: string;
  password: string;
}

/**
 * Login Command
 *
 * Command object representing the intent to authenticate a user
 * with email and password credentials.
 */
export class LoginCommand {
  public readonly email: string;
  public readonly password: string;

  constructor(props: LoginCommandProps) {
    this.email = props.email;
    this.password = props.password;
  }
}
