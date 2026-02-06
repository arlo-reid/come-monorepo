---
name: code-review-infrastructure
description: Review infrastructure layer code (repositories, persistence mappers, ZenStack/ORM schemas, external services) for proper adapter patterns and separation of concerns.
allowed-tools: Read, Glob, Grep
---

# Infrastructure Layer Code Review

Review infrastructure layer code for proper adapter implementation, persistence patterns, and separation from domain logic.

## When to Use

- Reviewing repository implementations
- Reviewing persistence mappers (DB <-> Domain)
- Reviewing ZenStack/Prisma models (.zmodel files)
- Reviewing external service adapters
- Reviewing messaging infrastructure

## Infrastructure Layer Location

`apps/core-api/src/modules/{context}/infrastructure/`

## Structure

```
infrastructure/
├── persistence/
│   ├── orm/
│   │   └── {entity}.zmodel           # ZenStack schema
│   ├── write-repositories/
│   │   └── {entity}.write-repository.ts
│   ├── read-repositories/            # (optional, for CQRS read models)
│   └── {entity}.mapper.ts            # Persistence mapper (if separate)
├── messaging/                        # (optional)
│   └── {event}-publisher.ts
└── external-services/                # (optional)
    └── {service}-adapter.ts
```

---

## Review Checklist

### Write Repositories

**Structure & Inheritance:**

- [ ] Extends `ZenStackRepositoryBase` from `@libs/db/repository-base`
- [ ] Implements the corresponding port from `application/ports/`
- [ ] Uses `@Injectable()` decorator
- [ ] Injects `DbService` via `@Inject(ENHANCED_DB)`
- [ ] Optionally injects `EventBus` for standalone usage

**Type Definitions:**

- [ ] Defines typed delegate: `type {Entity}Delegate = DbService['{entity}']`
- [ ] Properly implements `getDelegate()` to return model delegate
- [ ] Mapper methods have explicit input/output types

**Mapper Implementation:**

- [ ] `toDomain(row)` converts DB record to domain aggregate
- [ ] `toPersistence(entity)` converts domain aggregate to DB data
- [ ] Handle null/undefined for optional fields properly
- [ ] Date conversions handled correctly

**Port Compliance:**

- [ ] All port methods implemented
- [ ] Method signatures match port exactly
- [ ] Custom query methods filter soft-deleted records when appropriate

**Common Issues:**

```typescript
// BAD - missing typed delegate
protected getDelegate(client: DbService) {
  return client.organisation; // Untyped
}

// GOOD - typed delegate
type OrganisationDelegate = DbService['organisation'];

protected getDelegate(client: DbService): OrganisationDelegate {
  return client.organisation;
}
```

```typescript
// BAD - leaking infrastructure types to domain
toDomain(row: PrismaOrganisation): Organisation { } // WRONG

// GOOD - mapper handles conversion
toDomain(row: {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Organisation { }
```

```typescript
// BAD - not filtering soft deletes in custom methods
async findBySlug(slug: string): Promise<Organisation | null> {
  const row = await this.delegate.findUnique({ where: { slug } }); // Missing deletedAt filter
}

// GOOD - filter soft deletes
async findBySlug(slug: string): Promise<Organisation | null> {
  const row = await this.delegate.findUnique({
    where: { slug, deletedAt: null },
  });
}
```

---

### ZenStack Models (.zmodel)

**Structure:**

- [ ] Imports `base-entity.zmodel` for common fields
- [ ] Uses `with BaseEntity` mixin pattern
- [ ] Has `@@map("table_name")` for explicit table naming
- [ ] Table name is plural, snake_case

**Field Definitions:**

- [ ] Uses appropriate field types
- [ ] Unique constraints where needed (`@unique`)
- [ ] Optional fields marked with `?`
- [ ] Relations defined with proper cardinality

**Base Entity Fields (inherited):**

- `id` - UUID primary key (from BaseEntity)
- `createdAt` - Auto timestamp (from BaseEntity)
- `updatedAt` - Auto timestamp (from BaseEntity)

**Example Pattern:**

```zmodel
import '../../../../../libs/db/orm/base-entity.zmodel'

model Organisation with BaseEntity {
    slug      String    @unique
    name      String
    deletedAt DateTime?

    // Relations
    members   Member[]

    @@map("organisations")
}
```

