import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { routesV1 } from 'routes';

import { AddMemberCommand } from '../../../application/use-cases/add-member/add-member.command';
import { AddMemberHandler } from '../../../application/use-cases/add-member/add-member.handler';
import { OrganisationRole } from '../../../domain/value-objects/organisation-role.value-object';
import { AddMemberRequestDto } from '../dtos/add-member.request.dto';
import { MembershipResponseDto } from '../dtos/membership.response.dto';
import { MembershipResponseMapper } from '../mappers/membership.response.mapper';

@ApiTags(routesV1.membership.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class AddMemberHttpController {
  constructor(private readonly handler: AddMemberHandler) {}

  @Post(routesV1.membership.forOrg)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a member to an organisation' })
  @ApiCreatedResponse({
    description: 'The member has been successfully added.',
    type: MembershipResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Only organisation admins can add members',
  })
  @ApiConflictResponse({
    description: 'User is already a member of this organisation',
  })
  async handle(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: AddMemberRequestDto,
  ): Promise<MembershipResponseDto> {
    const command = new AddMemberCommand({
      userId: dto.userId,
      organisationSlug: orgSlug,
      role: dto.role ?? OrganisationRole.ORG_MEMBER,
    });
    const membership = await this.handler.execute(command);
    return MembershipResponseMapper.fromEntity(membership);
  }
}
