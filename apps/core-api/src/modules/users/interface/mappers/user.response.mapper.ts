import { FirebaseSignInResult } from '../../application/ports/firebase-auth.port';
import { LoginResult } from '../../application/use-cases/login/login.handler';
import { Account } from '../../domain/aggregates/account.aggregate';
import { Profile } from '../../domain/aggregates/profile.aggregate';
import { User } from '../../domain/aggregates/user.aggregate';
import { AccountResponseDto } from '../dtos/account.response.dto';
import { LoginResponseDto } from '../dtos/login.response.dto';
import { ProfileResponseDto } from '../dtos/profile.response.dto';
import { UserResponseDto } from '../dtos/user.response.dto';

/**
 * Maps domain entities to response DTOs
 */
export class UserResponseMapper {
  static toUserDto(entity: User): UserResponseDto {
    return {
      id: entity.id,
      email: entity.email,
      emailVerified: entity.emailVerified,
      primaryAccountId: entity.primaryAccountId,
      roles: entity.roles,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static toProfileDto(entity: Profile): ProfileResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      displayName: entity.displayName,
      avatarUrl: entity.avatarUrl,
      bio: entity.bio,
      timezone: entity.timezone,
      locale: entity.locale,
      notificationPreferences: entity.notificationPreferences,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static toAccountDto(entity: Account): AccountResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      providerType: entity.providerType,
      providerAccountId: entity.providerAccountId,
      providerEmail: entity.providerEmail,
      providerDisplayName: entity.providerDisplayName,
      providerPhotoUrl: entity.providerPhotoUrl,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static toAccountListDto(entities: Account[]): AccountResponseDto[] {
    return entities.map((e) => this.toAccountDto(e));
  }

  static toLoginDto(result: LoginResult): LoginResponseDto {
    return {
      user: this.toUserDto(result.user),
      auth: this.toAuthTokensDto(result.auth),
    };
  }

  private static toAuthTokensDto(auth: FirebaseSignInResult) {
    return {
      idToken: auth.idToken,
      refreshToken: auth.refreshToken,
      expiresIn: auth.expiresIn,
    };
  }
}
