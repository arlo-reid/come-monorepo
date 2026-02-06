import { BaseEntity } from 'libs/domain/base-entity';
import { v4 as uuidv4 } from 'uuid';

import { UserCreatedEvent } from '../events/user-created.event';
import { UserDeletedEvent } from '../events/user-deleted.event';
import { Role } from '../value-objects/role.value-object';

export interface UserProps {
  id: string;
  email: string;
  emailVerified: boolean;
  primaryAccountId?: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateUserParams {
  email: string;
  emailVerified?: boolean;
  roles?: Role[];
}

/**
 * User Aggregate
 *
 * Core domain aggregate representing a user in the system.
 * Links to Account aggregates for authentication and Profile for preferences.
 */
export class User extends BaseEntity {
  // Domain-specific fields
  private _email: string;
  private _emailVerified: boolean;
  private _primaryAccountId?: string;
  private _roles: Role[];

  private constructor(props: UserProps) {
    super({
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
    });
    this._email = props.email;
    this._emailVerified = props.emailVerified;
    this._primaryAccountId = props.primaryAccountId;
    this._roles = props.roles;
  }

  /**
   * Factory method to create a new User
   */
  static create(params: CreateUserParams): User {
    const id = uuidv4();
    const now = new Date();
    const user = new User({
      id,
      email: params.email.toLowerCase(),
      emailVerified: params.emailVerified ?? false,
      roles: params.roles ?? [],
      createdAt: now,
      updatedAt: now,
    });

    user.addDomainEvent(
      new UserCreatedEvent({
        id,
        email: params.email.toLowerCase(),
      }),
    );

    return user;
  }

  /**
   * Reconstitute a User from persistence
   */
  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  // Getters
  get email(): string {
    return this._email;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get primaryAccountId(): string | undefined {
    return this._primaryAccountId;
  }

  get roles(): Role[] {
    return this._roles;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: Role): boolean {
    return this._roles.includes(role);
  }

  /**
   * Check if user is a system admin
   */
  get isSystemAdmin(): boolean {
    return this._roles.includes(Role.SYSTEM_ADMIN);
  }

  /**
   * Add a role to the user
   */
  addRole(role: Role): void {
    if (!this._roles.includes(role)) {
      this._roles.push(role);
      this.markUpdated();
    }
  }

  /**
   * Remove a role from the user
   */
  removeRole(role: Role): void {
    const index = this._roles.indexOf(role);
    if (index > -1) {
      this._roles.splice(index, 1);
      this.markUpdated();
    }
  }

  // Business methods
  verifyEmail(): void {
    this._emailVerified = true;
    this.markUpdated();
  }

  setPrimaryAccount(accountId: string): void {
    this._primaryAccountId = accountId;
    this.markUpdated();
  }

  updateEmail(newEmail: string): void {
    this._email = newEmail.toLowerCase();
    this._emailVerified = false;
    this.markUpdated();
  }

  delete(): void {
    if (this.isDeleted) {
      return; // Already deleted, no-op
    }

    this.markDeleted();

    this.addDomainEvent(
      new UserDeletedEvent({
        id: this.id,
        deletedAt: this.deletedAt!,
      }),
    );
  }
}
