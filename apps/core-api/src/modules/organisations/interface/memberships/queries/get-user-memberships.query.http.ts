import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'modules/auth/types/auth-options.interface';
import { routesV1 } from 'routes';

import { MembershipQueryService } from '../../../application/queries/membership-query/membership-query.service';
import { MembershipsPagedResponseDto } from '../dtos/memberships-paged.response.dto';
import { MembershipResponseMapper } from '../mappers/membership.response.mapper';

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

@ApiTags(routesV1.membership.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class GetUserMembershipsHttpController {
  constructor(private readonly queryService: MembershipQueryService) {}

  @Get(routesV1.membership.userMemberships)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List current user memberships' })
  @ApiOkResponse({
    description: 'Paginated list of user memberships.',
    type: MembershipsPagedResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async handle(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ): Promise<MembershipsPagedResponseDto> {
    const limit = limitStr ? parseInt(limitStr, 10) : DEFAULT_LIMIT;
    const offset = offsetStr ? parseInt(offsetStr, 10) : DEFAULT_OFFSET;

    const result = await this.queryService.findUserMemberships(
      currentUser.id,
      limit,
      offset,
    );
    return MembershipResponseMapper.toPagedDto(result, limit, offset);
  }
}
