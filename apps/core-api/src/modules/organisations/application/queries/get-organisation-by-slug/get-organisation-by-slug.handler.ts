import { Inject, Injectable } from '@nestjs/common';

import { ORGANISATION_REPOSITORY } from '../../../di-tokens';
import { Organisation } from '../../../domain/aggregates/organisation.aggregate';
import { type OrganisationRepositoryPort } from '../../ports/organisation-repository.port';
import { GetOrganisationBySlugQuery } from './get-organisation-by-slug.query';

@Injectable()
export class GetOrganisationBySlugHandler {
  constructor(
    @Inject(ORGANISATION_REPOSITORY)
    private readonly organisationRepository: OrganisationRepositoryPort,
  ) {}

  async execute(
    query: GetOrganisationBySlugQuery,
  ): Promise<Organisation | null> {
    return this.organisationRepository.findBySlug(query.slug);
  }
}
