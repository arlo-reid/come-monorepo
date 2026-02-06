import type {
  PagedResult,
  PaginationOptions,
} from 'libs/application/repository-port.base';
import type { HasDomainEvents } from 'libs/domain/base-entity';
import { EventBus } from '@nestjs/cqrs';

import { UnitOfWork } from './unit-of-work';

/**
 * Minimal delegate interface for ZenStack v3 model operations.
 *
 * Uses `any` for args and return types to accommodate ZenStack's complex
 * generic types (SelectSubset, ZenStackPromise, etc.) which cannot be
 * represented in a generic interface. The repository base handles mapping
 * raw DB rows to domain entities via toDomain().
 */
export type MinimalDelegate = {
  findUnique(args?: any): Promise<any>;
  findFirst(args?: any): Promise<any>;
  findMany(args?: any): Promise<any[]>;
  count(args?: any): Promise<number>;
  create(args: { data: any }): Promise<any>;
  update(args: { where: any; data: any }): Promise<any>;
  delete(args: { where: any }): Promise<any>;
};

export abstract class ZenStackRepositoryBase<
  TClient,
  TEntity extends HasDomainEvents,
  TId,
  TDelegate extends MinimalDelegate = MinimalDelegate,
> {
  /** UoW is set contextually via withTransaction(), not at construction */
  protected uow?: UnitOfWork;

  protected constructor(
    protected client: TClient,
    /** EventBus for standalone usage (outside transactions) */
    protected readonly eventBus?: EventBus,
  ) {}

  /** Concrete repos must point to the ZenStack model delegate */
  protected abstract getDelegate(client: TClient): TDelegate;

  /** Map DB record -> domain entity */
  protected abstract toDomain(row: unknown): TEntity;

  /** Map domain entity -> DB json (ZenStack data) */
  protected abstract toPersistence(entity: TEntity): unknown;

  /**
   * Override to enable soft-delete filtering.
   * When true, all read operations will automatically exclude records where deletedAt is not null.
   * Default: false (no soft-delete filtering)
   */
  protected get supportsSoftDelete(): boolean {
    return false;
  }

  /** Hook point if you need to do something extra after save/delete */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected afterPersist(_entity: TEntity): Promise<void> {
    return Promise.resolve();
  }

  protected get delegate(): TDelegate {
    return this.getDelegate(this.client);
  }

  /** Bind this repo to a ZenStack transaction client, optionally with UoW for event queueing */
  withTransaction(tx: TClient, uow?: UnitOfWork): this {
    const clone = Object.create(this) as this;
    clone.client = tx;
    clone.uow = uow;
    return clone;
  }

  // ----------- CRUD helpers -----------

  async findById(id: TId): Promise<TEntity | null> {
    const args = { where: { id } };
    const row: unknown = await this.delegate.findUnique(args);
    return row ? this.toDomain(row) : null;
  }

  async findMany(args?: { where?: unknown }): Promise<TEntity[]> {
    const rows = await this.delegate.findMany(args);
    return rows.map((r: unknown) => this.toDomain(r));
  }

  async findAllPaged(
    options: PaginationOptions,
  ): Promise<PagedResult<TEntity>> {
    const { limit, offset, where, distinct } = options;
    const baseArgs = { where, distinct };

    const [rows, total] = await Promise.all([
      this.delegate.findMany({
        ...baseArgs,
        take: limit,
        skip: offset,
      }),
      this.delegate.count(baseArgs),
    ]);

    return { items: rows.map((r: unknown) => this.toDomain(r)), total };
  }

  /**
   * @deprecated Use findAllPaged instead
   */
  async findAllPaginated(
    limit: number,
    offset: number,
    args?: { where?: unknown; distinct?: unknown },
  ): Promise<PagedResult<TEntity>> {
    return this.findAllPaged({
      limit,
      offset,
      where: args?.where,
      distinct: args?.distinct,
    });
  }

  async findFirst(args?: { where?: unknown }): Promise<TEntity | null> {
    const row: unknown = await this.delegate.findFirst(args);
    return row ? this.toDomain(row) : null;
  }

  async findUnique(args: { where: unknown }): Promise<TEntity | null> {
    const row: unknown = await this.delegate.findUnique(args);
    return row ? this.toDomain(row) : null;
  }

  async count(args?: { where?: unknown }): Promise<number> {
    return await this.delegate.count(args);
  }

  /**
   * Upsert-style save: creates if entity doesn't exist, updates otherwise.
   * Uses ZenStack's upsert semantics via update-or-create pattern.
   */
  async save(entity: TEntity & { id: TId }): Promise<TEntity> {
    const data = this.toPersistence(entity);

    let row: unknown;
    try {
      row = await this.delegate.update({
        where: { id: entity.id },
        data,
      });
    } catch {
      // ZenStack throws NotFoundError if record doesn't exist; create instead
      row = await this.delegate.create({ data });
    }

    const saved = this.toDomain(row);
    await this.publishAndAfter(entity);
    return saved;
  }

  async create(entity: TEntity): Promise<TEntity> {
    const data = this.toPersistence(entity);
    const row: unknown = await this.delegate.create({ data });
    const created = this.toDomain(row);
    await this.publishAndAfter(entity);
    return created;
  }

  async update(entity: TEntity & { id: TId }): Promise<TEntity> {
    const data = this.toPersistence(entity);
    const row: unknown = await this.delegate.update({
      where: { id: entity.id },
      data,
    });
    const updated = this.toDomain(row);
    await this.publishAndAfter(entity);
    return updated;
  }

  /**
   * Upsert an entity - alias for save() with explicit upsert semantics.
   */
  async upsert(entity: TEntity & { id: TId }): Promise<TEntity> {
    return this.save(entity);
  }

  async delete(entityOrId: TEntity | TId): Promise<void> {
    const id =
      typeof entityOrId === 'object'
        ? (entityOrId as { id: TId }).id
        : entityOrId;
    await this.delegate.delete({ where: { id } });
    if (typeof entityOrId === 'object') {
      await this.publishEvents(entityOrId as TEntity);
    }
  }

  /**
   * Soft delete an entity by setting deletedAt to now.
   *
   * ZenStack policies with @@deny('read', deletedAt != null) will cause the
   * update to throw when it tries to re-read the entity after update.
   * We catch this and verify the delete succeeded by checking if the entity
   * is still readable (if it is, the update was denied by policy).
   *
   * @throws Error if the soft delete was not allowed by policy
   */
  async softDelete(entityOrId: TEntity | TId): Promise<void> {
    const now = new Date();
    const id =
      typeof entityOrId === 'object'
        ? (entityOrId as { id: TId }).id
        : entityOrId;

    const deletedAt =
      typeof entityOrId === 'object'
        ? (entityOrId as { deletedAt: Date | null }).deletedAt || now
        : now;

    try {
      await this.delegate.update({
        where: {
          id: id,
        },
        data: { deletedAt },
      });
    } catch (error) {
      // ZenStack throws when @@deny('read', deletedAt != null) blocks re-read.
      // Check if entity is still readable - if so, update was denied by policy.
      const stillExists: unknown = await this.delegate.findUnique({
        where: { id },
      });
      if (stillExists) {
        throw error;
      }
      // Entity not readable means soft delete succeeded (@@deny kicked in)
    }

    if (typeof entityOrId === 'object') {
      await this.publishEvents(entityOrId as TEntity);
    }
  }

  // ----------- Event publishing plumbing -----------

  protected async publishAndAfter(entity: TEntity) {
    await this.publishEvents(entity);
    await this.afterPersist(entity);
  }

  protected async publishEvents(entityOrEntities: TEntity | TEntity[]) {
    const list = Array.isArray(entityOrEntities)
      ? entityOrEntities
      : [entityOrEntities];
    const allEvents = list.flatMap((e) => e.pullDomainEvents());

    if (!allEvents.length) return;

    if (this.uow) {
      // Inside transaction: queue events for publish after commit
      this.uow.queue(allEvents);
    } else if (this.eventBus) {
      // Standalone: publish immediately
      await this.eventBus.publishAll(allEvents);
    } else {
      // No publisher configured; requeue to avoid losing events
      list.forEach((e) => allEvents.forEach((evt) => e.addDomainEvent(evt)));
    }
  }
}

/**
 * @deprecated Use ZenStackRepositoryBase instead. This alias exists for backwards compatibility.
 */
export const PrismaRepositoryBase = ZenStackRepositoryBase;
