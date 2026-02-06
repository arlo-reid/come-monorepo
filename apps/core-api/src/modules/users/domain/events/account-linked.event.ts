import { IEvent } from '@nestjs/cqrs';

import { AuthProviderType } from '../value-objects/auth-provider.value-object';

export interface AccountLinkedEventPayload {
  id: string;
  userId: string;
  providerType: AuthProviderType;
  providerAccountId: string;
}

export class AccountLinkedEvent implements IEvent {
  constructor(public readonly payload: AccountLinkedEventPayload) {}
}
