import { UnitOfWork } from 'libs/db/unit-of-work';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ORGANISATION_REPOSITORY } from '../../../di-tokens';
import {
  MembershipNotFoundException,
  OwnerRemovalException,
} from '../../../domain/exceptions/membership.exceptions';
import type { OrganisationRepositoryPort } from '../../ports/organisation-repository.port';
import { RemoveMemberCommand } from './remove-member.command';

/**
 * Handler for removing a member from an organisation
 *
 * Business rules enforced by the aggregate:
 * - Organisation owner cannot be removed
 *
 * Authorization is handled by ZenStack policies via ORGANISATION_REPOSITORY.
 * If the user doesn't have admin permission, the operation will fail with
 * a ForbiddenException.
 */
@Injectable()
export class RemoveMemberHandler {
  constructor(
    @Inject(ORGANISATION_REPOSITORY)
    private readonly organisationRepository: OrganisationRepositoryPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: RemoveMemberCommand): Promise<void> {
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

      // Delegate to aggregate - enforces owner protection invariant
      try {
        organisation.removeMember(command.membershipId);
        await repo.removeMembers(organisation);
      } catch (error) {
        if (error instanceof MembershipNotFoundException) {
          throw new NotFoundException(error.message);
        }
        if (error instanceof OwnerRemovalException) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }
    });
  }
}
