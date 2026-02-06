import { AuthProviderType } from '../../../domain/value-objects/auth-provider.value-object';

export interface LinkAccountCommandProps {
  userId: string;
  providerType: AuthProviderType;
  providerAccountId: string;
  providerEmail?: string;
  providerDisplayName?: string;
  providerPhotoUrl?: string;
}

/**
 * Link Account Command
 *
 * Command object representing the intent to link a new auth provider to a user.
 */
export class LinkAccountCommand {
  public readonly userId: string;
  public readonly providerType: AuthProviderType;
  public readonly providerAccountId: string;
  public readonly providerEmail?: string;
  public readonly providerDisplayName?: string;
  public readonly providerPhotoUrl?: string;

  constructor(props: LinkAccountCommandProps) {
    this.userId = props.userId;
    this.providerType = props.providerType;
    this.providerAccountId = props.providerAccountId;
    this.providerEmail = props.providerEmail;
    this.providerDisplayName = props.providerDisplayName;
    this.providerPhotoUrl = props.providerPhotoUrl;
  }
}
