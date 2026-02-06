import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserResponseDto } from './user.response.dto';

/**
 * Auth tokens returned from login
 */
export class AuthTokensDto {
  @ApiProperty({ description: 'Firebase ID token for authenticating requests' })
  idToken!: string;

  @ApiProperty({ description: 'Refresh token for obtaining new ID tokens' })
  refreshToken!: string;

  @ApiProperty({ description: 'Token expiry time in seconds', example: '3600' })
  expiresIn!: string;
}

/**
 * Response DTO for login containing user data and auth tokens
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Authenticated user data',
    type: UserResponseDto,
  })
  user!: UserResponseDto;

  @ApiProperty({ description: 'Authentication tokens', type: AuthTokensDto })
  auth!: AuthTokensDto;
}
