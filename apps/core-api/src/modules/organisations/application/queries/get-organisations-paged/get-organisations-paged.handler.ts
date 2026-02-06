import { PagedResult } from 'libs/application/repository-port.base';
import { Inject, Injectable } from '@nestjs/common';

import { ORGANISATION_REPOSITORY } from '../../../di-tokens';
import { Organisation } from '../../../domain/aggregates/organisation.aggregate';
import { type OrganisationRepositoryPort } from '../../ports/organisation-repository.port';
import { GetOrganisationsPagedQuery } from './get-organisations-paged.query';

@Injectable()
export class GetOrganisationsPagedHandler {
  constructor(
    @Inject(ORGANISATION_REPOSITORY)
    private readonly organisationRepository: OrganisationRepositoryPort,
  ) {}

  async execute(
    query: GetOrganisationsPagedQuery,
  ): Promise<PagedResult<Organisation>> {
    return this.organisationRepository.findAllPaged({
      limit: query.limit,
      offset: query.offset,
    });
  }
}
