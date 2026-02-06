import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from 'modules/auth/decorators/roles.decorator';
import { RolesGuard } from 'modules/auth/guards/roles.guard';
import { routesV1 } from 'routes';

import { UpdateRolesCommand } from '../../application/use-cases/update-roles/update-roles.command';
import { UpdateRolesHandler } from '../../application/use-cases/update-roles/update-roles.handler';
import { Role } from '../../domain/value-objects/role.value-object';
import { UpdateRolesRequestDto } from '../dtos/update-roles.request.dto';
import { UserResponseDto } from '../dtos/user.response.dto';
import { UserResponseMapper } from '../mappers/user.response.mapper';

@ApiTags(routesV1.user.root)
@ApiBearerAuth()
@Controller(routesV1.version)
export class UpdateRolesHttpController {
  constructor(private readonly handler: UpdateRolesHandler) {}

  @Put(routesV1.user.updateRoles)
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SYSTEM_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Update user roles',
    description: 'Updates the roles of a user. Requires SYSTEM_ADMIN role.',
  })
  @ApiOkResponse({ description: 'Roles updated', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires SYSTEM_ADMIN role',
  })
  async handle(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateRolesRequestDto,
  ): Promise<UserResponseDto> {
    const command = new UpdateRolesCommand({
      userId,
      roles: dto.roles,
    });
    const user = await this.handler.execute(command);
    return UserResponseMapper.toUserDto(user);
  }
}
