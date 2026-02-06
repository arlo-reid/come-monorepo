---
name: create-bounded-context
description: Create or extend bounded context modules for the core-api following hexagonal architecture with CQRS. Use when adding new domain modules (users, billing, products) OR extending existing contexts with new use cases, entities, endpoints, or domain events.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Bounded Context Module (Create & Extend)

Create or extend domain modules for the core-api following hexagonal architecture (ports & adapters) with CQRS.

## When to Use This Skill

**Creating a new context:**
- "Create a billing bounded context"
- "Add a new users module"
- "I need a products domain"

**Extending an existing context:**
- "Add an update endpoint to organisations"
- "Create a delete use case for users"
- "Add a new entity to billing"
- "Extend organisations with a 'members' relationship"
- "Add a query to list all organisations"

## Module Location

`apps/core-api/src/modules/{context-name}/`

## Architecture Overview

```
{context-name}/
├── application/
│   ├── use-cases/
│   │   ├── {action}-{entity}/
│   │   │   ├── {action}-{entity}.command.ts
│   │   │   └── {action}-{entity}.handler.ts
│   │   └── {query-name}/
│   │       ├── {query-name}.query.ts
│   │       └── {query-name}.handler.ts
│   ├── event-handlers/
│   └── ports/
│       └── {entity}-repository.port.ts
├── domain/
│   ├── aggregates/
│   │   └── {entity}.aggregate.ts
│   ├── entities/                      # (optional)
│   ├── events/
│   ├── value-objects/                 # (optional)
│   ├── services/                      # (optional)
│   └── errors/                        # (optional)
├── infrastructure/
│   ├── persistence/
│   │   ├── orm/
│   │   │   └── {entity}.zmodel        # ZenStack schema
│   │   ├── write-repositories/
│   │   ├── read-repositories/         # (optional)
│   │   └── {entity}.mapper.ts         # DB <-> Domain
│   ├── messaging/                     # (optional)
│   └── external-services/             # (optional)
├── interface/
│   ├── commands/
│   │   └── {action}-{entity}.command.http.ts
│   ├── queries/
│   │   └── {query-name}.query.http.ts
│   ├── mappers/                       # DTO <-> Domain (reusable)
│   │   ├── {entity}.request.mapper.ts
│   │   └── {entity}.response.mapper.ts
│   └── dtos/
├── di-tokens.ts
└── {context-name}.module.ts
```

## Core Dependencies

Located in `apps/core-api/src/libs/`. Import via path aliases (no barrel files):

```typescript
import { UnitOfWork } from '@libs/db/unit-of-work';
import { DbService, ENHANCED_DB } from '@libs/db/db.providers';
import { ZenStackRepositoryBase } from '@libs/db/repository-base';
import { BaseEntity } from '@libs/domain/base-entity';
```

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Aggregate | `{Entity}` | `Organisation` |
| Repository port | `{Entity}RepositoryPort` | `OrganisationRepositoryPort` |
| DI token | `{ENTITY}_REPOSITORY` | `ORGANISATION_REPOSITORY` |
| Handler | `{Action}{Entity}Handler` | `CreateOrganisationHandler` |
| Command | `{Action}{Entity}Command` | `CreateOrganisationCommand` |
| HTTP Controller | `{Action}{Entity}HttpController` | `CreateOrganisationHttpController` |
| Request DTO | `{Action}{Entity}RequestDto` | `CreateOrganisationRequestDto` |
| Response DTO | `{Entity}ResponseDto` | `OrganisationResponseDto` |
| Persistence Mapper | `{Entity}PersistenceMapper` | `OrganisationPersistenceMapper` |
| Request Mapper | `{Entity}RequestMapper` | `OrganisationRequestMapper` |
| Response Mapper | `{Entity}ResponseMapper` | `OrganisationResponseMapper` |
| Domain Event | `{Entity}{Action}Event` | `OrganisationCreatedEvent` |

## Mapper Types

| Mapper | Location | Purpose |
|--------|----------|---------|
| `{Entity}PersistenceMapper` | `infrastructure/persistence/` | DB record <-> Domain aggregate |
| `{Entity}RequestMapper` | `interface/mappers/` | Request DTO -> Domain command |
| `{Entity}ResponseMapper` | `interface/mappers/` | Domain entity -> Response DTO |

