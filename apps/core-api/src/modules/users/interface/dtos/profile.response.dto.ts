import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class NotificationPreferencesResponseDto {
  @ApiProperty()
  emailNotifications!: boolean;

  @ApiProperty()
  pushNotifications!: boolean;

  @ApiProperty()
  marketingEmails!: boolean;
}

/**
 * Response DTO for profile data
 */
export class ProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiProperty()
  timezone!: string;

  @ApiProperty()
  locale!: string;

  @ApiProperty({ type: NotificationPreferencesResponseDto })
  notificationPreferences!: NotificationPreferencesResponseDto;

  @ApiProperty({ description: 'Creation timestamp (ISO 8601)' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp (ISO 8601)' })
  updatedAt!: string;
}
