import { UnitOfWork } from 'libs/db/unit-of-work';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  ACCOUNT_REPOSITORY,
  FIREBASE_AUTH,
  USER_REPOSITORY,
} from '../../../di-tokens';
import { type AccountRepositoryPort } from '../../ports/account-repository.port';
import { type FirebaseAuthPort } from '../../ports/firebase-auth.port';
import { type UserRepositoryPort } from '../../ports/user-repository.port';
import { DeleteUserCommand } from './delete-user.command';

@Injectable()
export class DeleteUserHandler {
  private readonly logger = new Logger(DeleteUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(FIREBASE_AUTH)
    private readonly firebaseAuth: FirebaseAuthPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    // Capture accounts inside transaction to avoid race conditions,
    // but use them for Firebase cleanup outside transaction
    let accountsForFirebase: { providerAccountId: string }[] = [];

    // Soft delete user in database
    await this.unitOfWork.withTransaction(async (tx) => {
      const userRepo = this.userRepository.withTransaction(tx, this.unitOfWork);
      const accountRepo = this.accountRepository.withTransaction(
        tx,
        this.unitOfWork,
      );

      const user = await userRepo.findById(command.userId);
      if (!user) {
        throw new NotFoundException(
          `User with id "${command.userId}" not found`,
        );
      }

      // Get all accounts for Firebase cleanup (inside transaction for consistency)
      const accounts = await accountRepo.findAllByUserId(command.userId);
      accountsForFirebase = accounts.map((a) => ({
        providerAccountId: a.providerAccountId,
      }));

      // Soft delete user (triggers UserDeletedEvent)
      user.delete();
      await userRepo.softDelete(user);
    });

    // Delete from Firebase (outside transaction - best effort)
    for (const account of accountsForFirebase) {
      try {
        await this.firebaseAuth.deleteUser(account.providerAccountId);
        this.logger.log(`Deleted Firebase user: ${account.providerAccountId}`);
      } catch (error) {
        // Log but don't fail - user might have been manually deleted from Firebase
        this.logger.warn(
          `Failed to delete Firebase user ${account.providerAccountId}: ${(error as Error).message}`,
        );
      }
    }
  }
}
