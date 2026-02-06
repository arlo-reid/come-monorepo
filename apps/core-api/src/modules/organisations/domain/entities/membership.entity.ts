import { v4 as uuidv4 } from 'uuid';

import { OrganisationRole } from '../value-objects/organisation-role.value-object';

export interface MembershipProps {
  id: string;
  userId: string;
  organisationId: string;
  role: OrganisationRole;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateMembershipParams {
  userId: string;
  organisationId: string;
  role: OrganisationRole;
}

/**
 * Membership Entity
 *
 * Represents a user's membership in an organisation with a specific role.
 * This is an entity owned by the Organisation aggregate, not a standalone aggregate.
 *
 * Key differences from aggregate:
 * - Does not extend BaseEntity (no direct domain event emission)
 * - Events are emitted by the parent Organisation aggregate
 * - Internal mutation methods prefixed with _ (called by Organisation)
 */
export class Membership {
  // Entity fields
  readonly id: string;
  readonly userId: string;
  readonly organisationId: string;
  readonly createdAt: Date;
  private _role: OrganisationRole;
  private _updatedAt: Date;
  private _deletedAt?: Date;

  private constructor(props: MembershipProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.organisationId = props.organisationId;
    this.createdAt = props.createdAt;
    this._role = props.role;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;
  }

  /**
   * Factory method to create a new Membership
   * Called by Organisation.addMember()
   */
  static create(params: CreateMembershipParams): Membership {
    const id = uuidv4();
    const now = new Date();

    return new Membership({
      id,
      userId: params.userId,
      organisationId: params.organisationId,
      role: params.role,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute a Membership from persistence
   */
  static fromPersistence(props: MembershipProps): Membership {
    return new Membership(props);
  }

  // Getters
  get role(): OrganisationRole {
    return this._role;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  get isDeleted(): boolean {
    return this._deletedAt !== undefined;
  }

  /**
   * Check if this membership has admin privileges
   */
  get isAdmin(): boolean {
    return this._role === OrganisationRole.ORG_ADMIN;
  }

  // Internal mutation methods (called by Organisation aggregate)

  /**
   * Change the role of this membership
   * Returns the previous role for event emission by parent aggregate
   */
  _changeRole(newRole: OrganisationRole): OrganisationRole {
    const previousRole = this._role;

    if (previousRole === newRole) {
      return previousRole; // No change
    }

    this._role = newRole;
    this._updatedAt = new Date();

    return previousRole;
  }

  /**
   * Mark this membership as deleted (soft delete)
   */
  _markDeleted(): void {
    if (this.isDeleted) {
      return; // Already deleted
    }

    const now = new Date();
    this._deletedAt = now;
    this._updatedAt = now;
  }
}
