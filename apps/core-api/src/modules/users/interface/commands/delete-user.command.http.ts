import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import {
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

import { DeleteUserCommand } from '../../application/use-cases/delete-user/delete-user.command';
import { DeleteUserHandler } from '../../application/use-cases/delete-user/delete-user.handler';

@ApiTags(routesV1.user.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class DeleteUserHttpController {
  constructor(private readonly handler: DeleteUserHandler) {}

  @Delete(routesV1.user.me)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiNoContentResponse({ description: 'User deleted' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    const command = new DeleteUserCommand({ userId: user.id });
    await this.handler.execute(command);
  }
}
