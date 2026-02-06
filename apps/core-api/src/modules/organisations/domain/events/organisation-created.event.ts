import { IEvent } from '@nestjs/cqrs';

export class OrganisationCreatedEvent implements IEvent {
  constructor(
    public readonly payload: {
      id: string;
      name: string;
      slug: string;
      ownerId: string;
    },
  ) {}
}
