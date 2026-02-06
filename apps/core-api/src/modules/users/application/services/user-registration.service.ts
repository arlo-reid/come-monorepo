import { RAW_UNIT_OF_WORK } from 'libs/db/db.providers';
import { UnitOfWork } from 'libs/db/unit-of-work';
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  FIREBASE_AUTH,
  RAW_ACCOUNT_REPOSITORY,
  RAW_PROFILE_REPOSITORY,
  RAW_USER_REPOSITORY,
} from '../../di-tokens';
import { Account } from '../../domain/aggregates/account.aggregate';
import { Profile } from '../../domain/aggregates/profile.aggregate';
import { User } from '../../domain/aggregates/user.aggregate';
import { AuthProviderType } from '../../domain/value-objects/auth-provider.value-object';
import { Role } from '../../domain/value-objects/role.value-object';
import { type AccountRepositoryPort } from '../ports/account-repository.port';
import {
  type FirebaseAuthPort,
  type FirebaseUserRecord,
} from '../ports/firebase-auth.port';
import { type ProfileRepositoryPort } from '../ports/profile-repository.port';
import { type UserRepositoryPort } from '../ports/user-repository.port';

export interface CreateUserWithFirebaseParams {
  firebaseUser: FirebaseUserRecord;
  email: string;
  displayName?: string;
  roles?: Role[];
}

export interface CreateUserResult {
  user: User;
  account: Account;
  profile: Profile;
}

/**
 * User Registration Service
 *
 * Domain service that handles the core user creation logic shared between
 * different registration flows (public registration, admin seeding, etc.)
 */
@Injectable()
export class UserRegistrationService {
  private readonly logger = new Logger(UserRegistrationService.name);

  constructor(
    @Inject(RAW_USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(RAW_ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(RAW_PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepositoryPort,
    @Inject(FIREBASE_AUTH)
    private readonly firebaseAuth: FirebaseAuthPort,
    @Inject(RAW_UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * Creates a user with associated account and profile in a single transaction.
   * Assumes the Firebase user has already been created.
   */
  async createUserWithFirebase(
    params: CreateUserWithFirebaseParams,
  ): Promise<CreateUserResult> {
    const { firebaseUser, email, displayName, roles = [] } = params;

    const result = await this.unitOfWork.withTransaction(async (tx) => {
      const userRepo = this.userRepository.withTransaction(tx, this.unitOfWork);
      const accountRepo = this.accountRepository.withTransaction(
        tx,
        this.unitOfWork,
      );
      const profileRepo = this.profileRepository.withTransaction(
        tx,
        this.unitOfWork,
      );

      // Create User aggregate
      const user = User.create({
        email,
        emailVerified: firebaseUser.emailVerified,
        roles,
      });
      const savedUser = await userRepo.create(user);

      // Create Account aggregate
      const account = Account.create({
        userId: savedUser.id,
        providerType: AuthProviderType.EMAIL_PASSWORD,
        providerAccountId: firebaseUser.uid,
        providerEmail: firebaseUser.email,
        providerDisplayName: firebaseUser.displayName,
      });
      const savedAccount = await accountRepo.create(account);

      // Create Profile aggregate
      const profile = Profile.create({
        userId: savedUser.id,
        displayName: displayName ?? firebaseUser.displayName,
      });
      const savedProfile = await profileRepo.create(profile);

      // Set primary account
      savedUser.setPrimaryAccount(savedAccount.id);
      await userRepo.save(savedUser);

      return {
        user: savedUser,
        account: savedAccount,
        profile: savedProfile,
      };
    });

    // Set custom claims in Firebase
    await this.firebaseAuth.setCustomClaims(firebaseUser.uid, {
      userId: result.user.id,
      roles,
    });

    this.logger.log(`User created successfully: ${email}`);

    return result;
  }
}
