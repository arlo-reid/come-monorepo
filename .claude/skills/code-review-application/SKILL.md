---
name: code-review-application
description: Review application layer code (use cases, command/query handlers, ports, event handlers) for CQRS patterns, proper orchestration, and dependency direction.
allowed-tools: Read, Glob, Grep
---

# Application Layer Code Review

Review application layer code for proper use case orchestration, CQRS patterns, and hexagonal architecture compliance.

## When to Use

- Reviewing use case handlers (commands/queries)
- Reviewing command and query objects
- Reviewing repository ports (interfaces)
- Reviewing event handlers
- Reviewing application services

## Application Layer Location

`apps/core-api/src/modules/{context}/application/`

## Structure

```
application/
├── use-cases/
│   ├── {action}-{entity}/
│   │   ├── {action}-{entity}.command.ts    # Command object
│   │   └── {action}-{entity}.handler.ts    # Handler
│   └── {query-name}/
│       ├── {query-name}.query.ts           # Query object
│       └── {query-name}.handler.ts         # Handler
├── event-handlers/
│   └── {entity}-{action}ed.event-handler.ts
├── ports/
│   └── {entity}-repository.port.ts
└── services/                               # (optional)
    └── {domain}-application.service.ts
```

---

## Review Checklist

### Commands & Queries

**Command Structure:**

- [ ] Named with action verb: `{Action}{Entity}Command`
- [ ] Has Props interface: `{Action}{Entity}CommandProps`
- [ ] Uses typed object constructor (not positional args)
- [ ] Properties are `public readonly`
- [ ] Contains only data needed for the operation

**Query Structure:**

- [ ] Named descriptively: `{QueryName}Query`
- [ ] Has Props interface with defaults where appropriate
- [ ] Includes pagination helpers if paginated (offset getter)
- [ ] Contains filtering/sorting parameters

**Common Issues:**

```typescript
// BAD - positional arguments
export class CreateOrganisationCommand {
  constructor(
    public readonly name: string,
    public readonly slug?: string,
  ) {}
}

// GOOD - typed object parameter
export interface CreateOrganisationCommandProps {
  name: string;
  slug?: string;
}

export class CreateOrganisationCommand {
  public readonly name: string;
  public readonly slug?: string;

  constructor(props: CreateOrganisationCommandProps) {
    this.name = props.name;
    this.slug = props.slug;
  }
}
```

---

### Use Case Handlers

**Structure:**

- [ ] Uses `@Injectable()` decorator
- [ ] Injects repository via DI token, typed as port
- [ ] Injects `UnitOfWork` for transactional operations
- [ ] Has single public `execute()` method
- [ ] Named: `{Action}{Entity}Handler`

**Transaction Pattern:**

- [ ] Mutations wrapped in `unitOfWork.withTransaction()`
- [ ] Repository bound to transaction via `withTransaction(tx, unitOfWork)`
- [ ] UoW passed to enable post-commit event publishing
- [ ] Only uses transactional repo inside callback

**Domain Interaction:**

- [ ] Orchestrates domain logic, doesn't contain it
- [ ] Calls aggregate factory methods and behavior methods
- [ ] Handles application-level concerns (validation, authorization)
- [ ] Returns domain entity or void (not DTOs)

**Error Handling:**

- [ ] Uses NestJS HTTP exceptions where appropriate
- [ ] Throws `NotFoundException` for missing entities
- [ ] Throws `ConflictException` for uniqueness violations
- [ ] Domain errors caught and translated

**Example Pattern:**

```typescript
@Injectable()
export class CreateOrganisationHandler {
  constructor(
    @Inject(ORGANISATION_REPOSITORY)
    private readonly repository: OrganisationRepositoryPort,  // Port type, not impl
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: CreateOrganisationCommand): Promise<Organisation> {
    return await this.unitOfWork.withTransaction(async (tx) => {
      const repoWithTx = this.repository.withTransaction(tx, this.unitOfWork);

      // Check invariants
      if (await repoWithTx.existsBySlug(command.slug)) {
        throw new ConflictException('Slug already exists');
      }

      // Create via aggregate factory
      const entity = Entity.create({ ... });

      // Persist
      await repoWithTx.save(entity);

      return entity;
    });
  }
}
```

**Common Issues:**

```typescript
// BAD - business logic in handler
async execute(command: UpdatePriceCommand) {
  const product = await this.repo.findById(command.id);
  product.props.price = command.price * 1.1;  // WRONG: tax logic here
  product.props.updatedAt = new Date();
}

// GOOD - delegate to aggregate
async execute(command: UpdatePriceCommand) {
  const product = await this.repo.findById(command.id);
  product.updatePrice(command.price);  // Aggregate handles logic
}
```

```typescript
// BAD - not using transaction
async execute(command: CreateCommand) {
  const entity = Entity.create({ ... });
  await this.repository.save(entity);  // Missing transaction wrapper
}

// GOOD - wrapped in transaction
async execute(command: CreateCommand) {
  return await this.unitOfWork.withTransaction(async (tx) => {
    const repoWithTx = this.repository.withTransaction(tx, this.unitOfWork);
    const entity = Entity.create({ ... });
    await repoWithTx.save(entity);
    return entity;
  });
}
```

```typescript
// BAD - using implementation type
constructor(
  private readonly repository: OrganisationWriteRepository,  // WRONG
) {}

// GOOD - using port interface
constructor(
  @Inject(ORGANISATION_REPOSITORY)
  private readonly repository: OrganisationRepositoryPort,  // Correct
) {}
```