**Common Issues:**

```zmodel
// BAD - missing base entity import
model User {
    id        String @id @default(uuid())  // Should use BaseEntity mixin
    createdAt DateTime @default(now())
}

// GOOD - uses mixin
import '../../../../../libs/db/orm/base-entity.zmodel'
model User with BaseEntity {
    // Only add entity-specific fields
}
```

```zmodel
// BAD - table name not explicit
model UserProfile { }  // Will use "UserProfile" as table name

// GOOD - explicit snake_case table name
model UserProfile {
    @@map("user_profiles")
}
```

---

### Persistence Mappers (if separate file)

**Location:** `infrastructure/persistence/{entity}.mapper.ts`

**Purpose:**
- Convert between raw DB row types and domain aggregates
- Isolate database schema details from domain model

**Structure:**

- [ ] Static class with `toDomain()` and `toPersistence()` methods
- [ ] Input types match DB schema exactly
- [ ] Output types are domain aggregates
- [ ] Handle type conversions (dates, enums, nulls)

**Example Pattern:**

```typescript
export class OrganisationPersistenceMapper {
  static toDomain(row: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Organisation {
    return Organisation.fromPersistence({
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
    });
  }

  static toPersistence(entity: Organisation): DbOrganisationData {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }
}
```

---

### External Service Adapters

**Purpose:**
- Implement ports for external APIs/services
- Isolate external dependencies from application logic

**Structure:**

- [ ] Implements port interface from `application/ports/`
- [ ] Uses `@Injectable()` decorator
- [ ] Handles external API errors gracefully
- [ ] Converts external types to domain types
- [ ] Timeouts and retry logic where appropriate

**Example Pattern:**

```typescript
@Injectable()
export class StripePaymentGatewayAdapter implements PaymentGatewayPort {
  constructor(private readonly stripe: Stripe) {}

  async charge(amount: Money, customerId: string): Promise<PaymentResult> {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: amount.cents,
        currency: amount.currency,
        customer: customerId,
      });
      return PaymentResult.success(intent.id);
    } catch (error) {
      return PaymentResult.failure(this.mapError(error));
    }
  }

  private mapError(error: unknown): PaymentError {
    // Convert Stripe errors to domain errors
  }
}
```

---

## Red Flags

### Critical Issues

1. **Domain Logic in Repository** - Business rules should be in aggregates
2. **Missing Port Implementation** - Repository doesn't implement its port
3. **Infrastructure Types Leaking** - Domain layer importing Prisma/ZenStack types
4. **Raw SQL Without Justification** - Prefer ORM methods unless performance critical
5. **Missing Transaction Support** - `withTransaction()` not properly implemented

### Warnings

1. **Soft Delete Not Filtered** - Custom queries missing `deletedAt: null`
2. **Missing Index Hints** - Complex queries without corresponding indexes
3. **Untyped Delegate** - Using `any` for model delegates
4. **Missing Error Handling** - External service calls without try/catch

---

## Database Consistency

### Soft Delete Pattern

When using soft deletes (`deletedAt` field):

```typescript
// All "find" methods should filter by default
async findBySlug(slug: string): Promise<Entity | null> {
  const row = await this.delegate.findUnique({
    where: { slug, deletedAt: null },  // Always filter
  });
}

// Override findById from base class if needed
override async findById(id: string): Promise<Entity | null> {
  const row = await this.delegate.findUnique({
    where: { id, deletedAt: null },
  });
  return row ? this.toDomain(row) : null;
}

// Provide explicit method for including deleted
async findByIdIncludingDeleted(id: string): Promise<Entity | null> {
  const row = await this.delegate.findUnique({ where: { id } });
  return row ? this.toDomain(row) : null;
}
```

---

## Report Format

```markdown
## Infrastructure Layer Review: {ContextName}

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

### Schema Review
- ZModel files: {observations}
- Missing indexes: {if any}
- Schema consistency: {observations}

### Suggestions
- {suggestion for improvement}

### Compliance Score
- Port Implementation: {score}/10
- Separation of Concerns: {score}/10
- Type Safety: {score}/10
- Overall: {score}/10
```
