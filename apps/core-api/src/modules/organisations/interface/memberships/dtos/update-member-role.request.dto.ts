import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { OrganisationRole } from '../../../domain/value-objects/organisation-role.value-object';

export class UpdateMemberRoleRequestDto {
  @ApiProperty({
    description: 'The new role for the member',
    enum: OrganisationRole,
  })
  @IsEnum(OrganisationRole)
  role!: OrganisationRole;
}
