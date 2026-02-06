import { Body, Controller, HttpCode, HttpStatus, Patch } from '@nestjs/common';
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

import { UpdateProfileHandler } from '../../application/use-cases/update-profile/update-profile.handler';
import { ProfileResponseDto } from '../dtos/profile.response.dto';
import { UpdateProfileRequestDto } from '../dtos/update-profile.request.dto';
import { UserRequestMapper } from '../mappers/user.request.mapper';
import { UserResponseMapper } from '../mappers/user.response.mapper';

@ApiTags(routesV1.profile.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class UpdateProfileHttpController {
  constructor(private readonly handler: UpdateProfileHandler) {}

  @Patch(routesV1.profile.update)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ description: 'Profile updated', type: ProfileResponseDto })
  @ApiNotFoundResponse({ description: 'Profile not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileRequestDto,
  ): Promise<ProfileResponseDto> {
    const command = UserRequestMapper.toUpdateProfileCommand(user.id, dto);
    const profile = await this.handler.execute(command);
    return UserResponseMapper.toProfileDto(profile);
  }
}
