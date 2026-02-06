import { DbService, ENHANCED_DB } from 'libs/db/db.providers';
import { ZenStackRepositoryBase } from 'libs/db/repository-base';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { OrganisationRepositoryPort } from '../../../application/ports/organisation-repository.port';
import { Organisation } from '../../../domain/aggregates/organisation.aggregate';
import { Membership } from '../../../domain/entities/membership.entity';
import { parseOrganisationRole } from '../../../domain/value-objects/organisation-role.value-object';

/** Database row type for membership */
interface MembershipRow {
  id: string;
  userId: string;
  organisationId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** Database row type for organisation with memberships */
interface OrganisationWithMembershipsRow {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  memberships: MembershipRow[];
}

/** Typed delegate for Organisation model operations */
type OrganisationDelegate = DbService['organisation'];

/**
 * ZenStack Organisation Repository
 *
 * Infrastructure adapter implementing the OrganisationRepositoryPort.
 * Uses ZenStack v3 ORM for database operations with domain event support.
 * Handles nested membership entities.
 */
@Injectable()
export class OrganisationWriteRepository
  extends ZenStackRepositoryBase<
    DbService,
    Organisation,
    string,
    OrganisationDelegate
  >
  implements OrganisationRepositoryPort
{
  constructor(
    @Inject(ENHANCED_DB) db: DbService,
    @Optional() eventBus?: EventBus,
  ) {
    super(db, eventBus);
  }

  protected override get supportsSoftDelete(): boolean {
    return true;
  }

  protected getDelegate(client: DbService): OrganisationDelegate {
    return client.organisation;
  }

  /**
   * Map membership DB row to domain entity
   */
  private membershipToDomain(row: MembershipRow): Membership {
    return Membership.fromPersistence({
      id: row.id,
      userId: row.userId,
      organisationId: row.organisationId,
      role: parseOrganisationRole(row.role),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
    });
  }

  /**
   * Map membership domain entity to persistence format
   */
  private membershipToPersistence(membership: Membership): {
    id: string;
    userId: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  } {
    return {
      id: membership.id,
      userId: membership.userId,
      role: membership.role,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
      deletedAt: membership.deletedAt ?? null,
    };
  }

  protected toDomain(row: unknown): Organisation {
    const orgRow = row as OrganisationWithMembershipsRow;
    const memberships = (orgRow.memberships ?? []).map((m) =>
      this.membershipToDomain(m),
    );

    return Organisation.fromPersistence({
      id: orgRow.id,
      name: orgRow.name,
      slug: orgRow.slug,
      ownerId: orgRow.ownerId,
      memberships,
      createdAt: new Date(orgRow.createdAt),
      updatedAt: new Date(orgRow.updatedAt),
      deletedAt: orgRow.deletedAt ? new Date(orgRow.deletedAt) : undefined,
    });
  }

  protected toPersistence(entity: Organisation): {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  } {
    // Note: Memberships are handled separately in save/create methods
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      ownerId: entity.ownerId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  /**
   * Override findById to include memberships
   */
  override async findById(id: string): Promise<Organisation | null> {
    const baseArgs = { where: { id } };
    const row = await this.delegate.findUnique({
      ...baseArgs,
      include: { memberships: true },
    });
    return row ? this.toDomain(row) : null;
  }

  /**
   * Override findUnique to include memberships
   */
  override async findUnique(args: {
    where: { id?: string; slug?: string };
  }): Promise<Organisation | null> {
    const row = await this.delegate.findUnique({
      ...args,
      include: { memberships: true },
    } as any);
    return row ? this.toDomain(row) : null;
  }

  /**
   * Override findMany to include memberships
   */
  override async findMany(args?: { where?: unknown }): Promise<Organisation[]> {
    const rows = await this.delegate.findMany({
      ...args,
      include: { memberships: true },
    } as any);
    return rows.map((r: unknown) => this.toDomain(r));
  }

  async findBySlug(slug: string): Promise<Organisation | null> {
    return this.findUnique({ where: { slug } });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.count({ where: { slug } });
    return count > 0;
  }

  async findAll(): Promise<Organisation[]> {
    return this.findMany();
  }

  async removeMembers(organistion: Organisation): Promise<void> {
    const { deleted } = organistion.pullMembershipChanges();

    if (deleted.length === 0) {
      return;
    }

    await Promise.all(
      deleted.map(async (m) => {
        await this.client.membership.delete({
          where: { id: m.id },
        });
      }),
    );
    await this.publishAndAfter(organistion);
  }

  /**
   * Override save to handle nested membership persistence
   *
   * Uses pullMembershipChanges() for efficient persistence:
   * - Only creates memberships that were added
   * - Only updates memberships that were modified
   * - Collects child entity events to ensure they are published
   */
  override async save(entity: Organisation): Promise<Organisation> {
    const data = this.toPersistence(entity);

    const existing = await this.findUnique({
      where: { id: entity.id },
    });

    if (!existing) {
      return this.create(entity);
    }

    // Pull membership changes for efficient persistence
    // Note: Domain events for memberships are emitted by Organisation aggregate methods
    const {
      created: membershipsCreated,
      updated: membershipsUpdated,
      deleted: membershipsDeleted,
    } = entity.pullMembershipChanges();

    // Build membership operations
    const membershipOperations: {
      create?: Array<{
        id: string;
        userId: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
      }>;
      update?: Array<{
        where: { id: string };
        data: {
          role: string;
          updatedAt: Date;
          deletedAt: Date | null;
        };
      }>;
      delete?: Array<{ id: string }>;
    } = {};

    if (membershipsCreated.length > 0) {
      membershipOperations.create = membershipsCreated.map((m) =>
        this.membershipToPersistence(m),
      );
    }

    if (membershipsUpdated.length > 0) {
      membershipOperations.update = membershipsUpdated.map((m) => ({
        where: { id: m.id },
        data: {
          role: m.role,
          updatedAt: m.updatedAt,
          deletedAt: m.deletedAt ?? null,
        },
      }));
    }

    if (membershipsDeleted.length > 0) {
      membershipOperations.delete = membershipsDeleted.map((m) => ({
        id: m.id,
      }));
    }

    const row = await this.client.organisation.update({
      where: { id: entity.id },
      data: {
        ...data,
        memberships: membershipOperations,
      },
      include: { memberships: true },
    });

    const saved = this.toDomain(row);
    await this.publishAndAfter(entity);
    return saved;
  }

  /**
   * Override create for new organisations with memberships
   */
  override async create(entity: Organisation): Promise<Organisation> {
    const data = this.toPersistence(entity);
    const membershipData = entity.allMemberships.map((m) =>
      this.membershipToPersistence(m),
    );

    const row = await this.delegate.create({
      data: {
        ...data,
        memberships: {
          create: membershipData,
        },
      },
      include: { memberships: true },
    });

    const created = this.toDomain(row);
    await this.publishAndAfter(entity);
    return created;
  }
}
