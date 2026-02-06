import {
  createPaginationMeta,
  PagedRequestDto,
} from 'libs/application/pagination.dto';
import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { routesV1 } from 'routes';

import { GetOrganisationsPagedHandler } from '../../application/queries/get-organisations-paged/get-organisations-paged.handler';
import { GetOrganisationsPagedQuery } from '../../application/queries/get-organisations-paged/get-organisations-paged.query';
import { OrganisationsPagedResponseDto } from '../dtos/organisations-paged.response.dto';
import { OrganisationResponseMapper } from '../mappers/organisation.response.mapper';

@ApiTags(routesV1.organisation.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class GetOrganisationsPagedHttpController {
  constructor(private readonly handler: GetOrganisationsPagedHandler) {}

  @Get(routesV1.organisation.list)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated list of organisations' })
  @ApiOkResponse({
    description: 'Paginated list of organisations',
    type: OrganisationsPagedResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @Query() dto: PagedRequestDto,
  ): Promise<OrganisationsPagedResponseDto> {
    const limit = dto.limit ?? 20;
    const offset = dto.offset ?? 0;

    const query = new GetOrganisationsPagedQuery({ limit, offset });
    const result = await this.handler.execute(query);

    return {
      items: OrganisationResponseMapper.toListDto(result.items),
      pagination: createPaginationMeta(result.total, limit, offset),
    };
  }
}
