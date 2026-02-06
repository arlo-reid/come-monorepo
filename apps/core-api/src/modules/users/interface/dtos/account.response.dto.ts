import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AuthProviderType } from '../../domain/value-objects/auth-provider.value-object';

/**
 * Response DTO for account data
 */
export class AccountResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: AuthProviderType })
  providerType!: AuthProviderType;

  @ApiProperty()
  providerAccountId!: string;

  @ApiPropertyOptional()
  providerEmail?: string;

  @ApiPropertyOptional()
  providerDisplayName?: string;

  @ApiPropertyOptional()
  providerPhotoUrl?: string;

  @ApiProperty({ description: 'Creation timestamp (ISO 8601)' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp (ISO 8601)' })
  updatedAt!: string;
}
