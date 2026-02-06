import { IEvent } from '@nestjs/cqrs';

export class OrganisationDeletedEvent implements IEvent {
  constructor(
    public readonly payload: {
      id: string;
      slug: string;
      deletedAt: Date;
    },
  ) {}
}
