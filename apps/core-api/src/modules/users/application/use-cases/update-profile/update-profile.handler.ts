import { UnitOfWork } from 'libs/db/unit-of-work';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PROFILE_REPOSITORY } from '../../../di-tokens';
import { Profile } from '../../../domain/aggregates/profile.aggregate';
import { type ProfileRepositoryPort } from '../../ports/profile-repository.port';
import { UpdateProfileCommand } from './update-profile.command';

@Injectable()
export class UpdateProfileHandler {
  private readonly logger = new Logger(UpdateProfileHandler.name);

  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepositoryPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<Profile> {
    const result = await this.unitOfWork.withTransaction(async (tx) => {
      const profileRepo = this.profileRepository.withTransaction(
        tx,
        this.unitOfWork,
      );

      const profile = await profileRepo.findByUserId(command.userId);
      if (!profile) {
        throw new NotFoundException(
          `Profile for user "${command.userId}" not found`,
        );
      }

      // Update display info if any provided
      if (
        command.displayName !== undefined ||
        command.avatarUrl !== undefined ||
        command.bio !== undefined
      ) {
        profile.updateDisplayInfo({
          displayName: command.displayName,
          avatarUrl: command.avatarUrl,
          bio: command.bio,
        });
      }

      // Update preferences if any provided
      if (command.timezone !== undefined || command.locale !== undefined) {
        profile.updatePreferences({
          timezone: command.timezone,
          locale: command.locale,
        });
      }

      // Update notification preferences if provided
      if (command.notificationPreferences) {
        profile.updateNotificationPreferences(command.notificationPreferences);
      }

      const savedProfile = await profileRepo.save(profile);
      this.logger.log(`Profile updated for user "${command.userId}"`);
      return savedProfile;
    });

    return result;
  }
}
