import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { FIREBASE_AUTH, RAW_USER_REPOSITORY } from '../../../di-tokens';
import { User } from '../../../domain/aggregates/user.aggregate';
import type {
  FirebaseAuthPort,
  FirebaseSignInResult,
} from '../../ports/firebase-auth.port';
import type { UserRepositoryPort } from '../../ports/user-repository.port';
import { LoginCommand } from './login.command';

export interface LoginResult {
  user: User;
  auth: FirebaseSignInResult;
}

/**
 * Login Handler
 *
 * Authenticates a user with email and password via Firebase,
 * then retrieves the corresponding user from the database.
 */
@Injectable()
export class LoginHandler {
  private readonly logger = new Logger(LoginHandler.name);

  constructor(
    @Inject(FIREBASE_AUTH)
    private readonly firebaseAuth: FirebaseAuthPort,
    @Inject(RAW_USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    // Authenticate with Firebase (throws UnauthorizedException if invalid)
    const authResult = await this.firebaseAuth.signInWithPassword({
      email: command.email,
      password: command.password,
    });

    this.logger.debug(`User authenticated: ${authResult.localId}`);

    // Find the user in our database by email
    const user = await this.userRepository.findByEmail(command.email);

    if (!user) {
      // User exists in Firebase but not in our database
      // This shouldn't happen in normal flow, but handle gracefully
      this.logger.warn(
        `User authenticated but not found in database: ${command.email}`,
      );
      throw new NotFoundException(
        'User account not found. Please contact support.',
      );
    }

    return {
      user,
      auth: authResult,
    };
  }
}
