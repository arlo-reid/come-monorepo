import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';

import { FIREBASE_AUTH, RAW_USER_REPOSITORY } from '../../../di-tokens';
import { Account } from '../../../domain/aggregates/account.aggregate';
import { Profile } from '../../../domain/aggregates/profile.aggregate';
import { User } from '../../../domain/aggregates/user.aggregate';
import { type FirebaseAuthPort } from '../../ports/firebase-auth.port';
import { type UserRepositoryPort } from '../../ports/user-repository.port';
import { UserRegistrationService } from '../../services/user-registration.service';
import { RegisterUserCommand } from './register-user.command';

export interface RegisterUserResult {
  user: User;
  account: Account;
  profile: Profile;
}

@Injectable()
export class RegisterUserHandler {
  private readonly logger = new Logger(RegisterUserHandler.name);

  constructor(
    @Inject(RAW_USER_REPOSITORY)
    private readonly rawUserRepository: UserRepositoryPort,
    @Inject(FIREBASE_AUTH)
    private readonly firebaseAuth: FirebaseAuthPort,
    private readonly userRegistrationService: UserRegistrationService,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    // Check if email already exists in our database
    if (await this.rawUserRepository.existsByEmail(command.email)) {
      throw new ConflictException(
        `User with email "${command.email}" already exists`,
      );
    }

    // Create user in Firebase first (outside transaction)
    const firebaseUser = await this.firebaseAuth.createUser({
      email: command.email,
      password: command.password,
      displayName: command.displayName,
    });

    this.logger.log(`Created Firebase user: ${firebaseUser.uid}`);

    try {
      // Create user, account, and profile using shared service
      return await this.userRegistrationService.createUserWithFirebase({
        firebaseUser,
        email: command.email,
        displayName: command.displayName,
      });
    } catch (error) {
      // Rollback: Delete Firebase user if database operation fails
      this.logger.warn(
        `Rolling back Firebase user creation for ${firebaseUser.uid}`,
      );
      try {
        await this.firebaseAuth.deleteUser(firebaseUser.uid);
      } catch (deleteError) {
        this.logger.error(
          `Failed to rollback Firebase user: ${(deleteError as Error).message}`,
        );
      }
      throw error;
    }
  }
}
