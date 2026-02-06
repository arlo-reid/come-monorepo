import { RepositoryPortBase } from 'libs/application/repository-port.base';
import { UnitOfWork } from 'libs/db/unit-of-work';

import { Organisation } from '../../domain/aggregates/organisation.aggregate';

/**
 * Organisation Repository Port
 *
 * Extends the base repository contract with organisation-specific operations.
 * Owned by the application layer, implemented by infrastructure.
 */
export interface OrganisationRepositoryPort extends RepositoryPortBase<
  Organisation,
  string
> {
  findBySlug(slug: string): Promise<Organisation | null>;
  existsBySlug(slug: string): Promise<boolean>;
  findAll(): Promise<Organisation[]>;
  removeMembers(organistion: Organisation): Promise<void>;

  /** Override to return specific port type */
  withTransaction(tx: unknown, uow?: UnitOfWork): OrganisationRepositoryPort;
}
