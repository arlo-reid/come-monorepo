import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

import { AuthProviderType } from '../../domain/value-objects/auth-provider.value-object';

/**
 * Request DTO for linking an auth provider account
 */
export class LinkAccountRequestDto {
  @ApiProperty({
    description: 'Authentication provider type',
    enum: AuthProviderType,
    example: AuthProviderType.GOOGLE,
  })
  @IsEnum(AuthProviderType)
  providerType!: AuthProviderType;

  @ApiProperty({
    description: 'Provider account ID (Firebase UID)',
    example: 'firebase-uid-123',
  })
  @IsString()
  providerAccountId!: string;

  @ApiPropertyOptional({
    description: 'Email from provider',
    example: 'user@gmail.com',
  })
  @IsOptional()
  @IsEmail()
  providerEmail?: string;

  @ApiPropertyOptional({
    description: 'Display name from provider',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  providerDisplayName?: string;

  @ApiPropertyOptional({
    description: 'Photo URL from provider',
    example: 'https://lh3.googleusercontent.com/...',
  })
  @IsOptional()
  @IsUrl()
  providerPhotoUrl?: string;
}
