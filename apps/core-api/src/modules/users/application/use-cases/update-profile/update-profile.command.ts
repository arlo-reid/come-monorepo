export interface UpdateProfileCommandProps {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  locale?: string;
  notificationPreferences?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    marketingEmails?: boolean;
  };
}

/**
 * Update Profile Command
 *
 * Command object representing the intent to update a user's profile.
 */
export class UpdateProfileCommand {
  public readonly userId: string;
  public readonly displayName?: string;
  public readonly avatarUrl?: string;
  public readonly bio?: string;
  public readonly timezone?: string;
  public readonly locale?: string;
  public readonly notificationPreferences?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    marketingEmails?: boolean;
  };

  constructor(props: UpdateProfileCommandProps) {
    this.userId = props.userId;
    this.displayName = props.displayName;
    this.avatarUrl = props.avatarUrl;
    this.bio = props.bio;
    this.timezone = props.timezone;
    this.locale = props.locale;
    this.notificationPreferences = props.notificationPreferences;
  }
}
