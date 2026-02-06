import { BaseEntity } from 'libs/domain/base-entity';
import { v4 as uuidv4 } from 'uuid';

import { AccountLinkedEvent } from '../events/account-linked.event';
import { AccountUnlinkedEvent } from '../events/account-unlinked.event';
import { AuthProviderType } from '../value-objects/auth-provider.value-object';

export interface AccountProps {
  id: string;
  userId: string;
  providerType: AuthProviderType;
  providerAccountId: string;
  providerEmail?: string;
  providerDisplayName?: string;
  providerPhotoUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountParams {
  userId: string;
  providerType: AuthProviderType;
  providerAccountId: string;
  providerEmail?: string;
  providerDisplayName?: string;
  providerPhotoUrl?: string;
}

/**
 * Account Aggregate
 *
 * Represents an authentication provider linked to a User.
 * Supports multiple accounts per user (email/password, Google, Apple).
 */
export class Account extends BaseEntity {
  // Domain-specific fields (base fields inherited from BaseEntity)
  readonly userId: string;
  readonly providerType: AuthProviderType;
  readonly providerAccountId: string;
  private _providerEmail?: string;
  private _providerDisplayName?: string;
  private _providerPhotoUrl?: string;
  private _accessToken?: string;
  private _refreshToken?: string;
  private _tokenExpiresAt?: Date;

  private constructor(props: AccountProps) {
    super({
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
    this.userId = props.userId;
    this.providerType = props.providerType;
    this.providerAccountId = props.providerAccountId;
    this._providerEmail = props.providerEmail;
    this._providerDisplayName = props.providerDisplayName;
    this._providerPhotoUrl = props.providerPhotoUrl;
    this._accessToken = props.accessToken;
    this._refreshToken = props.refreshToken;
    this._tokenExpiresAt = props.tokenExpiresAt;
  }

  /**
   * Factory method to create a new Account
   */
  static create(params: CreateAccountParams): Account {
    const id = uuidv4();
    const now = new Date();
    const account = new Account({
      id,
      userId: params.userId,
      providerType: params.providerType,
      providerAccountId: params.providerAccountId,
      providerEmail: params.providerEmail,
      providerDisplayName: params.providerDisplayName,
      providerPhotoUrl: params.providerPhotoUrl,
      createdAt: now,
      updatedAt: now,
    });

    account.addDomainEvent(
      new AccountLinkedEvent({
        id,
        userId: params.userId,
        providerType: params.providerType,
        providerAccountId: params.providerAccountId,
      }),
    );

    return account;
  }

  /**
   * Reconstitute an Account from persistence
   */
  static fromPersistence(props: AccountProps): Account {
    return new Account(props);
  }

  // Getters for mutable fields
  get providerEmail(): string | undefined {
    return this._providerEmail;
  }

  get providerDisplayName(): string | undefined {
    return this._providerDisplayName;
  }

  get providerPhotoUrl(): string | undefined {
    return this._providerPhotoUrl;
  }

  get accessToken(): string | undefined {
    return this._accessToken;
  }

  get refreshToken(): string | undefined {
    return this._refreshToken;
  }

  get tokenExpiresAt(): Date | undefined {
    return this._tokenExpiresAt;
  }

  // Business methods
  updateTokens(params: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }): void {
    this._accessToken = params.accessToken;
    this._refreshToken = params.refreshToken;
    this._tokenExpiresAt = params.expiresAt;
    this.markUpdated();
  }

  updateProviderInfo(params: {
    displayName?: string;
    photoUrl?: string;
    email?: string;
  }): void {
    if (params.displayName !== undefined) {
      this._providerDisplayName = params.displayName;
    }
    if (params.photoUrl !== undefined) {
      this._providerPhotoUrl = params.photoUrl;
    }
    if (params.email !== undefined) {
      this._providerEmail = params.email;
    }
    this.markUpdated();
  }

  /**
   * Mark account for unlinking - emits event for side effects
   */
  unlink(): void {
    this.addDomainEvent(
      new AccountUnlinkedEvent({
        id: this.id,
        userId: this.userId,
        providerType: this.providerType,
      }),
    );
  }
}
