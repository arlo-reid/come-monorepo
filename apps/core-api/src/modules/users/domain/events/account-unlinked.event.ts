import { IEvent } from '@nestjs/cqrs';

import { AuthProviderType } from '../value-objects/auth-provider.value-object';

export interface AccountUnlinkedEventPayload {
  id: string;
  userId: string;
  providerType: AuthProviderType;
}

export class AccountUnlinkedEvent implements IEvent {
  constructor(public readonly payload: AccountUnlinkedEventPayload) {}
}
