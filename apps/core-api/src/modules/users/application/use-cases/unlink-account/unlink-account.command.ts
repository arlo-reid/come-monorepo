import { AuthProviderType } from '../../../domain/value-objects/auth-provider.value-object';

export interface UnlinkAccountCommandProps {
  userId: string;
  providerType: AuthProviderType;
}

/**
 * Unlink Account Command
 *
 * Command object representing the intent to unlink an auth provider from a user.
 */
export class UnlinkAccountCommand {
  public readonly userId: string;
  public readonly providerType: AuthProviderType;

  constructor(props: UnlinkAccountCommandProps) {
    this.userId = props.userId;
    this.providerType = props.providerType;
  }
}
