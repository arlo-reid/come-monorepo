import { UnitOfWork } from 'libs/db/unit-of-work';
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ACCOUNT_REPOSITORY, USER_REPOSITORY } from '../../../di-tokens';
import { Account } from '../../../domain/aggregates/account.aggregate';
import { type AccountRepositoryPort } from '../../ports/account-repository.port';
import { type UserRepositoryPort } from '../../ports/user-repository.port';
import { LinkAccountCommand } from './link-account.command';

@Injectable()
export class LinkAccountHandler {
  private readonly logger = new Logger(LinkAccountHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: LinkAccountCommand): Promise<Account> {
    const result = await this.unitOfWork.withTransaction(async (tx) => {
      const userRepo = this.userRepository.withTransaction(tx, this.unitOfWork);
      const accountRepo = this.accountRepository.withTransaction(
        tx,
        this.unitOfWork,
      );

      // Verify user exists
      const user = await userRepo.findById(command.userId);
      if (!user) {
        throw new NotFoundException(
          `User with id "${command.userId}" not found`,
        );
      }

      // Check if provider account already linked to any user
      const existingAccount = await accountRepo.findByProviderAccountId(
        command.providerAccountId,
      );
      if (existingAccount) {
        throw new ConflictException(
          'This provider account is already linked to a user',
        );
      }

      // Check if user already has this provider type linked
      const existingUserProvider = await accountRepo.findByUserIdAndProvider(
        command.userId,
        command.providerType,
      );
      if (existingUserProvider) {
        throw new ConflictException(
          `User already has a ${command.providerType} account linked`,
        );
      }

      // Create and save account
      const account = Account.create({
        userId: command.userId,
        providerType: command.providerType,
        providerAccountId: command.providerAccountId,
        providerEmail: command.providerEmail,
        providerDisplayName: command.providerDisplayName,
        providerPhotoUrl: command.providerPhotoUrl,
      });

      const savedAccount = await accountRepo.save(account);
      this.logger.log(
        `Linked ${command.providerType} account to user ${command.userId}`,
      );
      return savedAccount;
    });

    return result;
  }
}
