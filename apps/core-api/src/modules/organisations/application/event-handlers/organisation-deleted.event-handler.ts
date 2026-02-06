import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { OrganisationDeletedEvent } from '../../domain/events/organisation-deleted.event';

@EventsHandler(OrganisationDeletedEvent)
export class OrganisationDeletedEventHandler implements IEventHandler<OrganisationDeletedEvent> {
  private readonly logger = new Logger(OrganisationDeletedEventHandler.name);

  handle(event: OrganisationDeletedEvent): void {
    this.logger.log(
      `Organisation deleted: ${event.payload.slug} at ${event.payload.deletedAt.toISOString()}`,
    );
  }
}
