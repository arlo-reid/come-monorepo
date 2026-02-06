import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for organisation data
 */
export class OrganisationResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the organisation',
    example: 'org_abc123',
  })
  id!: string;

  @ApiProperty({
    description: 'The name of the organisation',
    example: 'Acme Corporation',
  })
  name!: string;

  @ApiProperty({
    description: 'URL-friendly identifier',
    example: 'acme-corporation',
  })
  slug!: string;

  @ApiProperty({
    description: 'The ID of the user who owns this organisation',
    example: 'usr_abc123',
  })
  ownerId!: string;

  @ApiProperty({
    description: 'When the organisation was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'When the organisation was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt!: string;
}
