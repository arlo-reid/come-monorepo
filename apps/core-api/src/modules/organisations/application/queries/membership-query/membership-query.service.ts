import type { PagedResult } from 'libs/application/repository-port.base';
import { DbService, ENHANCED_DB } from 'libs/db/db.providers';
import { Inject, Injectable } from '@nestjs/common';

import { OrganisationRole } from '../../../domain/value-objects/organisation-role.value-object';

/**
 * Read model for membership queries
 * Used for cross-organisation queries that don't need full aggregate loading
 */
export interface MembershipReadModel {
  id: string;
  userId: string;
  organisationId: string;
  role: OrganisationRole;
  createdAt: Date;
  updatedAt: Date;
  organisation?: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Membership Query Service
 *
 * Provides read-only access to membership data for cross-organisation queries.
 * Follows CQRS pattern - queries bypass aggregates and go directly to the database.
 *
 * Used by:
 * - GetUserMembershipsHandler (list user's memberships across all orgs)
 * - GetOrganisationMembershipsHandler (list org's memberships)
 * - GetMembershipHandler (get single membership)
 */
@Injectable()
export class MembershipQueryService {
  constructor(@Inject(ENHANCED_DB) private readonly db: DbService) {}

  /**
   * Find all memberships for a user (across all organisations)
   */
  async findUserMemberships(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<PagedResult<MembershipReadModel>> {
    const [items, total] = await Promise.all([
      this.db.membership.findMany({
        where: { userId, deletedAt: null },
        include: {
          organisation: {
            select: { id: true, name: true, slug: true },
          },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.membership.count({ where: { userId, deletedAt: null } }),
    ]);

    return {
      items: items.map((item) => this.toReadModel(item)),
      total,
    };
  }

  /**
   * Find all memberships for an organisation by ID
   */
  async findOrganisationMemberships(
    organisationId: string,
    limit: number,
    offset: number,
  ): Promise<PagedResult<MembershipReadModel>> {
    const [items, total] = await Promise.all([
      this.db.membership.findMany({
        where: { organisationId, deletedAt: null },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.membership.count({
        where: { organisationId, deletedAt: null },
      }),
    ]);

    return {
      items: items.map((item) => this.toReadModel(item)),
      total,
    };
  }

  /**
   * Find all memberships for an organisation by slug
   */
  async findOrganisationMembershipsBySlug(
    slug: string,
    limit: number,
    offset: number,
  ): Promise<PagedResult<MembershipReadModel>> {
    const [items, total] = await Promise.all([
      this.db.membership.findMany({
        where: { organisation: { slug } },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.membership.count({
        where: { organisation: { slug } },
      }),
    ]);

    return {
      items: items.map((item) => this.toReadModel(item)),
      total,
    };
  }

  /**
   * Find a membership by ID
   */
  async findMembershipById(id: string): Promise<MembershipReadModel | null> {
    const item = await this.db.membership.findUnique({
      where: { id },
      include: {
        organisation: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!item || item.deletedAt) {
      return null;
    }

    return this.toReadModel(item);
  }

  /**
   * Find a membership by user and organisation
   */
  async findByUserAndOrganisation(
    userId: string,
    organisationId: string,
  ): Promise<MembershipReadModel | null> {
    const item = await this.db.membership.findFirst({
      where: { userId, organisationId, deletedAt: null },
    });

    if (!item) {
      return null;
    }

    return this.toReadModel(item);
  }

  /**
   * Check if a membership exists
   */
  async existsByUserAndOrganisation(
    userId: string,
    organisationId: string,
  ): Promise<boolean> {
    const count = await this.db.membership.count({
      where: { userId, organisationId, deletedAt: null },
    });
    return count > 0;
  }

  /**
   * Map database row to read model
   */
  private toReadModel(row: {
    id: string;
    userId: string;
    organisationId: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    organisation?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }): MembershipReadModel {
    return {
      id: row.id,
      userId: row.userId,
      organisationId: row.organisationId,
      role: row.role as OrganisationRole,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ...(row.organisation && { organisation: row.organisation }),
    };
  }
}
