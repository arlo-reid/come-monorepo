import { Inject, Injectable } from '@nestjs/common';

import { USER_REPOSITORY } from '../../../di-tokens';
import { User } from '../../../domain/aggregates/user.aggregate';
import { type UserRepositoryPort } from '../../ports/user-repository.port';
import { GetUserByIdQuery } from './get-user-by-id.query';

@Injectable()
export class GetUserByIdHandler {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<User | null> {
    return this.userRepository.findById(query.userId);
  }
}
