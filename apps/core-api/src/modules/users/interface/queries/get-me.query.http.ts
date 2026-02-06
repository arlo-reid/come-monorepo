import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'modules/auth/types/auth-options.interface';
import { routesV1 } from 'routes';

import { GetUserByIdHandler } from '../../application/queries/get-user-by-id/get-user-by-id.handler';
import { GetUserByIdQuery } from '../../application/queries/get-user-by-id/get-user-by-id.query';
import { UserResponseDto } from '../dtos/user.response.dto';
import { UserResponseMapper } from '../mappers/user.response.mapper';

@ApiTags(routesV1.user.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class GetMeHttpController {
  constructor(private readonly handler: GetUserByIdHandler) {}

  @Get(routesV1.user.me)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse({ description: 'Current user', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const query = new GetUserByIdQuery({ userId: currentUser.id });
    const user = await this.handler.execute(query);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return UserResponseMapper.toUserDto(user);
  }
}
