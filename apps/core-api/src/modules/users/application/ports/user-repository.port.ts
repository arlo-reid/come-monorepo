import { RepositoryPortBase } from 'libs/application/repository-port.base';
import { UnitOfWork } from 'libs/db/unit-of-work';

import { User } from '../../domain/aggregates/user.aggregate';

/**
 * User Repository Port
 *
 * Extends the base repository contract with user-specific operations.
 * Owned by the application layer, implemented by infrastructure.
 */
export interface UserRepositoryPort extends RepositoryPortBase<User, string> {
  findByEmail(email: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;

  /** Override to return specific port type */
  withTransaction(tx: unknown, uow?: UnitOfWork): UserRepositoryPort;
}
