import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { AccountLinkedEvent } from '../../domain/events/account-linked.event';

@EventsHandler(AccountLinkedEvent)
export class AccountLinkedEventHandler implements IEventHandler<AccountLinkedEvent> {
  private readonly logger = new Logger(AccountLinkedEventHandler.name);

  handle(event: AccountLinkedEvent): void {
    this.logger.log(
      `Account linked: ${event.payload.providerType} for user ${event.payload.userId}`,
    );
    // Could trigger: notification, security audit log, etc.
  }
}
