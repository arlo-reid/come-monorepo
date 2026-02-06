import { UnitOfWork } from 'libs/db/unit-of-work';

/**
 * Result of a paginated query.
 */
export interface PagedResult<TEntity> {
  items: TEntity[];
  total: number;
}

/**
 * Options for paginated queries.
 */
export interface PaginationOptions {
  limit: number;
  offset: number;
  where?: unknown;
  distinct?: unknown;
}

/**
 * Generic Repository Port Base Interface
 *
 * Defines the standard CRUD contract for repository ports.
 * Owned by the application layer, implemented by infrastructure.
 *
 * @template TEntity - The domain entity type
 * @template TId - The entity identifier type (defaults to string)
 */
export interface RepositoryPortBase<TEntity, TId = string> {
  // ----------- Create Operations -----------

  /**
   * Create a new entity in the repository.
   * @param entity - The entity to create
   * @returns The created entity
   */
  create(entity: TEntity): Promise<TEntity>;

  // ----------- Read Operations -----------

  /**
   * Find an entity by its unique identifier.
   * @param id - The entity identifier
   * @returns The entity if found, null otherwise
   */
  findById(id: TId): Promise<TEntity | null>;

  /**
   * Find a single entity matching the given criteria.
   * @param args - Query arguments (where, select, include, etc.)
   * @returns The entity if found, null otherwise
   */
  findUnique(args: unknown): Promise<TEntity | null>;

  /**
   * Find the first entity matching the given criteria.
   * @param args - Query arguments (where, orderBy, etc.)
   * @returns The first matching entity, or null if none found
   */
  findFirst(args?: unknown): Promise<TEntity | null>;

  /**
   * Find multiple entities matching the given criteria.
   * @param args - Query arguments (where, orderBy, take, skip, etc.)
   * @returns Array of matching entities
   */
  findMany(args?: unknown): Promise<TEntity[]>;

  /**
   * Find entities with pagination support.
   * @param options - Pagination options (limit, offset, where, distinct)
   * @returns Paginated result with items and total count
   */
  findAllPaged(options: PaginationOptions): Promise<PagedResult<TEntity>>;

  /**
   * Count entities matching the given criteria.
   * @param args - Query arguments (where, etc.)
   * @returns The count of matching entities
   */
  count(args?: unknown): Promise<number>;

  // ----------- Update Operations -----------

  /**
   * Update an existing entity.
   * @param entity - The entity with updated values
   * @returns The updated entity
   */
  update(entity: TEntity): Promise<TEntity>;

  /**
   * Save (upsert) an entity - creates if new, updates if exists.
   * @param entity - The entity to save
   * @returns The saved entity
   */
  save(entity: TEntity): Promise<TEntity>;

  /**
   * Upsert an entity - creates if not exists, updates if exists.
   * Alias for save() with explicit upsert semantics.
   * @param entity - The entity to upsert
   * @returns The upserted entity
   */
  upsert(entity: TEntity): Promise<TEntity>;

  // ----------- Delete Operations -----------

  /**
   * Delete an entity by its identifier or entity instance.
   * @param entityOrId - The entity or its identifier
   */
  delete(entityOrId: TEntity | TId): Promise<void>;

  /**
   * Soft delete an entity by its identifier or entity instance.
   * Marks the entity as deleted without removing it from the data store.
   * @param entityOrId - The entity or its identifier
   */
  softDelete(entityOrId: TEntity | TId): Promise<void>;

  // ----------- Transaction Support -----------

  /**
   * Bind repository to a transaction client.
   * Pass UnitOfWork to queue events for post-commit publish.
   *
   * @param tx - The transaction client
   * @param uow - Optional UnitOfWork for event queueing
   * @returns A new repository instance bound to the transaction
   */
  withTransaction(
    tx: unknown,
    uow?: UnitOfWork,
  ): RepositoryPortBase<TEntity, TId>;
}
