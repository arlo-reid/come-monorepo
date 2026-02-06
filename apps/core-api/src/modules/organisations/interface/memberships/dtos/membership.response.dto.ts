import { ApiProperty } from '@nestjs/swagger';

import { OrganisationRole } from '../../../domain/value-objects/organisation-role.value-object';

export class MembershipResponseDto {
  @ApiProperty({
    description: 'The membership ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'The user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId!: string;

  @ApiProperty({
    description: 'The organisation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organisationId!: string;

  @ApiProperty({
    description: 'The role of the member',
    enum: OrganisationRole,
  })
  role!: OrganisationRole;

  @ApiProperty({
    description: 'When the membership was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'When the membership was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt!: string;
}
