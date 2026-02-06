import { Inject, Injectable } from '@nestjs/common';

import { PROFILE_REPOSITORY } from '../../../di-tokens';
import { Profile } from '../../../domain/aggregates/profile.aggregate';
import { type ProfileRepositoryPort } from '../../ports/profile-repository.port';
import { GetProfileQuery } from './get-profile.query';

@Injectable()
export class GetProfileHandler {
  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepositoryPort,
  ) {}

  async execute(query: GetProfileQuery): Promise<Profile | null> {
    return this.profileRepository.findByUserId(query.userId);
  }
}
