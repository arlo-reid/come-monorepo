import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'modules/auth/types/auth-options.interface';
import { routesV1 } from 'routes';

import { LinkAccountHandler } from '../../application/use-cases/link-account/link-account.handler';
import { AccountResponseDto } from '../dtos/account.response.dto';
import { LinkAccountRequestDto } from '../dtos/link-account.request.dto';
import { UserRequestMapper } from '../mappers/user.request.mapper';
import { UserResponseMapper } from '../mappers/user.response.mapper';

@ApiTags(routesV1.account.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class LinkAccountHttpController {
  constructor(private readonly handler: LinkAccountHandler) {}

  @Post(routesV1.account.link)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Link a new authentication provider to current user',
  })
  @ApiCreatedResponse({
    description: 'Account linked',
    type: AccountResponseDto,
  })
  @ApiConflictResponse({ description: 'Account already linked' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LinkAccountRequestDto,
  ): Promise<AccountResponseDto> {
    const command = UserRequestMapper.toLinkAccountCommand(user.id, dto);
    const account = await this.handler.execute(command);
    return UserResponseMapper.toAccountDto(account);
  }
}
