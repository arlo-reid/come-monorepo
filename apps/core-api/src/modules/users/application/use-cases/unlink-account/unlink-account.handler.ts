import { UnitOfWork } from 'libs/db/unit-of-work';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ACCOUNT_REPOSITORY, USER_REPOSITORY } from '../../../di-tokens';
import { type AccountRepositoryPort } from '../../ports/account-repository.port';
import { type UserRepositoryPort } from '../../ports/user-repository.port';
import { UnlinkAccountCommand } from './unlink-account.command';

@Injectable()
export class UnlinkAccountHandler {
  private readonly logger = new Logger(UnlinkAccountHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: UnlinkAccountCommand): Promise<void> {
    await this.unitOfWork.withTransaction(async (tx) => {
      const userRepo = this.userRepository.withTransaction(tx, this.unitOfWork);
      const accountRepo = this.accountRepository.withTransaction(
        tx,
        this.unitOfWork,
      );

      // Find the account to unlink
      const account = await accountRepo.findByUserIdAndProvider(
        command.userId,
        command.providerType,
      );
      if (!account) {
        throw new NotFoundException('Account not found');
      }

      // Ensure user has at least one other account
      const allAccounts = await accountRepo.findAllByUserId(command.userId);
      if (allAccounts.length <= 1) {
        throw new BadRequestException(
          'Cannot unlink the only authentication method',
        );
      }

      // If this is the primary account, update user to use another
      const user = await userRepo.findById(command.userId);
      if (user && user.primaryAccountId === account.id) {
        const otherAccount = allAccounts.find((a) => a.id !== account.id);
        if (otherAccount) {
          user.setPrimaryAccount(otherAccount.id);
          await userRepo.save(user);
        }
      }

      // Trigger domain event before delete
      account.unlink();

      // Delete the account
      await accountRepo.delete(account.id);

      this.logger.log(
        `Unlinked ${command.providerType} account from user ${command.userId}`,
      );
    });
  }
}
