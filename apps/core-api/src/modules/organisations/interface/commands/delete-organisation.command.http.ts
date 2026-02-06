import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { routesV1 } from 'routes';

import { DeleteOrganisationCommand } from '../../application/use-cases/delete-organisation/delete-organisation.command';
import { DeleteOrganisationHandler } from '../../application/use-cases/delete-organisation/delete-organisation.handler';

@ApiTags(routesV1.organisation.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class DeleteOrganisationHttpController {
  constructor(private readonly handler: DeleteOrganisationHandler) {}

  @Delete(routesV1.organisation.delete)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an organisation' })
  @ApiParam({
    name: 'slug',
    description: 'The URL-friendly identifier of the organisation',
    example: 'acme-corporation',
  })
  @ApiNoContentResponse({
    description: 'The organisation has been successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'Organisation not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(@Param('slug') slug: string): Promise<void> {
    const command = new DeleteOrganisationCommand({ slug });
    await this.handler.execute(command);
  }
}
