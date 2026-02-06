import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { OrganisationRole } from '../../../domain/value-objects/organisation-role.value-object';

export class AddMemberRequestDto {
  @ApiProperty({
    description: 'The ID of the user to add as a member',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsString()
  userId!: string;

  @ApiPropertyOptional({
    description: 'The role to assign to the member',
    enum: OrganisationRole,
    default: OrganisationRole.ORG_MEMBER,
  })
  @IsOptional()
  @IsEnum(OrganisationRole)
  role?: OrganisationRole;
}
