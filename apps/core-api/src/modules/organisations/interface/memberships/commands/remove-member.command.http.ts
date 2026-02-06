import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { routesV1 } from 'routes';

import { RemoveMemberCommand } from '../../../application/use-cases/remove-member/remove-member.command';
import { RemoveMemberHandler } from '../../../application/use-cases/remove-member/remove-member.handler';

@ApiTags(routesV1.membership.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class RemoveMemberHttpController {
  constructor(private readonly handler: RemoveMemberHandler) {}

  @Delete(routesV1.membership.byId)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from an organisation' })
  @ApiNoContentResponse({
    description: 'The member has been successfully removed.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Only organisation admins can remove other members',
  })
  @ApiNotFoundResponse({ description: 'Membership not found' })
  @ApiBadRequestResponse({
    description: 'Cannot remove the organisation owner',
  })
  async handle(
    @Param('orgSlug') orgSlug: string,
    @Param('id') membershipId: string,
  ): Promise<void> {
    const command = new RemoveMemberCommand({
      membershipId,
      organisationSlug: orgSlug,
    });
    await this.handler.execute(command);
  }
}
