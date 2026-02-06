import { Inject, Injectable, Optional } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DbService, ENHANCED_DB } from 'libs/db/db.providers';
import { ZenStackRepositoryBase } from 'libs/db/repository-base';

import { UserRepositoryPort } from '../../../application/ports/user-repository.port';
import { User } from '../../../domain/aggregates/user.aggregate';
import { Role } from '../../../domain/value-objects/role.value-object';

/** Typed delegate for User model operations */
type UserDelegate = DbService['user'];

/**
 * ZenStack User Repository
 *
 * Infrastructure adapter implementing the UserRepositoryPort.
 * Uses ZenStack v3 ORM for database operations with domain event support.
 */
@Injectable()
export class UserWriteRepository
  extends ZenStackRepositoryBase<DbService, User, string, UserDelegate>
  implements UserRepositoryPort
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

  protected getDelegate(client: DbService): UserDelegate {
    return client.user;
  }

  protected toDomain(row: {
    id: string;
    email: string;
    emailVerified: boolean;
    primaryAccountId: string | null;
    roles: string[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): User {
    return User.fromPersistence({
      id: row.id,
      email: row.email,
      emailVerified: row.emailVerified,
      primaryAccountId: row.primaryAccountId ?? undefined,
      roles: (row.roles ?? []) as Role[],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
    });
  }

  protected toPersistence(entity: User): {
    id?: string;
    email: string;
    emailVerified: boolean;
    primaryAccountId: string | null;
    roles: string[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  } {
    return {
      // Omit id if empty to let DB generate UUID on create
      ...(entity.id ? { id: entity.id } : {}),
      email: entity.email,
      emailVerified: entity.emailVerified,
      primaryAccountId: entity.primaryAccountId ?? null,
      roles: entity.roles,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findUnique({ where: { email: email.toLowerCase() } });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.count({ where: { email: email.toLowerCase() } });
    return count > 0;
  }
}
