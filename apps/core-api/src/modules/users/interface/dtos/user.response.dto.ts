import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for user data
 */
export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id!: string;

  @ApiProperty({ description: 'User email' })
  email!: string;

  @ApiProperty({ description: 'Whether email is verified' })
  emailVerified!: boolean;

  @ApiPropertyOptional({ description: 'Primary account ID' })
  primaryAccountId?: string;

  @ApiProperty({
    description: 'User roles',
    type: [String],
    example: ['SYSTEM_ADMIN'],
  })
  roles!: string[];

  @ApiProperty({ description: 'Creation timestamp (ISO 8601)' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp (ISO 8601)' })
  updatedAt!: string;
}
