import { RepositoryPortBase } from 'libs/application/repository-port.base';
import { UnitOfWork } from 'libs/db/unit-of-work';

import { Account } from '../../domain/aggregates/account.aggregate';
import { AuthProviderType } from '../../domain/value-objects/auth-provider.value-object';

/**
 * Account Repository Port
 *
 * Extends the base repository contract with account-specific operations.
 * Owned by the application layer, implemented by infrastructure.
 */
export interface AccountRepositoryPort extends RepositoryPortBase<
  Account,
  string
> {
  findByProviderAccountId(providerAccountId: string): Promise<Account | null>;
  findByUserIdAndProvider(
    userId: string,
    providerType: AuthProviderType,
  ): Promise<Account | null>;
  findAllByUserId(userId: string): Promise<Account[]>;

  /** Override to return specific port type */
  withTransaction(tx: unknown, uow?: UnitOfWork): AccountRepositoryPort;
}
