import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@repo/nestjs-config/service';
import { AppConfig } from 'config/app.config';

import {
  FIREBASE_AUTH,
  RAW_ACCOUNT_REPOSITORY,
  RAW_USER_REPOSITORY,
} from '../../../di-tokens';
import { User } from '../../../domain/aggregates/user.aggregate';
import { Role } from '../../../domain/value-objects/role.value-object';
import { type AccountRepositoryPort } from '../../ports/account-repository.port';
import { type FirebaseAuthPort } from '../../ports/firebase-auth.port';
import { type UserRepositoryPort } from '../../ports/user-repository.port';
import { UserRegistrationService } from '../../services/user-registration.service';
import { SeedAdminCommand } from './seed-admin.command';

export interface SeedAdminResult {
  created: boolean;
  user: User;
}

/**
 * Seed Admin Handler
 *
 * Creates the initial admin user from environment configuration.
 * Idempotent - skips if admin user already exists.
 */
@Injectable()
export class SeedAdminHandler {
  private readonly logger = new Logger(SeedAdminHandler.name);

  constructor(
    private readonly configService: ConfigService<AppConfig>,
    @Inject(RAW_USER_REPOSITORY)
    private readonly rawUserRepository: UserRepositoryPort,
    @Inject(RAW_ACCOUNT_REPOSITORY)
    private readonly rawAccountRepository: AccountRepositoryPort,
    @Inject(FIREBASE_AUTH)
    private readonly firebaseAuth: FirebaseAuthPort,
    private readonly userRegistrationService: UserRegistrationService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_command: SeedAdminCommand): Promise<SeedAdminResult> {
    const adminEmail = this.configService.config.ADMIN_EMAIL;
    const adminPassword = this.configService.config.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error(
        'ADMIN_EMAIL and ADMIN_PASSWORD must be configured to seed admin user',
      );
    }

    // Check if admin user already exists
    const existingUser = await this.rawUserRepository.findByEmail(adminEmail);
    if (existingUser) {
      this.logger.log(`Admin user already exists: ${adminEmail}`);

      // Ensure they have SYSTEM_ADMIN role
      if (!existingUser.isSystemAdmin) {
        existingUser.addRole(Role.SYSTEM_ADMIN);
        await this.rawUserRepository.save(existingUser);
        this.logger.log(`Added SYSTEM_ADMIN role to existing user`);
      }

      // Always update Firebase custom claims to ensure roles are synced
      if (existingUser.primaryAccountId) {
        const account = await this.rawAccountRepository.findById(
          existingUser.primaryAccountId,
        );
        if (account) {
          await this.firebaseAuth.setCustomClaims(account.providerAccountId, {
            userId: existingUser.id,
            roles: existingUser.roles,
          });
          this.logger.log(`Updated Firebase custom claims for admin user`);
        }
      }

      return { created: false, user: existingUser };
    }

    // Check if user exists in Firebase (may exist from previous failed attempt)
    let firebaseUser = await this.firebaseAuth.getUserByEmail(adminEmail);

    if (!firebaseUser) {
      // Create user in Firebase
      firebaseUser = await this.firebaseAuth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: 'System Admin',
      });
      this.logger.log(`Created Firebase user: ${firebaseUser.uid}`);
    } else {
      this.logger.log(`Found existing Firebase user: ${firebaseUser.uid}`);
    }

    // Create user, account, and profile using shared service
    const result = await this.userRegistrationService.createUserWithFirebase({
      firebaseUser,
      email: adminEmail,
      displayName: 'System Admin',
      roles: [Role.SYSTEM_ADMIN],
    });

    this.logger.log(`Admin user created successfully: ${adminEmail}`);

    return { created: true, user: result.user };
  }
}
