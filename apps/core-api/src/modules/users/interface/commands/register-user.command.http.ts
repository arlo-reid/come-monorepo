import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'modules/auth/decorators/public.decorator';
import { routesV1 } from 'routes';

import { RegisterUserHandler } from '../../application/use-cases/register-user/register-user.handler';
import { RegisterUserRequestDto } from '../dtos/register-user.request.dto';
import { UserResponseDto } from '../dtos/user.response.dto';
import { UserRequestMapper } from '../mappers/user.request.mapper';
import { UserResponseMapper } from '../mappers/user.response.mapper';

@ApiTags(routesV1.auth.root)
@Controller(routesV1.version)
export class RegisterUserHttpController {
  constructor(private readonly handler: RegisterUserHandler) {}

  @Public()
  @Post(routesV1.auth.register)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user with email/password' })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: UserResponseDto,
  })
  @ApiConflictResponse({ description: 'Email already exists' })
  async handle(@Body() dto: RegisterUserRequestDto): Promise<UserResponseDto> {
    const command = UserRequestMapper.toRegisterCommand(dto);
    const result = await this.handler.execute(command);
    return UserResponseMapper.toUserDto(result.user);
  }
}
