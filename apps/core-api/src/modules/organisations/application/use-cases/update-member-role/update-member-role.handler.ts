import { UnitOfWork } from 'libs/db/unit-of-work';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ORGANISATION_REPOSITORY } from '../../../di-tokens';
import { Membership } from '../../../domain/entities/membership.entity';
import { MembershipNotFoundException } from '../../../domain/exceptions/membership.exceptions';
import type { OrganisationRepositoryPort } from '../../ports/organisation-repository.port';
import { UpdateMemberRoleCommand } from './update-member-role.command';

/**
 * Handler for updating a member's role in an organisation
 *
 * Authorization is handled by ZenStack policies via ORGANISATION_REPOSITORY.
 * If the user doesn't have admin permission, the operation will fail with
 * a ForbiddenException.
 */
@Injectable()
export class UpdateMemberRoleHandler {
  constructor(
    @Inject(ORGANISATION_REPOSITORY)
    private readonly organisationRepository: OrganisationRepositoryPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: UpdateMemberRoleCommand): Promise<Membership> {
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

      // Delegate to aggregate
      try {
        const membership = organisation.updateMemberRole(
          command.membershipId,
          command.newRole,
        );
        await repo.save(organisation);
        return membership;
      } catch (error) {
        if (error instanceof MembershipNotFoundException) {
          throw new NotFoundException(error.message);
        }
        throw error;
      }
    });
  }
}
