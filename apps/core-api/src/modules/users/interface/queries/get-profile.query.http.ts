import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'modules/auth/types/auth-options.interface';
import { routesV1 } from 'routes';

import { GetProfileHandler } from '../../application/queries/get-profile/get-profile.handler';
import { GetProfileQuery } from '../../application/queries/get-profile/get-profile.query';
import { ProfileResponseDto } from '../dtos/profile.response.dto';
import { UserResponseMapper } from '../mappers/user.response.mapper';

@ApiTags(routesV1.profile.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class GetProfileHttpController {
  constructor(private readonly handler: GetProfileHandler) {}

  @Get(routesV1.profile.get)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'User profile', type: ProfileResponseDto })
  @ApiNotFoundResponse({ description: 'Profile not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProfileResponseDto> {
    const query = new GetProfileQuery({ userId: user.id });
    const profile = await this.handler.execute(query);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return UserResponseMapper.toProfileDto(profile);
  }
}
