import { IEvent } from '@nestjs/cqrs';

export interface ProfileUpdatedEventPayload {
  userId: string;
}

export class ProfileUpdatedEvent implements IEvent {
  constructor(public readonly payload: ProfileUpdatedEventPayload) {}
}
