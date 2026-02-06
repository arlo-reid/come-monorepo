import { UnitOfWork } from 'libs/db/unit-of-work';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import slugify from 'slugify';
import { RAW_ORGANISATION_REPOSITORY } from 'modules/organisations/di-tokens';

import { Organisation } from '../../../domain/aggregates/organisation.aggregate';
import { type OrganisationRepositoryPort } from '../../ports/organisation-repository.port';
import { CreateOrganisationCommand } from './create-organisation.command';

@Injectable()
export class CreateOrganisationHandler {
  constructor(
    @Inject(RAW_ORGANISATION_REPOSITORY)
    private readonly organisationRepository: OrganisationRepositoryPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  private generateSlug(name: string): string {
    return slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

  async execute(command: CreateOrganisationCommand): Promise<Organisation> {
    const result = await this.unitOfWork.withTransaction(async (tx) => {
      const repoWithTx = this.organisationRepository.withTransaction(
        tx,
        this.unitOfWork,
      );

      // Generate unique slug
      let slug: string;
      if (command.slug) {
        // Use provided slug, check uniqueness
        if (await repoWithTx.existsBySlug(command.slug)) {
          throw new ConflictException(
            `Organisation with slug "${command.slug}" already exists`,
          );
        }
        slug = command.slug;
      } else {
        // Generate slug with uniqueness suffix
        const baseSlug = this.generateSlug(command.name);
        slug = baseSlug;
        while (await repoWithTx.existsBySlug(slug)) {
          slug = `${baseSlug}-${nanoid(5)}`;
        }
      }

      const organisation = Organisation.create({
        name: command.name,
        slug,
        ownerId: command.ownerId,
      });

      // Repository handles ID generation on save
      await repoWithTx.create(organisation);

      return organisation;
    });

    return result;
  }
}
