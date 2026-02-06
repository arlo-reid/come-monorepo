import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsEnum } from 'class-validator';

import { Role } from '../../domain/value-objects/role.value-object';

/**
 * Request DTO for updating user roles
 */
export class UpdateRolesRequestDto {
  @ApiProperty({
    description: 'New set of roles (replaces existing roles)',
    type: [String],
    enum: Role,
    isArray: true,
    example: [Role.SYSTEM_ADMIN],
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(Role, { each: true })
  roles!: Role[];
}
