import { BaseEntity } from 'libs/domain/base-entity';
import { v4 as uuidv4 } from 'uuid';

import { ProfileUpdatedEvent } from '../events/profile-updated.event';

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

export interface ProfileProps {
  id: string;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone: string;
  locale: string;
  notificationPreferences: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileParams {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
}

/**
 * Profile Aggregate
 *
 * Represents user display preferences and settings.
 * One Profile per User.
 */
export class Profile extends BaseEntity {
  // Domain-specific fields
  readonly userId: string;
  private _displayName?: string;
  private _avatarUrl?: string;
  private _bio?: string;
  private _timezone: string;
  private _locale: string;
  private _notificationPreferences: NotificationPreferences;

  private constructor(props: ProfileProps) {
    super({
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
    this.userId = props.userId;
    this._displayName = props.displayName;
    this._avatarUrl = props.avatarUrl;
    this._bio = props.bio;
    this._timezone = props.timezone;
    this._locale = props.locale;
    this._notificationPreferences = props.notificationPreferences;
  }

  /**
   * Factory method to create a new Profile with defaults
   */
  static create(params: CreateProfileParams): Profile {
    const id = uuidv4();
    const now = new Date();
    return new Profile({
      id,
      userId: params.userId,
      displayName: params.displayName,
      avatarUrl: params.avatarUrl,
      timezone: 'UTC',
      locale: 'en',
      notificationPreferences: {
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute a Profile from persistence
   */
  static fromPersistence(props: ProfileProps): Profile {
    return new Profile(props);
  }

  // Getters
  get displayName(): string | undefined {
    return this._displayName;
  }

  get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  get bio(): string | undefined {
    return this._bio;
  }

  get timezone(): string {
    return this._timezone;
  }

  get locale(): string {
    return this._locale;
  }

  get notificationPreferences(): NotificationPreferences {
    return { ...this._notificationPreferences };
  }

  // Business methods
  updateDisplayInfo(params: {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  }): void {
    if (params.displayName !== undefined) {
      this._displayName = params.displayName;
    }
    if (params.avatarUrl !== undefined) {
      this._avatarUrl = params.avatarUrl;
    }
    if (params.bio !== undefined) {
      this._bio = params.bio;
    }
    this.markUpdated();

    this.addDomainEvent(
      new ProfileUpdatedEvent({
        userId: this.userId,
      }),
    );
  }

  updatePreferences(params: { timezone?: string; locale?: string }): void {
    if (params.timezone !== undefined) {
      this._timezone = params.timezone;
    }
    if (params.locale !== undefined) {
      this._locale = params.locale;
    }
    this.markUpdated();
  }

  updateNotificationPreferences(prefs: Partial<NotificationPreferences>): void {
    this._notificationPreferences = {
      ...this._notificationPreferences,
      ...prefs,
    };
    this.markUpdated();
  }
}
