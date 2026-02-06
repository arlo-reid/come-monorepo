import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from 'modules/auth/decorators/public.decorator';
import { routesV1 } from 'routes';

import { LoginHandler } from '../../application/use-cases/login/login.handler';
import { LoginRequestDto } from '../dtos/login.request.dto';
import { LoginResponseDto } from '../dtos/login.response.dto';
import { UserRequestMapper } from '../mappers/user.request.mapper';
import { UserResponseMapper } from '../mappers/user.response.mapper';

@ApiTags(routesV1.auth.root)
@Controller(routesV1.version)
export class LoginHttpController {
  constructor(private readonly handler: LoginHandler) {}

  @Public()
  @Post(routesV1.auth.login)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiOkResponse({
    description: 'User authenticated successfully',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async handle(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    const command = UserRequestMapper.toLoginCommand(dto);
    const result = await this.handler.execute(command);
    return UserResponseMapper.toLoginDto(result);
  }
}
