import { IEvent } from '@nestjs/cqrs';

export interface UserDeletedEventPayload {
  id: string;
  deletedAt: Date;
}

export class UserDeletedEvent implements IEvent {
  constructor(public readonly payload: UserDeletedEventPayload) {}
}
