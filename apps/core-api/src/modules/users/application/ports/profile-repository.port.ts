import { RepositoryPortBase } from 'libs/application/repository-port.base';
import { UnitOfWork } from 'libs/db/unit-of-work';

import { Profile } from '../../domain/aggregates/profile.aggregate';

/**
 * Profile Repository Port
 *
 * Extends the base repository contract with profile-specific operations.
 * Owned by the application layer, implemented by infrastructure.
 */
export interface ProfileRepositoryPort extends RepositoryPortBase<
  Profile,
  string
> {
  findByUserId(userId: string): Promise<Profile | null>;

  /** Override to return specific port type */
  withTransaction(tx: unknown, uow?: UnitOfWork): ProfileRepositoryPort;
}
