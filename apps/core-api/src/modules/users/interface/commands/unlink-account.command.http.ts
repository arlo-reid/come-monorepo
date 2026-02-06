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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'modules/auth/types/auth-options.interface';
import { routesV1 } from 'routes';

import { UnlinkAccountCommand } from '../../application/use-cases/unlink-account/unlink-account.command';
import { UnlinkAccountHandler } from '../../application/use-cases/unlink-account/unlink-account.handler';
import { AuthProviderType } from '../../domain/value-objects/auth-provider.value-object';

@ApiTags(routesV1.account.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class UnlinkAccountHttpController {
  constructor(private readonly handler: UnlinkAccountHandler) {}

  @Delete(routesV1.account.unlink)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Unlink an authentication provider from current user',
  })
  @ApiNoContentResponse({ description: 'Account unlinked' })
  @ApiBadRequestResponse({ description: 'Cannot unlink only auth method' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('providerType') providerType: AuthProviderType,
  ): Promise<void> {
    const command = new UnlinkAccountCommand({
      userId: user.id,
      providerType,
    });
    await this.handler.execute(command);
  }
}
