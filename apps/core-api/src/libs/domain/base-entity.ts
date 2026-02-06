import { IEvent } from '@nestjs/cqrs';

/**
 * Props interface for BaseEntity common fields
 */
export interface BaseEntityProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Interface for entities that can emit domain events.
 * Used by repository base for event publishing.
 */
export interface HasDomainEvents {
  addDomainEvent(evt: IEvent): void;
  pullDomainEvents(): IEvent[];
  clearDomainEvents(): void;
}

/**
 * Base class for all domain entities and aggregates.
 * Provides common fields (id, timestamps) and domain event support.
 */
export abstract class BaseEntity {
  private _domainEvents: IEvent[] = [];

  // Common entity fields
  readonly id: string;
  readonly createdAt: Date;
  protected _updatedAt: Date;
  protected _deletedAt?: Date;

  protected constructor(props: BaseEntityProps) {
    this.id = props.id;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  get isDeleted(): boolean {
    return this._deletedAt !== undefined;
  }

  /**
   * Mark entity as updated (sets updatedAt to now)
   */
  protected markUpdated(): void {
    this._updatedAt = new Date();
  }

  /**
   * Mark entity as deleted (soft delete)
   */
  protected markDeleted(): void {
    if (this.isDeleted) return;
    const now = new Date();
    this._deletedAt = now;
    this._updatedAt = now;
  }

  addDomainEvent(evt: IEvent): void {
    this._domainEvents.push(evt);
  }

  pullDomainEvents(): IEvent[] {
    const copy = [...this._domainEvents];
    this._domainEvents = [];
    return copy;
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // default impl is a no-op; repos/UoW will call pull+publish.
  async publishEvents(): Promise<void> {
    /* intentionally empty */
  }
}