## Key Patterns

1. **UnitOfWork** - Wrap mutations in `uow.withTransaction()` for atomic commits + event publishing
2. **BaseEntity** - Aggregates extend this for domain events support
3. **ZenStackRepositoryBase** - Repositories extend for automatic event publishing
4. **Ports** - Defined in application layer, implemented in infrastructure
5. **withTransaction(tx, uow)** - Repositories bind to transaction context; pass UoW to queue events for post-commit publish
6. **EventBus injection** - Repositories inject EventBus for standalone usage (immediate publish when not in transaction)
7. **Typed delegates** - Use `DbService['{entity}']` for properly typed ZenStack model delegates
8. **Separated mappers** - Interface mappers are reusable across controllers

## ZenStack Schema

Each bounded context defines its own `.zmodel` file in `infrastructure/persistence/orm/`:

```zmodel
// {context-name}/infrastructure/persistence/orm/{entity}.zmodel
import '../../../../../libs/db/orm/base-entity.zmodel'

model {Entity} extends BaseEntity {
    // Entity-specific fields
    slug      String   @unique
    name      String

    @@map("{entities}")  // table name (plural, snake_case)
}
```

The base entity mixin (`@libs/db/orm/base-entity.zmodel`) provides:
- `id` - UUID primary key
- `createdAt` - Auto timestamp
- `updatedAt` - Auto timestamp

**After creating the zmodel**, add an import to the main schema:

```zmodel
// zenstack/schema.zmodel
import "../src/modules/{context-name}/infrastructure/persistence/orm/{entity}.zmodel"
```

## After Creating a New Context

1. Create zmodel in `infrastructure/persistence/orm/`
2. Import zmodel in `zenstack/schema.zmodel`
3. Run `npm run zenstack:generate -w apps/core-api` to generate Prisma client
4. Import module in `AppModule`
5. **Follow post-implementation checklist below**

---

## Extending an Existing Context

When extending an existing bounded context, follow these patterns based on what you're adding.

### Adding a New Use Case (Command)

For operations that mutate state (create, update, delete):

1. **Command**: `application/use-cases/{action}-{entity}/{action}-{entity}.command.ts`
2. **Handler**: `application/use-cases/{action}-{entity}/{action}-{entity}.handler.ts`
3. **HTTP Controller**: `interface/commands/{action}-{entity}.command.http.ts`
4. **Request DTO**: `interface/dtos/{action}-{entity}.request.dto.ts`
5. **Domain Event** (if applicable): `domain/events/{entity}-{action}ed.event.ts`
6. **Update module**: Register handler and controller in `{context}.module.ts`

### Adding a New Use Case (Query)

For read-only operations:

1. **Query**: `application/use-cases/{query-name}/{query-name}.query.ts`
2. **Handler**: `application/use-cases/{query-name}/{query-name}.handler.ts`
3. **HTTP Controller**: `interface/queries/{query-name}.query.http.ts`
4. **Response DTO** (if new shape): `interface/dtos/{query-name}.response.dto.ts`
5. **Update module**: Register handler and controller

### Adding a New Entity to Existing Context

For child/related entities within the same bounded context:

1. **Aggregate**: `domain/aggregates/{entity}.aggregate.ts`
2. **Domain Events**: `domain/events/{entity}-*.event.ts`
3. **Repository Port**: `application/ports/{entity}-repository.port.ts`
4. **Repository Impl**: `infrastructure/persistence/write-repositories/{entity}.write-repository.ts`
5. **Persistence Mapper**: `infrastructure/persistence/{entity}.mapper.ts`
6. **ZModel**: `infrastructure/persistence/orm/{entity}.zmodel`
7. **DI Token**: Add to `di-tokens.ts`
8. **Update main schema**: Import zmodel in `zenstack/schema.zmodel`
9. **Run**: `pnpm zenstack generate`

### Adding Repository Methods

When extending repository capabilities:

1. **Add to Port**: Define new method signature in `application/ports/{entity}-repository.port.ts`
2. **Implement**: Add method in `infrastructure/persistence/write-repositories/{entity}.write-repository.ts`
3. **Example methods**: `findByEmail()`, `existsBySlug()`, `findAllActive()`, `countByStatus()`

