import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'modules/auth/types/auth-options.interface';
import { routesV1 } from 'routes';

import { CreateOrganisationHandler } from '../../application/use-cases/create-organisation/create-organisation.handler';
import { CreateOrganisationRequestDto } from '../dtos/create-organisation.request.dto';
import { OrganisationResponseDto } from '../dtos/organisation.response.dto';
import { OrganisationRequestMapper } from '../mappers/organisation.request.mapper';
import { OrganisationResponseMapper } from '../mappers/organisation.response.mapper';

@ApiTags(routesV1.organisation.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class CreateOrganisationHttpController {
  constructor(private readonly handler: CreateOrganisationHandler) {}

  @Post(routesV1.organisation.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new organisation' })
  @ApiCreatedResponse({
    description: 'The organisation has been successfully created.',
    type: OrganisationResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @Body() dto: CreateOrganisationRequestDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<OrganisationResponseDto> {
    const command = OrganisationRequestMapper.toCreateCommand(
      dto,
      currentUser.id,
    );
    const organisation = await this.handler.execute(command);
    return OrganisationResponseMapper.toDto(organisation);
  }
}
