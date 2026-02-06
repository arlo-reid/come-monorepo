import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { routesV1 } from 'routes';

import { UpdateMemberRoleCommand } from '../../../application/use-cases/update-member-role/update-member-role.command';
import { UpdateMemberRoleHandler } from '../../../application/use-cases/update-member-role/update-member-role.handler';
import { MembershipResponseDto } from '../dtos/membership.response.dto';
import { UpdateMemberRoleRequestDto } from '../dtos/update-member-role.request.dto';
import { MembershipResponseMapper } from '../mappers/membership.response.mapper';

@ApiTags(routesV1.membership.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class UpdateMemberRoleHttpController {
  constructor(private readonly handler: UpdateMemberRoleHandler) {}

  @Patch(routesV1.membership.byId)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a member role' })
  @ApiOkResponse({
    description: 'The member role has been successfully updated.',
    type: MembershipResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Only organisation admins can update member roles',
  })
  @ApiNotFoundResponse({ description: 'Membership not found' })
  async handle(
    @Param('orgSlug') orgSlug: string,
    @Param('id') membershipId: string,
    @Body() dto: UpdateMemberRoleRequestDto,
  ): Promise<MembershipResponseDto> {
    const command = new UpdateMemberRoleCommand({
      membershipId,
      organisationSlug: orgSlug,
      newRole: dto.role,
    });
    const membership = await this.handler.execute(command);
    return MembershipResponseMapper.fromEntity(membership);
  }
}
