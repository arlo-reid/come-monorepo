import { DbService, ENHANCED_DB } from 'libs/db/db.providers';
import { ZenStackRepositoryBase } from 'libs/db/repository-base';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { ProfileRepositoryPort } from '../../../application/ports/profile-repository.port';
import { Profile } from '../../../domain/aggregates/profile.aggregate';

/** Typed delegate for Profile model operations */
type ProfileDelegate = DbService['profile'];

/**
 * ZenStack Profile Repository
 *
 * Infrastructure adapter implementing the ProfileRepositoryPort.
 * Uses ZenStack v3 ORM for database operations with domain event support.
 */
@Injectable()
export class ProfileWriteRepository
  extends ZenStackRepositoryBase<DbService, Profile, string, ProfileDelegate>
  implements ProfileRepositoryPort
{
  constructor(
    @Inject(ENHANCED_DB) db: DbService,
    @Optional() eventBus?: EventBus,
  ) {
    super(db, eventBus);
  }

  protected getDelegate(client: DbService): ProfileDelegate {
    return client.profile;
  }

  protected toDomain(row: {
    id: string;
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    timezone: string;
    locale: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Profile {
    return Profile.fromPersistence({
      id: row.id,
      userId: row.userId,
      displayName: row.displayName ?? undefined,
      avatarUrl: row.avatarUrl ?? undefined,
      bio: row.bio ?? undefined,
      timezone: row.timezone,
      locale: row.locale,
      notificationPreferences: {
        emailNotifications: row.emailNotifications,
        pushNotifications: row.pushNotifications,
        marketingEmails: row.marketingEmails,
      },
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  protected toPersistence(entity: Profile): {
    id?: string;
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    timezone: string;
    locale: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      // Omit id if empty to let DB generate UUID on create
      ...(entity.id ? { id: entity.id } : {}),
      userId: entity.userId,
      displayName: entity.displayName ?? null,
      avatarUrl: entity.avatarUrl ?? null,
      bio: entity.bio ?? null,
      timezone: entity.timezone,
      locale: entity.locale,
      emailNotifications: entity.notificationPreferences.emailNotifications,
      pushNotifications: entity.notificationPreferences.pushNotifications,
      marketingEmails: entity.notificationPreferences.marketingEmails,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const row = await this.delegate.findUnique({
      where: { userId },
    });
    return row ? this.toDomain(row) : null;
  }
}
