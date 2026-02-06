import { Inject, Injectable, Logger } from '@nestjs/common';

import type {
  AuthenticatedUser,
  IUserResolver,
} from '../../../auth/types/auth-options.interface';
import {
  FIREBASE_AUTH,
  RAW_ACCOUNT_REPOSITORY,
  RAW_USER_REPOSITORY,
} from '../../di-tokens';
import { type AccountRepositoryPort } from '../ports/account-repository.port';
import { type FirebaseAuthPort } from '../ports/firebase-auth.port';
import { type UserRepositoryPort } from '../ports/user-repository.port';
import { UserRegistrationService } from './user-registration.service';

/**
 * User Resolver Service
 *
 * Implements IUserResolver from the auth module to provide "just-in-time"
 * user provisioning for Firebase-authenticated users.
 *
 * When a valid Firebase token is received but no corresponding user exists
 * in the database, this service creates the user, account, and profile.
 *
 * This enables a simpler signup flow where:
 * 1. User registers with Firebase SDK (client-side)
 * 2. User makes their first API request
 * 3. Backend automatically provisions the user on first request
 */
@Injectable()
export class UserResolverService implements IUserResolver {
  private readonly logger = new Logger(UserResolverService.name);

  constructor(
    @Inject(RAW_USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(RAW_ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(FIREBASE_AUTH)
    private readonly firebaseAuth: FirebaseAuthPort,
    private readonly userRegistrationService: UserRegistrationService,
  ) {}

  /**
   * Resolves a user from their Firebase provider ID.
   *
   * If the user already exists (linked via account), returns their info.
   * If not, provisions a new user with their Firebase data.
   *
   * @param providerId - The Firebase user's UID
   * @param claims - Token claims (email, name, etc.)
   * @returns AuthenticatedUser for attachment to request
   */
  async resolveUser(
    providerId: string,
    claims: Record<string, unknown>,
  ): Promise<AuthenticatedUser> {
    // First, check if an account with this Firebase UID already exists
    const existingAccount =
      await this.accountRepository.findByProviderAccountId(providerId);

    if (existingAccount) {
      // User already exists, fetch their data
      const user = await this.userRepository.findById(existingAccount.userId);

      if (!user) {
        // This shouldn't happen - orphaned account
        this.logger.warn(
          `Orphaned account found for Firebase UID: ${providerId}`,
        );
        throw new Error('User account is in an inconsistent state');
      }

      return {
        id: user.id,
        providerId,
        email: user.email,
        emailVerified: user.emailVerified,
        roles: user.roles,
      };
    }

    // User doesn't exist, provision them
    return this.provisionNewUser(providerId, claims);
  }

  /**
   * Provisions a new user based on their Firebase account data.
   */
  private async provisionNewUser(
    providerId: string,
    claims: Record<string, unknown>,
  ): Promise<AuthenticatedUser> {
    this.logger.log(
      `Auto-provisioning new user for Firebase UID: ${providerId}`,
    );

    // Get Firebase user data for complete profile
    const firebaseUser = await this.firebaseAuth.getUser(providerId);

    if (!firebaseUser.email) {
      throw new Error('Firebase user must have an email address');
    }

    // Check if email already exists (edge case: different Firebase account, same email)
    if (await this.userRepository.existsByEmail(firebaseUser.email)) {
      this.logger.warn(
        `Email ${firebaseUser.email} already exists in database but has different Firebase UID`,
      );
      throw new Error('An account with this email already exists');
    }

    // Create user, account, and profile using the shared service
    const result = await this.userRegistrationService.createUserWithFirebase({
      firebaseUser,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName ?? (claims.name as string),
    });

    this.logger.log(
      `Successfully provisioned user ${result.user.id} for email: ${firebaseUser.email}`,
    );

    return {
      id: result.user.id,
      providerId,
      email: result.user.email,
      emailVerified: result.user.emailVerified,
      roles: result.user.roles,
    };
  }
}
