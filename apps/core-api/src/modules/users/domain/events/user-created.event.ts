import { IEvent } from '@nestjs/cqrs';

export interface UserCreatedEventPayload {
  id: string;
  email: string;
}

export class UserCreatedEvent implements IEvent {
  constructor(public readonly payload: UserCreatedEventPayload) {}
}