---

### Repository Ports

**Structure:**

- [ ] Interface (not class) in `application/ports/`
- [ ] Named: `{Entity}RepositoryPort`
- [ ] Defines only methods needed by use cases
- [ ] Uses domain types (not DB types)
- [ ] Includes `withTransaction()` method

**Method Signatures:**

- [ ] `save(entity)` - upsert pattern
- [ ] `findById(id)` - single entity or null
- [ ] `findByX(x)` - custom lookups
- [ ] `existsByX(x)` - existence checks
- [ ] `withTransaction(tx, uow?)` - transaction binding

**Example Pattern:**

```typescript
import { UnitOfWork } from '@libs/db/unit-of-work';
import { Organisation } from '../../domain/aggregates/organisation.aggregate';

export interface OrganisationRepositoryPort {
  save(organisation: Organisation): Promise<Organisation | void>;
  findById(id: string): Promise<Organisation | null>;
  findBySlug(slug: string): Promise<Organisation | null>;
  existsBySlug(slug: string): Promise<boolean>;
  findAll(): Promise<Organisation[]>;
  withTransaction(tx: unknown, uow?: UnitOfWork): OrganisationRepositoryPort;
}
```

**Common Issues:**

```typescript
// BAD - using Prisma types
export interface UserRepositoryPort {
  findById(id: string): Promise<PrismaUser | null>;  // WRONG
}

// GOOD - using domain types
export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
}
```

```typescript
// BAD - missing withTransaction
export interface UserRepositoryPort {
  save(user: User): Promise<void>;
  // Missing transaction support!
}

// GOOD - includes transaction method
export interface UserRepositoryPort {
  save(user: User): Promise<void>;
  withTransaction(tx: unknown, uow?: UnitOfWork): UserRepositoryPort;
}
```

---

### Event Handlers

**Structure:**

- [ ] Uses `@EventsHandler(EventClass)` decorator
- [ ] Implements `IEventHandler<EventClass>`
- [ ] Located in `application/event-handlers/`
- [ ] Named: `{Entity}{Action}EventHandler`
- [ ] Has `handle(event)` method

**Handler Guidelines:**

- [ ] Keep handlers focused on single responsibility
- [ ] Use async/await for async operations
- [ ] Handle errors gracefully (don't break event flow)
- [ ] Log important operations

**Example Pattern:**

```typescript
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { OrganisationCreatedEvent } from '../../domain/events/organisation-created.event';

@EventsHandler(OrganisationCreatedEvent)
export class OrganisationCreatedEventHandler
  implements IEventHandler<OrganisationCreatedEvent>
{
  private readonly logger = new Logger(OrganisationCreatedEventHandler.name);

  async handle(event: OrganisationCreatedEvent): Promise<void> {
    this.logger.log(`Organisation created: ${event.payload.slug}`);
    // Trigger side effects: send emails, update read models, etc.
  }
}
```

**Common Issues:**

```typescript
// BAD - missing decorator
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  handle(event: UserCreatedEvent) { }  // Won't be invoked!
}

// GOOD - properly decorated
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  handle(event: UserCreatedEvent) { }
}
```

```typescript
// BAD - throwing unhandled errors
async handle(event: Event): Promise<void> {
  await this.emailService.send(...);  // Could throw and break event chain
}

// GOOD - handle errors gracefully
async handle(event: Event): Promise<void> {
  try {
    await this.emailService.send(...);
  } catch (error) {
    this.logger.error('Failed to send email', error);
    // Consider: dead letter queue, retry mechanism
  }
}
```

---

## Red Flags

### Critical Issues

1. **Business Logic in Handler** - Domain rules belong in aggregates
2. **Direct Repository Implementation** - Should inject via port interface
3. **Missing Transactions** - Mutations without UoW wrapper
4. **Infrastructure Imports** - Application importing from infrastructure
5. **DTO Returns** - Handler returning DTOs instead of domain entities

### Warnings

1. **Missing Event Handlers** - Domain events with no handlers
2. **Large Handlers** - Consider splitting into smaller use cases
3. **Hardcoded Values** - Should use configuration or constants
4. **Silent Failures** - Errors caught but not logged

---

## Dependency Direction

The application layer should:

**Import from:**
- Domain layer (aggregates, events, value objects)
- Shared libs (`@libs/db`, etc.)
- NestJS core (`@nestjs/common`, `@nestjs/cqrs`)

**NOT import from:**
- Infrastructure layer (repositories implementations)
- Interface layer (controllers, DTOs)
- External packages directly (use ports)

```
Interface -> Application -> Domain
              ↑
         Infrastructure
```

---

## Report Format

```markdown
## Application Layer Review: {ContextName}

### Files Reviewed
- {file1}
- {file2}

### Critical Issues
- **[CRITICAL]** {issue description} in {file}:{line}
  - Problem: {explanation}
  - Fix: {suggested fix}

### Warnings
- **[WARNING]** {issue description} in {file}:{line}
  - {explanation}

### Port Compliance
- All ports defined: {yes/no}
- Ports use domain types: {yes/no}
- Transaction support: {yes/no}

### Suggestions
- {suggestion for improvement}

### Compliance Score
- CQRS Pattern: {score}/10
- Transaction Handling: {score}/10
- Dependency Direction: {score}/10
- Overall: {score}/10
```
