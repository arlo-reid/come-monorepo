import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  ACCOUNT_REPOSITORY,
  FIREBASE_AUTH,
  USER_REPOSITORY,
} from '../../../di-tokens';
import { User } from '../../../domain/aggregates/user.aggregate';
import { type AccountRepositoryPort } from '../../ports/account-repository.port';
import { type FirebaseAuthPort } from '../../ports/firebase-auth.port';
import { type UserRepositoryPort } from '../../ports/user-repository.port';
import { UpdateRolesCommand } from './update-roles.command';

/**
 * Update Roles Handler
 *
 * Updates the roles of a user.
 * Authorization check (SYSTEM_ADMIN required) is performed at the controller level.
 */
@Injectable()
export class UpdateRolesHandler {
  private readonly logger = new Logger(UpdateRolesHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(FIREBASE_AUTH)
    private readonly firebaseAuth: FirebaseAuthPort,
  ) {}

  async execute(command: UpdateRolesCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);

    if (!user) {
      throw new NotFoundException(`User with ID "${command.userId}" not found`);
    }

    // Get current roles for logging
    const previousRoles = [...user.roles];

    // Clear existing roles and set new ones
    for (const role of previousRoles) {
      user.removeRole(role);
    }
    for (const role of command.roles) {
      user.addRole(role);
    }

    // Save updated user
    await this.userRepository.save(user);

    // Update Firebase custom claims with new roles
    // Use the user's primary account to find their Firebase UID
    if (user.primaryAccountId) {
      const account = await this.accountRepository.findById(
        user.primaryAccountId,
      );
      if (account) {
        await this.firebaseAuth.setCustomClaims(account.providerAccountId, {
          userId: user.id,
          roles: command.roles,
        });
      }
    }

    this.logger.log(
      `Updated roles for user ${user.id}: [${previousRoles.join(', ')}] -> [${command.roles.join(', ')}]`,
    );

    return user;
  }
}
