import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { OrganisationCreatedEvent } from '../../domain/events/organisation-created.event';

@EventsHandler(OrganisationCreatedEvent)
export class OrganisationCreatedEventHandler implements IEventHandler<OrganisationCreatedEvent> {
  private readonly logger = new Logger(OrganisationCreatedEventHandler.name);

  handle(event: OrganisationCreatedEvent): void {
    this.logger.log(`Organisation created: ${event.payload.slug}`);
  }
}