### Adding Value Objects

For domain concepts with validation/behavior:

1. **Create**: `domain/value-objects/{value}.value-object.ts`
2. **Pattern**: Private constructor + static `create()` factory + validation
3. **Use in aggregates**: Import and use in aggregate properties

### Adding Domain Events

For significant state changes that other parts of the system need to know about:

1. **Event**: `domain/events/{entity}-{action}ed.event.ts`
2. **Handler**: `application/event-handlers/{entity}-{action}ed.event-handler.ts`
3. **Emit from aggregate**: Call `this.addDomainEvent()` in aggregate methods
4. **Register handler**: Add to EventHandlers array in module

### Checklist for Extending

- [ ] Follow existing naming conventions in the context
- [ ] Reuse existing mappers where possible
- [ ] Add new handlers/controllers to module registration
- [ ] Update repository port if adding new persistence methods
- [ ] Run `npm run zenstack:generate -w apps/core-api` if zmodel changed
- [ ] **Follow post-implementation checklist below**

---

## Post-Implementation Checklist

After creating or extending a bounded context, complete these steps in order:

### 1. Update Bruno API Collections

Generate interactive API documentation for new/modified endpoints.

**Invoke skill:** `update-bruno-collection`

```bash
# Check if API server is running
curl -s http://localhost:8000/api/docs/json > /dev/null && echo "API running" || echo "Start API first"

# If not running, start it (may already be running via turbo dev)
npm run dev -w apps/core-api

# Generate Bruno collection
npm run generate:bruno -w tests
```

**Verify:**
- [ ] New `.bru` files created in `tests/collections/core-api/{context}/`
- [ ] Request bodies have correct structure
- [ ] Assertions match expected response codes

### 2. Add/Update API CRUD Tests

Create Playwright tests for individual CRUD operations.

**Invoke skill:** `update-api-tests`

**Location:** `tests/api/core-api/{context}/crud.spec.ts`

**Verify:**
- [ ] Test file exists for the context
- [ ] Data generator added to `tests/utils/test-helpers.ts` or `tests/api/fixtures/test-data.ts`
- [ ] All CRUD operations have tests (create, read, update, delete)
- [ ] Validation error cases tested (400 responses)
- [ ] Not found cases tested (404 responses)

### 3. Add/Update API Scenario Tests

Create tests for multi-step business flows.

**Invoke skill:** `update-api-scenarios`

**Location:** `tests/api/scenarios/{context}.spec.ts`

**Verify:**
- [ ] Lifecycle scenario (create → read → update → delete → verify gone)
- [ ] Duplicate/conflict handling tests
- [ ] Cross-entity workflows if applicable
- [ ] Edge cases (max lengths, special characters)

### 4. Run All Tests

Ensure nothing is broken by running the full test suite.

```bash
# Run all API tests (CRUD + scenarios)
npm run test:api -w tests

# Or run them separately:
npm run test:api:crud -w tests
npm run test:api:scenarios -w tests

# Run with specific context filter
npm run test:api -- --grep "{context}" -w tests
```

**All tests must pass before proceeding.**

### 5. Code Review

Perform comprehensive architectural review.

**Invoke skill:** `code-review`

The review will check:
- **Domain layer:** Aggregates, events, encapsulation
- **Application layer:** CQRS patterns, handlers, ports
- **Infrastructure layer:** Repositories, mappers, ORM
- **Interface layer:** Controllers, DTOs, Swagger

**Fix any critical issues before committing.**

---

## Quick Reference: Post-Implementation Commands

```bash
# 1. Check if API running, then generate Bruno collection
curl -s http://localhost:8000/api/docs/json > /dev/null && npm run generate:bruno -w tests

# 2. Run CRUD tests
npm run test:api:crud -w tests

# 3. Run scenario tests
npm run test:api:scenarios -w tests

# 4. Run all API tests
npm run test:api -w tests

# 5. Request code review
# Use the code-review skill
```

---

## Reference

- See `EXAMPLES.md` for complete code examples (including extension patterns)
- See `apps/core-api/src/modules/organisations/` for working reference
- See `tests/api/core-api/organisations/` for test examples
- See `tests/collections/core-api/organisations/` for Bruno collection examples
