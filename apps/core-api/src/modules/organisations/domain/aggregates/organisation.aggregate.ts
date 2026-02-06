import { BaseEntity } from 'libs/domain/base-entity';
import { v4 as uuidv4 } from 'uuid';

import { Membership } from '../entities/membership.entity';
import { MemberAddedEvent } from '../events/member-added.event';
import { MemberRemovedEvent } from '../events/member-removed.event';
import { MemberRoleChangedEvent } from '../events/member-role-changed.event';
import { OrganisationCreatedEvent } from '../events/organisation-created.event';
import { OrganisationDeletedEvent } from '../events/organisation-deleted.event';
import {
  DuplicateMembershipException,
  MembershipNotFoundException,
  OwnerRemovalException,
} from '../exceptions/membership.exceptions';
import { OrganisationRole } from '../value-objects/organisation-role.value-object';

export interface OrganisationProps {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  memberships: Membership[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Result of pulling membership changes for persistence
 */
export interface MembershipChanges {
  created: Membership[];
  updated: Membership[];
  deleted: Membership[];
}

/**
 * Organisation Aggregate
 *
 * Core domain aggregate representing an organisation in the system.
 * Owns and manages memberships as child entities.
 * Tracks membership changes (created/updated) for efficient persistence.
 * Extends BaseEntity for domain events support.
 */
export class Organisation extends BaseEntity {
  // Domain-specific fields
  private _name: string;
  private _slug: string;
  readonly ownerId: string;
  private _memberships: Membership[];

  /** Tracks newly created memberships since load/creation */
  private createdMembershipIds: Set<string> = new Set();

  /** Tracks updated memberships since load/creation */
  private updatedMembershipIds: Set<string> = new Set();

  /** Tracks deleted memberships since load/creation (for hard delete) */
  private deletedMemberships: Membership[] = [];

  private constructor(props: OrganisationProps) {
    super({
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
    });
    this._name = props.name;
    this._slug = props.slug;
    this.ownerId = props.ownerId;
    this._memberships = props.memberships;
  }

  /**
   * Factory method to create a new Organisation
   * Automatically creates owner membership with ORG_ADMIN role
   */
  static create(params: {
    name: string;
    slug: string;
    ownerId: string;
  }): Organisation {
    const id = uuidv4();
    const now = new Date();

    // Create owner membership immediately
    const ownerMembership = Membership.create({
      userId: params.ownerId,
      organisationId: id,
      role: OrganisationRole.ORG_ADMIN,
    });

    const organisation = new Organisation({
      id,
      name: params.name,
      slug: params.slug,
      ownerId: params.ownerId,
      memberships: [ownerMembership],
      createdAt: now,
      updatedAt: now,
    });

    // Track the owner membership as created
    organisation.createdMembershipIds.add(ownerMembership.id);

    // Emit organisation created event
    organisation.addDomainEvent(
      new OrganisationCreatedEvent({
        id,
        name: params.name,
        slug: params.slug,
        ownerId: params.ownerId,
      }),
    );

    // Emit member added event for owner
    organisation.addDomainEvent(
      new MemberAddedEvent({
        membershipId: ownerMembership.id,
        organisationId: id,
        userId: params.ownerId,
        role: OrganisationRole.ORG_ADMIN,
      }),
    );

    return organisation;
  }

  /**
   * Reconstitute an Organisation from persistence
   */
  static fromPersistence(props: OrganisationProps): Organisation {
    return new Organisation(props);
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get slug(): string {
    return this._slug;
  }

  /**
   * Get all active (non-deleted) memberships
   */
  get memberships(): ReadonlyArray<Membership> {
    return this._memberships;
  }

  /**
   * Get all memberships including deleted ones (for persistence)
   */
  get allMemberships(): ReadonlyArray<Membership> {
    return this._memberships;
  }

  // Membership query helpers

  /**
   * Find a membership by its ID
   */
  getMembershipById(membershipId: string): Membership | undefined {
    return this.memberships.find((m) => m.id === membershipId);
  }

  /**
   * Find a membership by user ID
   */
  getMembershipByUserId(userId: string): Membership | undefined {
    return this.memberships.find((m) => m.userId === userId);
  }

  /**
   * Check if a user is a member of this organisation
   */
  hasMember(userId: string): boolean {
    return this.getMembershipByUserId(userId) !== undefined;
  }

  /**
   * Check if a user has admin privileges in this organisation
   */
  isAdmin(userId: string): boolean {
    const membership = this.getMembershipByUserId(userId);
    return membership?.isAdmin ?? false;
  }

  /**
   * Check if a user is the owner of this organisation
   */
  isOwner(userId: string): boolean {
    return this.ownerId === userId;
  }

  // Business methods

  /**
   * Rename the organisation
   */
  rename(newName: string, newSlug: string): void {
    this._name = newName;
    this._slug = newSlug;
    this.markUpdated();
  }

  /**
   * Soft delete the organisation
   */
  delete(): void {
    if (this.isDeleted) {
      return; // Already deleted, no-op
    }

    this.markDeleted();

    this.addDomainEvent(
      new OrganisationDeletedEvent({
        id: this.id,
        slug: this._slug,
        deletedAt: this.deletedAt!,
      }),
    );
  }

  // Membership management methods

  /**
   * Add a member to the organisation
   *
   * @throws DuplicateMembershipException if user is already a member
   */
  addMember(userId: string, role: OrganisationRole): Membership {
    // Invariant: No duplicate memberships
    if (this.hasMember(userId)) {
      throw new DuplicateMembershipException(userId, this.id);
    }

    const membership = Membership.create({
      userId,
      organisationId: this.id,
      role,
    });
    this._memberships.push(membership);
    this.markUpdated();

    // Track as created for persistence
    this.createdMembershipIds.add(membership.id);

    this.addDomainEvent(
      new MemberAddedEvent({
        membershipId: membership.id,
        organisationId: this.id,
        userId,
        role,
      }),
    );

    return membership;
  }

  /**
   * Remove a member from the organisation (hard delete)
   *
   * @throws MembershipNotFoundException if membership not found
   * @throws OwnerRemovalException if trying to remove the organisation owner
   */
  removeMember(membershipId: string): void {
    const membership = this.getMembershipById(membershipId);

    if (!membership) {
      throw new MembershipNotFoundException(membershipId);
    }

    // Invariant: Cannot remove organisation owner
    if (membership.userId === this.ownerId) {
      throw new OwnerRemovalException(this.id);
    }

    membership._markDeleted();

    // Remove from the memberships array
    const membershipIndex = this._memberships.findIndex(
      (m) => m.id === membershipId,
    );
    this._memberships.splice(membershipIndex, 1);
    this.markUpdated();

    // Track for hard delete persistence
    this.deletedMemberships.push(membership);

    this.addDomainEvent(
      new MemberRemovedEvent({
        membershipId: membership.id,
        organisationId: this.id,
        userId: membership.userId,
        deletedAt: new Date(),
      }),
    );
  }

  /**
   * Update a member's role
   *
   * @throws MembershipNotFoundException if membership not found
   * @returns The updated membership
   */
  updateMemberRole(
    membershipId: string,
    newRole: OrganisationRole,
  ): Membership {
    const membership = this.getMembershipById(membershipId);

    if (!membership) {
      throw new MembershipNotFoundException(membershipId);
    }

    const previousRole = membership._changeRole(newRole);

    // Only emit event and track if role actually changed
    if (previousRole !== newRole) {
      this.markUpdated();

      // Track as updated for persistence
      this.updatedMembershipIds.add(membership.id);

      this.addDomainEvent(
        new MemberRoleChangedEvent({
          membershipId: membership.id,
          organisationId: this.id,
          userId: membership.userId,
          previousRole,
          newRole,
        }),
      );
    }

    return membership;
  }

  // Persistence helpers

  /**
   * Pull membership changes for persistence and clear tracking.
   * Returns created, updated, and deleted memberships since last pull or load.
   * Calling this method clears the tracking sets.
   */
  pullMembershipChanges(): MembershipChanges {
    const created = this._memberships.filter((m) =>
      this.createdMembershipIds.has(m.id),
    );
    const updated = this._memberships.filter((m) =>
      this.updatedMembershipIds.has(m.id),
    );
    const deleted = [...this.deletedMemberships];

    // Clear tracking after pull
    this.createdMembershipIds.clear();
    this.updatedMembershipIds.clear();
    this.deletedMemberships = [];

    return { created, updated, deleted };
  }
}
