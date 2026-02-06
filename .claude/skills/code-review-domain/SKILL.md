---
name: code-review-domain
description: Review domain layer code (aggregates, entities, value objects, domain events, domain services) for DDD best practices and architectural compliance.
allowed-tools: Read, Glob, Grep
---

# Domain Layer Code Review

Review domain layer code for DDD principles, encapsulation, and architectural compliance.

## When to Use

- Reviewing new or modified aggregates
- Reviewing domain events
- Reviewing value objects
- Reviewing domain services
- Reviewing entity definitions

## Domain Layer Location

`apps/core-api/src/modules/{context}/domain/`

## Structure

```
domain/
├── aggregates/
│   └── {entity}.aggregate.ts
├── entities/           # Child entities (optional)
├── events/
│   └── {entity}-{action}ed.event.ts
├── value-objects/      # (optional)
├── services/           # Domain services (optional)
└── errors/             # Domain-specific errors (optional)
```

---

## Review Checklist

### Aggregates

**Structure & Encapsulation:**

- [ ] Private constructor enforces factory pattern
- [ ] Uses typed Props interface for internal state
- [ ] Extends `BaseEntity` from `@libs/domain/base-entity`
- [ ] All properties accessed via getters only
- [ ] No public setters - state changes via behavior methods

**Factory Methods:**

- [ ] `static create()` for new instances with domain events
- [ ] `static fromPersistence()` for reconstitution (NO events)
- [ ] Factory validates invariants before creation

**Behavior Methods:**

- [ ] Named after domain actions (e.g., `rename()`, `delete()`, `activate()`)
- [ ] Emit domain events for significant state changes
- [ ] Enforce invariants before state mutation
- [ ] Update `updatedAt` on mutations

**Domain Events:**

- [ ] Called via `this.addDomainEvent()` in behavior methods
- [ ] Events are past-tense (e.g., `OrganisationCreatedEvent`)
- [ ] `create()` emits creation event
- [ ] `fromPersistence()` does NOT emit events

**Common Issues:**

```typescript
// BAD - public setter allows bypassing invariants
public setName(name: string) { this.props.name = name; }

// GOOD - behavior method with event
rename(newName: string, newSlug: string): void {
  this.props.name = newName;
  this.props.slug = newSlug;
  this.props.updatedAt = new Date();
  // Consider: emit OrganisationRenamedEvent
}
```

```typescript
// BAD - fromPersistence emits event
static fromPersistence(props: Props): Entity {
  const entity = new Entity(props);
  entity.addDomainEvent(new EntityCreatedEvent()); // WRONG
  return entity;
}

// GOOD - fromPersistence is pure reconstitution
static fromPersistence(props: Props): Entity {
  return new Entity(props);
}
```

---

### Domain Events

**Structure:**

- [ ] Implements `IEvent` from `@nestjs/cqrs`
- [ ] Constructor takes typed `payload` object
- [ ] Payload contains only primitive/serializable data
- [ ] Event name is past-tense (`{Entity}{Action}Event`)

**Payload Design:**

- [ ] Contains entity ID for correlation
- [ ] Contains relevant data for event handlers
- [ ] NO domain objects - only primitives and simple types
- [ ] Timestamp if relevant to the event

**Example Pattern:**

```typescript
import { IEvent } from '@nestjs/cqrs';

export class OrganisationDeletedEvent implements IEvent {
  constructor(
    public readonly payload: {
      id: string;
      slug: string;
      deletedAt: Date;
    },
  ) {}
}
```

**Common Issues:**

```typescript
// BAD - passing domain object
export class OrganisationCreatedEvent implements IEvent {
  constructor(public readonly organisation: Organisation) {} // WRONG
}

// BAD - verb form
export class CreateOrganisationEvent {} // Should be past tense

// GOOD - serializable payload
export class OrganisationCreatedEvent implements IEvent {
  constructor(
    public readonly payload: {
      id: string;
      name: string;
      slug: string;
    },
  ) {}
}
```

---

### Value Objects

**Structure:**

- [ ] Private constructor for validation enforcement
- [ ] Static `create()` factory with validation
- [ ] Immutable (readonly properties)
- [ ] Equality by value (implement `equals()`)
- [ ] No identity (no ID field)

**Example Pattern:**

```typescript
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new InvalidEmailError(email);
    }
    return new Email(email.toLowerCase());
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

**Common Issues:**

```typescript
// BAD - public constructor bypasses validation
export class Email {
  constructor(public value: string) {} // WRONG
}

// BAD - mutable
export class Money {
  constructor(public amount: number) {} // Should be readonly
}
```

---

### Domain Services

**When to Use:**

- Logic spans multiple aggregates
- Stateless operations on domain concepts
- Complex business rules not fitting single aggregate

**Structure:**

- [ ] Stateless (no instance state)
- [ ] Named after domain operation (e.g., `TransferService`)
- [ ] Takes aggregates/value objects as parameters
- [ ] Returns domain types

**Example Pattern:**

```typescript
export class TransferService {
  execute(from: Account, to: Account, amount: Money): void {
    if (!from.canWithdraw(amount)) {
      throw new InsufficientFundsError();
    }
    from.withdraw(amount);
    to.deposit(amount);
  }
}
```

---

## Red Flags

### Critical Issues

1. **Anemic Domain Model** - Aggregate is just a data bag with getters/setters
2. **Leaking Infrastructure** - Domain imports from `@nestjs/*` (except `@nestjs/cqrs` for IEvent)
3. **Missing Encapsulation** - Public properties or direct prop mutation
4. **Incorrect Event Timing** - Events emitted on reconstitution
5. **Aggregate Contains Repository** - Dependency inversion violation

### Warnings

1. **Missing Events** - State changes without corresponding events
2. **Large Aggregates** - Consider splitting if too many responsibilities
3. **Primitive Obsession** - Consider value objects for validated types
4. **Missing Invariant Checks** - Business rules not enforced

---

## Report Format

```markdown
## Domain Layer Review: {ContextName}

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

### Suggestions
- {suggestion for improvement}

### Compliance Score
- Encapsulation: {score}/10
- Event-Driven: {score}/10
- DDD Patterns: {score}/10
- Overall: {score}/10
```
