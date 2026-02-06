import { LinkAccountCommand } from '../../application/use-cases/link-account/link-account.command';
import { LoginCommand } from '../../application/use-cases/login/login.command';
import { RegisterUserCommand } from '../../application/use-cases/register-user/register-user.command';
import { UpdateProfileCommand } from '../../application/use-cases/update-profile/update-profile.command';
import { LinkAccountRequestDto } from '../dtos/link-account.request.dto';
import { LoginRequestDto } from '../dtos/login.request.dto';
import { RegisterUserRequestDto } from '../dtos/register-user.request.dto';
import { UpdateProfileRequestDto } from '../dtos/update-profile.request.dto';

/**
 * Maps request DTOs to application commands
 */
export class UserRequestMapper {
  static toRegisterCommand(dto: RegisterUserRequestDto): RegisterUserCommand {
    return new RegisterUserCommand({
      email: dto.email,
      password: dto.password,
      displayName: dto.displayName,
    });
  }

  static toUpdateProfileCommand(
    userId: string,
    dto: UpdateProfileRequestDto,
  ): UpdateProfileCommand {
    return new UpdateProfileCommand({
      userId,
      displayName: dto.displayName,
      avatarUrl: dto.avatarUrl,
      bio: dto.bio,
      timezone: dto.timezone,
      locale: dto.locale,
      notificationPreferences: dto.notificationPreferences,
    });
  }

  static toLinkAccountCommand(
    userId: string,
    dto: LinkAccountRequestDto,
  ): LinkAccountCommand {
    return new LinkAccountCommand({
      userId,
      providerType: dto.providerType,
      providerAccountId: dto.providerAccountId,
      providerEmail: dto.providerEmail,
      providerDisplayName: dto.providerDisplayName,
      providerPhotoUrl: dto.providerPhotoUrl,
    });
  }

  static toLoginCommand(dto: LoginRequestDto): LoginCommand {
    return new LoginCommand({
      email: dto.email,
      password: dto.password,
    });
  }
}
