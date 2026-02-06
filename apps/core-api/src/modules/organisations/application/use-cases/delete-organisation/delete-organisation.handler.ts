import { UnitOfWork } from 'libs/db/unit-of-work';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ORGANISATION_REPOSITORY } from '../../../di-tokens';
import { type OrganisationRepositoryPort } from '../../ports/organisation-repository.port';
import { DeleteOrganisationCommand } from './delete-organisation.command';

@Injectable()
export class DeleteOrganisationHandler {
  constructor(
    @Inject(ORGANISATION_REPOSITORY)
    private readonly organisationRepository: OrganisationRepositoryPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: DeleteOrganisationCommand): Promise<void> {
    await this.unitOfWork.withTransaction(async (tx) => {
      const repoWithTx = this.organisationRepository.withTransaction(
        tx,
        this.unitOfWork,
      );

      const organisation = await repoWithTx.findBySlug(command.slug);
      if (!organisation) {
        throw new NotFoundException(
          `Organisation with slug "${command.slug}" not found`,
        );
      }

      organisation.delete();

      await repoWithTx.softDelete(organisation);
    });
  }
}
