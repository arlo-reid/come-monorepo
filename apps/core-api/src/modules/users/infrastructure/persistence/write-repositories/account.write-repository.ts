import { DbService, ENHANCED_DB } from 'libs/db/db.providers';
import { ZenStackRepositoryBase } from 'libs/db/repository-base';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { AccountRepositoryPort } from '../../../application/ports/account-repository.port';
import { Account } from '../../../domain/aggregates/account.aggregate';
import { AuthProviderType } from '../../../domain/value-objects/auth-provider.value-object';

/** Typed delegate for Account model operations */
type AccountDelegate = DbService['account'];

/**
 * ZenStack Account Repository
 *
 * Infrastructure adapter implementing the AccountRepositoryPort.
 * Uses ZenStack v3 ORM for database operations with domain event support.
 */
@Injectable()
export class AccountWriteRepository
  extends ZenStackRepositoryBase<DbService, Account, string, AccountDelegate>
  implements AccountRepositoryPort
{
  constructor(
    @Inject(ENHANCED_DB) db: DbService,
    @Optional() eventBus?: EventBus,
  ) {
    super(db, eventBus);
  }

  protected getDelegate(client: DbService): AccountDelegate {
    return client.account;
  }

  protected toDomain(row: {
    id: string;
    userId: string;
    providerType: string;
    providerAccountId: string;
    providerEmail: string | null;
    providerDisplayName: string | null;
    providerPhotoUrl: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    tokenExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Account {
    return Account.fromPersistence({
      id: row.id,
      userId: row.userId,
      providerType: row.providerType as AuthProviderType,
      providerAccountId: row.providerAccountId,
      providerEmail: row.providerEmail ?? undefined,
      providerDisplayName: row.providerDisplayName ?? undefined,
      providerPhotoUrl: row.providerPhotoUrl ?? undefined,
      accessToken: row.accessToken ?? undefined,
      refreshToken: row.refreshToken ?? undefined,
      tokenExpiresAt: row.tokenExpiresAt
        ? new Date(row.tokenExpiresAt)
        : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  protected toPersistence(entity: Account): {
    id?: string;
    userId: string;
    providerType: string;
    providerAccountId: string;
    providerEmail: string | null;
    providerDisplayName: string | null;
    providerPhotoUrl: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    tokenExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      // Omit id if empty to let DB generate UUID on create
      ...(entity.id ? { id: entity.id } : {}),
      userId: entity.userId,
      providerType: entity.providerType,
      providerAccountId: entity.providerAccountId,
      providerEmail: entity.providerEmail ?? null,
      providerDisplayName: entity.providerDisplayName ?? null,
      providerPhotoUrl: entity.providerPhotoUrl ?? null,
      accessToken: entity.accessToken ?? null,
      refreshToken: entity.refreshToken ?? null,
      tokenExpiresAt: entity.tokenExpiresAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async findByProviderAccountId(
    providerAccountId: string,
  ): Promise<Account | null> {
    const row = await this.delegate.findUnique({
      where: { providerAccountId },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByUserIdAndProvider(
    userId: string,
    providerType: AuthProviderType,
  ): Promise<Account | null> {
    const row = await this.delegate.findFirst({
      where: { userId, providerType },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAllByUserId(userId: string): Promise<Account[]> {
    const rows = await this.delegate.findMany({
      where: { userId },
    });
    return rows.map((row: any) => this.toDomain(row));
  }
}
