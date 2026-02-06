import { EventBus, IEvent } from '@nestjs/cqrs';

/**
 * Minimal interface for Prisma-like clients that support transactions.
 * This allows the UnitOfWork to work without requiring @prisma/client to be installed.
 */
export interface TransactionalClient {
  $transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
}

export class UnitOfWork<
  TClient extends TransactionalClient = TransactionalClient,
> {
  private readonly pendingEvents: IEvent[] = [];

  constructor(
    public readonly db: TClient,
    private readonly eventBus: EventBus,
  ) {}

  /** Queue domain events to be published after successful commit */
  queue(events: Iterable<IEvent>) {
    for (const e of events) this.pendingEvents.push(e);
  }

  /** Execute a transaction and publish events only if it commits */
  async withTransaction<T>(fn: (tx: TClient) => Promise<T>): Promise<T> {
    const result = await this.db.$transaction(async (tx) => {
      const r = await fn(tx as TClient);
      return r;
    });
    if (this.pendingEvents.length) {
      await this.eventBus.publishAll(this.pendingEvents);
      this.pendingEvents.length = 0;
    }
    return result;
  }
}
