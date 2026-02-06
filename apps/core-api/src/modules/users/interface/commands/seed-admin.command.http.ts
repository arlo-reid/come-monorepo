import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'modules/auth/decorators/public.decorator';
import { routesV1 } from 'routes';

import { SeedAdminCommand } from '../../application/use-cases/seed-admin/seed-admin.command';
import { SeedAdminHandler } from '../../application/use-cases/seed-admin/seed-admin.handler';

class SeedAdminResponseDto {
  @ApiProperty({
    description: 'Whether the admin was created or already existed',
  })
  created!: boolean;

  @ApiProperty({ description: 'Admin user email' })
  email!: string;

  @ApiProperty({ description: 'Admin user ID' })
  userId!: string;
}

@ApiTags(routesV1.admin.root)
@Controller(routesV1.version)
export class SeedAdminHttpController {
  constructor(private readonly handler: SeedAdminHandler) {}

  @Post(routesV1.admin.seed)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed admin user',
    description:
      'Creates the initial admin user from environment configuration. Idempotent - returns existing admin if already created.',
  })
  @ApiOkResponse({
    description: 'Admin user seeded or already exists',
    type: SeedAdminResponseDto,
  })
  async handle(): Promise<SeedAdminResponseDto> {
    const result = await this.handler.execute(new SeedAdminCommand());

    return {
      created: result.created,
      email: result.user.email,
      userId: result.user.id,
    };
  }
}
