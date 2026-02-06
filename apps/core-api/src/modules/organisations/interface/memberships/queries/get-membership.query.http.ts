import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { routesV1 } from 'routes';

import { MembershipQueryService } from '../../../application/queries/membership-query/membership-query.service';
import { MembershipResponseDto } from '../dtos/membership.response.dto';
import { MembershipResponseMapper } from '../mappers/membership.response.mapper';

@ApiTags(routesV1.membership.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class GetMembershipHttpController {
  constructor(private readonly queryService: MembershipQueryService) {}

  @Get(routesV1.membership.byId)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a membership by ID' })
  @ApiParam({ name: 'orgSlug', description: 'Organisation slug' })
  @ApiParam({ name: 'id', description: 'Membership ID' })
  @ApiOkResponse({
    description: 'The membership details.',
    type: MembershipResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Membership not found' })
  async handle(
    @Param('orgSlug') orgSlug: string,
    @Param('id') membershipId: string,
  ): Promise<MembershipResponseDto> {
    const membership = await this.queryService.findMembershipById(membershipId);

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Validate membership belongs to the requested organisation
    if (membership.organisation?.slug !== orgSlug) {
      throw new NotFoundException('Membership not found');
    }

    return MembershipResponseMapper.fromReadModel(membership);
  }
}
