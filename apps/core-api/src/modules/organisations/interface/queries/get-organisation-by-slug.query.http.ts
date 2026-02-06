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

import { GetOrganisationBySlugHandler } from '../../application/queries/get-organisation-by-slug/get-organisation-by-slug.handler';
import { GetOrganisationBySlugQuery } from '../../application/queries/get-organisation-by-slug/get-organisation-by-slug.query';
import { OrganisationResponseDto } from '../dtos/organisation.response.dto';
import { OrganisationResponseMapper } from '../mappers/organisation.response.mapper';

@ApiTags(routesV1.organisation.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class GetOrganisationBySlugHttpController {
  constructor(private readonly handler: GetOrganisationBySlugHandler) {}

  @Get(routesV1.organisation.bySlug)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an organisation by its slug' })
  @ApiParam({
    name: 'slug',
    description: 'The URL-friendly identifier of the organisation',
    example: 'acme-corporation',
  })
  @ApiOkResponse({
    description: 'The organisation',
    type: OrganisationResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Organisation not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(@Param('slug') slug: string): Promise<OrganisationResponseDto> {
    const query = new GetOrganisationBySlugQuery({ slug });
    const organisation = await this.handler.execute(query);

    if (!organisation) {
      throw new NotFoundException(`Organisation with slug "${slug}" not found`);
    }

    return OrganisationResponseMapper.toDto(organisation);
  }
}
