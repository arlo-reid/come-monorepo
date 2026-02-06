import { UnitOfWork } from 'libs/db/unit-of-work';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ORGANISATION_REPOSITORY } from '../../../di-tokens';
import { Membership } from '../../../domain/entities/membership.entity';
import { DuplicateMembershipException } from '../../../domain/exceptions/membership.exceptions';
import type { OrganisationRepositoryPort } from '../../ports/organisation-repository.port';
import { AddMemberCommand } from './add-member.command';

/**
 * Handler for adding a member to an organisation
 *
 * Authorization is handled by ZenStack policies via ORGANISATION_REPOSITORY.
 * If the user doesn't have admin permission, the database operation will fail
 * with a ForbiddenException.
 *
 * User existence is validated by database FK constraint on membership.userId.
 */
@Injectable()
export class AddMemberHandler {
  constructor(
    @Inject(ORGANISATION_REPOSITORY)
    private readonly organisationRepository: OrganisationRepositoryPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: AddMemberCommand): Promise<Membership> {
    return await this.unitOfWork.withTransaction(async (tx) => {
      const repo = this.organisationRepository.withTransaction(
        tx,
        this.unitOfWork,
      );

      // Load organisation with memberships
      const organisation = await repo.findBySlug(command.organisationSlug);

      if (!organisation) {
        throw new NotFoundException('Organisation not found');
      }

      // Delegate to aggregate - enforces duplicate prevention invariant
      try {
        const membership = organisation.addMember(command.userId, command.role);
        await repo.save(organisation);
        return membership;
      } catch (error) {
        if (error instanceof DuplicateMembershipException) {
          throw new ConflictException(error.message);
        }
        throw error;
      }
    });
  }
}
